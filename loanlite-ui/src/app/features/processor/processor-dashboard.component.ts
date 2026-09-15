import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationListItem } from '../../core/models/application.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/**
 * Processor landing page: queue counts + the newest files awaiting action.
 * Data source: GET /api/worklists/processor
 */
@Component({
  selector: 'll-processor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, InrPipe],
  template: `
    <div class="head">
      <div>
        <h1>Welcome back, {{ firstName() }}</h1>
        <p class="muted">Applications assigned to the processing queue.</p>
      </div>
      <a routerLink="/processor/worklist" class="btn-primary">Open work list</a>
    </div>

    @if (loading()) {
      <div class="card">Loading queue…</div>
    } @else {
      <div class="stats">
        <div class="stat">
          <div class="stat__n">{{ total() }}</div>
          <div class="stat__l">In queue</div>
        </div>
        <div class="stat">
          <div class="stat__n">{{ count('Submitted') }}</div>
          <div class="stat__l">Awaiting pickup</div>
        </div>
        <div class="stat stat--review">
          <div class="stat__n">{{ count('InReview') }}</div>
          <div class="stat__l">In review</div>
        </div>
        <div class="stat stat--wait">
          <div class="stat__n">{{ count('WaitingForDocuments') }}</div>
          <div class="stat__l">Waiting for docs</div>
        </div>
      </div>

      <div class="card">
        <div class="card__head">
          <h2>Newest in queue</h2>
          <a routerLink="/processor/worklist">View all →</a>
        </div>

        @if (items().length === 0) {
          <div class="empty">Nothing in your queue right now.</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>App #</th>
                <th>Applicant</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of recent(); track item.id) {
                <tr>
                  <td>{{ item.applicationNumber }}</td>
                  <td>{{ item.applicantName }}</td>
                  <td>{{ item.loanAmount | inr }}</td>
                  <td><ll-status-badge [status]="item.status" /></td>
                  <td>
                    <a [routerLink]="['/processor/applications', item.id]">
                      Open
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  `,
  styles: [
    `
      .head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 20px;
      }

      h1 {
        margin: 0 0 4px;
      }

      .muted {
        margin: 0;
        color: #90a4ae;
      }

      .btn-primary {
        padding: 10px 16px;
        border-radius: 8px;
        background: #e67e22;
        color: #ffffff;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 20px;
      }

      .stat {
        padding: 18px;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      }

      .stat__n {
        font-size: 1.8rem;
        font-weight: 700;
      }

      .stat__l {
        margin-top: 2px;
        color: #90a4ae;
        font-size: 0.82rem;
      }

      .stat--review .stat__n {
        color: #e67e22;
      }

      .stat--wait .stat__n {
        color: #b8860b;
      }

      .card__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .card__head h2 {
        margin: 0;
        font-size: 1.1rem;
      }

      .card__head a,
      .data-table a {
        color: #e67e22;
        text-decoration: none;
        font-weight: 600;
      }

      .empty {
        padding: 32px;
        color: #90a4ae;
        text-align: center;
      }

      @media (max-width: 900px) {
        .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
})
export class ProcessorDashboardComponent {
  private readonly applicationService = inject(ApplicationService);
  private readonly auth = inject(AuthService);

  readonly items = signal<ApplicationListItem[]>([]);
  readonly loading = signal(true);

  readonly firstName = computed(
    () => this.auth.currentUser()?.fullName?.split(' ')[0] ?? 'there'
  );

  readonly total = computed(() => this.items().length);
  readonly recent = computed(() => this.items().slice(0, 5));

  constructor() {
    this.applicationService
      .processorWorkList({ page: 1, pageSize: 50, sortBy: 'createdAt', desc: true })
      .subscribe({
        next: (page) => {
          this.items.set(page.items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  count(status: string): number {
    return this.items().filter((item) => item.status === status).length;
  }
}
