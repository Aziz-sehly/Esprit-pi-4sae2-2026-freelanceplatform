import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectsRoadmapService } from './projects-roadmap.service';

@Component({
    selector: 'app-projects-roadmap',
    imports: [MatCardModule, MatMenuModule, MatButtonModule],
    templateUrl: './projects-roadmap.component.html',
    styleUrl: './projects-roadmap.component.scss'
})
export class ProjectsRoadmapComponent {

    constructor(
        private projectsRoadmapService: ProjectsRoadmapService
    ) {}

    ngOnInit(): void {
        this.projectsRoadmapService.loadChart();
    }

}