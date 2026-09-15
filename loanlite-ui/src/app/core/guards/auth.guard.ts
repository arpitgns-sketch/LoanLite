import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Blocks a route unless a valid (non-expired) JWT is present. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
