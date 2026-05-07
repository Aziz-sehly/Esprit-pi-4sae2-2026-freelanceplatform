import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Experience, Project, ProjectFilters, Status } from '../../models/models';
import { ProjectService } from '../../services/project.service';
import { ProjectProposalService } from '../../services/project-proposal.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  loading = true;
  projects: Project[] = [];
  total = 0;

  categories: string[] = [];
  filters: ProjectFilters = {};

  experienceOptions = [
    { value: Experience.ENTRY, label: 'Entry' },
    { value: Experience.INTERMEDIATE, label: 'Intermediate' },
    { value: Experience.EXPERT, label: 'Expert' }
  ];

  statusOptions = [
    { value: Status.OPEN, label: 'Open' },
    { value: Status.IN_PROGRESS, label: 'In progress' },
    { value: Status.COMPLETED, label: 'Completed' },
    { value: Status.ARCHIVED, label: 'Archived' }
  ];

  constructor(
    private readonly projectService: ProjectService,
    private readonly proposalService: ProjectProposalService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.projectService.getCategories().subscribe((cats) => (this.categories = cats));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.projectService.searchProjects(this.filters, 1, 50).subscribe((res) => {
      this.projects = res.items;
      this.total = res.total;
      // Refresh proposal counts per project from proposal API
      this.projects.forEach((p) => {
        this.proposalService.getByProject(p.id).subscribe((proposals) => {
          p.proposalsCount = proposals.length;
        });
      });
      this.loading = false;
    });
  }

  clear(): void {
    this.filters = {};
    this.load();
  }

  open(projectId: number): void {
    this.router.navigate(['/front/projects', projectId], { queryParams: { as: 'freelancer' } });
  }

  createNew(): void {
    this.router.navigate(['/front/projects/new']);
  }
}

