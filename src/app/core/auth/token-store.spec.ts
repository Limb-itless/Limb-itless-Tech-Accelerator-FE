import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TokenStore } from './token-store';

function storeFor(platform: 'browser' | 'server'): TokenStore {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(TokenStore);
}

describe('TokenStore', () => {
  beforeEach(() => localStorage.clear());

  describe('in the browser', () => {
    it('stores and returns the token pair', () => {
      const store = storeFor('browser');
      store.set({ accessToken: 'acc', refreshToken: 'ref' });

      expect(store.accessToken).toBe('acc');
      expect(store.refreshToken).toBe('ref');
      expect(localStorage.getItem('limbitless.access_token')).toBe('acc');
    });

    it('clears both tokens', () => {
      const store = storeFor('browser');
      store.set({ accessToken: 'acc', refreshToken: 'ref' });

      store.clear();

      expect(store.accessToken).toBeNull();
      expect(store.refreshToken).toBeNull();
    });

    it('returns null before anything is stored', () => {
      expect(storeFor('browser').accessToken).toBeNull();
    });
  });

  describe('on the server', () => {
    it('keeps tokens in memory without touching localStorage', () => {
      const store = storeFor('server');
      store.set({ accessToken: 'acc', refreshToken: 'ref' });

      expect(store.accessToken).toBe('acc');
      expect(localStorage.getItem('limbitless.access_token')).toBeNull();

      store.clear();
      expect(store.accessToken).toBeNull();
    });
  });
});
