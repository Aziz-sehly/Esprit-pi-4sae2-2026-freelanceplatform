// freelancer-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  Experience, Project, ProjectProposal, ProjectStatsDTO,
  Status, FreelancerStatsDTO, RankedProposalDTO, Milestone,
  PaymentStructureType
} from '../../models/models';
import { ProjectService } from '../../services/project.service';
import { ProjectProposalService, CoverLetterRequest } from '../../services/project-proposal.service';
import { AuthService, UserResponse } from '../../services/auth.service';
import { ServicesService } from '../../services/services.service';
import { FreelancerShopComponent } from '../freelancer-shop/freelancer-shop.component';

@Component({
  selector: 'app-freelancer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FreelancerShopComponent],
  templateUrl: './freelancer-profile.component.html',
  styleUrls: ['./freelancer-profile.component.scss']
})
export class FreelancerProfileComponent implements OnInit {

  currentUser: UserResponse | null = null;
  freelancerId: number = 0;
  isOwnProfile = false;

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

  editingId: number | null = null;
  editCoverLetter = '';
  editProposedBudget = 0;
  editDeliveryDays = 0;
  editRevisionsOffered = 0;
  saving = false;

  showProposalForm = false;
  selectedProject: Project | null = null;
  propCoverLetter = '';
  propBudget = 0;
  propDeliveryDays = 0;
  propRevisionsOffered = 0;
  submitting = false;

  // ✅ Payment Structure Properties
  selectedPaymentStructure: PaymentStructureType = 'FIXED';
  propHourlyRate: number = 0;
  propEstimatedHours: number = 0;
  propMilestoneCount: number = 1;
  propMilestones: Milestone[] = [];

  aiCoverLoading = false;
  aiCoverGenerated = false;
  freelancerSkills = '';

  detailedStats: FreelancerStatsDTO | null = null;

  rankedProposals: RankedProposalDTO[] = [];
  showRankingModal = false;
  selectedProjectForRanking: Project | null = null;

  coverPhotoUrl = '';
  profilePhotoUrl = '';

  stats: ProjectStatsDTO | null = null;
  private projectTitles: Map<number, string> = new Map();

  shopExpanded = false;

  constructor(
    private readonly proposalService: ProjectProposalService,
    private readonly projectService: ProjectService,
    private readonly authService: AuthService,
    private readonly servicesService: ServicesService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const loggedIn = this.authService.getCurrentUser();
    if (!loggedIn) { this.router.navigate(['/front/login']); return; }
    if (loggedIn.role !== 'FREELANCER') { this.router.navigate(['/front/unauthorized']); return; }

    this.currentUser = loggedIn;
    this.freelancerId = loggedIn.id;
    this.isOwnProfile = true;
    this.profilePhotoUrl = loggedIn.profilePicture || '';
    this.coverPhotoUrl = loggedIn.portfolioUrl || '';
    this.freelancerSkills = loggedIn.skills || '';

    this.projectService.getCategories().subscribe(c => (this.categories = c));
    this.projectService.getStats().subscribe(s => (this.stats = s));
    this.loadProposals();
    this.loadProjects();
    this.loadDetailedStats();
  }

  // ── User helpers ─────────────────────────────────────────────────────────
  getUserFullName(): string {
    return this.currentUser ? this.currentUser.firstName + ' ' + this.currentUser.lastName : 'Freelancer';
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'F';
    return (this.currentUser.firstName[0] + this.currentUser.lastName[0]).toUpperCase();
  }

  getUserBio(): string { return this.currentUser?.bio || 'No bio added yet.'; }

  getPhoneNumber(): string { return this.currentUser?.phoneNumber || 'Not provided'; }

  getPortfolioUrl(): string { return this.currentUser?.portfolioUrl || ''; }

  getSkills(): string[] {
    if (!this.currentUser?.skills) return [];
    return this.currentUser.skills.split(',').map(s => s.trim()).filter(s => s);
  }

  isVerified(): boolean { return this.currentUser?.isVerified || false; }

  isActive(): boolean { return this.currentUser?.isActive || false; }

  // ── Proposals ────────────────────────────────────────────────────────────
  loadProposals(): void {
    this.proposalsLoading = true;
    this.proposalService.getByFreelancer(this.freelancerId).subscribe(items => {
      items.forEach(p => {
        if (!this.projectTitles.has(p.projectId)) {
          this.projectService.getById(p.projectId).subscribe({
            next: project => { if (project) this.projectTitles.set(p.projectId, project.title); },
            error: () => { /* silently skip */ }
          });
        }
      });
      this.proposals = items;
      this.applyProposalFilter();
      this.loadAcceptedProjects();
      this.proposalsLoading = false;
    });
  }

  getProjectTitle(projectId: number): string {
    return this.projectTitles.get(projectId) || 'Project #' + projectId;
  }

  loadDetailedStats(): void {
    this.proposalService.getFreelancerStatsDetailed(this.freelancerId).subscribe({
      next: s => { this.detailedStats = s; },
      error: err => console.error('Error loading detailed stats:', err)
    });
  }

