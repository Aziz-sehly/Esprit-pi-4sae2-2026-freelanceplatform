import { Routes } from '@angular/router';
import { NotFoundComponent } from './common/not-found/not-found.component';

export const routes: Routes = [
    // ✅ Admin Reviews
    {
        path: 'reviews',
        loadComponent: () => import('./reviews/admin-reviews.component').then(m => m.AdminReviewsComponent)
    },
    // ✅ Admin Forum
    {
        path: 'forum',
        loadComponent: () => import('./forum/admin-forum.component').then(m => m.AdminForumComponent)
    },
    // Default redirect
    {
        path: '',
        redirectTo: 'reviews',
        pathMatch: 'full'
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];