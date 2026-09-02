import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth, UserRole } from './auth';

/** Blocks a route unless there is an authenticated user; otherwise sends
 * the visitor to the login page with a `returnUrl` back to where they
 * were headed. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Blocks a route unless the current user's role is one of `allowed`;
 * otherwise redirects to `/forbidden`. */
export function roleGuard(...allowed: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    const user = auth.currentUser();
    if (user && allowed.includes(user.role)) {
      return true;
    }
    return router.createUrlTree(['/forbidden']);
  };
}
