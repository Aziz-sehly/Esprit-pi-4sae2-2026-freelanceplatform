import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Standalone Components (all of them)
import { FrontLayoutComponent } from './front-layout/front-layout.component';
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

// Routes
import { FrontRoutingModule } from './front-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FrontRoutingModule,

    // Import all standalone components
    FrontLayoutComponent,
    HomeComponent,
    LoginComponent,
    //JobDetailComponent,
    JobListComponent,
    MessagesComponent,
    MyJobsComponent,
    //PostJobComponent,
    ProfileComponent,
    ProposalsComponent,
    RegisterComponent
  ]
})
export class FrontModule { }
