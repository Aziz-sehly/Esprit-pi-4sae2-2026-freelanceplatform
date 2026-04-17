import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomizerSettingsService } from '../../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-product-development',
    imports: [MatCardModule, MatButtonModule, MatProgressBarModule],
    templateUrl: './product-development.component.html',
    styleUrl: './product-development.component.scss'
})
export class ProductDevelopmentComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}