import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guard';

const writerRoles = roleGuard('clinician', 'prosthetist');

export const AVAILABILITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./availability-list/availability-list').then((m) => m.AvailabilityList),
  },
  {
    path: 'new',
    canActivate: [writerRoles],
    loadComponent: () => import('./slot-form/slot-form').then((m) => m.SlotForm),
  },
  {
    path: ':id/edit',
    canActivate: [writerRoles],
    data: { mode: 'edit' },
    loadComponent: () => import('./slot-form/slot-form').then((m) => m.SlotForm),
  },
];
