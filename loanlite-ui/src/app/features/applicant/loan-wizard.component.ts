import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApplicationUpsertRequest } from '../../core/models/application.model';
import { LOAN_MAX, LOAN_MIN, TENURES } from '../../core/models/enums';
import { ANNUAL_RATE, calculateEmi, formatInr } from '../../core/utils/emi.util';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/**
 * Multi-step Loan Application Wizard.
 *   Step 1 Employment · Step 2 Loan details (+ live EMI) · Step 3 Review & save
 * Save Draft -> POST /api/applications (or PUT if we already have an id).
 * "Save & Submit" saves the draft then calls /submit.
 */
@Component({
  selector: 'll-loan-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InrPipe],
  template: `
    <div class="wiz">
      <a routerLink="/app/dashboard" class="back">← Back to dashboard</a>
      <h1>{{ editingId() ? 'Edit application' : 'New loan application' }}</h1>

      <!-- Stepper -->
      <div class="steps">
        @for (s of stepLabels; track s; let i = $index) {
          <div class="step" [class.active]="step() === i + 1" [class.done]="step() > i + 1">
            <span class="step__n">{{ i + 1 }}</span>{{ s }}
          </div>
        }
      </div>

      <form [formGroup]="form" class="card">
        <!-- STEP 1: Employment -->
        @if (step() === 1) {
          <h2>Employment & income</h2>
          <label>Company name</label>
          <input formControlName="companyName" placeholder="Your employer" />

          <div class="row">
            <div>
              <label>Declared monthly income (₹)</label>
              <input type="number" formControlName="declaredIncome" placeholder="e.g. 85000" />
            </div>
            <div>
              <label>Last salary date</label>
              <input type="date" formControlName="lastSalaryDate" />
            </div>
          </div>
          <p class="hint">ⓘ Your declared income is compared against verified income during assessment.</p>
        }

        <!-- STEP 2: Loan details + EMI -->
        @if (step() === 2) {
          <h2>Loan details</h2>
          <label>Loan amount (₹{{ min | number }} – ₹{{ max | number }})</label>
          <input type="number" formControlName="loanAmount" [min]="min" [max]="max" placeholder="e.g. 500000" />

          <label>Tenure</label>
          <select formControlName="tenureMonths">
            <option [ngValue]="null" disabled>Select tenure</option>
            @for (t of tenures; track t) { <option [ngValue]="t">{{ t }} months</option> }
          </select>

          <!-- Live EMI preview -->
          <div class="emi">
            <div class="emi__row"><span>Interest rate (fixed)</span><b>{{ rate }}% p.a.</b></div>
            <div class="emi__row"><span>Monthly EMI</span><b class="emi__big">{{ emi() > 0 ? (emi() | inr) : '—' }}</b></div>
            <div class="emi__row"><span>Total payable</span><b>{{ emi() > 0 ? (totalPayable() | inr) : '—' }}</b></div>
            <div class="emi__row emi__muted"><span>Total interest</span><span>{{ emi() > 0 ? (totalInterest() | inr) : '—' }}</span></div>
          </div>
        }

        <!-- STEP 3: Review -->
        @if (step() === 3) {
          <h2>Review & confirm</h2>
          <div class="review">
            <div><span>Company</span><b>{{ form.value.companyName }}</b></div>
            <div><span>Declared income</span><b>{{ form.value.declaredIncome | inr }}</b></div>
            <div><span>Last salary date</span><b>{{ form.value.lastSalaryDate }}</b></div>
            <div><span>Loan amount</span><b>{{ form.value.loanAmount | inr }}</b></div>
            <div><span>Tenure</span><b>{{ form.value.tenureMonths }} months</b></div>
            <div><span>Monthly EMI</span><b>{{ emi() | inr }}</b></div>
          </div>
          <p class="hint">ⓘ Saving keeps this as a <b>Draft</b>. Submitting sends it to the processing queue.</p>
        }

        <!-- Nav buttons -->
        <div class="nav">
          <button type="button" class="btn-ghost" (click)="prev()" [disabled]="step() === 1">Back</button>
          <div class="nav__right">
            @if (step() < 3) {
              <button type="button" class="btn-primary" (click)="next()">Next</button>
            } @else {
              <button type="button" class="btn-ghost" (click)="save(false)" [disabled]="busy()">Save Draft</button>
              <button type="button" class="btn-primary" (click)="save(true)" [disabled]="busy()">
                {{ busy() ? 'Saving…' : 'Save & Submit' }}
              </button>
            }
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .wiz { max-width: 720px; }
    .back { color: #90a4ae; text-decoration: none; font-size: .85rem; }
    h1 { margin: 8px 0 16px; }
    h2 { margin: 0 0 16px; font-size: 1.15rem; }
    .steps { display: flex; gap: 8px; margin-bottom: 16px; }
    .step { flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; background: #fff; color: #90a4ae; font-size: .85rem; border: 1px solid #eceff1; }
    .step__n { width: 22px; height: 22px; border-radius: 50%; background: #eceff1; color: #90a4ae; display: grid; place-content: center; font-weight: 700; font-size: .78rem; }
    .step.active { border-color: #E67E22; color: #E67E22; font-weight: 600; }
    .step.active .step__n { background: #E67E22; color: #fff; }
    .step.done .step__n { background: #1e7a1e; color: #fff; }
    label { display: block; font-size: .82rem; color: #455a64; margin: 14px 0 4px; }
    input, select { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #d0d5dd; border-radius: 8px; font-size: .95rem; }
    input:focus, select:focus { outline: none; border-color: #E67E22; box-shadow: 0 0 0 3px rgba(230,126,34,.15); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .hint { margin-top: 14px; font-size: .82rem; color: #90a4ae; }
    .emi { margin-top: 18px; background: #fff8f1; border: 1px solid #ffe0c2; border-radius: 10px; padding: 14px 16px; }
    .emi__row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; font-size: .9rem; }
    .emi__big { font-size: 1.5rem; color: #E67E22; }
    .emi__muted { color: #90a4ae; font-size: .82rem; }
    .nav { display: flex; justify-content: space-between; margin-top: 24px; }
    .nav__right { display: flex; gap: 10px; }
    .btn-primary { background: #E67E22; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-ghost { background: #fff; border: 1px solid #d0d5dd; padding: 10px 18px; border-radius: 8px; cursor: pointer; }
    .btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
    .review { display: grid; gap: 10px; }
    .review > div { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eceff1; }
    .review span { color: #90a4ae; }
  `],
})
export class LoanWizardComponent {
  private fb = inject(FormBuilder);
  private appService = inject(ApplicationService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly min = LOAN_MIN;
  readonly max = LOAN_MAX;
  readonly rate = ANNUAL_RATE;
  readonly tenures = TENURES;
  readonly stepLabels = ['Employment', 'Loan details', 'Review'];

  step = signal(1);
  busy = signal(false);
  editingId = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    companyName: ['', [Validators.required]],
    declaredIncome: [null as number | null, [Validators.required, Validators.min(1)]],
    lastSalaryDate: ['', [Validators.required]],
    loanAmount: [null as number | null, [Validators.required, Validators.min(LOAN_MIN), Validators.max(LOAN_MAX)]],
    tenureMonths: [null as number | null, [Validators.required]],
  });

  // Live EMI — recomputed from the current form values.
  private amount = signal(0);
  private tenure = signal(0);
  emi = computed(() => calculateEmi(this.amount(), ANNUAL_RATE, this.tenure()));
  totalPayable = computed(() => this.emi() * this.tenure());
  totalInterest = computed(() => this.totalPayable() - this.amount());

  constructor() {
    // Keep EMI signals in sync with the reactive form.
    this.form.controls.loanAmount.valueChanges.subscribe((v) => this.amount.set(Number(v) || 0));
    this.form.controls.tenureMonths.valueChanges.subscribe((v) => this.tenure.set(Number(v) || 0));

    // Edit mode: /app/apply/:id loads an existing Draft.
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  private load(id: number): void {
    this.appService.getById(id).subscribe((a) => {
      this.editingId.set(a.id);
      this.form.patchValue({
        companyName: a.companyName,
        declaredIncome: a.declaredIncome,
        lastSalaryDate: a.lastSalaryDate?.substring(0, 10),
        loanAmount: a.loanAmount,
        tenureMonths: a.tenureMonths,
      });
    });
  }

  next(): void {
    // Validate only the current step's controls before advancing.
    const groups: Record<number, string[]> = {
      1: ['companyName', 'declaredIncome', 'lastSalaryDate'],
      2: ['loanAmount', 'tenureMonths'],
    };
    const controls = groups[this.step()] ?? [];
    let ok = true;
    for (const c of controls) {
      const ctrl = this.form.get(c);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) ok = false;
    }
    if (!ok) {
      this.notify.warning('Please complete the highlighted fields.');
      return;
    }
    this.step.update((s) => Math.min(3, s + 1));
  }

  prev(): void {
    this.step.update((s) => Math.max(1, s - 1));
  }

  save(thenSubmit: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Some fields are invalid.');
      return;
    }
    this.busy.set(true);
    const body = this.form.getRawValue() as unknown as ApplicationUpsertRequest;

    const id = this.editingId();
    const save$ = id ? this.appService.update(id, body) : this.appService.create(body);

    save$.subscribe({
      next: (app) => {
        if (thenSubmit) {
          this.appService.submit(app.id).subscribe({
            next: () => {
              this.notify.success(`Application ${app.applicationNumber} submitted!`);
              this.router.navigate(['/app/applications', app.id]);
            },
            error: () => this.busy.set(false),
          });
        } else {
          this.notify.success('Draft saved.');
          this.router.navigate(['/app/applications', app.id]);
        }
      },
      error: () => this.busy.set(false),
    });
  }
}
