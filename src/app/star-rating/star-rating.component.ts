import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="star-rating d-flex align-items-center">
      <mat-icon *ngFor="let star of stars" 
                (click)="setRating(star)"
                [class.filled]="star <= rating"
                class="cursor-pointer">
        {{star <= rating ? 'star' : 'star_border'}}
      </mat-icon>
    </div>
  `,
  styles: [`
    .star-rating {
      mat-icon {
        color: #ddd;
        transition: color 0.2s;
        
        &.filled {
          color: #ffc107;
        }
        
        &:hover {
          color: #ffc107;
        }
      }
    }
  `]
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Output() ratingChange = new EventEmitter<number>();
  
  stars = [1, 2, 3, 4, 5];

  setRating(value: number): void {
    this.rating = value;
    this.ratingChange.emit(value);
  }
}