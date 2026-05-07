import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-pricing-page',
    imports: [RouterLink, MatCardModule, MatButtonModule, MatMenuModule],
    templateUrl: './pricing-page.component.html',
    styleUrl: './pricing-page.component.scss'
})
export class PricingPageComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}