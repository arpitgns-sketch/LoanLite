import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/** Shown for 403 / wrong-role navigation. */
@Component({
  selector: 'll-not-authorized',
  standalone: true,
  template: `
    <div class="na">
      <div class="na__code">403</div>
      <h2>Not authorized</h2>
      <p>Your role ({{ auth.role() ?? 'guest' }}) can't access that screen.</p>
      <button class="btn" (click)="goHome()">Go to my dashboard</button>
    </div>
  `,
  styles: [`
    .na { min-height: 100vh; display: grid; place-content: center; text-align: center; gap: 8px; background: #f4f6f8; }
    .na__code { font-size: 4rem; font-weight: 800; color: #E67E22; }
    .btn { margin-top: 12px; padding: 10px 18px; border: none; border-radius: 8px; background: #2b2f36; color: #fff; cursor: pointer; }
  `],
})
export class NotAuthorizedComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  goHome(): void {
    const role = this.auth.role();
    this.router.navigateByUrl(role ? this.auth.homeForRole(role) : '/login');
  }
}
