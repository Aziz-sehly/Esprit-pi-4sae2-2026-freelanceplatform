import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-quantity-counter',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="quantity-counter d-flex align-items-center">
      <button mat-icon-button (click)="decrement()" [disabled]="value <= min">
        <mat-icon>remove</mat-icon>
      </button>
      <span class="mx-15 fw-bold">{{value}}</span>
      <button mat-icon-button (click)="increment()" [disabled]="value >= max">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .quantity-counter {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 5px;
    }
  `]
})
export class QuantityCounterComponent {
  @Input() value = 1;
  @Input() min = 1;
  @Input() max = 10;
  @Output() valueChange = new EventEmitter<number>();

  increment(): void {
    if (this.value < this.max) {
      this.value++;
      this.valueChange.emit(this.value);
    }
  }

  decrement(): void {
    if (this.value > this.min) {
      this.value--;
      this.valueChange.emit(this.value);
    }
  }
}