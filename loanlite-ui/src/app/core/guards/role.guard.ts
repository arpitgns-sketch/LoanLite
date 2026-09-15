import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/enums';

/**
 * Route-data-driven role gate. Usage:
 *   { path: 'processor', canActivate: [authGuard, roleGuard], data: { roles: ['Processor'] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowed = (route.data?.['roles'] as Role[] | undefined) ?? [];
  const role = auth.role();

  if (role && allowed.includes(role)) return true;

  // Logged in but wrong role -> not authorized. Not logged in -> login.
  return router.createUrlTree([auth.isLoggedIn() ? '/not-authorized' : '/login']);
};
