import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

/** Register screen — POST /api/auth/register (always creates an Applicant). */
@Component({
  selector: 'll-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth auth--single">
      <div class="auth__card auth__card--wide">
        <div class="auth__logo"><span class="box"></span> LoanLite</div>
        <h2>Create your account</h2>
        <p class="muted">Register as an Applicant to apply for a loan</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="row">
            <div>
              <label>First name</label>
              <input formControlName="firstName" placeholder="Enter first name" autocomplete="given-name"/>
            </div>
            <div>
              <label>Last name</label>
              <input formControlName="lastName" placeholder="Enter first name" autocomplete="given-name" />
            </div>
          </div>

          <label>Email</label>
          <input type="email" formControlName="email" placeholder="you@example.com" />

          <div class="row">
            <div>
              <label>Phone</label>
              <input formControlName="phone" placeholder="10-digit mobile" />
            </div>
            <div>
              <label>Password</label>
              <input type="password" formControlName="password" placeholder="min 8 chars" />
            </div>
          </div>

          <div class="note">ⓘ Public sign-up always creates an Applicant role.</div>

          <button class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create Account' }}
          </button>
        </form>

        <p class="switch">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `,
  styleUrls: ['./auth.shared.css'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Please fix the highlighted fields.');
      return;
    }
    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.notify.success('Account created!');
        this.router.navigateByUrl(this.auth.homeForRole(res.role));
      },
      error: () => this.loading.set(false),
    });
  }
}
