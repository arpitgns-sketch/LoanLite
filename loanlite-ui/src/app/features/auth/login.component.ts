import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

/** Login screen — POST /api/auth/login, then route to the role's home. */
@Component({
  selector: 'll-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth">
      <div class="auth__brand">
        <div class="auth__logo"><span class="box"></span> LoanLite</div>
        <h1>Personal Loan<br />Origination Platform</h1>
      </div>

      <div class="auth__card">
        <h2>Sign in</h2>
        <p class="muted">Welcome back — enter your credentials</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Email</label>
          <input type="email" formControlName="email" placeholder="you@example.com" />

          <label>Password</label>
          <input type="password" formControlName="password" placeholder="••••••••" />

          <button class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <p class="switch">New here? <a routerLink="/register">Create an account</a></p>
        <p class="hint">Default admin: admin&#64;loanlite.local / Admin&#64;123</p>
      </div>
    </div>
  `,
  styleUrls: ['./auth.shared.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.notify.success(`Welcome back, ${res.fullName.split(' ')[0]}`);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || this.auth.homeForRole(res.role));
      },
      error: () => this.loading.set(false),
    });
  }
}
