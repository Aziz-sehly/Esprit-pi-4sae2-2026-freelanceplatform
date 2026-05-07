import { Component } from '@angular/core';
import {
    CdkDrag,
    CdkDragDrop,
    CdkDropList,
    CdkDropListGroup,
    moveItemInArray,
    transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-dd-disabled-sorting',
    imports: [CdkDropListGroup, CdkDropList, CdkDrag],
    templateUrl: './dd-disabled-sorting.component.html',
    styleUrl: './dd-disabled-sorting.component.scss'
})
export class DdDisabledSortingComponent {

    items = [
        {
            value: 'Carrots',
            disabled: false
        },
        {
            value: 'Tomatoes',
            disabled: true
        },
        {
            value: 'Onions',
            disabled: false
        },
        {
            value: 'Apples',
            disabled: false
        },
        {
            value: 'Avocados',
            disabled: false
        }
    ];

    basket = [
        {
            value: 'Oranges',
            disabled: false
        },
        {
            value: 'Bananas',
            disabled: false
        },
        {
            value: 'Cucumbers',
            disabled: true
        }
    ];

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    }

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}