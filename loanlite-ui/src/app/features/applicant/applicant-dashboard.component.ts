import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationListItem, } from '../../core/models/application.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/** Applicant landing page: state counts + quick actions + recent applications. */
@Component({
  selector: 'll-applicant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, InrPipe],
  template: `
    <div class="head">
      <div>
        <h1>Welcome back, {{ firstName() }}</h1>
        <p class="muted">Here's a snapshot of your loan applications.</p>
      </div>
      <a routerLink="/app/apply" class="btn-primary">+ New Application</a>
    </div>

    @if (loading()) {
      <div class="card">Loading your applications…</div>
    } @else {
      <div class="stats">
        <div class="stat"><div class="stat__n">{{ total() }}</div><div class="stat__l">Total</div></div>
        <div class="stat"><div class="stat__n">{{ count('Draft') }}</div><div class="stat__l">Drafts</div></div>
        <div class="stat"><div class="stat__n">{{ active() }}</div><div class="stat__l">In Progress</div></div>
        <div class="stat stat--ok"><div class="stat__n">{{ approved() }}</div><div class="stat__l">Approved</div></div>
        <div class="stat stat--no"><div class="stat__n">{{ rejected() }}</div><div class="stat__l">Rejected</div></div>
      </div>

      <div class="card">
        <div class="card__head">
          <h2>Recent applications</h2>
          <a routerLink="/app/applications">View all →</a>
        </div>

        @if (apps().length === 0) {
          <div class="empty">
            <p>You haven't started an application yet.</p>
            <a routerLink="/app/apply" class="btn-primary">Apply for a loan</a>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>App #</th><th>Amount</th><th>Tenure</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (a of recent(); track a.id) {
                <tr>
                  <td>{{ a.applicationNumber }}</td>
                  <td>{{ a.loanAmount | inr }}</td>
                  <td>{{ a.tenureMonths }} mo</td>
                  <td><ll-status-badge [status]="a.status" /></td>
                  <td><a [routerLink]="['/app/applications', a.id]">Open</a></td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    h1 { margin: 0 0 4px; }
    .muted { color: #90a4ae; margin: 0; }
    .btn-primary { background: #E67E22; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; white-space: nowrap; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 20px; }
    .stat { background: #fff; border-radius: 12px; padding: 18px; box-shadow: 0 4px 16px rgba(0,0,0,.04); }
    .stat__n { font-size: 1.8rem; font-weight: 700; }
    .stat__l { color: #90a4ae; font-size: .82rem; margin-top: 2px; }
    .stat--ok .stat__n { color: #1e7a1e; }
    .stat--no .stat__n { color: #c0392b; }
    .card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .card__head h2 { margin: 0; font-size: 1.1rem; }
    .card__head a, .data-table a { color: #E67E22; text-decoration: none; font-weight: 600; }
    .empty { text-align: center; padding: 32px; color: #90a4ae; }
    .empty .btn-primary { display: inline-block; margin-top: 10px; }
  `],
})
export class ApplicantDashboardComponent {
  private appService = inject(ApplicationService);
  private auth = inject(AuthService);

  apps = signal<ApplicationListItem[]>([]);
  loading = signal(true);

  firstName = computed(() => this.auth.currentUser()?.fullName?.split(' ')[0] ?? 'there');

  total = computed(() => this.apps().length);
  recent = computed(() => this.apps().slice(0, 5));
  approved = computed(() => this.apps().filter((a) => a.status === 'Decided').length);
  rejected = computed(() => 0); // list item has no decision; refine when detail is loaded
  active = computed(() =>
    this.apps().filter((a) =>
      ['Submitted', 'InReview', 'WaitingForDocuments', 'Referred'].includes(a.status)).length);

  count(status: string) {
    return this.apps().filter((a) => a.status === status).length;
  }

  constructor() {
    this.appService.mine().subscribe({
      next: (list) => { this.apps.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
