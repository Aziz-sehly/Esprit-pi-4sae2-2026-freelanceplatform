import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-assets',
    imports: [RouterLink, MatCardModule, MatMenuModule, MatButtonModule],
    templateUrl: './assets.component.html',
    styleUrl: './assets.component.scss'
})
export class AssetsComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}