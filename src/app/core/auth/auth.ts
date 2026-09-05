import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenStore } from './token-store';

export type UserRole =
  | 'platform_administrator'
  | 'practice_administrator'
  | 'clinician'
  | 'prosthetist'
  | 'patient'
  | 'medical_aid_reviewer';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
  practiceId: number | null;
  siteId: number | null;
  practiceName: string | null;
  siteName: string | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface CurrentUserResponse {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  practice_id: number | null;
  site_id: number | null;
  practice_name: string | null;
  site_name: string | null;
}

const AUTH_BASE = `${environment.apiBaseUrl}/auth`;

/**
 * Owns the authenticated session: talks to the backend's `/auth` endpoints,
 * keeps tokens in {@link TokenStore}, and exposes the current user as a
 * signal.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStore);

  private readonly currentUserSignal = signal<AuthenticatedUser | null>(null);
  private refreshInFlight: Observable<string> | null = null;

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  /** Exchange credentials for tokens, then load the current user. */
  login(email: string, password: string): Observable<AuthenticatedUser> {
    const body = new HttpParams({ fromObject: { username: email, password } });
    return this.http.post<TokenResponse>(`${AUTH_BASE}/login`, body).pipe(
      tap((res) => this.storeTokens(res)),
      switchMap(() => this.fetchCurrentUser()),
      tap((user) => this.currentUserSignal.set(user)),
    );
  }

  /** Self-service patient sign-up (requirements Section 5.11) — creates
   * the account and signs it in, the same as {@link login}. No linked
   * clinical record yet; claiming one is a separate step. */
  register(email: string, password: string): Observable<AuthenticatedUser> {
    return this.http.post<TokenResponse>(`${AUTH_BASE}/register`, { email, password }).pipe(
      tap((res) => this.storeTokens(res)),
      switchMap(() => this.fetchCurrentUser()),
      tap((user) => this.currentUserSignal.set(user)),
    );
  }

  /** Clear the local session. JWTs are stateless, so there's no server call. */
  logout(): void {
    this.tokens.clear();
    this.currentUserSignal.set(null);
    this.refreshInFlight = null;
  }

  /**
   * Rebuild the session from a stored token on app start. Emits the user,
   * or `null` if there's no token or it is no longer accepted.
   */
  restoreSession(): Observable<AuthenticatedUser | null> {
    if (!this.tokens.accessToken) {
      return of(null);
    }
    return this.fetchCurrentUser().pipe(
      tap((user) => this.currentUserSignal.set(user)),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  /**
   * Swap the refresh token for a fresh pair and return the new access
   * token. Concurrent callers share one in-flight request, so a burst of
   * 401s triggers a single refresh.
   */
  refreshTokens(): Observable<string> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const refreshToken = this.tokens.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    this.refreshInFlight = this.http
      .post<TokenResponse>(`${AUTH_BASE}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((res) => this.storeTokens(res)),
        map((res) => res.access_token),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );
    return this.refreshInFlight;
  }

  private fetchCurrentUser(): Observable<AuthenticatedUser> {
    return this.http
      .get<CurrentUserResponse>(`${AUTH_BASE}/me`)
      .pipe(map((res) => this.toUser(res)));
  }

  private storeTokens(res: TokenResponse): void {
    this.tokens.set({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
    });
  }

  private toUser(res: CurrentUserResponse): AuthenticatedUser {
    return {
      id: res.id,
      email: res.email,
      role: res.role,
      isActive: res.is_active,
      practiceId: res.practice_id,
      siteId: res.site_id,
      practiceName: res.practice_name,
      siteName: res.site_name,
    };
  }
}
