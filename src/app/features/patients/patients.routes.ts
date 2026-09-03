import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guard';

const writerRoles = roleGuard('clinician', 'prosthetist');

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./patient-list/patient-list').then((m) => m.PatientList),
  },
  {
    path: 'new',
    canActivate: [writerRoles],
    loadComponent: () => import('./patient-form/patient-form').then((m) => m.PatientForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./patient-detail/patient-detail').then((m) => m.PatientDetail),
  },
  {
    path: ':id/edit',
    canActivate: [writerRoles],
    loadComponent: () => import('./patient-form/patient-form').then((m) => m.PatientForm),
  },
];
