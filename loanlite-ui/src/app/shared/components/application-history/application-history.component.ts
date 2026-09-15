import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationHistoryItem } from '../../../core/models/application-history.model';
import { ApplicationService } from '../../../core/services/application.service';

/** Reusable, read-only timeline backed by GET /api/applications/{id}/history. */
@Component({
  selector: 'll-application-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="history">
      <div class="history__head">
        <div>
          <h2>Application History</h2>
          <p>Recorded workflow actions for this application.</p>
        </div>

        <button
          type="button"
          class="refresh"
          (click)="load()"
          [disabled]="loading()"
        >
          Refresh
        </button>
      </div>

      @if (loading()) {
        <div class="state">Loading history...</div>
      } @else {
        @if (loadFailed()) {
          <div class="state state--error">
            History could not be loaded. Use Refresh to try again.
          </div>
        } @else {
          @if (items().length === 0) {
            <div class="state">No history is available for this application.</div>
          } @else {
            <div class="timeline">
              @for (item of items(); track item.id; let last = $last) {
                <article class="event">
                  <div class="event__rail">
                    <span class="event__dot"></span>
                    @if (!last) {
                      <span class="event__line"></span>
                    }
                  </div>

                  <div class="event__body">
                    <div class="event__top">
                      <strong>{{ actionLabel(item.action) }}</strong>
                      <time [attr.datetime]="item.createdAt">
                        {{ item.createdAt | date: 'dd MMM yyyy, HH:mm' }}
                      </time>
                    </div>

                    <p class="event__details">{{ item.details }}</p>

                    <div class="event__actor">
                      <span>{{ item.performedByName }}</span>
                      <span class="role">{{ item.performedByRole }}</span>
                      <span class="email">{{ item.performedByEmail }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        }
      }
    </section>
  `,
  styles: [`
    .history {
      padding: 20px;
      border: 1px solid #eceff1;
      border-radius: 12px;
      background: #ffffff;
    }

    .history__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    h2 {
      margin: 0 0 3px;
      font-size: 1.1rem;
    }

    .history__head p {
      margin: 0;
      color: #90a4ae;
      font-size: 0.84rem;
    }

    .refresh {
      padding: 7px 12px;
      border: 1px solid #d0d5dd;
      border-radius: 7px;
      background: #ffffff;
      color: #455a64;
      cursor: pointer;
    }

    .refresh:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .state {
      padding: 24px;
      color: #90a4ae;
      text-align: center;
    }

    .state--error {
      border-radius: 8px;
      background: #fbe9e7;
      color: #c0392b;
    }

    .timeline {
      display: flex;
      flex-direction: column;
    }

    .event {
      display: grid;
      grid-template-columns: 20px minmax(0, 1fr);
      gap: 12px;
    }

    .event__rail {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .event__dot {
      width: 12px;
      height: 12px;
      margin-top: 5px;
      border: 3px solid #ffe0c2;
      border-radius: 50%;
      background: #e67e22;
      box-sizing: content-box;
      flex: 0 0 auto;
    }

    .event__line {
      width: 2px;
      min-height: 54px;
      flex: 1;
      background: #eceff1;
    }

    .event__body {
      min-width: 0;
      padding: 0 0 20px;
    }

    .event__top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .event__top strong {
      color: #263238;
    }

    .event__top time {
      color: #90a4ae;
      font-size: 0.78rem;
    }

    .event__details {
      margin: 6px 0 8px;
      color: #546e7a;
      overflow-wrap: anywhere;
    }

    .event__actor {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
      color: #78909c;
      font-size: 0.8rem;
    }

    .role {
      padding: 2px 8px;
      border-radius: 999px;
      background: #fff3e0;
      color: #e67e22;
      font-weight: 600;
    }

    .email {
      color: #90a4ae;
    }

    @media (max-width: 640px) {
      .history {
        padding: 16px;
      }

      .history__head {
        align-items: stretch;
        flex-direction: column;
      }

      .refresh {
        align-self: flex-start;
      }
    }
  `],
})
export class ApplicationHistoryComponent implements OnChanges {
  private readonly applicationService = inject(ApplicationService);

  @Input({ required: true }) applicationId!: number;

  readonly items = signal<ApplicationHistoryItem[]>([]);
  readonly loading = signal(false);
  readonly loadFailed = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['applicationId'] && this.applicationId > 0) {
      this.load();
    }
  }

  load(): void {
    if (!this.applicationId || this.applicationId < 1) {
      this.items.set([]);
      return;
    }

    this.loading.set(true);
    this.loadFailed.set(false);

    this.applicationService.history(this.applicationId).subscribe({
      next: (history) => {
        this.items.set(history);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }

  actionLabel(action: string): string {
    const labels: Record<string, string> = {
      Created: 'Application created',
      Submitted: 'Application submitted',
      PickedUp: 'Picked up by processor',
      RequestedDocuments: 'Additional documents requested',
      'Re-uploaded documents': 'Documents marked ready',
      Referred: 'Referred to underwriter',
      SentBack: 'Sent back to processor',
      'Decided:Approve': 'Application approved',
      'Decided:Reject': 'Application rejected',
      Withdrawn: 'Application withdrawn',
    };

    return labels[action] ?? action;
  }
}
