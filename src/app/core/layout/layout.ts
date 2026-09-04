import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';

import { Auth, UserRole } from '../auth/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  platform_administrator: 'Platform administrator',
  practice_administrator: 'Practice administrator',
  clinician: 'Clinician',
  prosthetist: 'Prosthetist',
  patient: 'Patient',
  medical_aid_reviewer: 'Medical aid reviewer',
};

interface NavLink {
  path: string;
  label: string;
}

const CLINICAL_LINKS: NavLink[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/patients', label: 'Patients' },
  { path: '/availability', label: 'Availability' },
  { path: '/reports', label: 'Reports' },
];

const NAV_BY_ROLE: Record<UserRole, NavLink[]> = {
  clinician: CLINICAL_LINKS,
  prosthetist: CLINICAL_LINKS,
  practice_administrator: [...CLINICAL_LINKS, { path: '/users', label: 'Users' }],
  platform_administrator: [{ path: '/platform', label: 'Practices' }],
  patient: [
    { path: '/portal', label: 'My care' },
    { path: '/portal/measures', label: 'My measures' },
  ],
  medical_aid_reviewer: [{ path: '/review', label: 'Reviews' }],
};

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  readonly navLinks = computed(() => {
    const role = this.user()?.role;
    return role ? NAV_BY_ROLE[role] : [];
  });

  signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
