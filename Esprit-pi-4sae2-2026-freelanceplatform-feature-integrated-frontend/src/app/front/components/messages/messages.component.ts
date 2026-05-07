import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding:4rem 2rem;max-width:800px;margin:0 auto;">
      <h1 style="font-size:2rem;margin-bottom:1rem;">Messages</h1>
      <p style="color:#6b7280;font-size:1.05rem;line-height:1.6;margin-bottom:1.5rem;">
        Les conversations en temps réel liées à un contrat sont disponibles dans l’espace de travail
        d’un contrat (onglet chat). Cette page peut accueillir une messagerie globale une fois branchée
        sur votre API messages.
      </p>
      <p style="margin-bottom:0.75rem;"><strong>Client</strong> —</p>
      <a routerLink="/front/client/contracts" style="color:#2563eb;">Contrats client & jalons</a>
      <p style="margin:1.25rem 0 0.75rem;"><strong>Freelance</strong> —</p>
      <a routerLink="/front/freelancer/contracts" style="color:#2563eb;">Contrats freelance & jalons</a>
    </div>
  `,
})
export class MessagesComponent {}
