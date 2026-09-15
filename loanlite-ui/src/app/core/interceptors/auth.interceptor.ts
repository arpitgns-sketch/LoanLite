import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

/**
 * Attaches `Authorization: Bearer <JWT>` to every outgoing API request
 * (except the public auth endpoints, which don't need a token).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const token = tokens.token;

  const isAuthPublic =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register');

  if (token && !isAuthPublic) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
