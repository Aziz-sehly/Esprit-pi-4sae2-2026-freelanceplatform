import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { CustomizerSettingsService } from '../../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-timeline',
    imports: [MatMenuModule, MatButtonModule, MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule],
    templateUrl: './timeline.component.html',
    styleUrl: './timeline.component.scss'
})
export class TimelineComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}