import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Layout
import { FrontLayoutComponent } from './front-layout/front-layout.component';

// Components
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
//import { JobDetailComponent } from './components/job-detail/job-detail.component';
import { JobListComponent } from './components/job-list/job-list.component';
import { MessagesComponent } from './components/messages/messages.component';
import { MyJobsComponent } from './components/my-jobs/my-jobs.component';
//import { PostJobComponent } from './components/post-job/post-job.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProposalsComponent } from './components/proposals/proposals.component';
import { RegisterComponent } from './components/register/register.component';

const routes: Routes = [
  {
    path: '',
    component: FrontLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'register',
        component: RegisterComponent
      },
      {
        path: 'jobs',
        component: JobListComponent
      },
  /*    {
        path: 'jobs/:id',
        component: JobDetailComponent
      }, */
      {
        path: 'messages',
        component: MessagesComponent
      },
      {
        path: 'my-jobs',
        component: MyJobsComponent
      },
   /*   {
        path: 'post-job',
        component: PostJobComponent
      },  */
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'proposals',
        component: ProposalsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrontRoutingModule { }