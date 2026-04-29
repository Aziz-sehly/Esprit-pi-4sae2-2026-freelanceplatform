import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CustomizerSettingsService } from '../../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-conversion-rate',
    imports: [MatCardModule],
    templateUrl: './conversion-rate.component.html',
    styleUrl: './conversion-rate.component.scss'
})
export class ConversionRateComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}