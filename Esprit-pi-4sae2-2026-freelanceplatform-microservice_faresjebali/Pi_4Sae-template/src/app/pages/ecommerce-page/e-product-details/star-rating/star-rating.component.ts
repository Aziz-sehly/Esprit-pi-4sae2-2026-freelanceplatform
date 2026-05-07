import { NgFor } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CustomizerSettingsService } from '../../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-star-rating',
    imports: [NgFor],
    templateUrl: './star-rating.component.html',
    styleUrl: './star-rating.component.scss'
})
export class StarRatingComponent {

    @Input() rating!: number;
    @Input() readonly: boolean = false;
    @Output() ratingChange: EventEmitter<number> = new EventEmitter<number>();

    onClick(rating: number): void {
        if (!this.readonly) {
            this.rating = rating;
            this.ratingChange.emit(this.rating);
        }
    }

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}