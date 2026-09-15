import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

/**
 * Global client-side toast bus (per the v2 Notification component).
 * The error interceptor and lifecycle actions push messages here.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  private push(kind: ToastKind, message: string, ttl = 4000): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, kind, message }]);
    if (ttl > 0) setTimeout(() => this.dismiss(id), ttl);
  }

  success(msg: string) { this.push('success', msg); }
  error(msg: string) { this.push('error', msg, 6000); }
  info(msg: string) { this.push('info', msg); }
  warning(msg: string) { this.push('warning', msg); }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
