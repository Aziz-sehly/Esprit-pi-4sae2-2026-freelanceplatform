import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  Experience,
  FreelancerPreferences,
  Project,
  ProjectProposal,
  ProjectStatsDTO,
  Status,
  ProjectFilters
} from '../../models/models';
import { ProjectService, AISuggestResponse } from '../../services/project.service';
import { ProjectProposalService } from '../../services/project-proposal.service';
import { CandidatureService } from '../../services/candidature.service';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.scss']
})
export class ClientProfileComponent implements OnInit {

  loading = true;
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  proposalsByProject: Map<number, ProjectProposal[]> = new Map();
  proposalsLoading: Map<number, boolean> = new Map();
  expandedProjectId: number | null = null;

  /** Freelancer preferences by freelancerId (for "Recommandé" badge) */
  freelancerPrefsMap: Map<number, FreelancerPreferences | null> = new Map();

  showAddForm = false;
  showEditId: number | null = null;

  searchQuery      = '';
  filterCategory   = '';
  filterStatus: Status | ''     = '';
  filterExperience: Experience | '' = '';
  filterBudgetMin: number | '' = '';
  filterBudgetMax: number | '' = '';
  categories: string[] = [];

  private readonly clientId = 1;
  totalProjects    = 0;
  pendingProposals = 0;
  totalSpent       = 0;
  stats: ProjectStatsDTO | null = null;

  // ── Form fields ───────────────────────────────────────────────────────────
  formMode: 'add' | 'edit' = 'add';
  editId?: number;
  title           = '';
  description     = '';
  category        = '';
  skills          = '';
  budget_min      = 0;
  budget_max      = 0;
  duration        = '';
  experienceLevel: Experience = Experience.INTERMEDIATE;
  status: Status  = Status.OPEN;
  deadline        = this.isoDatePlusDays(14);
  clientEmail     = '';   // ← email du client pour les notifications
  saving          = false;
  formErrors: string[] = [];

  // ── AI suggest state ──────────────────────────────────────────────────────
  aiLoading   = false;
  aiSuggested = false;

  experienceOptions = [
    { value: Experience.ENTRY,        label: 'Entry' },
    { value: Experience.INTERMEDIATE, label: 'Intermediate' },
    { value: Experience.EXPERT,       label: 'Expert' }
  ];

  statusOptions = [
    { value: Status.OPEN,        label: 'Open' },
    { value: Status.IN_PROGRESS, label: 'In progress' },
    { value: Status.COMPLETED,   label: 'Completed' },
    { value: Status.CANCELLED,   label: 'Cancelled' },
    { value: Status.ARCHIVED,    label: 'Archived' }
  ];

  coverPhotoUrl   = '';
  profilePhotoUrl = '';

  constructor(
    private readonly projectService: ProjectService,
    private readonly proposalService: ProjectProposalService,
    private readonly candidatureService: CandidatureService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.projectService.getCategories().subscribe((c) => (this.categories = c));
    this.projectService.getStats().subscribe((s) => (this.stats = s));
    this.load();
  }

  // ── LOAD ──────────────────────────────────────────────────────────────────
  load(): void {
    this.loading = true;
    this.projectService.getByClient(this.clientId, 1, 100).subscribe((res) => {
      this.projects        = res.items;
      this.totalProjects   = this.projects.length;
      this.pendingProposals = 0;
      this.proposalsByProject.clear();

      if (this.projects.length === 0) {
        this.filteredProjects = [];
        this.loading = false;
        return;
      }

      const requests = this.projects.map((p) => this.proposalService.getByProject(p.id));
      forkJoin(requests).subscribe((results) => {
        results.forEach((proposals, i) => {
          const projectId = this.projects[i].id;
          this.proposalsByProject.set(projectId, proposals);
          this.pendingProposals += proposals.filter((pr) => pr.status === 'PENDING').length;
        });
        this.filteredProjects = [...this.projects];
        this.loading = false;
        this.loadFreelancerPrefsForProposals();
      });
    });
  }

