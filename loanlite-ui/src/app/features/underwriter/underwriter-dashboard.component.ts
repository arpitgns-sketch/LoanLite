import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationListItem } from '../../core/models/application.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'll-underwriter-dashboard', standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, InrPipe],
  template: `
    <div class="head"><div><h1>Welcome back, {{ firstName() }}</h1><p class="muted">Applications awaiting an underwriting decision.</p></div><a routerLink="/underwriter/worklist" class="btn-primary">Open work list</a></div>
    @if (loading()) { <div class="card">Loading queue…</div> } @else {
      <div class="stats">
        <div class="stat"><b>{{ items().length }}</b><span>Total pending</span></div>
        <div class="stat"><b>{{ statusCount('Referred') }}</b><span>Referred</span></div>
        <div class="stat"><b>{{ statusCount('InReview') }}</b><span>In review</span></div>
        <div class="stat ok"><b>{{ recommendationCount('Approve') }}</b><span>Approve recommendations</span></div>
        <div class="stat no"><b>{{ recommendationCount('Reject') }}</b><span>Reject recommendations</span></div>
      </div>
      <div class="card"><div class="card-head"><h2>Recent applications</h2><a routerLink="/underwriter/worklist">View all →</a></div>
        @if (recent().length === 0) { <div class="empty">No applications are awaiting a decision.</div> } @else {
          <table class="data-table"><thead><tr><th>App #</th><th>Applicant</th><th>Amount</th><th>Status</th><th>Recommendation</th><th></th></tr></thead><tbody>
          @for (item of recent(); track item.id) { <tr><td>{{ item.applicationNumber }}</td><td>{{ item.applicantName || '—' }}</td><td>{{ item.loanAmount | inr }}</td><td><ll-status-badge [status]="item.status" /></td><td><ll-status-badge [recommendation]="item.recommendation" /></td><td><a [routerLink]="['/underwriter/applications', item.id]">Open</a></td></tr> }
          </tbody></table>
        }
      </div>
    }
  `,
  styles: [`
    .head,.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px} h1,h2{margin:0}.muted{color:#90a4ae;margin:4px 0 0}.btn-primary{background:#e67e22;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px}.stat{background:#fff;border-radius:12px;padding:18px;display:flex;flex-direction:column}.stat b{font-size:1.7rem}.stat span{color:#90a4ae;font-size:.8rem}.ok b{color:#1e7a1e}.no b{color:#c0392b}.card-head h2{font-size:1.1rem}.card-head a,.data-table a{color:#e67e22;text-decoration:none;font-weight:600}.empty{text-align:center;color:#90a4ae;padding:28px}@media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}}
  `]
})
export class UnderwriterDashboardComponent {
  private readonly service=inject(ApplicationService); private readonly auth=inject(AuthService);
  readonly items=signal<ApplicationListItem[]>([]); readonly loading=signal(true);
  readonly firstName=computed(()=>this.auth.currentUser()?.fullName?.split(' ')[0]??'there');
  readonly recent=computed(()=>this.items().slice(0,5));
  constructor(){this.service.underwriterWorkList({page:1,pageSize:50,sortBy:'createdAt',desc:true}).subscribe({next:p=>{this.items.set(p.items);this.loading.set(false)},error:()=>this.loading.set(false)});}
  statusCount(status:string){return this.items().filter(x=>x.status===status).length;}
  recommendationCount(value:string){return this.items().filter(x=>x.recommendation===value).length;}
}
