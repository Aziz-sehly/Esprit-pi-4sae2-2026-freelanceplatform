import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-invoice-details',
    imports: [RouterLink, MatCardModule, MatMenuModule, MatButtonModule],
    templateUrl: './invoice-details.component.html',
    styleUrl: './invoice-details.component.scss'
})
export class InvoiceDetailsComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}