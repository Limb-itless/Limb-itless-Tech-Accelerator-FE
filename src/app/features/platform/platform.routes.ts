import { Routes } from '@angular/router';

export const PLATFORM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./platform-practices/platform-practices').then((m) => m.PlatformPractices),
  },
  {
    path: 'onboard',
    loadComponent: () =>
      import('./practice-onboard/practice-onboard').then((m) => m.PracticeOnboard),
  },
  {
    path: ':id',
    loadComponent: () => import('./practice-detail/practice-detail').then((m) => m.PracticeDetail),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./practice-form/practice-form').then((m) => m.PracticeForm),
  },
];
