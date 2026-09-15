import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CreateStaffRequest } from '../../core/models/auth.model';
import { AdminUserListItem } from '../../core/models/admin.model';
import { PagedResult } from '../../core/models/paged-result.model';
import { Role } from '../../core/models/enums';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'll-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>User management</h1>
        <p>Create staff accounts and view all LoanLite users.</p>
      </div>

      <button
        type="button"
        class="btn"
        (click)="loadUsers()"
        [disabled]="loadingUsers()"
      >
        Refresh users
      </button>
    </div>

    <section class="card create-card">
      <div class="section-head">
        <div>
          <h2>Create a staff user</h2>
          <p>Creates a Processor, Underwriter, or Admin account.</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid">
          <label class="field">
            <span>First name</span>
            <input formControlName="firstName" placeholder="Enter first name" />
            @if (isInvalid('firstName')) {
              <small>First name is required.</small>
            }
          </label>

          <label class="field">
            <span>Last name</span>
            <input formControlName="lastName" placeholder="Enter last name" />
            @if (isInvalid('lastName')) {
              <small>Last name is required.</small>
            }
          </label>

          <label class="field">
            <span>Email</span>
            <input
              type="email"
              formControlName="email"
              placeholder="name@loanlite.local"
            />
            @if (isInvalid('email')) {
              <small>Enter a valid email address.</small>
            }
          </label>

          <label class="field">
            <span>Phone</span>
            <input formControlName="phone" placeholder="10-digit mobile" />
            @if (isInvalid('phone')) {
              <small>Enter a valid 10-digit phone number.</small>
            }
          </label>

          <label class="field">
            <span>Password</span>
            <input
              type="password"
              formControlName="password"
              placeholder="Minimum 8 characters"
            />
            @if (isInvalid('password')) {
              <small>Password must contain at least 8 characters.</small>
            }
          </label>

          <label class="field">
            <span>Role</span>
            <select formControlName="role">
              @for (role of assignableRoles; track role) {
                <option [value]="role">{{ role }}</option>
              }
            </select>
          </label>
        </div>

        <button type="submit" class="btn-primary" [disabled]="creating()">
          {{ creating() ? 'Creating...' : 'Create staff user' }}
        </button>
      </form>
    </section>

    <section class="card users-card">
      <div class="section-head">
        <div>
          <h2>All users</h2>
          <p>Search and filter registered users without exposing credentials.</p>
        </div>
      </div>

      <div class="filters">
        <label class="field field--search">
          <span>Search</span>
          <input
            [(ngModel)]="search"
            (keyup.enter)="applyFilters()"
            placeholder="Name, email, or phone"
          />
        </label>

        <label class="field">
          <span>Role</span>
          <select [(ngModel)]="role">
            <option value="">All roles</option>
            <option value="Applicant">Applicant</option>
            <option value="Processor">Processor</option>
            <option value="Underwriter">Underwriter</option>
            <option value="Admin">Admin</option>
          </select>
        </label>

        <label class="field">
          <span>Order</span>
          <select [(ngModel)]="desc">
            <option [ngValue]="true">Newest first</option>
            <option [ngValue]="false">Oldest first</option>
          </select>
        </label>

        <div class="filter-actions">
          <button type="button" class="btn-primary" (click)="applyFilters()">
            Apply
          </button>
          <button type="button" class="btn" (click)="clearFilters()">
            Clear
          </button>
        </div>
      </div>

      @if (loadingUsers()) {
        <div class="state">Loading users...</div>
      } @else {
        @if (usersFailed()) {
          <div class="state state--error">
            Users could not be loaded. Select Refresh users to try again.
          </div>
        } @else {
          @if (result(); as page) {
            <div class="summary">
              <span>
                {{ page.totalCount }} user{{ page.totalCount === 1 ? '' : 's' }}
              </span>

              <label>
                Rows
                <select [(ngModel)]="pageSize" (change)="changePageSize()">
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="20">20</option>
                  <option [ngValue]="50">50</option>
                </select>
              </label>
            </div>

            @if (page.items.length === 0) {
              <div class="state">No users match the selected filters.</div>
            } @else {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (user of page.items; track user.id) {
                      <tr>
                        <td>
                          <strong>{{ user.fullName }}</strong>
                          <small>User ID {{ user.id }}</small>
                        </td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.phone }}</td>
                        <td>
                          <span class="role role--{{ user.role.toLowerCase() }}">
                            {{ user.role }}
                          </span>
                        </td>
                        <td class="date">
                          {{ user.createdAt | date: 'dd MMM yyyy, HH:mm' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <div class="pager">
              <button
                type="button"
                class="btn"
                (click)="goToPage(page.page - 1)"
                [disabled]="page.page <= 1 || loadingUsers()"
              >
                Previous
              </button>

              <span>Page {{ page.page }} of {{ page.totalPages || 1 }}</span>

              <button
                type="button"
                class="btn"
                (click)="goToPage(page.page + 1)"
                [disabled]="page.page >= page.totalPages || loadingUsers()"
              >
                Next
              </button>
            </div>
          }
        }
      }
    </section>
  `,
  styles: [`
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }

    h1 {
      margin: 0 0 4px;
    }

    .page-head p,
    .section-head p {
      margin: 0;
      color: #90a4ae;
    }

    .card {
      margin-bottom: 18px;
    }

    .create-card {
      max-width: 900px;
    }

    .users-card {
      padding: 20px;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }

    h2 {
      margin: 0 0 3px;
      font-size: 1.1rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .filters {
      display: grid;
      grid-template-columns: minmax(250px, 2fr) minmax(150px, 1fr)
        minmax(150px, 1fr) auto;
      gap: 12px;
      align-items: end;
      margin-bottom: 18px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 12px;
    }

    .filters .field {
      margin-bottom: 0;
    }

    .field span {
      color: #455a64;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .field input,
    .field select,
    .summary select {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 1px solid #d0d5dd;
      border-radius: 8px;
      background: #ffffff;
      font: inherit;
    }

    .field input:focus,
    .field select:focus {
      outline: none;
      border-color: #e67e22;
      box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.15);
    }

    .field small {
      color: #c0392b;
      font-size: 0.75rem;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      padding-bottom: 12px;
    }

    .btn,
    .btn-primary {
      padding: 9px 14px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .btn {
      border: 1px solid #d0d5dd;
      background: #ffffff;
      color: #455a64;
    }

    .btn-primary {
      border: none;
      background: #e67e22;
      color: #ffffff;
    }

    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .state {
      padding: 28px;
      color: #90a4ae;
      text-align: center;
    }

    .state--error {
      border-radius: 8px;
      background: #fbe9e7;
      color: #c0392b;
    }

    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      color: #607d8b;
      font-size: 0.85rem;
    }

    .summary label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .summary select {
      width: auto;
      padding: 6px 9px;
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid #eceff1;
      border-radius: 10px;
    }

    table {
      width: 100%;
      min-width: 800px;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #eceff1;
      text-align: left;
      vertical-align: middle;
    }

    th {
      background: #fafbfc;
      color: #607d8b;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    td {
      color: #455a64;
      font-size: 0.86rem;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    td strong,
    td small {
      display: block;
    }

    td small {
      margin-top: 3px;
      color: #90a4ae;
      font-size: 0.75rem;
    }

    .date {
      white-space: nowrap;
    }

    .role {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .role--applicant {
      background: #e3f2fd;
      color: #1565c0;
    }

    .role--processor {
      background: #fff3e0;
      color: #d66d0d;
    }

    .role--underwriter {
      background: #ede7f6;
      color: #6a1b9a;
    }

    .role--admin {
      background: #e8f5e9;
      color: #1e7a1e;
    }

    .pager {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      color: #607d8b;
      font-size: 0.86rem;
    }

    @media (max-width: 900px) {
      .filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .field--search {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 700px) {
      .page-head,
      .section-head,
      .summary {
        align-items: stretch;
        flex-direction: column;
      }

      .form-grid,
      .filters {
        grid-template-columns: 1fr;
      }

      .field--search {
        grid-column: auto;
      }

      .filter-actions {
        padding-bottom: 0;
      }
    }
  `],
})
export class AdminUsersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly notificationService = inject(NotificationService);

  readonly assignableRoles: Role[] = ['Processor', 'Underwriter', 'Admin'];
  readonly creating = signal(false);
  readonly loadingUsers = signal(false);
  readonly usersFailed = signal(false);
  readonly result = signal<PagedResult<AdminUserListItem> | null>(null);

  search = '';
  role: Role | '' = '';
  desc = true;
  pageSize = 20;
  private page = 1;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['Processor' as Role, [Validators.required]],
  });

  constructor() {
    this.loadUsers();
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.warning('Please fix the highlighted fields.');
      return;
    }

    this.creating.set(true);
    const payload = this.form.getRawValue() as CreateStaffRequest;

    this.auth.createStaff(payload).subscribe({
      next: () => {
        this.creating.set(false);
        this.notificationService.success(
          `${payload.role} account created for ${payload.email}.`
        );
        this.form.reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'Processor',
        });
        this.page = 1;
        this.loadUsers();
      },
      error: () => {
        this.creating.set(false);
      },
    });
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.usersFailed.set(false);

    this.adminService
      .users({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search.trim() || undefined,
        role: this.role,
        desc: this.desc,
      })
      .subscribe({
        next: (page) => {
          this.result.set(page);
          this.loadingUsers.set(false);
        },
        error: () => {
          this.usersFailed.set(true);
          this.loadingUsers.set(false);
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadUsers();
  }

  clearFilters(): void {
    this.search = '';
    this.role = '';
    this.desc = true;
    this.page = 1;
    this.loadUsers();
  }

  changePageSize(): void {
    this.page = 1;
    this.loadUsers();
  }

  goToPage(page: number): void {
    const totalPages = this.result()?.totalPages ?? 0;

    if (page < 1 || page > totalPages) {
      return;
    }

    this.page = page;
    this.loadUsers();
  }
}
