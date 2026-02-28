import { Routes } from '@angular/router';
import {MilestoneClientComponent} from "./components/client/milestone-client/milestone-client.component";
import {PaymentClientComponent} from "./components/client/payment-client/payment-client.component";
import {
  MilestoneFreelancerComponent
} from "./components/freelancer/milestone-freelancer/milestone-freelancer.component";

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
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
    loadComponent: () => import('./components/job-list/job-list.component').then(m => m.JobListComponent)
  },
  {
    path: 'jobs/:id',
    loadComponent: () => import('./components/job-detail/job-detail.component').then(m => m.JobDetailComponent)
  },
  {
    path: 'post-job',
    loadComponent: () => import('./components/post-job/post-job.component').then(m => m.PostJobComponent)
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
  { path: 'client/milestones', component: MilestoneClientComponent },
  { path: 'freelancer/milestones', component: MilestoneFreelancerComponent },

  {
    path: '**',
    redirectTo: ''
  }
];
