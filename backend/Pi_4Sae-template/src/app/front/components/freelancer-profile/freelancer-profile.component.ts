import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Experience, FreelancerPreferences, Project, ProjectProposal, ProjectStatsDTO, Status } from '../../models/models';
import { ProjectService } from '../../services/project.service';
import { ProjectProposalService } from '../../services/project-proposal.service';
import { CandidatureService } from '../../services/candidature.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-freelancer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './freelancer-profile.component.html',
  styleUrls: ['./freelancer-profile.component.scss']
})
export class FreelancerProfileComponent implements OnInit {
  loading = true;
  proposalsLoading = true;
  proposals: ProjectProposal[] = [];

  acceptedProjectsLoading = true;
  acceptedProjects: Project[] = [];

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  categories: string[] = [];
  searchQuery = '';
  filterCategory = '';
  filterExperience: Experience | '' = '';
  filterBudgetMin: number | '' = '';
  filterBudgetMax: number | '' = '';
  filterRecommendedOnly = false;

  editingId: number | null = null;
  editCoverLetter = '';
  editProposedBudget = 0;
  editDeliveryDays = 0;
  saving = false;

  showProposalForm = false;
  selectedProject: Project | null = null;
  propCoverLetter = '';
  propBudget = 0;
  propDeliveryDays = 0;
  submitting = false;

  private readonly freelancerId = 101;

  coverPhotoUrl = '';
  profilePhotoUrl = '';

  // ── Freelancer Preferences (integrated) ─────────────────────────────────────
  prefsLoading = true;
  prefsSaving = false;
  prefsDeleting = false;
  hasPrefs = false;
  prefsEditMode = false;
  prefsErrors: string[] = [];
  skillsInput = '';
  skills: string[] = [];
  preferredProjectTypes: string[] = [];
  minBudget = 0;
  maxBudget = 0;
  avgDeliveryDays = 0;
  openToNegotiation = false;
  openToOtherProjectTypes = false;
  notes = '';
  readonly PROJECT_TYPE_OPTIONS = [
    'Web Development', 'Mobile Development', 'Backend Development', 'Frontend Development',
    'Full-Stack Development', 'API Development', 'Database', 'DevOps', 'Cloud Computing',
    'Game Development', 'Software Development', 'Python', 'JavaScript', 'Java',
    'React', 'Angular', 'Node.js', 'Machine Learning', 'Cybersecurity'
  ];
  // ── Stats avancées ────────────────────────────────────────────────────────
  stats: ProjectStatsDTO | null = null;

  constructor(
    private readonly proposalService: ProjectProposalService,
    private readonly projectService: ProjectService,
    private readonly candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    this.projectService.getCategories().subscribe((c) => (this.categories = c));
    this.projectService.getStats().subscribe((s) => (this.stats = s));
    this.loadProposals();
    this.loadProjects();
    this.loadPrefs();
  }

  loadPrefs(): void {
    this.prefsLoading = true;
    this.prefsErrors = [];
    this.candidatureService.getByFreelancer(this.freelancerId).subscribe((prefs) => {
      this.prefsLoading = false;
      if (prefs) {
        this.hasPrefs = true;
        this.prefsEditMode = false;
        this.skills = [...(prefs.skills || [])];
        this.preferredProjectTypes = [...(prefs.preferredProjectTypes || [])];
        this.minBudget = prefs.minBudget ?? 0;
        this.maxBudget = prefs.maxBudget ?? 0;
        this.avgDeliveryDays = prefs.avgDeliveryDays ?? 0;
        this.openToNegotiation = prefs.openToNegotiation ?? false;
        this.openToOtherProjectTypes = prefs.openToOtherProjectTypes ?? false;
        this.notes = prefs.notes ?? '';
      } else {
        this.hasPrefs = false;
        this.prefsEditMode = true;
        this.resetPrefs();
      }
    });
  }

