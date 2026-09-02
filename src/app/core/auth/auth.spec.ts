import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Auth } from './auth';
import { TokenStore } from './token-store';

const AUTH = `${environment.apiBaseUrl}/auth`;

const ME = {
  id: 1,
  email: 'doc@clinic.io',
  role: 'clinician' as const,
  is_active: true,
  practice_id: 3,
  site_id: 5,
  practice_name: 'Northgate',
  site_name: 'Gait Lab',
};

const TOKENS = {
  access_token: 'acc',
  refresh_token: 'ref',
  token_type: 'bearer',
};

describe('Auth', () => {
  let auth: Auth;
  let http: HttpTestingController;
  let tokens: TokenStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    auth = TestBed.inject(Auth);
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStore);
  });

  afterEach(() => http.verify());

  it('starts signed out', () => {
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.currentUser()).toBeNull();
  });

  it('logs in: form-encoded credentials, stores tokens, loads the user', () => {
    let result: unknown;
    auth.login('doc@clinic.io', 'pw').subscribe((user) => (result = user));

    const loginReq = http.expectOne(`${AUTH}/login`);
    expect(loginReq.request.method).toBe('POST');
    expect(loginReq.request.detectContentTypeHeader()).toContain(
      'application/x-www-form-urlencoded',
    );
    expect(loginReq.request.body.get('username')).toBe('doc@clinic.io');
    expect(loginReq.request.body.get('password')).toBe('pw');
    loginReq.flush(TOKENS);

    http.expectOne(`${AUTH}/me`).flush(ME);

    expect(tokens.accessToken).toBe('acc');
    expect(tokens.refreshToken).toBe('ref');
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentUser()).toEqual({
      id: 1,
      email: 'doc@clinic.io',
      role: 'clinician',
      isActive: true,
      practiceId: 3,
      siteId: 5,
      practiceName: 'Northgate',
      siteName: 'Gait Lab',
    });
    expect(result).toEqual(auth.currentUser());
  });

  it('logout clears tokens and the current user', () => {
    tokens.set({ accessToken: 'acc', refreshToken: 'ref' });
    auth.login('doc@clinic.io', 'pw').subscribe();
    http.expectOne(`${AUTH}/login`).flush(TOKENS);
    http.expectOne(`${AUTH}/me`).flush(ME);

    auth.logout();

    expect(tokens.accessToken).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  describe('restoreSession', () => {
    it('returns null and makes no request when there is no token', () => {
      let emitted: unknown = 'unset';
      auth.restoreSession().subscribe((value) => (emitted = value));

      expect(emitted).toBeNull();
      http.expectNone(`${AUTH}/me`);
    });

    it('loads the user when the stored token is still valid', () => {
      tokens.set({ accessToken: 'acc', refreshToken: 'ref' });

      auth.restoreSession().subscribe();
      http.expectOne(`${AUTH}/me`).flush({ ...ME, role: 'prosthetist' });

      expect(auth.currentUser()?.role).toBe('prosthetist');
    });

    it('clears the session when the stored token is rejected', () => {
      tokens.set({ accessToken: 'acc', refreshToken: 'ref' });

      let emitted: unknown = 'unset';
      auth.restoreSession().subscribe((value) => (emitted = value));
      http.expectOne(`${AUTH}/me`).flush('no', { status: 401, statusText: 'Unauthorized' });

      expect(emitted).toBeNull();
      expect(tokens.accessToken).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshTokens', () => {
    it('posts the refresh token and stores the new pair', () => {
      tokens.set({ accessToken: 'old', refreshToken: 'r0' });

      let newAccess: string | undefined;
      auth.refreshTokens().subscribe((token) => (newAccess = token));

      const req = http.expectOne(`${AUTH}/refresh`);
      expect(req.request.body).toEqual({ refresh_token: 'r0' });
      req.flush({ access_token: 'new', refresh_token: 'r1', token_type: 'bearer' });

      expect(newAccess).toBe('new');
      expect(tokens.accessToken).toBe('new');
      expect(tokens.refreshToken).toBe('r1');
    });

    it('shares one in-flight request between concurrent callers', () => {
      tokens.set({ accessToken: 'old', refreshToken: 'r0' });

      auth.refreshTokens().subscribe();
      auth.refreshTokens().subscribe();

      http
        .expectOne(`${AUTH}/refresh`)
        .flush({ access_token: 'new', refresh_token: 'r1', token_type: 'bearer' });

      // once settled, the next call makes a fresh request
      auth.refreshTokens().subscribe();
      http
        .expectOne(`${AUTH}/refresh`)
        .flush({ access_token: 'new2', refresh_token: 'r2', token_type: 'bearer' });
    });

    it('errors without a request when there is no refresh token', () => {
      let error: unknown;
      auth.refreshTokens().subscribe({ error: (e) => (error = e) });

      expect(error).toBeInstanceOf(Error);
      http.expectNone(`${AUTH}/refresh`);
    });
  });
});
