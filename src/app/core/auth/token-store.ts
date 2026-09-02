import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const ACCESS_KEY = 'limbitless.access_token';
const REFRESH_KEY = 'limbitless.refresh_token';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Persists the access and refresh tokens. Uses `localStorage` in the
 * browser and falls back to an in-memory map on the server (during SSR),
 * where `localStorage` doesn't exist.
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly memory = new Map<string, string>();

  get accessToken(): string | null {
    return this.read(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return this.read(REFRESH_KEY);
  }

  set({ accessToken, refreshToken }: TokenPair): void {
    this.write(ACCESS_KEY, accessToken);
    this.write(REFRESH_KEY, refreshToken);
  }

  clear(): void {
    this.remove(ACCESS_KEY);
    this.remove(REFRESH_KEY);
  }

  private read(key: string): string | null {
    if (!this.isBrowser) {
      return this.memory.get(key) ?? null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    if (!this.isBrowser) {
      this.memory.set(key, value);
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // storage disabled (private mode, quota) - stay unauthenticated
    }
  }

  private remove(key: string): void {
    if (!this.isBrowser) {
      this.memory.delete(key);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // nothing to do
    }
  }
}
