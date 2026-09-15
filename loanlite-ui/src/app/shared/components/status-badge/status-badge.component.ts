import { Component, Input } from '@angular/core';
import { ApplicationStatus, Recommendation, STATUS_LABELS } from '../../../core/models/enums';

/**
 * Colored pill for the 7 statuses and Approve/Reject/Refer recommendations,
 * matching the wireframe color language.
 *
 *   <ll-status-badge [status]="app.status" />
 *   <ll-status-badge [recommendation]="app.recommendation" />
 */
@Component({
  selector: 'll-status-badge',
  standalone: true,
  template: `<span class="badge badge--{{ cssKey }}">{{ label }}</span>`,
  styles: [`
    .badge {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      font-size: .78rem; font-weight: 600; line-height: 1.6; white-space: nowrap;
    }
    /* Statuses */
    .badge--draft               { background:#eceff1; color:#546e7a; }
    .badge--submitted           { background:#e3f2fd; color:#1565c0; }
    .badge--inreview            { background:#fff3e0; color:#e67e22; }
    .badge--waitingfordocuments { background:#fff8e1; color:#b8860b; }
    .badge--referred            { background:#ede7f6; color:#6a1b9a; }
    .badge--decided             { background:#e8f5e9; color:#1e7a1e; }
    .badge--withdrawn           { background:#fbe9e7; color:#c0392b; }
    /* Recommendation / decision */
    .badge--approve { background:#e8f5e9; color:#1e7a1e; }
    .badge--reject  { background:#fbe9e7; color:#c0392b; }
    .badge--refer   { background:#fff3e0; color:#e67e22; }
    .badge--unknown { background:#eceff1; color:#607d8b; }
  `],
})
export class StatusBadgeComponent {
  @Input() status?: ApplicationStatus | null;
  @Input() recommendation?: Recommendation | null;

  get label(): string {
    if (this.status) return STATUS_LABELS[this.status];
    if (this.recommendation) return this.recommendation;
    return '—';
  }

  get cssKey(): string {
    const key = this.status ?? this.recommendation ?? 'unknown';
    return key.toLowerCase();
  }
}
