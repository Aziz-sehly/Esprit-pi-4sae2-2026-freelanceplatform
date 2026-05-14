import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-lbw-disabled-options',
    imports: [FormsModule, ReactiveFormsModule, CdkListbox, CdkOption],
    templateUrl: './lbw-disabled-options.component.html',
    styleUrl: './lbw-disabled-options.component.scss'
})
export class LbwDisabledOptionsComponent {

    canDrinkCtrl = new FormControl(false);

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}