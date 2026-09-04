import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-users/admin-users').then((m) => m.AdminUsers),
  },
  {
    path: 'new',
    loadComponent: () => import('./user-form/user-form').then((m) => m.UserForm),
  },
  {
    path: ':id/edit',
    data: { mode: 'edit' },
    loadComponent: () => import('./user-form/user-form').then((m) => m.UserForm),
  },
  {
    path: 'sites',
    loadComponent: () => import('./admin-sites/admin-sites').then((m) => m.AdminSites),
  },
  {
    path: 'audit',
    loadComponent: () => import('./admin-audit/admin-audit').then((m) => m.AdminAudit),
  },
  {
    path: 'sites/new',
    loadComponent: () => import('./site-form/site-form').then((m) => m.SiteForm),
  },
  {
    path: 'sites/:id/edit',
    data: { mode: 'edit' },
    loadComponent: () => import('./site-form/site-form').then((m) => m.SiteForm),
  },
];
