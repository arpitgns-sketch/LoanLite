import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { TokenService } from '../services/token.service';
import { ApiError } from '../models/paged-result.model';

/**
 * Centralises API error handling per the handoff contract:
 *   401 -> clear session + go to /login
 *   403 -> go to /not-authorized
 *   409 -> toast "action not allowed" (illegal state transition)
 *   400 -> toast the first validation error
 *   0   -> toast "cannot reach API"
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notify = inject(NotificationService);
  const tokens = inject(TokenService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const body = err.error as ApiError | undefined;

      switch (err.status) {
        case 0:
          notify.error('Cannot reach the API. Is the backend running on :5002?');
          break;
        case 400: {
          const first =
            body?.errors && Object.values(body.errors)[0]?.[0];
          notify.error(first || body?.detail || body?.title || 'Invalid request.');
          break;
        }
        case 401:
          tokens.clear();
          notify.warning('Your session expired. Please sign in again.');
          router.navigate(['/login']);
          break;
        case 403:
          notify.error('You are not allowed to perform this action.');
          router.navigate(['/not-authorized']);
          break;
        case 404:
          notify.error(body?.detail || 'Not found.');
          break;
        case 409:
          notify.warning(body?.detail || 'Action not allowed in the current state.');
          break;
        default:
          notify.error(body?.title || 'Something went wrong. Please try again.');
      }
      return throwError(() => err);
    })
  );
};
