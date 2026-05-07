import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-advance-expansion',
    imports: [MatCardModule, MatButtonModule, MatExpansionModule],
    templateUrl: './advance-expansion.component.html',
    styleUrl: './advance-expansion.component.scss'
})
export class AdvanceExpansionComponent {

    // Expansion Panel
    panelOpenState = false;

    constructor(
        public themeService: CustomizerSettingsService
    ) {}
    
}