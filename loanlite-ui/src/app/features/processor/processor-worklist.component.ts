import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApplicationService } from '../../core/services/application.service';
import { ApplicationListItem } from '../../core/models/application.model';
import {
  PagedResult,
  WorkListQuery,
} from '../../core/models/paged-result.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

type SortKey = 'createdAt' | 'loanAmount' | 'status';

/**
 * Processor Work List — paged, sortable and searchable queue of files
 * awaiting pickup.  GET /api/worklists/processor
 */
@Component({
  selector: 'll-processor-worklist',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, InrPipe],
  template: `
    <div class="head">
      <div>
        <h1>Work list</h1>
        <p class="muted">
          Applications waiting to be picked up and reviewed.
        </p>
      </div>

      <button type="button" class="btn-ghost" (click)="reload()">
        Refresh
      </button>
    </div>

    <div class="toolbar card">
      <input
        type="search"
        class="search"
        placeholder="Search by application number or applicant"
        [value]="query().search ?? ''"
        (input)="onSearch($any($event.target).value)"
      />

      <label class="page-size">
        Rows

        <select
          [value]="query().pageSize"
          (change)="onPageSize(+$any($event.target).value)"
        >
          <option [value]="10">10</option>
          <option [value]="20">20</option>
          <option [value]="50">50</option>
        </select>
      </label>
    </div>

    @if (loading()) {
      <div class="card">Loading work list…</div>
    } @else {
      @if (result(); as page) {
        @if (page.items.length === 0) {
          <div class="card empty">
            Nothing in your queue right now.
          </div>
        } @else {
          <div class="card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>App #</th>
                  <th>Applicant</th>

                  <th
                    class="sortable"
                    (click)="sortBy('loanAmount')"
                  >
                    Amount {{ sortArrow('loanAmount') }}
                  </th>

                  <th>Tenure</th>

                  <th class="sortable" (click)="sortBy('status')">
                    Status {{ sortArrow('status') }}
                  </th>

                  <th
                    class="sortable"
                    (click)="sortBy('createdAt')"
                  >
                    Created {{ sortArrow('createdAt') }}
                  </th>

                  <th></th>
                </tr>
              </thead>

              <tbody>
                @for (item of page.items; track item.id) {
                  <tr>
                    <td>{{ item.applicationNumber }}</td>
                    <td>{{ item.applicantName }}</td>
                    <td>{{ item.loanAmount | inr }}</td>
                    <td>{{ item.tenureMonths }} mo</td>

                    <td>
                      <ll-status-badge [status]="item.status" />
                    </td>

                    <td>
                      {{ item.createdAt | date: 'dd MMM yyyy' }}
                    </td>

                    <td>
                      <a
                        [routerLink]="[
                          '/processor/applications',
                          item.id
                        ]"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="pager">
              <span class="pager__info">
                Page {{ page.page }} of {{ page.totalPages || 1 }}
                · {{ page.totalCount }} item(s)
              </span>

              <div class="pager__btns">
                <button
                  type="button"
                  class="btn-ghost"
                  (click)="goto(page.page - 1)"
                  [disabled]="page.page <= 1"
                >
                  Previous
                </button>

                <button
                  type="button"
                  class="btn-ghost"
                  (click)="goto(page.page + 1)"
                  [disabled]="page.page >= page.totalPages"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="card empty">
          Work list could not be loaded.
        </div>
      }
    }
  `,
  styles: [
    `
      .head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 16px;
      }

      h1 {
        margin: 0 0 4px;
      }

      .muted {
        margin: 0;
        color: #90a4ae;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .search {
        flex: 1;
        padding: 9px 12px;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        font-size: 0.92rem;
      }

      .search:focus {
        outline: none;
        border-color: #e67e22;
        box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.15);
      }

      .page-size {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #607d8b;
        font-size: 0.85rem;
      }

      .page-size select {
        padding: 7px 10px;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
      }

      .sortable {
        cursor: pointer;
        user-select: none;
      }

      .sortable:hover {
        color: #e67e22;
      }

      .data-table a {
        color: #e67e22;
        text-decoration: none;
        font-weight: 600;
      }

      .pager {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding-top: 14px;
      }

      .pager__info {
        color: #90a4ae;
        font-size: 0.85rem;
      }

      .pager__btns {
        display: flex;
        gap: 8px;
      }

      .btn-ghost {
        padding: 8px 14px;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        background: #ffffff;
        cursor: pointer;
      }

      .btn-ghost:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .empty {
        padding: 32px;
        color: #90a4ae;
        text-align: center;
      }

      @media (max-width: 800px) {
        .head {
          flex-direction: column;
        }

        .toolbar {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class ProcessorWorklistComponent {
  private readonly applicationService = inject(ApplicationService);

  readonly result = signal<PagedResult<ApplicationListItem> | null>(
    null
  );
  readonly loading = signal(true);

  readonly query = signal<WorkListQuery>({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: 'createdAt',
    desc: true,
  });

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);

    this.applicationService
      .processorWorkList(this.query())
      .subscribe({
        next: (page) => {
          this.result.set(page);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  reload(): void {
    this.load();
  }

  onSearch(value: string): void {
    clearTimeout(this.searchTimer);

    this.searchTimer = setTimeout(() => {
      this.query.update((q) => ({
        ...q,
        search: value,
        page: 1,
      }));

      this.load();
    }, 350);
  }

  onPageSize(size: number): void {
    this.query.update((q) => ({
      ...q,
      pageSize: size,
      page: 1,
    }));

    this.load();
  }

  sortBy(key: SortKey): void {
    this.query.update((q) => ({
      ...q,
      sortBy: key,
      desc: q.sortBy === key ? !q.desc : true,
      page: 1,
    }));

    this.load();
  }

  sortArrow(key: SortKey): string {
    const q = this.query();

    if (q.sortBy !== key) {
      return '';
    }

    return q.desc ? '↓' : '↑';
  }

  goto(page: number): void {
    const total = this.result()?.totalPages ?? 1;

    if (page < 1 || page > total) {
      return;
    }

    this.query.update((q) => ({ ...q, page }));
    this.load();
  }
}