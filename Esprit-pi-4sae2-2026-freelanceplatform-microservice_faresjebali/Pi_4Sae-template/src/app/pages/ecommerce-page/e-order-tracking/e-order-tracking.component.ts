import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-e-order-tracking',
    imports: [MatCardModule, MatMenuModule, MatButtonModule, RouterLink],
    templateUrl: './e-order-tracking.component.html',
    styleUrl: './e-order-tracking.component.scss'
})
export class EOrderTrackingComponent {
    
    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}