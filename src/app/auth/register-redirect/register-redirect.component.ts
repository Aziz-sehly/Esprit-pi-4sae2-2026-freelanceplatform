import { Component, OnInit, inject } from '@angular/core';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-register-redirect',
  standalone: true,
  template: `
    <div class="register-redirect">
      <p>Redirection vers l'inscription...</p>
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .register-redirect {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      gap: 1rem;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class RegisterRedirectComponent implements OnInit {
  private keycloak = inject(Keycloak) as Keycloak;

  ngOnInit(): void {
    this.keycloak.register({ redirectUri: window.location.origin + '/front' });
  }
}
