import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { Role } from '../core/models/enums';

interface NavItem { label: string; link: string; }

/**
 * Authenticated app shell: brand header + role-based sidebar + <router-outlet>.
 * The sidebar links are derived from the JWT role so each user only sees
 * their own screens (RBAC in the UI; the API enforces it server-side too).
 */
@Component({
  selector: 'll-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand__box"></span> LoanLite</div>
        <nav>
          @for (item of nav(); track item.link) {
            <a [routerLink]="item.link" routerLinkActive="active">{{ item.label }}</a>
          }
        </nav>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="topbar__title">Personal Loan Origination Platform</div>
          <div class="topbar__user">
            <div class="topbar__name">{{ user()?.fullName }}</div>
            <div class="topbar__role">{{ user()?.role }}</div>
            <button class="btn-ghost" (click)="auth.logout()">Log out</button>
          </div>
        </header>
        <section class="content">
          <router-outlet />
        </section>
      </div>
    </div>
  `,
  styles: [`
    .shell { display: grid; grid-template-columns: 232px 1fr; min-height: 100vh; }
    .sidebar { background: #2b2f36; color: #cfd3da; padding: 18px 12px; }
    .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #fff; font-size: 1.1rem; margin-bottom: 22px; }
    .brand__box { width: 16px; height: 16px; background: #E67E22; border-radius: 3px; display: inline-block; }
    .sidebar nav { display: flex; flex-direction: column; gap: 2px; }
    .sidebar a { color: #cfd3da; text-decoration: none; padding: 9px 12px; border-radius: 6px; font-size: .92rem; }
    .sidebar a:hover { background: #363b44; color: #fff; }
    .sidebar a.active { background: #E67E22; color: #fff; font-weight: 600; }
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid #eceff1; background: #fff; }
    .topbar__title { color: #607d8b; font-size: .9rem; }
    .topbar__user { display: flex; align-items: center; gap: 12px; }
    .topbar__name { font-weight: 600; }
    .topbar__role { font-size: .78rem; color: #E67E22; }
    .btn-ghost { border: 1px solid #d0d5dd; background: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .content { padding: 24px; }
  `],
})
export class ShellComponent {
  auth = inject(AuthService);
  user = this.auth.currentUser;

  nav = computed<NavItem[]>(() => this.menuFor(this.auth.role()));

  private menuFor(role: Role | null): NavItem[] {
    switch (role) {
      case 'Applicant':
        return [
          { label: 'Dashboard', link: '/app/dashboard' },
          { label: 'New Application', link: '/app/apply' },
          { label: 'My Applications', link: '/app/applications' },
          { label: 'Profile', link: '/app/profile' },
        ];
      case 'Processor':
        return [
          { label: 'Dashboard', link: '/processor/dashboard' },
          { label: 'Work List', link: '/processor/worklist' },
          { label: 'Profile', link: '/processor/profile' },
        ];
      case 'Underwriter':
        return [
          { label: 'Dashboard', link: '/underwriter/dashboard' },
          { label: 'Work List', link: '/underwriter/worklist' },
          { label: 'Profile', link: '/underwriter/profile' },
        ];
      case 'Admin':
        return [
          { label: 'Dashboard', link: '/admin/dashboard' },
          { label: 'User Management', link: '/admin/users' },
          { label: 'Audit Log', link: '/admin/audit' },
        ];
      default:
        return [];
    }
  }
}
