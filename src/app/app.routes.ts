import { Routes } from '@angular/router';
import { NotFoundComponent } from './common/not-found/not-found.component';
import { adminGuard } from './auth/auth.guards';

// Dashboard Components
import { EcommerceComponent } from './dashboard/ecommerce/ecommerce.component';
import { ProjectManagementComponent } from './dashboard/project-management/project-management.component';
import { CrmComponent } from './dashboard/crm/crm.component';
import { LmsComponent } from './dashboard/lms/lms.component';
import { HelpDeskComponent } from './dashboard/help-desk/help-desk.component';

// Apps Components
import { ToDoListComponent } from './apps/to-do-list/to-do-list.component';
import { CalendarComponent } from './apps/calendar/calendar.component';
import { ContactsComponent } from './apps/contacts/contacts.component';
import { ChatComponent } from './apps/chat/chat.component';
import { KanbanBoardComponent } from './apps/kanban-board/kanban-board.component';
import { FileManagerComponent } from './apps/file-manager/file-manager.component';
import { MyDriveComponent } from './apps/file-manager/my-drive/my-drive.component';
import { AssetsComponent } from './apps/file-manager/assets/assets.component';
import { ProjectsComponent } from './apps/file-manager/projects/projects.component';
import { PersonalComponent } from './apps/file-manager/personal/personal.component';
import { ApplicationsComponent } from './apps/file-manager/applications/applications.component';
import { DocumentsComponent } from './apps/file-manager/documents/documents.component';
import { MediaComponent } from './apps/file-manager/media/media.component';
import { EmailComponent } from './apps/email/email.component';
import { InboxComponent } from './apps/email/inbox/inbox.component';
import { ComposeComponent } from './apps/email/compose/compose.component';
import { ReadComponent } from './apps/email/read/read.component';

// Pages Components
import { EcommercePageComponent } from './pages/ecommerce-page/ecommerce-page.component';
import { EProductsGridComponent } from './pages/ecommerce-page/e-products-grid/e-products-grid.component';
import { EProductsListComponent } from './pages/ecommerce-page/e-products-list/e-products-list.component';
import { EProductDetailsComponent } from './pages/ecommerce-page/e-product-details/e-product-details.component';
import { ECreateProductComponent } from './pages/ecommerce-page/e-create-product/e-create-product.component';
import { EEditProductComponent } from './pages/ecommerce-page/e-edit-product/e-edit-product.component';
import { EOrdersComponent } from './pages/ecommerce-page/e-orders/e-orders.component';
import { EOrderDetailsComponent } from './pages/ecommerce-page/e-order-details/e-order-details.component';
import { ECreateOrderComponent } from './pages/ecommerce-page/e-create-order/e-create-order.component';
import { EOrderTrackingComponent } from './pages/ecommerce-page/e-order-tracking/e-order-tracking.component';
import { ECustomersComponent } from './pages/ecommerce-page/e-customers/e-customers.component';
import { ECustomerDetailsComponent } from './pages/ecommerce-page/e-customer-details/e-customer-details.component';
import { ECartComponent } from './pages/ecommerce-page/e-cart/e-cart.component';
import { ECheckoutComponent } from './pages/ecommerce-page/e-checkout/e-checkout.component';
import { ESellersComponent } from './pages/ecommerce-page/e-sellers/e-sellers.component';
import { ESellerDetailsComponent } from './pages/ecommerce-page/e-seller-details/e-seller-details.component';
import { ECreateSellerComponent } from './pages/ecommerce-page/e-create-seller/e-create-seller.component';
import { ERefundsComponent } from './pages/ecommerce-page/e-refunds/e-refunds.component';
import { ECategoriesComponent } from './pages/ecommerce-page/e-categories/e-categories.component';
import { ECreateCategoryComponent } from './pages/ecommerce-page/e-create-category/e-create-category.component';
import { EEditCategoryComponent } from './pages/ecommerce-page/e-edit-category/e-edit-category.component';
import { EReviewsComponent } from './pages/ecommerce-page/e-reviews/e-reviews.component';

import { CrmPageComponent } from './pages/crm-page/crm-page.component';
import { CContactsComponent } from './pages/crm-page/c-contacts/c-contacts.component';
import { CCreateContactComponent } from './pages/crm-page/c-create-contact/c-create-contact.component';
import { CEditContactComponent } from './pages/crm-page/c-edit-contact/c-edit-contact.component';
import { CCustomersComponent } from './pages/crm-page/c-customers/c-customers.component';
import { CCreateLeadComponent } from './pages/crm-page/c-create-lead/c-create-lead.component';
import { CEditLeadComponent } from './pages/crm-page/c-edit-lead/c-edit-lead.component';
import { CLeadsComponent } from './pages/crm-page/c-leads/c-leads.component';
import { CDealsComponent } from './pages/crm-page/c-deals/c-deals.component';
import { CCreateDealComponent } from './pages/crm-page/c-create-deal/c-create-deal.component';

