import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  Experience,
  Project,
  ProjectProposal,
  ProjectStatsDTO,
  Status,
  FreelancerStatsDTO,
  RankedProposalDTO
} from '../../models/models';
import { ProjectService } from '../../services/project.service';
import { ProjectProposalService, CoverLetterRequest } from '../../services/project-proposal.service';

@Component({
  selector: 'app-freelancer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './freelancer-profile.component.html',
  styleUrls: ['./freelancer-profile.component.scss']
})
export class FreelancerProfileComponent implements OnInit {

  loading          = true;
  proposalsLoading = true;
  proposals: ProjectProposal[] = [];

  acceptedProjectsLoading = true;
  acceptedProjects: Project[] = [];

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  categories: string[] = [];
  searchQuery      = '';
  filterCategory   = '';
  filterExperience: Experience | '' = '';
  filterBudgetMin: number | '' = '';
  filterBudgetMax: number | '' = '';

  editingId: number | null = null;
  editCoverLetter    = '';
  editProposedBudget = 0;
  editDeliveryDays   = 0;
  editRevisionsOffered = 0;
  saving = false;

  showProposalForm = false;
  selectedProject: Project | null = null;
  propCoverLetter  = '';
  propBudget       = 0;
  propDeliveryDays = 0;
  propRevisionsOffered = 0;
  submitting       = false;

  aiCoverLoading   = false;
  aiCoverGenerated = false;
  freelancerSkills = 'fill your skills';

  detailedStats: FreelancerStatsDTO | null = null;

  rankedProposals: RankedProposalDTO[] = [];
  showRankingModal = false;
  selectedProjectForRanking: Project | null = null;

  private readonly freelancerId = 101;

  coverPhotoUrl   = '';
  profilePhotoUrl = '';

  stats: ProjectStatsDTO | null = null;
  private projectTitles: Map<number, string> = new Map();

  constructor(
    private readonly proposalService: ProjectProposalService,
    private readonly projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.projectService.getCategories().subscribe((c) => (this.categories = c));
    this.projectService.getStats().subscribe((s) => (this.stats = s));
    this.loadProposals();
    this.loadProjects();
    this.loadDetailedStats();
  }

