import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-typography',
    imports: [RouterLink, MatCardModule],
    templateUrl: './typography.component.html',
    styleUrl: './typography.component.scss'
})
export class TypographyComponent {}