  private loadAcceptedProjects(): void {
    const ids = Array.from(
      new Set(this.proposals.filter(p => p.status === 'ACCEPTED').map(p => p.projectId))
    );
    if (ids.length === 0) { this.acceptedProjects = []; this.acceptedProjectsLoading = false; return; }
    this.acceptedProjectsLoading = true;
    forkJoin(ids.map(id => this.projectService.getById(id))).subscribe({
      next: list => { this.acceptedProjects = list.filter(Boolean) as Project[]; this.acceptedProjectsLoading = false; },
      error: () => { this.acceptedProjects = []; this.acceptedProjectsLoading = false; }
    });
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  loadProjects(): void {
    this.loading = true;
    this.projectService.searchProjects({ status: Status.OPEN }, 1, 50).subscribe(res => {
      this.projects = res.items;
      this.filteredProjects = [...this.projects];
      this.loading = false;
    });
  }

  onSearchInput(): void {
    const q = (this.searchQuery || '').trim();
    if (!q) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.search(q).subscribe(list => {
      this.filteredProjects = list.filter(p => p.status === Status.OPEN);
      this.loading = false;
    });
  }

  onFilterChange(): void {
    const noFilters = !this.filterCategory && !this.filterExperience &&
      this.filterBudgetMin === '' && this.filterBudgetMax === '';
    if (noFilters) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.filter({
      category: this.filterCategory || undefined,
      status: Status.OPEN,
      experience: this.filterExperience || undefined,
      budgetMin: this.filterBudgetMin,
      budgetMax: this.filterBudgetMax,
    }).subscribe(list => { this.filteredProjects = list; this.loading = false; });
  }

  clearFilters(): void {
    this.searchQuery = ''; this.filterCategory = '';
    this.filterExperience = ''; this.filterBudgetMin = ''; this.filterBudgetMax = '';
    this.filteredProjects = [...this.projects];
  }

  applyFilters(): void { this.filteredProjects = [...this.projects]; }

  getPercent(value: number): number {
    if (!this.stats || this.stats.totalProjects === 0) return 0;
    return Math.round((value / this.stats.totalProjects) * 100);
  }

  // ── Proposal filter ───────────────────────────────────────────────────────
  proposalSearchQuery = '';
  filteredProposals: ProjectProposal[] = [];

  applyProposalFilter(): void {
    const q = (this.proposalSearchQuery || '').trim().toLowerCase();
    if (!q) { this.filteredProposals = [...this.proposals]; return; }
    this.filteredProposals = this.proposals.filter(p =>
      String(p.projectId).includes(q) ||
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

  // ✅ Payment Structure Methods
  onPaymentStructureChange(): void {
    if (this.selectedPaymentStructure === 'MILESTONE' && this.propBudget > 0) {
      this.generateMilestoneFields();
    }
  }

  generateMilestoneFields(): void {
    this.propMilestones = [];
    if (this.propMilestoneCount <= 0) this.propMilestoneCount = 1;
    
    const equalAmount = this.propBudget / this.propMilestoneCount;
    
    for (let i = 0; i < this.propMilestoneCount; i++) {
      const dueDate = new Date();
      const daysPerMilestone = this.propDeliveryDays > 0 
        ? this.propDeliveryDays / this.propMilestoneCount 
        : 7;
      dueDate.setDate(dueDate.getDate() + ((i + 1) * daysPerMilestone));
      
      this.propMilestones.push({
        title: `Milestone ${i + 1}`,
        description: '',
        amount: Math.round(equalAmount),
        dueDate: dueDate.toISOString().split('T')[0],
        completed: false
      });
    }
  }

  // ── Proposal form ─────────────────────────────────────────────────────────
  openProposalForm(project: Project): void {
    this.selectedProject = project;
    this.propCoverLetter = '';
    this.propBudget = project.budgetMin || 0;
    this.propDeliveryDays = 0;
    this.propRevisionsOffered = 0;
    
    // Reset payment structure
    this.selectedPaymentStructure = 'FIXED';
    this.propHourlyRate = 0;
    this.propEstimatedHours = 0;
    this.propMilestoneCount = 1;
    this.propMilestones = [];
    
    this.aiCoverGenerated = false;
    this.showProposalForm = true;
    this.generateAICoverLetter();
  }

  closeProposalForm(): void {
    this.showProposalForm = false;
    this.selectedProject = null;
    this.aiCoverGenerated = false;
    this.aiCoverLoading = false;
  }

  generateAICoverLetter(): void {
    if (!this.selectedProject) return;
    this.aiCoverLoading = true;
    this.aiCoverGenerated = false;
    const req: CoverLetterRequest = {
      freelancerSkills: this.freelancerSkills,
      projectTitle: this.selectedProject.title,
      projectDescription: this.selectedProject.description,
      projectCategory: this.selectedProject.category,
      projectBudgetMin: this.selectedProject.budgetMin,
      projectBudgetMax: this.selectedProject.budgetMax,
      projectDuration: this.selectedProject.duration
    };
    this.proposalService.generateCoverLetter(req).subscribe({
      next: res => {
        if (res.coverLetter?.trim()) {
          this.propCoverLetter = res.coverLetter.trim();
          this.aiCoverGenerated = true;
        }
        this.aiCoverLoading = false;
        setTimeout(() => (this.aiCoverGenerated = false), 4000);
      },
      error: () => { this.aiCoverLoading = false; }
    });
  }

  submitProposal(): void {
    if (!this.selectedProject || !this.propCoverLetter.trim()) return;
    
    this.submitting = true;
    
    const proposalData: any = {
      projectId: this.selectedProject.id,
      freelancerId: this.freelancerId,
      coverLetter: this.propCoverLetter.trim(),
      proposedBudget: this.propBudget,
      deliveryDays: this.propDeliveryDays,
      estimatedDuration: this.propDeliveryDays ? this.propDeliveryDays + ' day(s)' : '',
      revisionsOffered: this.propRevisionsOffered,
      paymentStructure: this.selectedPaymentStructure
    };
    
    // Add payment structure specific fields
    if (this.selectedPaymentStructure === 'HOURLY') {
      proposalData.hourlyRate = this.propHourlyRate;
      proposalData.estimatedHoursPerWeek = this.propEstimatedHours;
    } else if (this.selectedPaymentStructure === 'MILESTONE') {
      proposalData.milestoneCount = this.propMilestoneCount;
      proposalData.milestoneDetails = JSON.stringify(this.propMilestones);
    }
    
    this.proposalService.create(proposalData).subscribe({
      next: () => {
        this.proposalService.notifyClient({
          projectId: this.selectedProject!.id,
          proposedBudget: this.propBudget,
          deliveryDays: this.propDeliveryDays,
          coverLetter: this.propCoverLetter.trim()
        }).subscribe();
        this.submitting = false;
        this.closeProposalForm();
        this.loadProposals();
        this.loadProjects();
        this.loadDetailedStats();
      },
      error: () => { this.submitting = false; }
    });
  }

  alreadyProposed(projectId: number): boolean {
    return this.proposals.some(p => p.projectId === projectId);
  }

  // ── Edit / delete ─────────────────────────────────────────────────────────
  startEdit(p: ProjectProposal): void {
    this.editingId = p.id;
    this.editCoverLetter = p.coverLetter;
    this.editProposedBudget = p.proposedBudget;
    this.editDeliveryDays = p.deliveryDays ?? (parseInt(String(p.estimatedDuration || '0'), 10) || 0);
    this.editRevisionsOffered = p.revisionsOffered ?? 0;
  }

  cancelEdit(): void { this.editingId = null; }

  saveEdit(): void {
    if (this.editingId == null) return;
    this.saving = true;
    this.proposalService.update(this.editingId, {
      coverLetter: this.editCoverLetter,
      proposedBudget: this.editProposedBudget,
      deliveryDays: this.editDeliveryDays,
      estimatedDuration: this.editDeliveryDays ? this.editDeliveryDays + ' day(s)' : '',
      revisionsOffered: this.editRevisionsOffered
    }).subscribe({
      next: () => {
        this.saving = false;
        this.editingId = null;
        this.loadProposals();
        this.loadDetailedStats();
      },
      error: () => { this.saving = false; }
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this proposal?')) return;
    this.proposalService.delete(id).subscribe(() => {
      this.loadProposals();
      this.loadDetailedStats();
    });
  }

  // ── Counter offer ─────────────────────────────────────────────────────────
  acceptCounterOffer(proposalId: number): void {
    this.proposalService.acceptCounterOffer(proposalId).subscribe({
      next: u => {
        const i = this.proposals.findIndex(p => p.id === u.id);
        if (i !== -1) this.proposals[i] = u;
        this.applyProposalFilter();
        this.loadDetailedStats();
      },
      error: err => console.error(err)
    });
  }

  rejectCounterOffer(proposalId: number): void {
    this.proposalService.rejectCounterOffer(proposalId).subscribe({
      next: u => {
        const i = this.proposals.findIndex(p => p.id === u.id);
        if (i !== -1) this.proposals[i] = u;
        this.applyProposalFilter();
        this.loadDetailedStats();
      },
      error: err => console.error(err)
    });
  }

  // ── Ranking ───────────────────────────────────────────────────────────────
  viewRankedProposals(project: Project): void {
    this.selectedProjectForRanking = project;
    this.proposalService.getRankedProposals(project.id).subscribe({
      next: list => { this.rankedProposals = list; this.showRankingModal = true; },
      error: err => console.error(err)
    });
  }

  closeRankingModal(): void {
    this.showRankingModal = false;
    this.rankedProposals = [];
    this.selectedProjectForRanking = null;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  get totalProposals(): number { return this.proposals.length; }
  get acceptedProposals(): number { return this.proposals.filter(p => p.status === 'ACCEPTED').length; }
  get pendingProposals(): number { return this.proposals.filter(p => p.status === 'PENDING').length; }

  // ── Navigation ────────────────────────────────────────────────────────────
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
}