  loadProposals(): void {
    this.proposalsLoading = true;
    this.proposalService.getByFreelancer(this.freelancerId).subscribe((items) => {
      console.log('Proposals loaded:', items);
      
      items.forEach(p => {
        if (!this.projectTitles.has(p.projectId)) {
          this.projectService.getById(p.projectId).subscribe(project => {
            if (project) {
              this.projectTitles.set(p.projectId, project.title);
            }
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
    return this.projectTitles.get(projectId) || `Project #${projectId}`;
  }

  loadDetailedStats(): void {
    this.proposalService.getFreelancerStatsDetailed(this.freelancerId).subscribe({
      next: (stats) => {
        this.detailedStats = stats;
      },
      error: (err) => console.error('Error loading detailed stats:', err)
    });
  }

  private loadAcceptedProjects(): void {
    const acceptedProjectIds = Array.from(
      new Set(this.proposals.filter((p) => p.status === 'ACCEPTED').map((p) => p.projectId))
    );
    if (acceptedProjectIds.length === 0) {
      this.acceptedProjects        = [];
      this.acceptedProjectsLoading = false;
      return;
    }
    this.acceptedProjectsLoading = true;
    forkJoin(acceptedProjectIds.map((id) => this.projectService.getById(id))).subscribe({
      next:  (projects) => { this.acceptedProjects = projects.filter(Boolean) as Project[]; this.acceptedProjectsLoading = false; },
      error: () => { this.acceptedProjects = []; this.acceptedProjectsLoading = false; }
    });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.searchProjects({ status: Status.OPEN }, 1, 50).subscribe((res) => {
      this.projects        = res.items;
      this.filteredProjects = [...this.projects];
      this.loading         = false;
    });
  }

  onSearchInput(): void {
    const q = (this.searchQuery || '').trim();
    if (!q) { this.filteredProjects = [...this.projects]; return; }
    this.loading = true;
    this.projectService.search(q).subscribe((projects) => {
      this.filteredProjects = projects.filter((p) => p.status === Status.OPEN);
      this.loading = false;
    });
  }

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
    this.searchQuery      = '';
    this.filterCategory   = '';
    this.filterExperience = '';
    this.filterBudgetMin  = '';
    this.filterBudgetMax  = '';
    this.filteredProjects = [...this.projects];
  }

  applyFilters(): void { this.filteredProjects = [...this.projects]; }

  getPercent(value: number): number {
    if (!this.stats || this.stats.totalProjects === 0) return 0;
    return Math.round((value / this.stats.totalProjects) * 100);
  }

  proposalSearchQuery  = '';
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
    { value: Experience.ENTRY,        label: 'Entry' },
    { value: Experience.INTERMEDIATE, label: 'Intermediate' },
    { value: Experience.EXPERT,       label: 'Expert' }
  ];

  openProposalForm(project: Project): void {
    this.selectedProject = project;
    this.propCoverLetter = '';
    this.propBudget = project.budgetMin || 0;
    this.propDeliveryDays = 0;
    this.propRevisionsOffered = 0;
    this.aiCoverGenerated = false;
    this.showProposalForm = true;
    this.generateAICoverLetter();
  }

  closeProposalForm(): void {
    this.showProposalForm = false;
    this.selectedProject  = null;
    this.aiCoverGenerated = false;
    this.aiCoverLoading   = false;
  }

  generateAICoverLetter(): void {
    if (!this.selectedProject) return;
    this.aiCoverLoading   = true;
    this.aiCoverGenerated = false;
    const req: CoverLetterRequest = {
      freelancerSkills:   this.freelancerSkills,
      projectTitle:       this.selectedProject.title,
      projectDescription: this.selectedProject.description,
      projectCategory:    this.selectedProject.category,
      projectBudgetMin:   this.selectedProject.budgetMin,
      projectBudgetMax:   this.selectedProject.budgetMax,
      projectDuration:    this.selectedProject.duration
    };
    this.proposalService.generateCoverLetter(req).subscribe({
      next: (res) => {
        if (res.coverLetter && res.coverLetter.trim()) {
          this.propCoverLetter  = res.coverLetter.trim();
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
    this.proposalService.create({
      projectId:         this.selectedProject.id,
      freelancerId:      this.freelancerId,
      coverLetter:       this.propCoverLetter.trim(),
      proposedBudget:    this.propBudget,
      deliveryDays:      this.propDeliveryDays,
      estimatedDuration: this.propDeliveryDays ? `${this.propDeliveryDays} day(s)` : '',
      revisionsOffered:  this.propRevisionsOffered
    }).subscribe({
      next: () => {
        this.proposalService.notifyClient({
          projectId:      this.selectedProject!.id,
          proposedBudget: this.propBudget,
          deliveryDays:   this.propDeliveryDays,
          coverLetter:    this.propCoverLetter.trim()
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
    return this.proposals.some((p) => p.projectId === projectId);
  }

  get totalProposals():   number { return this.proposals.length; }
  get acceptedProposals(): number { return this.proposals.filter((p) => p.status === 'ACCEPTED').length; }
  get pendingProposals():  number { return this.proposals.filter((p) => p.status === 'PENDING').length; }

  canEditOrDelete(p: ProjectProposal): boolean {
    if (p.status === 'NEGOTIATING') {
      return false;
    }
    const hasCounterOffer = (p.counterOfferPrice !== undefined && p.counterOfferPrice > 0) ||
                            (p.counterOfferMessage && p.counterOfferMessage.trim() !== '');
    return p.status === 'PENDING' && !hasCounterOffer;
  }

  startEdit(p: ProjectProposal): void {
    this.editingId         = p.id;
    this.editCoverLetter   = p.coverLetter;
    this.editProposedBudget = p.proposedBudget;
    this.editDeliveryDays  = p.deliveryDays ?? (parseInt(String(p.estimatedDuration || '0'), 10) || 0);
    this.editRevisionsOffered = p.revisionsOffered ?? 0;
  }

  cancelEdit(): void { this.editingId = null; }

  saveEdit(): void {
    if (this.editingId == null) return;
    this.saving = true;
    this.proposalService.update(this.editingId, {
      coverLetter:       this.editCoverLetter,
      proposedBudget:    this.editProposedBudget,
      deliveryDays:      this.editDeliveryDays,
      estimatedDuration: this.editDeliveryDays ? `${this.editDeliveryDays} day(s)` : '', 
      revisionsOffered:  this.editRevisionsOffered
    }).subscribe({
      next:  () => { this.saving = false; this.editingId = null; this.loadProposals(); this.loadDetailedStats(); },
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

  acceptCounterOffer(proposalId: number): void {
    this.proposalService.acceptCounterOffer(proposalId).subscribe({
      next: (updatedProposal) => {
        const index = this.proposals.findIndex(p => p.id === updatedProposal.id);
        if (index !== -1) this.proposals[index] = updatedProposal;
        this.applyProposalFilter();
        this.loadDetailedStats();
      },
      error: (err) => console.error('Erreur lors de l’acceptation de la contre‑offre', err)
    });
  }

  rejectCounterOffer(proposalId: number): void {
    this.proposalService.rejectCounterOffer(proposalId).subscribe({
      next: (updatedProposal) => {
        const index = this.proposals.findIndex(p => p.id === updatedProposal.id);
        if (index !== -1) this.proposals[index] = updatedProposal;
        this.applyProposalFilter();
        this.loadDetailedStats();
      },
      error: (err) => console.error('Erreur lors du refus de la contre‑offre', err)
    });
  }

  viewRankedProposals(project: Project): void {
    this.selectedProjectForRanking = project;
    this.proposalService.getRankedProposals(project.id).subscribe({
      next: (rankedList) => {
        this.rankedProposals = rankedList;
        this.showRankingModal = true;
      },
      error: (err) => console.error('Error loading ranked proposals:', err)
    });
  }

  closeRankingModal(): void {
    this.showRankingModal = false;
    this.rankedProposals = [];
    this.selectedProjectForRanking = null;
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