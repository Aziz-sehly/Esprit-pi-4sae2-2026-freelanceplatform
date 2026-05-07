import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: '<div style="padding:4rem 2rem;text-align:center;max-width:800px;margin:0 auto;"><h1 style="font-size:2.5rem;margin-bottom:1rem;">Profile</h1><p style="color:#6b7280;font-size:1.125rem;">Your profile settings, portfolio, and preferences would appear here.</p></div>'
})
export class ProfileComponent {}
