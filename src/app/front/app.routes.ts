import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./front-layout/front-layout.component').then(m => m.FrontLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
      },
      // =========================
      // Projects (gestion projets)
      // =========================
      {
        path: 'projects',
        loadComponent: () => import('./components/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./components/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./components/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () => import('./components/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: 'my-proposals',
        loadComponent: () => import('./components/my-proposals/my-proposals.component').then(m => m.MyProposalsComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'jobs',
        // Compat: ancien chemin -> nouvelle page projects
        loadComponent: () => import('./components/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'jobs/:id',
        // Compat: ancien chemin -> nouveau détail project
        loadComponent: () => import('./components/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: 'post-job',
        // Compat: ancien chemin -> création projet
        loadComponent: () => import('./components/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: 'my-jobs',
        loadComponent: () => import('./components/my-jobs/my-jobs.component').then(m => m.MyJobsComponent)
      },
      {
        path: 'proposals',
        loadComponent: () => import('./components/proposals/proposals.component').then(m => m.ProposalsComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./components/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'profile-client',
        loadComponent: () => import('./components/client-profile/client-profile.component').then(m => m.ClientProfileComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent)
      },
      {
        path: 'profile-freelancer',
        loadComponent: () => import('./components/freelancer-profile/freelancer-profile.component').then(m => m.FreelancerProfileComponent)
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];
