import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./core/forbidden/forbidden').then((m) => m.Forbidden),
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'users',
        canActivate: [roleGuard('platform_administrator', 'practice_administrator')],
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
    ],
  },
];