import { ProjectManagementPageComponent } from './pages/project-management-page/project-management-page.component';
import { PmProjectOverviewComponent } from './pages/project-management-page/pm-project-overview/pm-project-overview.component';
import { PmProjectsListComponent } from './pages/project-management-page/pm-projects-list/pm-projects-list.component';
import { PmCreateProjectComponent } from './pages/project-management-page/pm-create-project/pm-create-project.component';
import { PmClientsComponent } from './pages/project-management-page/pm-clients/pm-clients.component';
import { PmTeamsComponent } from './pages/project-management-page/pm-teams/pm-teams.component';
import { PmKanbanBoardComponent } from './pages/project-management-page/pm-kanban-board/pm-kanban-board.component';
import { PmUsersComponent } from './pages/project-management-page/pm-users/pm-users.component';
import { PmCreateUserComponent } from './pages/project-management-page/pm-create-user/pm-create-user.component';
import { PmEditUserComponent } from './pages/project-management-page/pm-edit-user/pm-edit-user.component';

import { LmsPageComponent } from './pages/lms-page/lms-page.component';
import { LCoursesComponent } from './pages/lms-page/l-courses/l-courses.component';
import { LCourseDetailsComponent } from './pages/lms-page/l-course-details/l-course-details.component';
import { LCreateCourseComponent } from './pages/lms-page/l-create-course/l-create-course.component';
import { LEditCourseComponent } from './pages/lms-page/l-edit-course/l-edit-course.component';
import { LInstructorsComponent } from './pages/lms-page/l-instructors/l-instructors.component';

import { HelpDeskPageComponent } from './pages/help-desk-page/help-desk-page.component';
import { HdTicketsComponent } from './pages/help-desk-page/hd-tickets/hd-tickets.component';
import { HdTicketDetailsComponent } from './pages/help-desk-page/hd-ticket-details/hd-ticket-details.component';
import { HdAgentsComponent } from './pages/help-desk-page/hd-agents/hd-agents.component';
import { HdReportsComponent } from './pages/help-desk-page/hd-reports/hd-reports.component';

import { EventsPageComponent } from './pages/events-page/events-page.component';
import { EventsListComponent } from './pages/events-page/events-list/events-list.component';
import { EventDetailsComponent } from './pages/events-page/event-details/event-details.component';
import { CreateAnEventComponent } from './pages/events-page/create-an-event/create-an-event.component';
import { EditAnEventComponent } from './pages/events-page/edit-an-event/edit-an-event.component';

import { InvoicesPageComponent } from './pages/invoices-page/invoices-page.component';
import { InvoicesComponent } from './pages/invoices-page/invoices/invoices.component';
import { InvoiceDetailsComponent } from './pages/invoices-page/invoice-details/invoice-details.component';

import { SocialPageComponent } from './pages/social-page/social-page.component';
import { ProfileComponent } from './pages/social-page/profile/profile.component';
import { TimelineComponent } from './pages/social-page/profile/timeline/timeline.component';
import { AboutComponent } from './pages/social-page/profile/about/about.component';
import { ActivityComponent } from './pages/social-page/profile/activity/activity.component';
import { ProfileSettingsComponent } from './pages/social-page/profile-settings/profile-settings.component';

import { StarterComponent } from './starter/starter.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { PricingPageComponent } from './pages/pricing-page/pricing-page.component';
import { MapsPageComponent } from './pages/maps-page/maps-page.component';
import { NotificationsPageComponent } from './pages/notifications-page/notifications-page.component';
import { MembersPageComponent } from './pages/members-page/members-page.component';

import { UsersPageComponent } from './pages/users-page/users-page.component';
import { TeamMembersComponent } from './pages/users-page/team-members/team-members.component';
import { UsersListComponent } from './pages/users-page/users-list/users-list.component';
import { AddUserComponent } from './pages/users-page/add-user/add-user.component';

import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { UserProfileComponent } from './pages/profile-page/user-profile/user-profile.component';
import { TeamsComponent } from './pages/profile-page/teams/teams.component';
import { PProjectsComponent } from './pages/profile-page/p-projects/p-projects.component';

import { IconsComponent } from './icons/icons.component';
import { MaterialSymbolsComponent } from './icons/material-symbols/material-symbols.component';
import { RemixiconComponent } from './icons/remixicon/remixicon.component';