  // ── AI AUTO-FILL ──────────────────────────────────────────────────────────
  onAISuggest(): void {
    const desc = (this.description || '').trim();
    const dur  = (this.duration   || '').trim();
    if (!desc || !dur) return;
    if (this.title && this.skills && this.budget_min && this.budget_max) return;

    this.aiLoading   = true;
    this.aiSuggested = false;

    this.projectService.aiSuggest(desc, dur).subscribe({
      next: (res: AISuggestResponse) => {
        if (!this.title.trim()    && res.title)    this.title      = res.title;
        if (!this.skills.trim()   && res.skills)   this.skills     = res.skills;
        if (!this.budget_min      && res.budgetMin) this.budget_min = res.budgetMin;
        if (!this.budget_max      && res.budgetMax) this.budget_max = res.budgetMax;
        if (!this.category.trim() && res.category) this.category   = res.category;
        this.aiLoading   = false;
        this.aiSuggested = true;
        setTimeout(() => (this.aiSuggested = false), 4000);
      },
      error: () => { this.aiLoading = false; }
    });
  }

  // ── SEARCH ────────────────────────────────────────────────────────────────
  onSearchInput(): void {
    const q = (this.searchQuery || '').trim();
    if (!q) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.search(q).subscribe((projects) => {
      this.filteredProjects = projects;
      this.loading = false;
    });
  }

  // ── FILTER ────────────────────────────────────────────────────────────────
  onFilterChange(): void {
    const noFilters =
      !this.filterCategory && !this.filterStatus && !this.filterExperience &&
      this.filterBudgetMin === '' && this.filterBudgetMax === '';
    if (noFilters) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.filter({
      category:   this.filterCategory   || undefined,
      status:     this.filterStatus     || undefined,
      experience: this.filterExperience || undefined,
      budgetMin:  this.filterBudgetMin,
      budgetMax:  this.filterBudgetMax,
    }).subscribe((projects) => { this.filteredProjects = projects; this.loading = false; });
  }

  clearFilters(): void {
    this.searchQuery     = '';
    this.filterCategory  = '';
    this.filterStatus    = '';
    this.filterExperience = '';
    this.filterBudgetMin = '';
    this.filterBudgetMax = '';
    this.filteredProjects = [...this.projects];
  }

