import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Auth } from './auth';
import { TokenStore } from './token-store';

const LOGIN_URL = `${environment.apiBaseUrl}/auth/login`;
const REFRESH_URL = `${environment.apiBaseUrl}/auth/refresh`;

/**
 * Attaches the bearer token to requests aimed at our API and, on a 401,
 * makes a single attempt to refresh the token and replay the request
 * before clearing the session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStore);
  const auth = inject(Auth);

  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);
  const isAuthEndpoint = req.url === LOGIN_URL || req.url === REFRESH_URL;
  const shouldAuthorise = isApiRequest && !isAuthEndpoint;

  const authorised = () => {
    const token = tokens.accessToken;
    return shouldAuthorise && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
  };

  return next(authorised()).pipe(
    catchError((error: unknown) => {
      const isExpired = error instanceof HttpErrorResponse && error.status === 401;
      if (!isExpired || !shouldAuthorise) {
        return throwError(() => error);
      }
      return auth.refreshTokens().pipe(
        switchMap((accessToken) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })),
        ),
        catchError((refreshError: unknown) => {
          auth.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
