import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-videos',
    imports: [RouterLink, MatCardModule],
    templateUrl: './videos.component.html',
    styleUrl: './videos.component.scss'
})
export class VideosComponent {}