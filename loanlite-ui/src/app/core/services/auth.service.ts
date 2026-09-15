import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import {
  AuthResponse,
  CreateStaffRequest,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from '../models/auth.model';
import { Role } from '../models/enums';

/**
 * Central auth state. Exposes a `currentUser` signal so components/guards
 * can react to sign-in / sign-out without manual subscriptions.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokens = inject(TokenService);
  private router = inject(Router);
  private base = environment.apiBaseUrl;

  // Reactive signed-in user (rehydrated from localStorage on startup).
  private _user = signal<CurrentUser | null>(this.tokens.read());
  readonly currentUser = this._user.asReadonly();

  readonly isLoggedIn = computed(() => !!this._user() && this.tokens.isValid());
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/api/auth/login`, payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    // Public sign-up always creates an Applicant; API returns a token so we log in.
    return this.http
      .post<AuthResponse>(`${this.base}/api/auth/register`, payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  /** Admin-only: create a Processor / Underwriter / Admin. Does NOT change our session. */
  createStaff(payload: CreateStaffRequest): Observable<unknown> {
    return this.http.post(`${this.base}/api/auth/staff`, payload);
  }

  logout(): void {
    this.tokens.clear();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  /** Landing route for a given role after login. */
  homeForRole(role: Role): string {
    switch (role) {
      case 'Applicant':
        return '/app/dashboard';
      case 'Processor':
        return '/processor/dashboard';
      case 'Underwriter':
        return '/underwriter/dashboard';
      case 'Admin':
        return '/admin/dashboard';
    }
  }

  private setSession(res: AuthResponse): void {
    const user: CurrentUser = {
      userId: res.userId,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
      token: res.token,
      expiresAtUtc: res.expiresAtUtc,
    };
    this.tokens.save(user);
    this._user.set(user);
  }
}
