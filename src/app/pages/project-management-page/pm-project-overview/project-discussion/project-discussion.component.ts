import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { CustomizerSettingsService } from '../../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-project-discussion',
    imports: [MatCardModule, MatMenuModule, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule],
    templateUrl: './project-discussion.component.html',
    styleUrl: './project-discussion.component.scss'
})
export class ProjectDiscussionComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}