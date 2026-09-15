import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { AuditLogItem } from '../../core/models/admin.model';
import { PagedResult } from '../../core/models/paged-result.model';

@Component({
  selector: 'll-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head">
      <div><h1>Audit log</h1><p>Real workflow activity recorded across LoanLite.</p></div>
      <button type="button" class="btn" (click)="load()" [disabled]="loading()">Refresh</button>
    </div>

    <section class="card filters">
      <label class="field field--search"><span>Search</span><input [(ngModel)]="search" (keyup.enter)="applyFilters()" placeholder="Application, action, user or email" /></label>
      <label class="field"><span>Action</span><select [(ngModel)]="action"><option value="">All actions</option>@for (value of actions; track value) {<option [value]="value">{{ actionLabel(value) }}</option>}</select></label>
      <label class="field"><span>Role</span><select [(ngModel)]="role"><option value="">All roles</option><option value="Applicant">Applicant</option><option value="Processor">Processor</option><option value="Underwriter">Underwriter</option><option value="Admin">Admin</option></select></label>
      <label class="field"><span>From</span><input type="date" [(ngModel)]="fromDate" /></label>
      <label class="field"><span>To</span><input type="date" [(ngModel)]="toDate" /></label>
      <label class="field"><span>Order</span><select [(ngModel)]="desc"><option [ngValue]="true">Newest first</option><option [ngValue]="false">Oldest first</option></select></label>
      <div class="filter-actions"><button type="button" class="btn-primary" (click)="applyFilters()">Apply</button><button type="button" class="btn" (click)="clearFilters()">Clear</button></div>
    </section>

    @if (loading()) { <div class="card state">Loading audit records...</div> }
    @else {
      @if (failed()) { <div class="card state state--error">Audit records could not be loaded. Select Refresh to try again.</div> }
      @else {
        @if (result(); as page) {
          <div class="summary"><span>{{ page.totalCount }} record{{ page.totalCount === 1 ? '' : 's' }}</span><label>Rows <select [(ngModel)]="pageSize" (change)="changePageSize()"><option [ngValue]="10">10</option><option [ngValue]="20">20</option><option [ngValue]="50">50</option></select></label></div>
          @if (page.items.length === 0) { <div class="card state">No audit records match the selected filters.</div> }
          @else {
            <div class="card table-wrap"><table><thead><tr><th>Application</th><th>Action</th><th>Details</th><th>Performed by</th><th>Role</th><th>Date and time</th></tr></thead><tbody>
              @for (item of page.items; track item.id) {<tr><td><strong>{{ item.applicationNumber }}</strong><small>Application ID {{ item.applicationId }}</small></td><td><span class="action">{{ actionLabel(item.action) }}</span></td><td class="details">{{ item.details }}</td><td><strong>{{ item.performedByName }}</strong><small>{{ item.performedByEmail }}</small></td><td><span class="role role--{{ item.performedByRole.toLowerCase() }}">{{ item.performedByRole }}</span></td><td class="date">{{ item.createdAt | date:'dd MMM yyyy, HH:mm' }}</td></tr>}
            </tbody></table></div>
          }
          <div class="pager"><button class="btn" (click)="goToPage(page.page - 1)" [disabled]="page.page <= 1 || loading()">Previous</button><span>Page {{ page.page }} of {{ page.totalPages || 1 }}</span><button class="btn" (click)="goToPage(page.page + 1)" [disabled]="page.page >= page.totalPages || loading()">Next</button></div>
        }
      }
    }
  `,
  styles: [`
    .page-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px}h1{margin:0 0 4px}.page-head p{margin:0;color:#90a4ae}.filters{display:grid;grid-template-columns:2fr repeat(5,minmax(130px,1fr));gap:12px;align-items:end;margin-bottom:16px}.field{display:flex;flex-direction:column;gap:5px}.field span{color:#607d8b;font-size:.78rem;font-weight:600}.field input,.field select,.summary select{padding:9px 10px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;font:inherit}.filter-actions{display:flex;gap:8px;grid-column:1/-1}.btn,.btn-primary{padding:8px 14px;border-radius:7px;cursor:pointer;font-weight:600}.btn{border:1px solid #d0d5dd;background:#fff;color:#455a64}.btn-primary{border:0;background:#e67e22;color:#fff}.btn:disabled{opacity:.5;cursor:not-allowed}.summary{display:flex;justify-content:space-between;align-items:center;margin:0 2px 10px;color:#607d8b;font-size:.85rem}.summary label{display:flex;align-items:center;gap:8px}.table-wrap{padding:0;overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:1050px}th,td{padding:12px 14px;border-bottom:1px solid #eceff1;text-align:left;vertical-align:top}th{background:#fafbfc;color:#607d8b;font-size:.76rem;text-transform:uppercase;letter-spacing:.03em}td{color:#455a64;font-size:.86rem}td strong,td small{display:block}td small{margin-top:3px;color:#90a4ae;font-size:.75rem}.details{min-width:280px;max-width:430px;line-height:1.45;overflow-wrap:anywhere}.date{white-space:nowrap}.action,.role{display:inline-block;padding:3px 9px;border-radius:999px;font-size:.75rem;font-weight:600}.action{background:#fff3e0;color:#d66d0d}.role--applicant{background:#e3f2fd;color:#1565c0}.role--processor{background:#fff3e0;color:#d66d0d}.role--underwriter{background:#ede7f6;color:#6a1b9a}.role--admin{background:#e8f5e9;color:#1e7a1e}.state{padding:32px;text-align:center;color:#90a4ae}.state--error{background:#fbe9e7;color:#c0392b}.pager{display:flex;justify-content:center;align-items:center;gap:16px;margin-top:16px;color:#607d8b;font-size:.86rem}@media(max-width:1200px){.filters{grid-template-columns:repeat(3,1fr)}.field--search{grid-column:span 2}}@media(max-width:700px){.page-head{flex-direction:column}.filters{grid-template-columns:1fr}.field--search{grid-column:auto}.summary{align-items:flex-start;gap:10px;flex-direction:column}}
  `]
})
export class AdminAuditComponent {
  private readonly adminService = inject(AdminService);
  readonly result = signal<PagedResult<AuditLogItem> | null>(null);
  readonly loading = signal(false);
  readonly failed = signal(false);
  search = ''; action = ''; role = ''; fromDate = ''; toDate = ''; desc = true; pageSize = 20; private page = 1;
  readonly actions = ['Created','Submitted','PickedUp','RanChecks','RequestedDocuments','Re-uploaded documents','Referred','SentBack','Decided:Approve','Decided:Reject','Withdrawn'];
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.failed.set(false); this.adminService.auditLog({page:this.page,pageSize:this.pageSize,search:this.search.trim()||undefined,action:this.action||undefined,role:this.role as any,fromDate:this.fromDate||undefined,toDate:this.toDate||undefined,desc:this.desc}).subscribe({next:r=>{this.result.set(r);this.loading.set(false)},error:()=>{this.failed.set(true);this.loading.set(false)}}); }
  applyFilters(): void { this.page=1; this.load(); }
  clearFilters(): void { this.search='';this.action='';this.role='';this.fromDate='';this.toDate='';this.desc=true;this.page=1;this.load(); }
  changePageSize(): void { this.page=1;this.load(); }
  goToPage(page:number): void { const total=this.result()?.totalPages??0;if(page<1||page>total)return;this.page=page;this.load(); }
  actionLabel(value:string): string { const labels:Record<string,string>={Created:'Application created',Submitted:'Application submitted',PickedUp:'Picked up',RanChecks:'Checks run',RequestedDocuments:'Documents requested','Re-uploaded documents':'Documents ready',Referred:'Referred',SentBack:'Sent back','Decided:Approve':'Approved','Decided:Reject':'Rejected',Withdrawn:'Withdrawn'};return labels[value]??value; }
}
