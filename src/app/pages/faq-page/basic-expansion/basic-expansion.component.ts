import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-basic-expansion',
    imports: [MatCardModule, MatButtonModule, MatExpansionModule],
    templateUrl: './basic-expansion.component.html',
    styleUrl: './basic-expansion.component.scss'
})
export class BasicExpansionComponent {

    // Expansion Panel
    panelOpenState = false;

    constructor(
        public themeService: CustomizerSettingsService
    ) {}
    
}