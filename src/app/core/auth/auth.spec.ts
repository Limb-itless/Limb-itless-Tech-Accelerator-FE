import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';

describe('Auth', () => {
  let auth: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    auth = TestBed.inject(Auth);
  });

  it('starts signed out', () => {
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('tracks the signed-in user', () => {
    auth.login({ id: '1', email: 'person@example.com' });
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentUser()?.email).toBe('person@example.com');

    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.currentUser()).toBeNull();
  });
});
