import { Routes } from '@angular/router';

export const REVIEW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./review-patients/review-patients').then((m) => m.ReviewPatients),
  },
  {
    path: ':id',
    loadComponent: () => import('./review-patient/review-patient').then((m) => m.ReviewPatient),
  },
];
