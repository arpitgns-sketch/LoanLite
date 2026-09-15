import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/auth.model';

const STORAGE_KEY = 'loanlite.user';

/**
 * Persists the signed-in user (incl. JWT) in localStorage and provides
 * lightweight helpers to read the token / expiry. No HTTP here.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  save(user: CurrentUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  read(): CurrentUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      this.clear();
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  get token(): string | null {
    return this.read()?.token ?? null;
  }

  /** True if we have a token that has not passed expiresAtUtc. */
  isValid(): boolean {
    const user = this.read();
    if (!user?.token) return false;
    const expiry = new Date(user.expiresAtUtc).getTime();
    return Number.isFinite(expiry) ? expiry > Date.now() : true;
  }
}
