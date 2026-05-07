import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CustomizerSettingsService } from '../../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-total-earnings',
    imports: [MatCardModule],
    templateUrl: './total-earnings.component.html',
    styleUrl: './total-earnings.component.scss'
})
export class TotalEarningsComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}