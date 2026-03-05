import { Component, OnInit, inject } from '@angular/core';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-login-redirect',
  standalone: true,
  template: `
    <div class="login-redirect">
      <p>Redirection vers la connexion...</p>
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .login-redirect {
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
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginRedirectComponent implements OnInit {
  private keycloak = inject(Keycloak) as Keycloak;

  ngOnInit(): void {
    this.keycloak.login({ redirectUri: window.location.origin + '/front' });
  }
}
