import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { Auth, AuthenticatedUser } from './auth';
import { authGuard, roleGuard } from './auth.guard';

function run(guard: CanActivateFn, url = '/users'): boolean | UrlTree {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url } as RouterStateSnapshot;
  return TestBed.runInInjectionContext(() => guard(route, state) as boolean | UrlTree);
}

function configureWithUser(user: AuthenticatedUser | null): void {
  const currentUser = signal(user);
  const stub: Pick<Auth, 'isAuthenticated' | 'currentUser'> = {
    currentUser: currentUser.asReadonly(),
    isAuthenticated: computed(() => currentUser() !== null),
  };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: Auth, useValue: stub }],
  });
}

describe('authGuard', () => {
  it('allows an authenticated user', () => {
    configureWithUser({ role: 'clinician' } as AuthenticatedUser);
    expect(run(authGuard)).toBe(true);
  });

  it('redirects an anonymous user to /login with a returnUrl', () => {
    configureWithUser(null);

    const result = run(authGuard, '/reports');

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Freports');
  });
});

describe('roleGuard', () => {
  it('allows a user whose role is listed', () => {
    configureWithUser({ role: 'practice_administrator' } as AuthenticatedUser);
    expect(run(roleGuard('platform_administrator', 'practice_administrator'))).toBe(true);
  });

  it('sends a disallowed role to /forbidden', () => {
    configureWithUser({ role: 'clinician' } as AuthenticatedUser);

    const result = run(roleGuard('platform_administrator'));

    expect((result as UrlTree).toString()).toBe('/forbidden');
  });

  it('sends an anonymous user to /forbidden', () => {
    configureWithUser(null);
    expect((run(roleGuard('clinician')) as UrlTree).toString()).toBe('/forbidden');
  });
});
