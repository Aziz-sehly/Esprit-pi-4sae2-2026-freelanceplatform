import { Routes } from '@angular/router';
import { ClientContractsComponent } from './components/client/client-contracts/client-contracts.component';
import { ClientActivityComponent } from './components/client/client-activity/client-activity.component';
import { ClientDisputesComponent } from './components/client/client-disputes/client-disputes.component';
import { MilestoneClientComponent } from './components/client/milestone-client/milestone-client.component';
import { FreelancerContractsComponent } from './components/freelancer/freelancer-contracts/freelancer-contracts.component';
import { FreelancerActivityComponent } from './components/freelancer/freelancer-activity/freelancer-activity.component';
import { FreelancerDisputesComponent } from './components/freelancer/freelancer-disputes/freelancer-disputes.component';
import { MilestoneFreelancerComponent } from './components/freelancer/milestone-freelancer/milestone-freelancer.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'jobs',
    loadComponent: () => import('./components/job-list/job-list.component').then((m) => m.JobListComponent),
  },
  {
    path: 'jobs/:id',
    loadComponent: () => import('./components/job-detail/job-detail.component').then((m) => m.JobDetailComponent),
  },
  {
    path: 'post-job',
    loadComponent: () => import('./components/post-job/post-job.component').then((m) => m.PostJobComponent),
  },
  {
    path: 'my-jobs',
    loadComponent: () => import('./components/my-jobs/my-jobs.component').then((m) => m.MyJobsComponent),
  },
  {
    path: 'proposals',
    loadComponent: () => import('./components/proposals/proposals.component').then((m) => m.ProposalsComponent),
  },
  {
    path: 'messages',
    loadComponent: () => import('./components/messages/messages.component').then((m) => m.MessagesComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then((m) => m.ProfileComponent),
  },
  { path: 'client/contracts', component: ClientContractsComponent },
  { path: 'client/contracts/:id/workspace', component: MilestoneClientComponent },
  { path: 'client/contracts/:id/activity', component: ClientActivityComponent },
  { path: 'client/contracts/:id/disputes', component: ClientDisputesComponent },
  { path: 'freelancer/contracts', component: FreelancerContractsComponent },
  { path: 'freelancer/contracts/:id/workspace', component: MilestoneFreelancerComponent },
  { path: 'freelancer/contracts/:id/activity', component: FreelancerActivityComponent },
  { path: 'freelancer/contracts/:id/disputes', component: FreelancerDisputesComponent },
  {
    path: 'payments/success',
    loadComponent: () =>
      import('./components/client/payment-result/payment-result.component').then((m) => m.PaymentResultComponent),
  },
  {
    path: 'payments/cancel',
    loadComponent: () =>
      import('./components/client/payment-result/payment-result.component').then((m) => m.PaymentResultComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
