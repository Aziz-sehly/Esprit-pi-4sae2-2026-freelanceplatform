import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-basic-drawer',
    imports: [MatSidenavModule],
    templateUrl: './basic-drawer.component.html',
    styleUrl: './basic-drawer.component.scss'
})
export class BasicDrawerComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}