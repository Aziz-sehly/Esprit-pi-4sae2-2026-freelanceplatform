import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  CounterOfferRequest,
  Experience,
  Project,
  ProjectProposal,
  ProjectStatsDTO,
  RankedProposalDTO,
  Status,
} from '../../models/models';
import { ProjectService, AISuggestResponse } from '../../services/project.service';
import { ProjectProposalService } from '../../services/project-proposal.service';
import { AuthService, UserResponse } from '../../services/auth.service';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.scss']
})
export class ClientProfileComponent implements OnInit {

  // User data from AuthService
  currentUser: UserResponse | null = null;
  clientId: number = 0;

  loading = true;
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  proposalsByProject: Map<number, ProjectProposal[]> = new Map();
  proposalsLoading: Map<number, boolean> = new Map();
  expandedProjectId: number | null = null;

  showAddForm = false;
  showEditId: number | null = null;

  searchQuery       = '';
  filterCategory    = '';
  filterStatus: Status | ''       = '';
  filterExperience: Experience | '' = '';
  filterBudgetMin: number | '' = '';
  filterBudgetMax: number | '' = '';
  categories: string[] = [];

  totalProjects     = 0;
  pendingProposals  = 0;
  totalSpent        = 0;
  stats: ProjectStatsDTO | null = null;

  // Form fields
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
  clientEmail     = '';
  saving          = false;
  formErrors: string[] = [];

  aiLoading   = false;
  aiSuggested = false;

  // Counter Offer
  showCounterModal             = false;
  selectedProposalForCounter: ProjectProposal | null = null;
  counterPrice   = 0;
  counterMessage = '';
  counterSaving  = false;

  // Smart Ranking
  showRankingModal    = false;
  rankingProjectTitle = '';
  rankedProposals: RankedProposalDTO[] = [];
  rankingLoading  = false;

  // FIXED: Add flag to track profile photo load error
  profilePhotoError = false;

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
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Get current user from AuthService
    this.currentUser = this.authService.getCurrentUser();
    
    // Redirect if not authenticated or not a client
    if (!this.currentUser) {
      this.router.navigate(['/front/login']);
      return;
    }
    
    if (this.currentUser.role !== 'CLIENT') {
      this.router.navigate(['/front/unauthorized']);
      return;
    }
    
    this.clientId = this.currentUser.id;
    
    // Set profile data
    this.clientEmail = this.currentUser.email || '';
    
    // FIXED: Validate profile photo URL before setting to prevent 404 loop
    this.setProfilePhotoUrl(this.currentUser.profilePicture);
    