  getPercent(value: number): number {
    if (!this.stats || this.stats.totalProjects === 0) return 0;
    return Math.round((value / this.stats.totalProjects) * 100);
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  openAddForm(): void {
    this.formMode = 'add';
    this.resetForm();
    this.showAddForm = true;
    this.showEditId  = null;
  }

  closeForm(): void {
    this.showAddForm = false;
    this.showEditId  = null;
  }

  openEditForm(p: Project): void {
    this.formMode       = 'edit';
    this.editId         = p.id;
    this.title          = p.title;
    this.description    = p.description;
    this.category       = p.category;
    this.skills         = (p.skills || []).join(', ');
    this.budget_min     = p.budgetMin;
    this.budget_max     = p.budgetMax;
    this.duration       = p.duration;
    this.experienceLevel = p.experienceLevel;
    this.status         = p.status;
    this.deadline       = this.toIsoDate(p.deadline);
    this.clientEmail    = p.clientEmail || '';   // ← récupérer email existant
    this.showEditId     = p.id;
    this.showAddForm    = false;
  }

  resetForm(): void {
    this.editId         = undefined;
    this.title          = '';
    this.description    = '';
    this.category       = '';
    this.skills         = '';
    this.budget_min     = 0;
    this.budget_max     = 0;
    this.duration       = '';
    this.experienceLevel = Experience.INTERMEDIATE;
    this.status         = Status.OPEN;
    this.deadline       = this.isoDatePlusDays(14);
    this.clientEmail    = '';   // ← reset
    this.formErrors     = [];
    this.aiSuggested    = false;
    this.aiLoading      = false;
  }

  validateForm(): boolean {
    this.formErrors = [];
    if (!this.title?.trim())       this.formErrors.push('Title is required');
    if (!this.description?.trim()) this.formErrors.push('Description is required');
    if (!this.category?.trim())    this.formErrors.push('Category is required');
    if (!this.skills?.trim() ||
      this.skills.split(',').map((s) => s.trim()).filter(Boolean).length === 0)
      this.formErrors.push('At least one skill is required');
    if (this.budget_min < 0)               this.formErrors.push('Min budget is invalid');
    if (this.budget_max < this.budget_min) this.formErrors.push('Max budget must be ≥ min');
    if (!this.duration?.trim()) this.formErrors.push('Duration is required');
    if (!this.deadline)         this.formErrors.push('Deadline is required');
    if (!this.clientEmail?.trim() || !this.clientEmail.includes('@'))
      this.formErrors.push('Valid email is required (to receive proposal notifications)');
    return this.formErrors.length === 0;
  }

  saveProject(): void {
    if (!this.validateForm()) return;
    const skillsArray = this.skills.split(',').map((s) => s.trim()).filter(Boolean);
    const project: Omit<Project, 'id'> = {
      clientId:        this.clientId,
      clientEmail:     this.clientEmail.trim(),   // ← inclus dans le payload
      title:           this.title.trim(),
      description:     this.description.trim(),
      category:        this.category.trim(),
      skills:          skillsArray,
      budgetMin:       this.budget_min,
      budgetMax:       this.budget_max,
      duration:        this.duration.trim(),
      experienceLevel: this.experienceLevel,
      status:          this.status,
      deadline:        new Date(this.deadline)
    };
    this.saving = true;
    if (this.formMode === 'add') {
      this.projectService.create(project).subscribe({
        next: () => {
          this.saving = false;
          this.closeForm();
          this.load();
          this.projectService.getStats().subscribe((s) => (this.stats = s));
        },
        error: () => { this.saving = false; }
      });
    } else if (this.editId) {
      this.projectService.update(this.editId, project).subscribe({
        next: () => { this.saving = false; this.closeForm(); this.load(); },
        error: () => { this.saving = false; }
      });
    }
  }

  delete(id: number, ev: Event): void {
    ev.stopPropagation();
    if (!confirm('Delete this project?')) return;
    this.projectService.delete(id).subscribe({
      next: (ok) => {
        if (ok) {
          this.projects         = this.projects.filter((p) => p.id !== id);
          this.filteredProjects = this.filteredProjects.filter((p) => p.id !== id);
          this.proposalsByProject.delete(id);
          this.load();
          this.projectService.getStats().subscribe((s) => (this.stats = s));
        }
      }
    });
  }

  toggleProposals(projectId: number): void {
    if (this.expandedProjectId === projectId) { this.expandedProjectId = null; return; }
    this.expandedProjectId = projectId;
    if (!this.proposalsByProject.has(projectId)) {
      this.proposalsLoading.set(projectId, true);
      this.proposalService.getByProject(projectId).subscribe((items) => {
        this.proposalsByProject.set(projectId, items);
        this.proposalsLoading.set(projectId, false);
      });
    }
  }

  getProposals(projectId: number): ProjectProposal[] {
    return this.proposalsByProject.get(projectId) ?? [];
  }

  getAllProposals(): { proposal: ProjectProposal; project: Project }[] {
    const result: { proposal: ProjectProposal; project: Project }[] = [];
    for (const p of this.projects) {
      const proposals = this.proposalsByProject.get(p.id) ?? [];
      for (const prop of proposals) result.push({ proposal: prop, project: p });
    }
    return result;
  }

  private loadFreelancerPrefsForProposals(): void {
    const freelancerIds = new Set<number>();
    for (const p of this.projects) {
      const proposals = this.proposalsByProject.get(p.id) ?? [];
      proposals.forEach((prop) => freelancerIds.add(prop.freelancerId));
    }
    freelancerIds.forEach((fid) => {
      this.candidatureService.getByFreelancer(fid).subscribe((prefs) => {
        this.freelancerPrefsMap.set(fid, prefs);
      });
    });
  }

  /** Returns true if the proposal matches the project (client's implicit preferences for that job) */
  proposalMatchesProject(proposal: ProjectProposal, project: Project): boolean {
    const budgetMatch =
      proposal.proposedBudget >= project.budgetMin &&
      proposal.proposedBudget <= project.budgetMax;

    const projSkills = (project.skills ?? []).map((s) => String(s).toLowerCase().trim());
    const prefs = this.freelancerPrefsMap.get(proposal.freelancerId);
    const prefSkills = (prefs?.skills ?? []).map((s) => String(s).toLowerCase().trim());

    const skillsMatch =
      prefSkills.length === 0 ||
      projSkills.length === 0 ||
      projSkills.some((s) => prefSkills.includes(s));

    return budgetMatch && skillsMatch;
  }

  isProposalsLoading(projectId: number): boolean {
    return this.proposalsLoading.get(projectId) ?? false;
  }

  acceptProposal(proposalId: number, ev: Event): void {
    ev.stopPropagation();
    this.proposalService.accept(proposalId).subscribe(() => this.load());
  }

  rejectProposal(proposalId: number, ev: Event): void {
    ev.stopPropagation();
    this.proposalService.reject(proposalId).subscribe(() => this.load());
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  get currentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  private isoDatePlusDays(days: number): string {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.toIsoDate(d);
  }

  private toIsoDate(d: Date): string {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
}