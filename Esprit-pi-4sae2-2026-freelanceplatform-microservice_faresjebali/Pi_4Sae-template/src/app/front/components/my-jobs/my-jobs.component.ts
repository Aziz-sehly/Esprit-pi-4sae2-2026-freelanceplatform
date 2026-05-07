import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Project } from '../../models/models';
import { ProjectService } from '../../services/project.service';
import { ProjectProposalService } from '../../services/project-proposal.service';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-jobs.component.html',
  styleUrls: ['./my-jobs.component.scss']
})
export class MyJobsComponent implements OnInit {
  loading = true;
  projects: Project[] = [];

  // TODO: remplacer par authService.user.id (client connecté)
  private readonly clientId = 1;

  constructor(
    private readonly projectService: ProjectService,
    private readonly proposalService: ProjectProposalService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.projectService.getByClient(this.clientId, 1, 100).subscribe((res) => {
      this.projects = res.items;
      // Refresh proposal counts for each project
      this.projects.forEach((p) => {
        this.proposalService.getByProject(p.id).subscribe((proposals) => {
          p.proposalsCount = proposals.length;
        });
      });
      this.loading = false;
    });
  }

  createNew(): void {
    this.router.navigate(['/front/projects/new']);
  }

  edit(id: number): void {
    this.router.navigate(['/front/projects', id, 'edit']);
  }

  view(id: number): void {
    this.router.navigate(['/front/projects', id]);
  }

  delete(id: number, ev: Event): void {
    ev.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    this.projectService.delete(id).subscribe({
      next: (ok) => {
        if (ok) {
          this.projects = this.projects.filter((p) => p.id !== id);
          alert('Project deleted successfully.');
        } else {
          alert('Failed to delete project.');
        }
      },
      error: () => {
        alert('Error while deleting project.');
      }
    });
  }
}
