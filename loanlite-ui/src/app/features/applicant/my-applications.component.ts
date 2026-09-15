import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { ApplicationListItem } from '../../core/models/application.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/** All of the applicant's applications, newest first, with a status filter. */
@Component({
  selector: 'll-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, InrPipe],
  template: `
    <div class="head">
      <h1>My applications</h1>
      <a routerLink="/app/apply" class="btn-primary">+ New Application</a>
    </div>

    <div class="filters">
      @for (f of filters; track f) {
        <button class="chip" [class.chip--on]="filter() === f" (click)="filter.set(f)">{{ f }}</button>
      }
    </div>

    @if (loading()) {
      <div class="card">Loading…</div>
    } @else if (filtered().length === 0) {
      <div class="card empty">No applications{{ filter() === 'All' ? ' yet' : ' in this state' }}.</div>
    } @else {
      <div class="card">
        <table class="data-table">
          <thead>
            <tr><th>App #</th><th>Amount</th><th>Tenure</th><th>Status</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            @for (a of filtered(); track a.id) {
              <tr>
                <td>{{ a.applicationNumber }}</td>
                <td>{{ a.loanAmount | inr }}</td>
                <td>{{ a.tenureMonths }} mo</td>
                <td><ll-status-badge [status]="a.status" /></td>
                <td>{{ a.createdAt | date:'dd MMM yyyy' }}</td>
                <td>
                  @if (a.status === 'Draft') {
                    <a [routerLink]="['/app/apply', a.id]">Continue</a>
                  } @else {
                    <a [routerLink]="['/app/applications', a.id]">View</a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; }
    .btn-primary { background: #E67E22; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .chip { border: 1px solid #d0d5dd; background: #fff; padding: 6px 14px; border-radius: 999px; cursor: pointer; font-size: .82rem; }
    .chip--on { background: #E67E22; color: #fff; border-color: #E67E22; }
    .data-table a { color: #E67E22; text-decoration: none; font-weight: 600; }
    .empty { text-align: center; color: #90a4ae; padding: 32px; }
  `],
})
export class MyApplicationsComponent {
  private appService = inject(ApplicationService);

  apps = signal<ApplicationListItem[]>([]);
  loading = signal(true);
  filter = signal<string>('All');

  readonly filters = ['All', 'Draft', 'Submitted', 'InReview', 'WaitingForDocuments', 'Referred', 'Decided', 'Withdrawn'];

  filtered = computed(() => {
    const f = this.filter();
    const list = [...this.apps()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return f === 'All' ? list : list.filter((a) => a.status === f);
  });

  constructor() {
    this.appService.mine().subscribe({
      next: (list) => { this.apps.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
