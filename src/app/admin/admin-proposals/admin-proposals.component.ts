import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project, ProjectProposal } from '../../front/models/models';
import { ProjectProposalService } from '../../front/services/project-proposal.service';
import { ProjectService } from '../../front/services/project.service';

@Component({
  selector: 'app-admin-proposals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-proposals.component.html',
  styleUrls: ['./admin-proposals.component.scss']
})
export class AdminProposalsComponent implements OnInit {
  loading = true;
  proposals: ProjectProposal[] = [];
  projectMap: Record<number, Project> = {};

  constructor(
    private readonly proposalService: ProjectProposalService,
    private readonly projectService: ProjectService
  ) {}

  ngOnInit(): void {
    // toutes les propositions connues via les freelancers (simplification)
    // Pour l’API réelle: endpoint admin pour lister toutes les proposals.
    this.load();
  }

  load(): void {
    this.loading = true;
    this.proposalService.getAllProposals().subscribe((list) => {
      this.proposals = list;
      const ids = Array.from(new Set(list.map((p) => p.projectId)));
      ids.forEach((id) => {
        this.projectService.getById(id).subscribe((proj) => {
          if (proj) this.projectMap[id] = proj;
        });
      });
      this.loading = false;
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this proposal?')) return;
    this.proposalService.delete(id).subscribe((ok) => {
      if (ok) this.load();
    });
  }

  getProjectTitle(projectId: number): string {
    const proj = this.projectMap[projectId];
    return proj?.title ?? `Project #${projectId}`;
  }
}

