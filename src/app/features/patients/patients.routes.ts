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
  {
    path: ':id/devices/new',
    canActivate: [writerRoles],
    loadComponent: () => import('./devices/device-form/device-form').then((m) => m.DeviceForm),
  },
  {
    path: ':id/devices/:deviceId/edit',
    canActivate: [writerRoles],
    data: { mode: 'edit' },
    loadComponent: () => import('./devices/device-form/device-form').then((m) => m.DeviceForm),
  },
  {
    path: ':id/devices/:deviceId/replace',
    canActivate: [writerRoles],
    data: { mode: 'replace' },
    loadComponent: () => import('./devices/device-form/device-form').then((m) => m.DeviceForm),
  },
  {
    path: ':id/milestones/new',
    canActivate: [writerRoles],
    loadComponent: () =>
      import('./milestones/milestone-form/milestone-form').then((m) => m.MilestoneForm),
  },
  {
    path: ':id/milestones/:milestoneId/edit',
    canActivate: [writerRoles],
    data: { mode: 'edit' },
    loadComponent: () =>
      import('./milestones/milestone-form/milestone-form').then((m) => m.MilestoneForm),
  },
  {
    path: ':id/pathways/new',
    canActivate: [writerRoles],
    loadComponent: () =>
      import('./milestones/pathway-apply/pathway-apply').then((m) => m.PathwayApply),
  },
  {
    path: ':id/proms/new',
    canActivate: [writerRoles],
    loadComponent: () => import('./proms/prom-form/prom-form').then((m) => m.PromForm),
  },
  {
    path: ':id/proms/:promId/edit',
    canActivate: [writerRoles],
    data: { mode: 'edit' },
    loadComponent: () => import('./proms/prom-form/prom-form').then((m) => m.PromForm),
  },
  {
    path: ':id/timeline',
    loadComponent: () =>
      import('./timeline/patient-timeline/patient-timeline').then((m) => m.PatientTimeline),
  },
  {
    path: ':id/notes/new',
    canActivate: [writerRoles],
    loadComponent: () => import('./notes/note-form/note-form').then((m) => m.NoteForm),
  },
  {
    path: ':id/notes/:noteId/edit',
    canActivate: [writerRoles],
    data: { mode: 'edit' },
    loadComponent: () => import('./notes/note-form/note-form').then((m) => m.NoteForm),
  },
];
