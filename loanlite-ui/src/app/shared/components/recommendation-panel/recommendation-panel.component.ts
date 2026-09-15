import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RunChecksResponse } from '../../../core/models/application.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { InrPipe } from '../../pipes/inr.pipe';

/**
 * System Recommendation Panel (plan v2, section 4.2).
 * Read-only on Processor Review after checks run; also used by the Underwriter
 * Decision screen. Surfaces the rule-engine output so a human can decide.
 *
 *   <ll-recommendation-panel [checks]="checks()" />
 */
@Component({
  selector: 'll-recommendation-panel',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, InrPipe],
  template: `
    @if (checks; as c) {
      <div class="rp">
        <div class="rp__head">
          <h2>System recommendation</h2>
          <ll-status-badge [recommendation]="c.recommendation" />
        </div>

        @if (c.recommendationReason) {
          <p class="rp__reason">{{ c.recommendationReason }}</p>
        }

        <div class="rp__grid">
          <div class="m">
            <span class="m__l">Credit score</span>
            <b class="m__v">{{ c.creditScore }}</b>
            <span class="m__s">range 300–900</span>
          </div>
          <div class="m">
            <span class="m__l">Monthly EMI</span>
            <b class="m__v">{{ c.emi | inr }}</b>
            <span class="m__s">{{ c.annualInterestRatePercent }}% p.a. · {{ c.tenureMonths }} mo</span>
          </div>
          <div class="m">
            <span class="m__l">FOIR</span>
            <b class="m__v">{{ c.foir | number: '1.0-1' }}%</b>
            <span class="m__s">EMI to income ratio</span>
          </div>
          <div class="m">
            <span class="m__l">Income match</span>
            <b class="m__v">{{ c.incomeMatchPercent | number: '1.0-1' }}%</b>
            <span class="m__s">verified vs declared</span>
          </div>
        </div>

        <div class="rp__income">
          <div class="kv">
            <span>Declared income</span>
            <b>{{ c.declaredIncome | inr }}</b>
          </div>
          <div class="kv">
            <span>Verified income</span>
            <b>{{ c.verifiedIncome | inr }}</b>
          </div>
        </div>

        <p class="rp__note">
          ⓘ This is the system's suggestion only. Only an Underwriter can make
          the final decision.
        </p>
      </div>
    }
  `,
  styles: [
    `
      .rp__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      h2 {
        margin: 0;
        font-size: 1.1rem;
      }

      .rp__reason {
        margin: 0 0 16px;
        padding: 10px 12px;
        border: 1px solid #ffe0c2;
        border-radius: 8px;
        background: #fff8f1;
        font-size: 0.9rem;
      }

      .rp__grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .m {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 12px;
        border: 1px solid #eceff1;
        border-radius: 10px;
      }

      .m__l {
        color: #90a4ae;
        font-size: 0.78rem;
      }

      .m__v {
        font-size: 1.25rem;
      }

      .m__s {
        color: #b0bec5;
        font-size: 0.72rem;
      }

      .rp__income {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 24px;
        margin-top: 14px;
      }

      .kv {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 0;
        border-bottom: 1px solid #eceff1;
      }

      .kv span {
        color: #90a4ae;
      }

      .rp__note {
        margin: 12px 0 0;
        color: #90a4ae;
        font-size: 0.82rem;
      }

      @media (max-width: 900px) {
        .rp__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .rp__income {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RecommendationPanelComponent {
  @Input({ required: true }) checks!: RunChecksResponse | null;
}
