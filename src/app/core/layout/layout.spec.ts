import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Auth, AuthenticatedUser } from '../auth/auth';
import { Layout } from './layout';

const USER: AuthenticatedUser = {
  id: 1,
  email: 'doc@clinic.io',
  role: 'clinician',
  isActive: true,
  practiceId: 1,
  siteId: 2,
  practiceName: 'Northgate Rehabilitation Network',
  siteName: 'Gait Lab',
};

function fakeAuth(user: AuthenticatedUser | null) {
  const current = signal(user);
  return {
    currentUser: current.asReadonly(),
    isAuthenticated: () => current() !== null,
    logout: vi.fn(),
  };
}

async function setup(user: AuthenticatedUser | null) {
  const auth = fakeAuth(user);
  await TestBed.configureTestingModule({
    imports: [Layout],
    providers: [provideRouter([]), { provide: Auth, useValue: auth }],
  }).compileComponents();
  const fixture = TestBed.createComponent(Layout);
  fixture.detectChanges();
  return { fixture, auth };
}

describe('Layout', () => {
  it('shows the signed-in user with their role, practice and site', async () => {
    const { fixture } = await setup(USER);
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('doc@clinic.io');
    expect(text).toContain('Clinician');
    expect(text).toContain('Northgate Rehabilitation Network');
    expect(text).toContain('Gait Lab');
  });

  it('signs out and returns to the login page', async () => {
    const { fixture, auth } = await setup(USER);
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture.nativeElement.querySelector('.app-header__signout').click();

    expect(auth.logout).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('renders without a user block when signed out', async () => {
    const { fixture } = await setup(null);

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-header__user')).toBeNull();
  });
});
