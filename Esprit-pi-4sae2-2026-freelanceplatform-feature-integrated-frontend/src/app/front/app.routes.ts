import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './services/auth.service';

const isAuthenticated = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) {
    router.navigate(['/front/login'], { queryParams: { redirect: state.url } });
    return false;
  }
  return true;
};

const isFreelancer = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated()) {
    router.navigate(['/front/login'], { queryParams: { redirect: state.url } });
    return false;
  }
  if (user?.role !== 'FREELANCER') {
    router.navigate(['/front/unauthorized']);
    return false;
  }
  return true;
};

const isClient = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated()) {
    router.navigate(['/front/login'], { queryParams: { redirect: state.url } });
    return false;
  }
  if (user?.role !== 'CLIENT') {
    router.navigate(['/front/unauthorized']);
    return false;
  }
  return true;
};

const isClientOrFreelancer = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated()) {
    router.navigate(['/front/login'], { queryParams: { redirect: state.url } });
    return false;
  }
  if (user?.role !== 'CLIENT' && user?.role !== 'FREELANCER') {
    router.navigate(['/front/unauthorized']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./front-layout/front-layout.component').then(m => m.FrontLayoutComponent),
    children: [

      // =========================
      // Public Routes
      // =========================
      {
        path: '',
        loadComponent: () =>
          import('./components/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./components/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./components/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./components/about/about.component').then(m => m.AboutComponent)
      },

      // =========================
      // SERVICES — static routes MUST come before :slug
      // =========================
      {
        path: 'services',
        loadComponent: () =>
          import('./components/service-list/service-list.component').then(m => m.ServiceListComponent)
      },
      {
        path: 'services/new',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/service-form/service-form.component').then(m => m.ServiceFormComponent)
      },
      {
        path: 'services/create',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/service-form/service-form.component').then(m => m.ServiceFormComponent)
      },
      {
        path: 'services/:id/edit',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/service-form/service-form.component').then(m => m.ServiceFormComponent)
      },
      {
        path: 'services/:id/addons',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/addon-management/addon-management.component').then(m => m.AddonManagementComponent)
      },
      // :slug MUST be last among /services/* routes
      {
        path: 'services/:slug',
        loadComponent: () =>
          import('./components/service-details/service-details.component').then(m => m.ServiceDetailsComponent)
      },

      // =========================
      // Public Project Browsing
      // =========================
      {
        path: 'projects',
        loadComponent: () =>
          import('./components/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'projects/new',
        canActivate: [isClient],
        loadComponent: () =>
          import('./components/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: 'projects/:id/edit',
        canActivate: [isClient],
        loadComponent: () =>
          import('./components/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./components/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },

      // =========================
      // FREELANCER SHOP (Public View)
      // =========================
      {
        path: 'freelancer/:id/shop',
        loadComponent: () =>
          import('./components/freelancer-shop/freelancer-shop.component').then(m => m.FreelancerShopComponent)
      },

      // =========================
      // CONTRACT SIGNING
      // =========================
      {
        path: 'sign-contract/:contractId',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./components/contract-signing/contract-signing.component').then(m => m.ContractSigningComponent)
      },

      // =========================
      // MY CONTRACTS
      // =========================
      {
        path: 'my-contracts',
        canActivate: [isClientOrFreelancer],
        loadComponent: () =>
          import('./components/contracts/Contracts.component').then(m => m.ContractsComponent)
      },

      // =========================
      // WORKSPACE — distinct paths per role (no inject() in loadComponent)
      // =========================
      {
        path: 'my-contracts/:id/workspace',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./upwork/components/freelancer/milestone-freelancer/milestone-freelancer.component')
            .then(m => m.MilestoneFreelancerComponent)
      },
      {
        path: 'my-contracts/:id/workspace-client',
        canActivate: [isClient],
        loadComponent: () =>
          import('./upwork/components/client/milestone-client/milestone-client.component')
            .then(m => m.MilestoneClientComponent)
      },

      // =========================
      // ACTIVITY — distinct paths per role
      // =========================
      {
        path: 'my-contracts/:id/activity',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./upwork/components/freelancer/freelancer-activity/freelancer-activity.component')
            .then(m => m.FreelancerActivityComponent)
      },
      {
        path: 'my-contracts/:id/activity-client',
        canActivate: [isClient],
        loadComponent: () =>
          import('./upwork/components/client/client-activity/client-activity.component')
            .then(m => m.ClientActivityComponent)
      },

      // =========================
      // DISPUTES — distinct paths per role
      // =========================
      {
        path: 'my-contracts/:id/disputes',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./upwork/components/freelancer/freelancer-disputes/freelancer-disputes.component')
            .then(m => m.FreelancerDisputesComponent)
      },
      {
        path: 'my-contracts/:id/disputes-client',
        canActivate: [isClient],
        loadComponent: () =>
          import('./upwork/components/client/client-disputes/client-disputes.component')
            .then(m => m.ClientDisputesComponent)
      },

      // =========================
      // PAYMENT RESULTS
      // =========================
      {
        path: 'payments/success',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./upwork/components/client/payment-result/payment-result.component')
            .then(m => m.PaymentResultComponent)
      },
      {
        path: 'payments/cancel',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./upwork/components/client/payment-result/payment-result.component')
            .then(m => m.PaymentResultComponent)
      },

      // =========================
      // FREELANCER ROUTES
      // =========================
      {
        path: 'profile-freelancer',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/freelancer-profile/freelancer-profile.component').then(m => m.FreelancerProfileComponent)
      },
      {
        path: 'my-proposals',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/my-proposals/my-proposals.component').then(m => m.MyProposalsComponent)
      },
      {
        path: 'jobs',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'jobs/:id',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: 'my-shop',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/shop-management/shop-management.component').then(m => m.ShopManagementComponent)
      },
      {
        path: 'shop/create',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/shop-management/shop-management.component').then(m => m.ShopManagementComponent)
      },
      {
        path: 'shop/edit',
        canActivate: [isFreelancer],
        loadComponent: () =>
          import('./components/shop-management/shop-management.component').then(m => m.ShopManagementComponent)
      },

      // =========================
      // CLIENT ROUTES
      // =========================
      {
        path: 'profile-client',
        canActivate: [isClient],
        loadComponent: () =>
          import('./components/client-profile/client-profile.component').then(m => m.ClientProfileComponent)
      },
      {
        path: 'my-jobs',
        canActivate: [isClient],
        loadComponent: () =>
          import('./components/my-jobs/my-jobs.component').then(m => m.MyJobsComponent)
      },
      {
        path: 'post-job',
        canActivate: [isClient],
        loadComponent: () =>
          import('./components/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: 'proposals',
        canActivate: [isClient],
        loadComponent: () =>
          import('./components/proposals/proposals.component').then(m => m.ProposalsComponent)
      },

      // =========================
      // GENERIC PROTECTED ROUTES
      // =========================
      {
        path: 'checkout',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./components/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'my-orders',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./components/my-orders/my-orders.component').then(m => m.MyOrdersComponent)
      },
      {
        path: 'messages',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./upwork/components/messages-platform/messages-platform.component')
            .then(m => m.MessagesPlatformComponent)
      },
      {
        path: 'disputes/:id',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./upwork/components/dispute-detail-platform/dispute-detail-platform.component')
            .then(m => m.DisputeDetailPlatformComponent)
      },
      {
        path: 'disputes',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./upwork/components/disputes-platform/disputes-platform.component')
            .then(m => m.DisputesPlatformComponent)
      },
      {
        path: 'profile',
        canActivate: [isAuthenticated],
        loadComponent: () =>
          import('./components/profile/profile.component').then(m => m.ProfileComponent)
      },

      // =========================
      // CATCH ALL
      // =========================
      {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];