import { AuthenticationComponent } from './authentication/authentication.component';
import { SignInComponent } from './authentication/sign-in/sign-in.component';
import { SignUpComponent } from './authentication/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './authentication/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { LockScreenComponent } from './authentication/lock-screen/lock-screen.component';
import { ConfirmEmailComponent } from './authentication/confirm-email/confirm-email.component';
import { LogoutComponent } from './authentication/logout/logout.component';

import { MyProfileComponent } from './my-profile/my-profile.component';
import { SettingsComponent } from './settings/settings.component';
import { AccountSettingsComponent } from './settings/account-settings/account-settings.component';
import { ChangePasswordComponent } from './settings/change-password/change-password.component';
import { ConnectionsComponent } from './settings/connections/connections.component';
import { PrivacyPolicyComponent } from './settings/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './settings/terms-conditions/terms-conditions.component';

import { TimelinePageComponent } from './pages/timeline-page/timeline-page.component';
import { GalleryPageComponent } from './pages/gallery-page/gallery-page.component';
import { TestimonialsPageComponent } from './pages/testimonials-page/testimonials-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { ComingSoonPageComponent } from './pages/coming-soon-page/coming-soon-page.component';
import { BlankPageComponent } from './blank-page/blank-page.component';
import { InternalErrorComponent } from './common/internal-error/internal-error.component';


import { ApexchartsComponent } from './apexcharts/apexcharts.component';
import { LineChartsComponent } from './apexcharts/line-charts/line-charts.component';
import { AreaChartsComponent } from './apexcharts/area-charts/area-charts.component';
import { ColumnChartsComponent } from './apexcharts/column-charts/column-charts.component';
import { MixedChartsComponent } from './apexcharts/mixed-charts/mixed-charts.component';
import { RadialBarChartsComponent } from './apexcharts/radial-bar-charts/radial-bar-charts.component';
import { RadarChartsComponent } from './apexcharts/radar-charts/radar-charts.component';
import { PieChartsComponent } from './apexcharts/pie-charts/pie-charts.component';
import { PolarChartsComponent } from './apexcharts/polar-charts/polar-charts.component';
import { MoreChartsComponent } from './apexcharts/more-charts/more-charts.component';

import { TablesComponent } from './tables/tables.component';
import { BasicTableComponent } from './tables/basic-table/basic-table.component';
import { DataTableComponent } from './tables/data-table/data-table.component';



import { FormsComponent } from './forms/forms.component';
import { BasicElementsComponent } from './forms/basic-elements/basic-elements.component';
import { AdvancedElementsComponent } from './forms/advanced-elements/advanced-elements.component';
import { WizardComponent } from './forms/wizard/wizard.component';
import { EditorsComponent } from './forms/editors/editors.component';
import { FileUploaderComponent } from './forms/file-uploader/file-uploader.component';

