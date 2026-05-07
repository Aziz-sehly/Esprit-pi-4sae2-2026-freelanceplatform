import { Routes } from '@angular/router';
import { authGuard } from '../auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./front-layout/front-layout.component').then(m => m.FrontLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('../auth/login-redirect/login-redirect.component').then(m => m.LoginRedirectComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('../auth/register-redirect/register-redirect.component').then(m => m.RegisterRedirectComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./components/messages/messages.component').then(m => m.MessagesComponent),
        canActivate: [authGuard]
      },
      {
        path: 'disputes',
        loadComponent: () => import('./components/disputes/disputes.component').then(m => m.DisputesComponent),
        canActivate: [authGuard]
      },
      {
        path: 'disputes/:id',
        loadComponent: () => import('./components/dispute-detail/dispute-detail.component').then(m => m.DisputeDetailComponent),
        canActivate: [authGuard]
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];
