import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { MeResponse } from '../../core/models/auth.model';

/**
 * Shared User Profile screen for every role.
 *
 * Shows the identity stored in the JWT and confirms it against the server
 * via GET /api/auth/me, which also proves the token is still valid.
 */
@Component({
  selector: 'll-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>My profile</h1>
    <p class="muted">Your account details and current session.</p>

    <div class="grid">
      <div class="card">
        <h2>Account</h2>

        <div class="kv">
          <span>Name</span>
          <b>{{ user()?.fullName ?? '—' }}</b>
        </div>

        <div class="kv">
          <span>Email</span>
          <b>{{ user()?.email ?? '—' }}</b>
        </div>

        <div class="kv">
          <span>Role</span>
          <b class="role">{{ user()?.role ?? '—' }}</b>
        </div>

        <div class="kv">
          <span>User ID</span>
          <b>{{ user()?.userId ?? '—' }}</b>
        </div>
      </div>

      <div class="card">
        <h2>Session</h2>

        <div class="kv">
          <span>Token expires</span>
          <b>
            {{
              user()?.expiresAtUtc
                ? (user()!.expiresAtUtc | date: 'dd MMM yyyy, HH:mm')
                : '—'
            }}
          </b>
        </div>

        <div class="kv">
          <span>Server check</span>
          <b>
            @if (checking()) {
              <span class="pending">Checking…</span>
            } @else if (verified()) {
              <span class="ok">Session valid</span>
            } @else {
              <span class="bad">Could not verify</span>
            }
          </b>
        </div>

        @if (me(); as identity) {
          <div class="kv">
            <span>Confirmed as</span>
            <b>{{ identity.name }} ({{ identity.role }})</b>
          </div>
        }

        <button type="button" class="btn-danger" (click)="auth.logout()">
          Log out
        </button>
      </div>
    </div>

    <div class="card">
      <h2>Security</h2>
      <p class="muted">
        Password changes are not part of the current API. Ask an administrator
        if you need your credentials reset.
      </p>
    </div>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 4px;
      }

      h2 {
        margin: 0 0 14px;
        font-size: 1.1rem;
      }

      .muted {
        margin: 0 0 20px;
        color: #90a4ae;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }

      .card {
        margin-bottom: 0;
      }

      .kv {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 9px 0;
        border-bottom: 1px solid #eceff1;
      }

      .kv span {
        color: #90a4ae;
      }

      .kv b {
        text-align: right;
        word-break: break-all;
      }

      .role {
        color: #e67e22;
      }

      .ok {
        color: #1e7a1e;
      }

      .bad {
        color: #c0392b;
      }

      .pending {
        color: #90a4ae;
      }

      .btn-danger {
        margin-top: 18px;
        padding: 9px 16px;
        border: 1px solid #e0b4ae;
        border-radius: 8px;
        background: #ffffff;
        color: #c0392b;
        font-weight: 600;
        cursor: pointer;
      }

      @media (max-width: 800px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly user = this.auth.currentUser;

  readonly me = signal<MeResponse | null>(null);
  readonly checking = signal(true);
  readonly verified = signal(false);

  constructor() {
    this.http
      .get<MeResponse>(`${environment.apiBaseUrl}/api/auth/me`)
      .subscribe({
        next: (identity) => {
          this.me.set(identity);
          this.verified.set(true);
          this.checking.set(false);
        },
        error: () => {
          this.verified.set(false);
          this.checking.set(false);
        },
      });
  }
}
