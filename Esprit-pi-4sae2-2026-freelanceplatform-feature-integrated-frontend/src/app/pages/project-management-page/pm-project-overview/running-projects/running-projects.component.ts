import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomizerSettingsService } from '../../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-running-projects',
    imports: [MatCardModule, MatMenuModule, MatButtonModule, MatProgressBarModule],
    templateUrl: './running-projects.component.html',
    styleUrl: './running-projects.component.scss'
})
export class RunningProjectsComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}