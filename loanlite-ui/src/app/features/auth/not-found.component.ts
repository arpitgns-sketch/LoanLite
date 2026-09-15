import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

/**
 * 404 page.
 *
 * Previously any unmatched URL fell through to a redirect to /login, which
 * logged people out of a working session. This page keeps the session intact
 * and offers a route back to the right dashboard.
 */
@Component({
  selector: 'll-not-found',
  standalone: true,
  template: `
    <div class="nf">
      <div class="nf__code">404</div>
      <h2>Page not found</h2>
      <p>That screen does not exist or has moved.</p>

      <button type="button" class="btn" (click)="goHome()">
        {{ auth.isLoggedIn() ? 'Go to my dashboard' : 'Go to sign in' }}
      </button>
    </div>
  `,
  styles: [
    `
      .nf {
        display: grid;
        place-content: center;
        gap: 8px;
        min-height: 60vh;
        text-align: center;
      }

      .nf__code {
        color: #e67e22;
        font-size: 4rem;
        font-weight: 800;
      }

      h2 {
        margin: 0;
      }

      p {
        margin: 0;
        color: #90a4ae;
      }

      .btn {
        justify-self: center;
        margin-top: 12px;
        padding: 10px 18px;
        border: none;
        border-radius: 8px;
        background: #2b2f36;
        color: #ffffff;
        cursor: pointer;
      }
    `,
  ],
})
export class NotFoundComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  goHome(): void {
    const role = this.auth.role();

    if (role && this.auth.isLoggedIn()) {
      this.router.navigateByUrl(this.auth.homeForRole(role));
      return;
    }

    this.router.navigateByUrl('/login');
  }
}