  resetPrefs(): void {
    this.skills = [];
    this.skillsInput = '';
    this.preferredProjectTypes = [];
    this.minBudget = 0;
    this.maxBudget = 0;
    this.avgDeliveryDays = 0;
    this.openToNegotiation = false;
    this.openToOtherProjectTypes = false;
    this.notes = '';
    this.prefsErrors = [];
  }

  addSkill(): void {
    const val = this.skillsInput.trim();
    if (val && !this.skills.includes(val)) {
      this.skills.push(val);
      this.skillsInput = '';
    }
  }

  addSkillOnKey(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' || ev.key === ',') {
      ev.preventDefault();
      this.addSkill();
    }
  }

  removeSkill(s: string): void {
    this.skills = this.skills.filter((x) => x !== s);
  }

  toggleProjectType(type: string): void {
    const idx = this.preferredProjectTypes.indexOf(type);
    if (idx >= 0) {
      this.preferredProjectTypes = this.preferredProjectTypes.filter((t) => t !== type);
    } else {
      this.preferredProjectTypes = [...this.preferredProjectTypes, type];
    }
  }

  isProjectTypeSelected(type: string): boolean {
    return this.preferredProjectTypes.includes(type);
  }

  validatePrefs(): boolean {
    this.prefsErrors = [];
    if (!this.skills.length) this.prefsErrors.push('Skills are required.');
    if (this.minBudget > this.maxBudget) this.prefsErrors.push('Minimum budget must be less than or equal to maximum budget.');
    if (this.avgDeliveryDays <= 0) this.prefsErrors.push('Delivery time must be greater than 0 days.');
    return this.prefsErrors.length === 0;
  }

  savePrefs(): void {
    if (!this.validatePrefs()) return;
    this.prefsSaving = true;
    this.prefsErrors = [];
    const payload: Omit<FreelancerPreferences, 'id' | 'freelancerId'> = {
      skills: this.skills,
      preferredProjectTypes: this.preferredProjectTypes,
      minBudget: this.minBudget,
      maxBudget: this.maxBudget,
      avgDeliveryDays: this.avgDeliveryDays,
      openToNegotiation: this.openToNegotiation,
      openToOtherProjectTypes: this.openToOtherProjectTypes,
      notes: this.notes.trim() || undefined
    };
    if (this.hasPrefs) {
      this.candidatureService.update(this.freelancerId, payload).subscribe({
        next: () => { this.prefsSaving = false; this.prefsEditMode = false; this.loadPrefs(); },
        error: () => { this.prefsSaving = false; this.prefsErrors.push('Failed to update preferences.'); }
      });
    } else {
      this.candidatureService.create(this.freelancerId, payload).subscribe({
        next: () => { this.prefsSaving = false; this.prefsEditMode = false; this.loadPrefs(); },
        error: () => { this.prefsSaving = false; this.prefsErrors.push('Failed to save preferences.'); }
      });
    }
  }

  cancelPrefs(): void {
    if (this.hasPrefs) {
      this.prefsEditMode = false;
      this.loadPrefs();
    } else {
      this.resetPrefs();
    }
  }

  startEditPrefs(): void {
    this.prefsEditMode = true;
  }

  deletePrefs(): void {
    if (!this.hasPrefs || !confirm('Are you sure you want to delete your preferences? This cannot be undone.')) return;
    this.prefsDeleting = true;
    this.prefsErrors = [];
    this.candidatureService.delete(this.freelancerId).subscribe({
      next: (ok) => {
        this.prefsDeleting = false;
        if (ok) {
          this.hasPrefs = false;
          this.prefsEditMode = true;
          this.resetPrefs();
        } else {
          this.prefsErrors.push('Failed to delete preferences.');
        }
      },
      error: () => { this.prefsDeleting = false; this.prefsErrors.push('Failed to delete preferences.'); }
    });
  }

  loadProposals(): void {
    this.proposalsLoading = true;
    this.proposalService.getByFreelancer(this.freelancerId).subscribe((items) => {
      this.proposals = items;
      this.applyProposalFilter();
      this.loadAcceptedProjects();
      this.proposalsLoading = false;
    });
  }

  private loadAcceptedProjects(): void {
    const acceptedProjectIds = Array.from(
      new Set(this.proposals.filter((p) => p.status === 'ACCEPTED').map((p) => p.projectId))
    );
    if (acceptedProjectIds.length === 0) {
      this.acceptedProjects = [];
      this.acceptedProjectsLoading = false;
      return;
    }
    this.acceptedProjectsLoading = true;
    forkJoin(acceptedProjectIds.map((id) => this.projectService.getById(id))).subscribe({
      next: (projects) => {
        this.acceptedProjects = projects.filter(Boolean) as Project[];
        this.acceptedProjectsLoading = false;
      },
      error: () => { this.acceptedProjects = []; this.acceptedProjectsLoading = false; }
    });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.searchProjects({ status: Status.OPEN }, 1, 50).subscribe((res) => {
      this.projects = res.items;
      this.filteredProjects = [...this.projects];
      this.loading = false;
    });
  }

  // ── Projets affichés (avec filtre "recommandés uniquement") ───────────────
  get displayedProjects(): Project[] {
    if (!this.filterRecommendedOnly) return this.filteredProjects;
    return this.filteredProjects.filter((p) => this.projectMatchesPreferences(p));
  }

  // ── SEARCH via backend ────────────────────────────────────────────────────
  onSearchInput(): void {
    const q = (this.searchQuery || '').trim();
    if (!q) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.search(q).subscribe((projects) => {
      this.filteredProjects = projects.filter((p) => p.status === Status.OPEN);
      this.loading = false;
    });
  }

  // ── FILTER via backend ────────────────────────────────────────────────────
  onFilterChange(): void {
    const noFilters = !this.filterCategory && !this.filterExperience &&
      this.filterBudgetMin === '' && this.filterBudgetMax === '';
    if (noFilters) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.filter({
      category:   this.filterCategory   || undefined,
      status:     Status.OPEN,
      experience: this.filterExperience || undefined,
      budgetMin:  this.filterBudgetMin,
      budgetMax:  this.filterBudgetMax,
    }).subscribe((projects) => { this.filteredProjects = projects; this.loading = false; });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterCategory = '';
    this.filterExperience = '';
    this.filterBudgetMin = '';
    this.filterBudgetMax = '';
    this.filterRecommendedOnly = false;
    this.filteredProjects = [...this.projects];
  }

  applyFilters(): void { this.filteredProjects = [...this.projects]; }

  // ── helper pour le chart dynamique ───────────────────────────────────────
  getPercent(value: number): number {
    if (!this.stats || this.stats.totalProjects === 0) return 0;
    return Math.round((value / this.stats.totalProjects) * 100);
  }

  proposalSearchQuery = '';
  filteredProposals: ProjectProposal[] = [];

  applyProposalFilter(): void {
    const q = (this.proposalSearchQuery || '').trim().toLowerCase();
    if (!q) { this.filteredProposals = [...this.proposals]; return; }
    this.filteredProposals = this.proposals.filter(
      (p) => String(p.projectId).includes(q) ||
             p.coverLetter.toLowerCase().includes(q) ||
             String(p.proposedBudget).includes(q)
    );
  }

  onProposalSearchInput(): void { this.applyProposalFilter(); }

  experienceOptions = [
    { value: Experience.ENTRY, label: 'Entry' },
    { value: Experience.INTERMEDIATE, label: 'Intermediate' },
    { value: Experience.EXPERT, label: 'Expert' }
  ];

  openProposalForm(project: Project): void {
    this.selectedProject = project;
    this.propCoverLetter = '';
    this.propBudget = project.budgetMin || 0;
    this.propDeliveryDays = 14;
    this.showProposalForm = true;
  }

  closeProposalForm(): void { this.showProposalForm = false; this.selectedProject = null; }

  submitProposal(): void {
    if (!this.selectedProject || !this.propCoverLetter.trim()) return;
    this.submitting = true;

    this.proposalService.create({
      projectId:         this.selectedProject.id,
      freelancerId:      this.freelancerId,
      coverLetter:       this.propCoverLetter.trim(),
      proposedBudget:    this.propBudget,
      deliveryDays:      this.propDeliveryDays,
      estimatedDuration: this.propDeliveryDays ? `${this.propDeliveryDays} day(s)` : ''
    }).subscribe({
      next: () => {
        // ── Envoyer notification email au client (non bloquant) ───────
        this.proposalService.notifyClient({
          projectId:      this.selectedProject!.id,
          proposedBudget: this.propBudget,
          deliveryDays:   this.propDeliveryDays,
          coverLetter:    this.propCoverLetter.trim()
        }).subscribe();
        // ─────────────────────────────────────────────────────────────

        this.submitting = false;
        this.closeProposalForm();
        this.loadProposals();
        this.loadProjects();
      },
      error: () => { this.submitting = false; }
    });
  }

  alreadyProposed(projectId: number): boolean {
    return this.proposals.some((p) => p.projectId === projectId);
  }

  /** Returns true if the project matches freelancer preferences, or all projects when prefs are empty */
  projectMatchesPreferences(project: Project): boolean {
    if (!this.hasPrefs) return true; // Afficher le badge sur tous les projets quand préférences vides

    const projSkills = (project.skills ?? []).map((s) => String(s).toLowerCase().trim());
    const prefSkills = (this.skills ?? []).map((s) => String(s).toLowerCase().trim());
    const hasSkillMatch =
      prefSkills.length === 0 || projSkills.some((s) => prefSkills.includes(s));

    const cat = (project.category ?? '').trim().toLowerCase();
    const prefCats = (this.preferredProjectTypes ?? []).map((t) => String(t).toLowerCase().trim());
    const categoryMatch =
      prefCats.length === 0 || prefCats.includes(cat) || this.openToOtherProjectTypes;

    const budgetOverlap =
      (this.maxBudget <= 0 && this.minBudget <= 0) ||
      (project.budgetMax >= this.minBudget && project.budgetMin <= this.maxBudget);
    const budgetMatch = budgetOverlap || this.openToNegotiation;

    return hasSkillMatch && categoryMatch && budgetMatch;
  }

  get totalProposals(): number { return this.proposals.length; }
  get acceptedProposals(): number { return this.proposals.filter((p) => p.status === 'ACCEPTED').length; }
  get pendingProposals(): number { return this.proposals.filter((p) => p.status === 'PENDING').length; }

  canEditOrDelete(p: ProjectProposal): boolean { return p.status === 'PENDING'; }

  startEdit(p: ProjectProposal): void {
    this.editingId = p.id;
    this.editCoverLetter = p.coverLetter;
    this.editProposedBudget = p.proposedBudget;
    this.editDeliveryDays = p.deliveryDays ?? (parseInt(String(p.estimatedDuration || '0'), 10) || 0);
  }

  cancelEdit(): void { this.editingId = null; }

  saveEdit(): void {
    if (this.editingId == null) return;
    this.saving = true;
    this.proposalService.update(this.editingId, {
      coverLetter: this.editCoverLetter,
      proposedBudget: this.editProposedBudget,
      deliveryDays: this.editDeliveryDays,
      estimatedDuration: this.editDeliveryDays ? `${this.editDeliveryDays} day(s)` : ''
    }).subscribe({
      next: () => { this.saving = false; this.editingId = null; this.loadProposals(); },
      error: () => { this.saving = false; }
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this proposal?')) return;
    this.proposalService.delete(id).subscribe(() => this.loadProposals());
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
}