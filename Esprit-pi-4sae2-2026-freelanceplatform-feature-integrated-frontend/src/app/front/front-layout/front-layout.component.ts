// front-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserResponse } from '../services/auth.service';

@Component({
  selector: 'app-front-layout',
  templateUrl: './front-layout.component.html',
  styleUrls: ['./front-layout.component.scss'],
  standalone: true,
  imports: [RouterModule, RouterLink, RouterLinkActive, CommonModule]
})
export class FrontLayoutComponent implements OnInit {
  currentUser: UserResponse | null = null;
  isMenuOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  getDashboardLink(): string {
    if (!this.currentUser) return '/front/login';
    switch (this.currentUser.role) {
      case 'CLIENT': return '/front/profile-client';
      case 'FREELANCER': return '/front/profile-freelancer';
      default: return '/front/dashboard';
    }
  }
}