export const routes: Routes = [
    
    // Ouverture du site → page d'accueil (front)
    { path: '', redirectTo: 'front', pathMatch: 'full' },
    
    // Routes BACK-OFFICE (admin) - Messages & Disputes only
    { path: 'back', redirectTo: 'back/admin-messages', pathMatch: 'full' },
    { path: 'back/crm', component: CrmComponent },
    { path: 'back/project-management', component: ProjectManagementComponent },
    { path: 'back/lms', component: LmsComponent },
    { path: 'back/help-desk', component: HelpDeskComponent },
    { path: 'back/to-do-list', component: ToDoListComponent },
    { path: 'back/calendar', component: CalendarComponent },
    { path: 'back/contacts', component: ContactsComponent },
    { path: 'back/chat', component: ChatComponent },
    { path: 'back/kanban-board', component: KanbanBoardComponent },

    // Admin - Messages & Disputes only (protégé par JWT local)
    {
        path: 'back/admin-messages',
        loadComponent: () => import('./admin/admin-messages/admin-messages.component').then(m => m.AdminMessagesComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'back/admin-disputes',
        loadComponent: () => import('./admin/admin-disputes/admin-disputes.component').then(m => m.AdminDisputesComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'back/admin-disputes/:id',
        loadComponent: () => import('./front/components/dispute-detail/dispute-detail.component').then(m => m.DisputeDetailComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'back/admin-users',
        loadComponent: () => import('./admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
        canActivate: [adminGuard]
    },
    
    // File Manager avec sous-routes
    { 
        path: 'back/file-manager',
        component: FileManagerComponent,
        children: [
            { path: '', component: MyDriveComponent },
            { path: 'assets', component: AssetsComponent },
            { path: 'projects', component: ProjectsComponent },
            { path: 'personal', component: PersonalComponent },
            { path: 'applications', component: ApplicationsComponent },
            { path: 'documents', component: DocumentsComponent },
            { path: 'media', component: MediaComponent }
        ]
    },
    
    // Email avec sous-routes
    {
        path: 'back/email',
        component: EmailComponent,
        children: [
            { path: '', component: InboxComponent },
            { path: 'compose', component: ComposeComponent },
            { path: 'read', component: ReadComponent }
        ]
    },
    
    // E-commerce pages
    {
        path: 'back/ecommerce-page',
        component: EcommercePageComponent,
        children: [
            { path: '', component: EProductsGridComponent },
            { path: 'products-list', component: EProductsListComponent },
            { path: 'product-details', component: EProductDetailsComponent },
            { path: 'create-product', component: ECreateProductComponent },
            { path: 'edit-product', component: EEditProductComponent },
            { path: 'orders', component: EOrdersComponent },
            { path: 'order-details', component: EOrderDetailsComponent },
            { path: 'create-order', component: ECreateOrderComponent },
            { path: 'order-tracking', component: EOrderTrackingComponent },
            { path: 'customers', component: ECustomersComponent },
            { path: 'customer-details', component: ECustomerDetailsComponent },
            { path: 'cart', component: ECartComponent },
            { path: 'checkout', component: ECheckoutComponent },
            { path: 'sellers', component: ESellersComponent },
            { path: 'seller-details', component: ESellerDetailsComponent },
            { path: 'create-seller', component: ECreateSellerComponent },
            { path: 'refunds', component: ERefundsComponent },
            { path: 'categories', component: ECategoriesComponent },
            { path: 'create-category', component: ECreateCategoryComponent },
            { path: 'edit-category', component: EEditCategoryComponent },
            { path: 'reviews', component: EReviewsComponent }
        ]
    },
    
    // CRM pages
    {
        path: 'back/crm-page',
        component: CrmPageComponent,
        children: [
            { path: '', component: CContactsComponent },
            { path: 'create-contact', component: CCreateContactComponent },
            { path: 'edit-contact', component: CEditContactComponent },
            { path: 'customers', component: CCustomersComponent },
            { path: 'create-lead', component: CCreateLeadComponent },
            { path: 'edit-lead', component: CEditLeadComponent },
            { path: 'leads', component: CLeadsComponent },
            { path: 'deals', component: CDealsComponent },
            { path: 'create-deal', component: CCreateDealComponent }
        ]
    },
    
    // Project Management pages
    {
        path: 'back/project-management-page',
        component: ProjectManagementPageComponent,
        children: [
            { path: '', component: PmProjectOverviewComponent },
            { path: 'projects-list', component: PmProjectsListComponent },
            { path: 'create-project', component: PmCreateProjectComponent },
            { path: 'clients', component: PmClientsComponent },
            { path: 'teams', component: PmTeamsComponent },
            { path: 'kanban-board', component: PmKanbanBoardComponent },
            { path: 'users', component: PmUsersComponent },
            { path: 'create-user', component: PmCreateUserComponent },
            { path: 'edit-user', component: PmEditUserComponent }
        ]
    },
    
    // LMS pages
    {
        path: 'back/lms-page',
        component: LmsPageComponent,
        children: [
            { path: '', component: LCoursesComponent },
            { path: 'course-details', component: LCourseDetailsComponent },
            { path: 'create-course', component: LCreateCourseComponent },
            { path: 'edit-course', component: LEditCourseComponent },
            { path: 'instructors', component: LInstructorsComponent }
        ]
    },
    
    // Help Desk pages
    {
        path: 'back/help-desk-page',
        component: HelpDeskPageComponent,
        children: [
            { path: '', component: HdTicketsComponent },
            { path: 'ticket-details', component: HdTicketDetailsComponent },
            { path: 'agents', component: HdAgentsComponent },
            { path: 'reports', component: HdReportsComponent }
        ]
    },
    
    // Events pages
    {
        path: 'back/events',
        component: EventsPageComponent,
        children: [
            { path: '', component: EventsListComponent },
            { path: 'event-details', component: EventDetailsComponent },
            { path: 'create-an-event', component: CreateAnEventComponent },
            { path: 'edit-an-event', component: EditAnEventComponent }
        ]
    },
    
    // Invoices pages
    {
        path: 'back/invoices',
        component: InvoicesPageComponent,
        children: [
            { path: '', component: InvoicesComponent },
            { path: 'invoice-details', component: InvoiceDetailsComponent }
        ]
    },
    
    // Social pages
    {
        path: 'back/social',
        component: SocialPageComponent,
        children: [
            {
                path: '',
                component: ProfileComponent,
                children: [
                    { path: '', component: TimelineComponent },
                    { path: 'about', component: AboutComponent },
                    { path: 'activity', component: ActivityComponent }
                ]
            },
            { path: 'settings', component: ProfileSettingsComponent }
        ]
    },
    
    // Autres pages back-office
    { path: 'back/starter', component: StarterComponent },
    { path: 'back/faq', component: FaqPageComponent },
    { path: 'back/pricing', component: PricingPageComponent },
    { path: 'back/maps', component: MapsPageComponent },
    { path: 'back/notifications', component: NotificationsPageComponent },
    { path: 'back/members', component: MembersPageComponent },
    
    // Users pages
    {
        path: 'back/users',
        component: UsersPageComponent,
        children: [
            { path: '', component: TeamMembersComponent },
            { path: 'users-list', component: UsersListComponent },
            { path: 'add-user', component: AddUserComponent }
        ]
    },
    
    // Profile pages
    {
        path: 'back/profile',
        component: ProfilePageComponent,
        children: [
            { path: '', component: UserProfileComponent },
            { path: 'teams', component: TeamsComponent },
            { path: 'projects', component: PProjectsComponent }
        ]
    },
    
    // Icons pages
    {
        path: 'back/icons',
        component: IconsComponent,
        children: [
            { path: '', component: MaterialSymbolsComponent },
            { path: 'remixicon', component: RemixiconComponent }
        ]
    },
    
    // Authentication pages
    {
        path: 'back/authentication',
        component: AuthenticationComponent,
        children: [
            { path: '', component: SignInComponent },
            { path: 'sign-up', component: SignUpComponent },
            { path: 'forgot-password', component: ForgotPasswordComponent },
            { path: 'reset-password', component: ResetPasswordComponent },
            { path: 'lock-screen', component: LockScreenComponent },
            { path: 'confirm-email', component: ConfirmEmailComponent },
            { path: 'logout', component: LogoutComponent }
        ]
    },
    
    { path: 'back/my-profile', component: MyProfileComponent },
    
    // Settings pages
    {
        path: 'back/settings',
        component: SettingsComponent,
        children: [
            { path: '', component: AccountSettingsComponent },
            { path: 'change-password', component: ChangePasswordComponent },
            { path: 'connections', component: ConnectionsComponent },
            { path: 'privacy-policy', component: PrivacyPolicyComponent },
            { path: 'terms-conditions', component: TermsConditionsComponent }
        ]
    },
    
    // Autres pages
    { path: 'back/timeline', component: TimelinePageComponent },
    { path: 'back/gallery', component: GalleryPageComponent },
    { path: 'back/testimonials', component: TestimonialsPageComponent },
    { path: 'back/search', component: SearchPageComponent },
    { path: 'back/coming-soon', component: ComingSoonPageComponent },
    { path: 'back/blank-page', component: BlankPageComponent },
    { path: 'back/internal-error', component: InternalErrorComponent },
    
    
    // Charts pages
    {
        path: 'back/charts',
        component: ApexchartsComponent,
        children: [
            { path: '', component: LineChartsComponent },
            { path: 'area', component: AreaChartsComponent },
            { path: 'column', component: ColumnChartsComponent },
            { path: 'mixed', component: MixedChartsComponent },
            { path: 'radialbar', component: RadialBarChartsComponent },
            { path: 'radar', component: RadarChartsComponent },
            { path: 'pie', component: PieChartsComponent },
            { path: 'polar', component: PolarChartsComponent },
            { path: 'more', component: MoreChartsComponent }
        ]
    },
    
    // Tables pages
    {
        path: 'back/tables',
        component: TablesComponent,
        children: [
            { path: '', component: BasicTableComponent },
            { path: 'data-table', component: DataTableComponent }
        ]
    },
    
    
    
    // Forms pages
    {
        path: 'back/forms',
        component: FormsComponent,
        children: [
            { path: '', component: BasicElementsComponent },
            { path: 'advanced-elements', component: AdvancedElementsComponent },
            { path: 'wizard', component: WizardComponent },
            { path: 'editors', component: EditorsComponent },
            { path: 'file-uploader', component: FileUploaderComponent }
        ]
    },
    
    // Routes FRONT (site public)
    { 
        path: 'front',
        loadChildren: () => import('./front/app.routes').then(m => m.routes)
    },

    // Page 404 - doit être en dernier
    { path: '**', component: NotFoundComponent }
];