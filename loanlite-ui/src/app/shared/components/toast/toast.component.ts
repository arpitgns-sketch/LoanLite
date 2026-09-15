import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

/** Global toast stack — mount once in the app shell. */
@Component({
  selector: 'll-toast',
  standalone: true,
  template: `
    <div class="toast-stack">
      @for (t of notify.toasts(); track t.id) {
        <div class="toast toast--{{ t.kind }}" (click)="notify.dismiss(t.id)">
          <span class="toast__msg">{{ t.message }}</span>
          <button class="toast__x" aria-label="Dismiss">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed; top: 16px; right: 16px; z-index: 1000;
      display: flex; flex-direction: column; gap: 10px; max-width: 360px;
    }
    .toast {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 14px; border-radius: 8px; color: #fff; cursor: pointer;
      box-shadow: 0 6px 20px rgba(0,0,0,.18); font-size: .9rem; animation: slide .2s ease;
    }
    .toast--success { background: #1E7A1E; }
    .toast--error   { background: #c0392b; }
    .toast--warning { background: #E67E22; }
    .toast--info    { background: #2F5496; }
    .toast__x { background: none; border: none; color: #fff; font-size: 1.1rem; cursor: pointer; }
    @keyframes slide { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }
  `],
})
export class ToastComponent {
  notify = inject(NotificationService);
}
