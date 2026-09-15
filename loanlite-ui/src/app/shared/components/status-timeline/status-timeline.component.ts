import { Component, Input, computed, signal } from '@angular/core';
import { ApplicationStatus, STATUS_FLOW, STATUS_LABELS } from '../../../core/models/enums';

interface Step {
  status: ApplicationStatus;
  label: string;
  state: 'done' | 'current' | 'upcoming';
}

/**
 * Horizontal stepper visualising the lifecycle:
 * Draft → Submitted → In Review → Waiting for Docs → Referred → Decided.
 * Withdrawn renders as a terminal branch chip.
 *
 *   <ll-status-timeline [current]="app.status" />
 */
@Component({
  selector: 'll-status-timeline',
  standalone: true,
  template: `
    @if (isWithdrawn()) {
      <div class="tl tl--withdrawn">
        <span class="dot dot--done"></span>
        <span class="lbl">Application withdrawn by applicant</span>
      </div>
    } @else {
      <div class="tl">
        @for (step of steps(); track step.status; let last = $last) {
          <div class="node node--{{ step.state }}">
            <span class="dot"></span>
            <span class="lbl">{{ step.label }}</span>
          </div>
          @if (!last) { <span class="bar bar--{{ step.state }}"></span> }
        }
      </div>
    }
  `,
  styles: [`
    .tl { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; }
    .node { display: flex; flex-direction: column; align-items: center; min-width: 84px; text-align: center; }
    .dot { width: 16px; height: 16px; border-radius: 50%; background: #cfd8dc; border: 2px solid #cfd8dc; }
    .lbl { font-size: .72rem; margin-top: 6px; color: #90a4ae; }
    .bar { flex: 1; height: 3px; background: #cfd8dc; min-width: 20px; margin-bottom: 20px; }

    .node--done .dot     { background: #1e7a1e; border-color: #1e7a1e; }
    .node--done .lbl     { color: #1e7a1e; }
    .node--current .dot  { background: #E67E22; border-color: #E67E22; box-shadow: 0 0 0 4px rgba(230,126,34,.2); }
    .node--current .lbl  { color: #E67E22; font-weight: 600; }
    .bar--done { background: #1e7a1e; }

    .tl--withdrawn { gap: 10px; }
    .tl--withdrawn .dot--done { background: #c0392b; border-color: #c0392b; }
    .tl--withdrawn .lbl { margin: 0; color: #c0392b; font-weight: 600; font-size: .85rem; }
  `],
})
export class StatusTimelineComponent {
  private _current = signal<ApplicationStatus>('Draft');

  @Input({ required: true }) set current(value: ApplicationStatus) {
    this._current.set(value);
  }

  isWithdrawn = computed(() => this._current() === 'Withdrawn');

  steps = computed<Step[]>(() => {
    const current = this._current();
    const idx = STATUS_FLOW.indexOf(current);
    return STATUS_FLOW.map((status, i) => ({
      status,
      label: STATUS_LABELS[status],
      state: i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
    }));
  });
}
