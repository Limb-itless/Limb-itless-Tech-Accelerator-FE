import { Routes } from '@angular/router';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./portal-home/portal-home').then((m) => m.PortalHome),
  },
  {
    path: 'measures',
    loadComponent: () => import('./portal-measures/portal-measures').then((m) => m.PortalMeasures),
  },
];
