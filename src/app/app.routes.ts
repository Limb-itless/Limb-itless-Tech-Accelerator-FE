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
        path: 'patients',
        canActivate: [roleGuard('clinician', 'prosthetist', 'practice_administrator')],
        loadChildren: () =>
          import('./features/patients/patients.routes').then((m) => m.PATIENT_ROUTES),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'users',
        canActivate: [roleGuard('practice_administrator')],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'platform',
        canActivate: [roleGuard('platform_administrator')],
        loadChildren: () =>
          import('./features/platform/platform.routes').then((m) => m.PLATFORM_ROUTES),
      },
    ],
  },
];
