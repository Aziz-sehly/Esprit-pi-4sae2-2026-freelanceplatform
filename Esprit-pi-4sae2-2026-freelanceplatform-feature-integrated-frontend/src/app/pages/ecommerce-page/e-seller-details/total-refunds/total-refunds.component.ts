import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CustomizerSettingsService } from '../../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-total-refunds',
    imports: [MatCardModule],
    templateUrl: './total-refunds.component.html',
    styleUrl: './total-refunds.component.scss'
})
export class TotalRefundsComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}