    // Initialize component
    this.projectService.getCategories().subscribe((c) => (this.categories = c));
    this.projectService.getStats().subscribe((s) => (this.stats = s));
    this.load();
  }

  // ── USER PROFILE HELPERS ─────────────────────────────────────────────────
  
  getUserFullName(): string {
    return this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : 'Client';
  }
  
  getUserInitials(): string {
    if (!this.currentUser) return 'C';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
  }
  
  getCompanyName(): string {
    return this.currentUser?.companyName || 'Company not specified';
  }
  
  getUserBio(): string {
    return this.currentUser?.bio || 'No bio added yet.';
  }
  
  getPhoneNumber(): string {
    return this.currentUser?.phoneNumber || 'Not provided';
  }
  
  isVerified(): boolean {
    return this.currentUser?.isVerified || false;
  }
  
  isActive(): boolean {
    return this.currentUser?.isActive || false;
  }

  // FIXED: Safe URL setter with validation to prevent infinite 404 loops
  private setProfilePhotoUrl(url: string | null | undefined): void {
    this.profilePhotoError = false;
    
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
      this.profilePhotoUrl = '';
      return;
    }

    // Chemins Windows / file: stockés par erreur en BDD — ne pas préfixer avec assets/
    if (url.includes(':\\') || url.startsWith('\\\\') || /^file:/i.test(url)) {
      this.profilePhotoUrl = '';
      return;
    }
    
    // If it's a relative URL starting with /, use it as is
    if (url.startsWith('/')) {
      this.profilePhotoUrl = url;
      return;
    }
    
    // If it's already a full URL, use it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      this.profilePhotoUrl = url;
      return;
    }
    
    // If it's just a filename, check if it's the problematic default avatar
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('default-avatar') || lowerUrl.includes('default_avatar')) {
      // Don't use default avatar to prevent 404 loop - show initials instead
      this.profilePhotoUrl = '';
      return;
    }
    
    // For other image files, prepend assets path
    if (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || 
        lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.gif') || 
        lowerUrl.endsWith('.svg')) {
      this.profilePhotoUrl = `assets/${url}`;
      return;
    }
    
    // For any other value, treat as empty
    this.profilePhotoUrl = '';
  }

  // FIXED: Handle profile photo load error to prevent infinite loop
  onProfilePhotoError(): void {
    console.warn('Profile photo failed to load:', this.profilePhotoUrl);
    this.profilePhotoError = true;
    this.profilePhotoUrl = ''; // Clear the URL to show initials instead
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
      });
    });
  }

  // ── AI AUTO-FILL ──────────────────────────────────────────────────────────
  onAISuggest(): void {
    const desc = (this.description || '').trim();
    const dur  = (this.duration   || '').trim();
    if (!desc || !dur) return;
    const hasRealTitle = this.title.trim() &&
      this.title.trim().toLowerCase() !== 'untitled project';
    const hasSkills = !!(this.skills || '').trim();
    if (hasRealTitle && hasSkills && this.budget_min && this.budget_max) return;
    this.aiLoading = true; this.aiSuggested = false;
    this.projectService.aiSuggest(desc, dur).subscribe({
      next: (res: AISuggestResponse) => {
        const ph = !this.title.trim() || this.title.trim().toLowerCase() === 'untitled project';
        if (ph && res.title?.trim()) this.title = res.title;
        if (!this.skills.trim() && res.skills)   this.skills     = res.skills;
        if (!this.budget_min      && res.budgetMin) this.budget_min = res.budgetMin;
        if (!this.budget_max      && res.budgetMax) this.budget_max = res.budgetMax;
        if (!this.category.trim() && res.category) this.category   = res.category;
        this.aiLoading = false; this.aiSuggested = true;
        setTimeout(() => (this.aiSuggested = false), 4000);
      },
      error: () => { this.aiLoading = false; }
    });
  }

  // ── SEARCH / FILTER ───────────────────────────────────────────────────────
  onSearchInput(): void {
    const q = (this.searchQuery || '').trim();
    if (!q) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.search(q).subscribe((p) => { this.filteredProjects = p; this.loading = false; });
  }

  onFilterChange(): void {
    const noFilters = !this.filterCategory && !this.filterStatus && !this.filterExperience &&
      this.filterBudgetMin === '' && this.filterBudgetMax === '';
    if (noFilters) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.filter({
      category: this.filterCategory || undefined, status: this.filterStatus || undefined,
      experience: this.filterExperience || undefined,
      budgetMin: this.filterBudgetMin, budgetMax: this.filterBudgetMax,
    }).subscribe((p) => { this.filteredProjects = p; this.loading = false; });
  }

  clearFilters(): void {
    this.searchQuery = ''; this.filterCategory = ''; this.filterStatus = '';
    this.filterExperience = ''; this.filterBudgetMin = ''; this.filterBudgetMax = '';
    this.filteredProjects = [...this.projects];
  }

  getPercent(value: number): number {
    if (!this.stats || this.stats.totalProjects === 0) return 0;
    return Math.round((value / this.stats.totalProjects) * 100);
  }

  // ── SMART RANKING ─────────────────────────────────────────────────────────
  viewRanking(projectId: number, ev: Event): void {
    ev.stopPropagation();
    const project = this.projects.find(p => p.id === projectId);
    this.rankingProjectTitle = project?.title ?? '';
    this.rankingLoading      = true;
    this.showRankingModal    = true;
    this.rankedProposals     = [];

    this.proposalService.getRankedProposals(projectId).subscribe({
      next: (ranked) => {
        this.rankedProposals = ranked;
        this.rankingLoading  = false;
      },
      error: () => { this.rankingLoading = false; }
    });
  }

  closeRankingModal(): void {
    this.showRankingModal = false;
    this.rankedProposals  = [];
    this.rankingLoading   = false;
  }

  getRankBadge(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? `#${index + 1}`;
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  // ── COUNTER OFFER ─────────────────────────────────────────────────────────
  openCounterOffer(proposal: ProjectProposal, ev: Event): void {
    ev.stopPropagation();
    this.selectedProposalForCounter = proposal;
    this.counterPrice   = Math.round(proposal.proposedBudget * 0.9);
    this.counterMessage = `I propose a price of $${this.counterPrice} for this project.`;
    this.showCounterModal = true;
  }

  closeCounterModal(): void {
    this.showCounterModal = false;
    this.selectedProposalForCounter = null;
    this.counterPrice   = 0;
    this.counterMessage = '';
    this.counterSaving  = false;
  }

  submitCounterOffer(): void {
    if (!this.selectedProposalForCounter || !this.counterPrice || !this.counterMessage.trim()) return;
    this.counterSaving = true;
    const req: CounterOfferRequest = {
      counterPrice: this.counterPrice,
      message:      this.counterMessage.trim()
    };
    this.proposalService.makeCounterOffer(this.selectedProposalForCounter.id, req).subscribe({
      next: () => {
        this.counterSaving = false;
        this.closeCounterModal();
        this.load();
      },
      error: () => { this.counterSaving = false; }
    });
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  openAddForm(): void {
    this.formMode = 'add'; this.resetForm();
    this.showAddForm = true; this.showEditId = null;
  }

  closeForm(): void { this.showAddForm = false; this.showEditId = null; }

  openEditForm(p: Project): void {
    this.formMode = 'edit'; this.editId = p.id;
    this.title = p.title; this.description = p.description;
    this.category = p.category; this.skills = (p.skills || []).join(', ');
    this.budget_min = p.budgetMin; this.budget_max = p.budgetMax;
    this.duration = p.duration; this.experienceLevel = p.experienceLevel;
    this.status = p.status; this.deadline = this.toIsoDate(p.deadline);
    this.clientEmail = p.clientEmail || this.currentUser?.email || '';
    this.showEditId = p.id; this.showAddForm = false;
  }

  resetForm(): void {
    this.editId = undefined; this.title = ''; this.description = '';
    this.category = ''; this.skills = ''; this.budget_min = 0; this.budget_max = 0;
    this.duration = ''; this.experienceLevel = Experience.INTERMEDIATE;
    this.status = Status.OPEN; this.deadline = this.isoDatePlusDays(14);
    this.clientEmail = this.currentUser?.email || ''; this.formErrors = [];
    this.aiSuggested = false; this.aiLoading = false;
  }

  validateForm(): boolean {
    this.formErrors = [];
    if (!this.title?.trim())       this.formErrors.push('Title is required');
    if (!this.description?.trim()) this.formErrors.push('Description is required');
    if (!this.category?.trim())    this.formErrors.push('Category is required');
    if (!this.skills?.trim() || this.skills.split(',').map(s => s.trim()).filter(Boolean).length === 0)
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
    const skillsArray = this.skills.split(',').map(s => s.trim()).filter(Boolean);
    const project: Omit<Project, 'id'> = {
      clientId: this.clientId, clientEmail: this.clientEmail.trim(),
      title: this.title.trim(), description: this.description.trim(),
      category: this.category.trim(), skills: skillsArray,
      budgetMin: this.budget_min, budgetMax: this.budget_max,
      duration: this.duration.trim(), experienceLevel: this.experienceLevel,
      status: this.status, deadline: new Date(this.deadline)
    };
    this.saving = true;
    if (this.formMode === 'add') {
      this.projectService.create(project).subscribe({
        next: () => { this.saving = false; this.closeForm(); this.load(); this.projectService.getStats().subscribe(s => this.stats = s); },
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
    this.projectService.delete(id).subscribe({ next: (ok) => {
      if (ok) {
        this.projects = this.projects.filter(p => p.id !== id);
        this.filteredProjects = this.filteredProjects.filter(p => p.id !== id);
        this.proposalsByProject.delete(id);
        this.load();
        this.projectService.getStats().subscribe(s => this.stats = s);
      }
    }});
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

  getAllProposals(): { proposal: ProjectProposal; projectTitle: string }[] {
    const result: { proposal: ProjectProposal; projectTitle: string }[] = [];
    for (const p of this.projects) {
      const proposals = this.proposalsByProject.get(p.id) ?? [];
      for (const prop of proposals) result.push({ proposal: prop, projectTitle: p.title });
    }
    return result;
  }

  isProposalsLoading(projectId: number): boolean {
    return this.proposalsLoading.get(projectId) ?? false;
  }

  acceptProposal(proposalId: number, ev: Event): void {
    ev.stopPropagation();
    this.proposalService.accept(proposalId).subscribe(() => {
      this.load();
      this.closeRankingModal();
    });
  }

  rejectProposal(proposalId: number, ev: Event): void {
    ev.stopPropagation();
    this.proposalService.reject(proposalId).subscribe(() => this.load());
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/front/login']);
  }

  get currentDate(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  private isoDatePlusDays(days: number): string {
    return this.toIsoDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
  }

  private toIsoDate(d: Date): string {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
}