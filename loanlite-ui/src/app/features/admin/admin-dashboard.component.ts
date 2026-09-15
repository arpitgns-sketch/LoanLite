import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminDashboardResponse } from '../../core/models/admin.model';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'll-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Admin Dashboard</h1>
        <p>
          Signed in as {{ auth.currentUser()?.fullName }}.
          Monitor users, applications, and audit activity.
        </p>
      </div>

      <button
        type="button"
        class="btn"
        (click)="load()"
        [disabled]="loading()"
      >
        {{ loading() ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    @if (loading() && !data()) {
      <div class="card state">Loading dashboard...</div>
    } @else {
      @if (failed()) {
        <div class="card state state--error">
          Dashboard metrics could not be loaded. Select Refresh to try again.
        </div>
      } @else {
        @if (data(); as dashboard) {
          <section class="section">
            <div class="section-head">
              <div>
                <h2>Users</h2>
                <p>Registered accounts by role.</p>
              </div>

              <a routerLink="/admin/users" class="link">Manage users</a>
            </div>

            <div class="metrics metrics--users">
              <article class="metric metric--primary">
                <span class="metric__label">Total users</span>
                <strong>{{ dashboard.totalUsers }}</strong>
                <span class="metric__note">All registered accounts</span>
              </article>

              <article class="metric">
                <span class="metric__label">Applicants</span>
                <strong>{{ dashboard.applicants }}</strong>
                <span class="metric__note">
                  {{ percentage(dashboard.applicants, dashboard.totalUsers) }}% of users
                </span>
              </article>

              <article class="metric">
                <span class="metric__label">Processors</span>
                <strong>{{ dashboard.processors }}</strong>
                <span class="metric__note">Operational users</span>
              </article>

              <article class="metric">
                <span class="metric__label">Underwriters</span>
                <strong>{{ dashboard.underwriters }}</strong>
                <span class="metric__note">Decision users</span>
              </article>

              <article class="metric">
                <span class="metric__label">Admins</span>
                <strong>{{ dashboard.admins }}</strong>
                <span class="metric__note">Administration users</span>
              </article>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <h2>Applications</h2>
                <p>Current distribution across the loan lifecycle.</p>
              </div>
            </div>

            <div class="application-summary">
              <article class="total-card">
                <span>Total applications</span>
                <strong>{{ dashboard.totalApplications }}</strong>
                <p>All applications currently stored in LoanLite.</p>
              </article>

              <div class="status-grid">
                <article class="status-card">
                  <span class="dot dot--draft"></span>
                  <div><strong>{{ dashboard.draft }}</strong><span>Draft</span></div>
                </article>

                <article class="status-card">
                  <span class="dot dot--submitted"></span>
                  <div><strong>{{ dashboard.submitted }}</strong><span>Submitted</span></div>
                </article>

                <article class="status-card">
                  <span class="dot dot--review"></span>
                  <div><strong>{{ dashboard.inReview }}</strong><span>In Review</span></div>
                </article>

                <article class="status-card">
                  <span class="dot dot--waiting"></span>
                  <div>
                    <strong>{{ dashboard.waitingForDocuments }}</strong>
                    <span>Waiting for Documents</span>
                  </div>
                </article>

                <article class="status-card">
                  <span class="dot dot--referred"></span>
                  <div><strong>{{ dashboard.referred }}</strong><span>Referred</span></div>
                </article>

                <article class="status-card">
                  <span class="dot dot--decided"></span>
                  <div><strong>{{ dashboard.decided }}</strong><span>Decided</span></div>
                </article>

                <article class="status-card">
                  <span class="dot dot--withdrawn"></span>
                  <div><strong>{{ dashboard.withdrawn }}</strong><span>Withdrawn</span></div>
                </article>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <h2>Audit activity</h2>
                <p>Immutable workflow events captured by the system.</p>
              </div>

              <a routerLink="/admin/audit" class="link">Open audit log</a>
            </div>

            <article class="audit-card">
              <div class="audit-card__icon">A</div>
              <div>
                <span>Total audit records</span>
                <strong>{{ dashboard.totalAuditRecords }}</strong>
                <p>
                  Includes application creation, submission, processing,
                  checks, referrals, send-backs, decisions, and withdrawals.
                </p>
              </div>
            </article>
          </section>
        }
      }
    }
  `,
  styles: [`
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
    }

    h1 {
      margin: 0 0 4px;
    }

    .page-head p,
    .section-head p {
      margin: 0;
      color: #90a4ae;
    }

    .btn {
      padding: 9px 14px;
      border: 1px solid #d0d5dd;
      border-radius: 8px;
      background: #ffffff;
      color: #455a64;
      font-weight: 600;
      cursor: pointer;
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .section {
      margin-bottom: 26px;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 14px;
    }

    h2 {
      margin: 0 0 3px;
      font-size: 1.15rem;
    }

    .link {
      color: #e67e22;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }

    .link:hover {
      text-decoration: underline;
    }

    .metrics {
      display: grid;
      gap: 14px;
    }

    .metrics--users {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .metric {
      display: flex;
      flex-direction: column;
      min-height: 112px;
      padding: 18px;
      border: 1px solid #eceff1;
      border-radius: 12px;
      background: #ffffff;
    }

    .metric--primary {
      border-color: #ffe0c2;
      background: #fff8f1;
    }

    .metric__label {
      color: #607d8b;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .metric strong {
      margin: 8px 0 4px;
      color: #263238;
      font-size: 2rem;
      line-height: 1;
    }

    .metric--primary strong {
      color: #e67e22;
    }

    .metric__note {
      margin-top: auto;
      color: #90a4ae;
      font-size: 0.75rem;
    }

    .application-summary {
      display: grid;
      grid-template-columns: minmax(220px, 0.7fr) minmax(0, 2.3fr);
      gap: 14px;
    }

    .total-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 22px;
      border: 1px solid #ffe0c2;
      border-radius: 12px;
      background: #fff8f1;
    }

    .total-card span {
      color: #a15c00;
      font-weight: 600;
    }

    .total-card strong {
      margin: 10px 0 6px;
      color: #e67e22;
      font-size: 2.5rem;
      line-height: 1;
    }

    .total-card p {
      margin: 0;
      color: #ad7a46;
      font-size: 0.8rem;
      line-height: 1.45;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 68px;
      padding: 14px;
      border: 1px solid #eceff1;
      border-radius: 10px;
      background: #ffffff;
    }

    .status-card div {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .status-card strong {
      color: #263238;
      font-size: 1.35rem;
      line-height: 1.1;
    }

    .status-card div span {
      margin-top: 3px;
      color: #78909c;
      font-size: 0.77rem;
    }

    .dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      flex: 0 0 auto;
    }

    .dot--draft { background: #78909c; }
    .dot--submitted { background: #1565c0; }
    .dot--review { background: #e67e22; }
    .dot--waiting { background: #b8860b; }
    .dot--referred { background: #6a1b9a; }
    .dot--decided { background: #1e7a1e; }
    .dot--withdrawn { background: #c0392b; }

    .audit-card {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 20px;
      border: 1px solid #eceff1;
      border-radius: 12px;
      background: #ffffff;
    }

    .audit-card__icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #fff3e0;
      color: #e67e22;
      font-size: 1.15rem;
      font-weight: 800;
      flex: 0 0 auto;
    }

    .audit-card div:last-child {
      display: grid;
      grid-template-columns: auto auto;
      align-items: baseline;
      gap: 4px 12px;
    }

    .audit-card span {
      color: #607d8b;
      font-weight: 600;
    }

    .audit-card strong {
      color: #263238;
      font-size: 1.8rem;
    }

    .audit-card p {
      grid-column: 1 / -1;
      margin: 0;
      color: #90a4ae;
      font-size: 0.8rem;
      line-height: 1.45;
    }

    .state {
      padding: 36px;
      color: #90a4ae;
      text-align: center;
    }

    .state--error {
      background: #fbe9e7;
      color: #c0392b;
    }

    @media (max-width: 1150px) {
      .metrics--users {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .status-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 850px) {
      .application-summary {
        grid-template-columns: 1fr;
      }

      .status-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 650px) {
      .page-head,
      .section-head {
        align-items: stretch;
        flex-direction: column;
      }

      .btn {
        align-self: flex-start;
      }

      .metrics--users,
      .status-grid {
        grid-template-columns: 1fr;
      }

      .audit-card {
        align-items: flex-start;
      }
    }
  `],
})
export class AdminDashboardComponent {
  readonly auth = inject(AuthService);
  private readonly adminService = inject(AdminService);

  readonly data = signal<AdminDashboardResponse | null>(null);
  readonly loading = signal(false);
  readonly failed = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);

    this.adminService.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  percentage(value: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }
}
