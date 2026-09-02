import { Injectable, computed, signal } from '@angular/core';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Placeholder auth service. Holds the current user in memory and exposes a
 * simple sign-in/sign-out API. Replace the TODOs with real calls to the
 * backend's auth endpoints once they exist.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly currentUserSignal = signal<AuthenticatedUser | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(user: AuthenticatedUser): void {
    // TODO: replace with a real call to the backend auth endpoint.
    this.currentUserSignal.set(user);
  }

  logout(): void {
    // TODO: notify the backend / clear any stored tokens.
    this.currentUserSignal.set(null);
  }
}
