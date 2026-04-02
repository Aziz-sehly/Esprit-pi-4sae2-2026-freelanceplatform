import { Component } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-front-layout',
  templateUrl: './front-layout.component.html',
  styleUrls: ['./front-layout.component.scss'],
  standalone: true,
  imports: [RouterModule, RouterLink, RouterLinkActive]  // <-- RouterLink et RouterLinkActive pour les liens
})
export class FrontLayoutComponent {}
