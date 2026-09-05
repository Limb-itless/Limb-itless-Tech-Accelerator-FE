import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
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
        canActivate: [roleGuard('clinician', 'prosthetist', 'practice_administrator')],
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'availability',
        canActivate: [roleGuard('clinician', 'prosthetist', 'practice_administrator')],
        loadChildren: () =>
          import('./features/availability/availability.routes').then((m) => m.AVAILABILITY_ROUTES),
      },
      {
        path: 'appointments',
        canActivate: [roleGuard('clinician', 'prosthetist', 'practice_administrator')],
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
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
      {
        path: 'portal',
        canActivate: [roleGuard('patient')],
        loadChildren: () => import('./features/portal/portal.routes').then((m) => m.PORTAL_ROUTES),
      },
      {
        path: 'review',
        canActivate: [roleGuard('medical_aid_reviewer')],
        loadChildren: () => import('./features/review/review.routes').then((m) => m.REVIEW_ROUTES),
      },
    ],
  },
];
