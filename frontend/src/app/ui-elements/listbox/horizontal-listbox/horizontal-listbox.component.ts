import { Component } from '@angular/core';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-horizontal-listbox',
    imports: [CdkListbox, CdkOption],
    templateUrl: './horizontal-listbox.component.html',
    styleUrl: './horizontal-listbox.component.scss'
})
export class HorizontalListboxComponent {

    sizes = ['XS', 'S', 'M', 'L', 'XL'];

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}