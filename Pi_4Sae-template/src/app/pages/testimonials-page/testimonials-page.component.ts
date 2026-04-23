import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-testimonials-page',
    imports: [RouterLink, MatCardModule],
    templateUrl: './testimonials-page.component.html',
    styleUrl: './testimonials-page.component.scss'
})
export class TestimonialsPageComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}