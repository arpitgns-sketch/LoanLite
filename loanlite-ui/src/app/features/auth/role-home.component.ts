import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

/**
 * Landing redirect for the bare "/" URL inside the authenticated shell.
 *
 * A plain `redirectTo` cannot be used here because the destination depends on
 * the role carried in the JWT, which is only known at runtime:
 *
 *   Applicant   -> /app/dashboard
 *   Processor   -> /processor/dashboard
 *   Underwriter -> /underwriter/dashboard
 *   Admin       -> /admin/dashboard
 */
@Component({
  selector: 'll-role-home',
  standalone: true,
  template: `<div class="loading">Taking you to your dashboard…</div>`,
  styles: [
    `
      .loading {
        padding: 48px;
        color: #90a4ae;
        text-align: center;
      }
    `,
  ],
})
export class RoleHomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    const role = this.auth.role();

    if (role) {
      this.router.navigateByUrl(this.auth.homeForRole(role));
      return;
    }

    this.router.navigateByUrl('/login');
  }
}
