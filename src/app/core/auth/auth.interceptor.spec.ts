import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Auth } from './auth';
import { authInterceptor } from './auth.interceptor';
import { TokenStore } from './token-store';

const API = environment.apiBaseUrl;

describe('authInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let tokens: TokenStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStore);
  });

  afterEach(() => mock.verify());

  it('adds the bearer token to API requests', () => {
    tokens.set({ accessToken: 'acc', refreshToken: 'ref' });

    http.get(`${API}/patients`).subscribe();
    const req = mock.expectOne(`${API}/patients`);

    expect(req.request.headers.get('Authorization')).toBe('Bearer acc');
    req.flush({});
  });

  it('leaves third-party requests untouched', () => {
    tokens.set({ accessToken: 'acc', refreshToken: 'ref' });

    http.get('https://third-party.example/thing').subscribe();
    const req = mock.expectOne('https://third-party.example/thing');

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not authorise the login request', () => {
    tokens.set({ accessToken: 'acc', refreshToken: 'ref' });

    http.post(`${API}/auth/login`, null).subscribe();
    const req = mock.expectOne(`${API}/auth/login`);

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('on 401, refreshes once and replays the original request', () => {
    tokens.set({ accessToken: 'stale', refreshToken: 'ref' });

    let body: unknown;
    http.get(`${API}/patients`).subscribe((value) => (body = value));

    mock.expectOne(`${API}/patients`).flush('unauth', { status: 401, statusText: 'Unauthorized' });
    mock
      .expectOne(`${API}/auth/refresh`)
      .flush({ access_token: 'fresh', refresh_token: 'ref2', token_type: 'bearer' });

    const replay = mock.expectOne(`${API}/patients`);
    expect(replay.request.headers.get('Authorization')).toBe('Bearer fresh');
    replay.flush({ ok: true });

    expect(body).toEqual({ ok: true });
  });

  it('clears the session when the refresh also fails', () => {
    const auth = TestBed.inject(Auth);
    tokens.set({ accessToken: 'stale', refreshToken: 'ref' });

    let errored = false;
    http.get(`${API}/patients`).subscribe({ error: () => (errored = true) });

    mock.expectOne(`${API}/patients`).flush('unauth', { status: 401, statusText: 'Unauthorized' });
    mock.expectOne(`${API}/auth/refresh`).flush('no', { status: 401, statusText: 'Unauthorized' });

    expect(errored).toBe(true);
    expect(tokens.accessToken).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });
});
