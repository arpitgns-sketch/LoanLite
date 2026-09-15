import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApplicationResponse } from '../../core/models/application.model';
import { ANNUAL_RATE, calculateEmi } from '../../core/utils/emi.util';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { StatusTimelineComponent } from '../../shared/components/status-timeline/status-timeline.component';
import { DocumentsComponent } from '../../shared/components/documents/documents.component';
import { ApplicationHistoryComponent } from '../../shared/components/application-history/application-history.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'll-application-status', standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, StatusTimelineComponent, DocumentsComponent, ApplicationHistoryComponent, InrPipe],
  template: `
    <a routerLink="/app/applications" class="back">← My applications</a>
    @if (loading()) { <div class="card">Loading…</div> } @else {
      @if (app(); as application) {
        <div class="head"><div><h1>{{ application.applicationNumber }}</h1><ll-status-badge [status]="application.status" /></div>
          <div class="actions">
            @if (application.status === 'Draft') { <a [routerLink]="['/app/apply', application.id]" class="btn-ghost">Edit</a><button class="btn-primary" (click)="submit(application.id)" [disabled]="busy()">Submit</button> }
            @if (application.status === 'WaitingForDocuments') { <button class="btn-primary" (click)="reupload(application.id)" [disabled]="busy()">Mark documents ready</button> }
            @if (canWithdraw(application.status)) { <button class="btn-danger" (click)="withdraw(application.id)" [disabled]="busy()">Withdraw</button> }
          </div>
        </div>
        @if (application.status === 'WaitingForDocuments') { <div class="card banner">📄 A processor has asked for documents. Upload what is missing below, then choose <b>Mark documents ready</b> to send the file back for review.</div> }
        <div class="card"><h2>Progress</h2><ll-status-timeline [current]="application.status" /></div>
        <div class="grid">
          <div class="card"><h2>Loan details</h2><div class="kv"><span>Amount</span><b>{{ application.loanAmount | inr }}</b></div><div class="kv"><span>Tenure</span><b>{{ application.tenureMonths }} months</b></div><div class="kv"><span>Interest</span><b>{{ rate }}% p.a. fixed</b></div><div class="kv"><span>Estimated EMI</span><b>{{ emi(application) | inr }}</b></div></div>
          <div class="card"><h2>Employment</h2><div class="kv"><span>Company</span><b>{{ application.companyName }}</b></div><div class="kv"><span>Declared income</span><b>{{ application.declaredIncome | inr }}</b></div><div class="kv"><span>Last salary date</span><b>{{ application.lastSalaryDate | date: 'dd MMM yyyy' }}</b></div><div class="kv"><span>Created</span><b>{{ application.createdAt | date: 'dd MMM yyyy, HH:mm' }}</b></div></div>
        </div>
        <div class="card"><ll-documents [applicationId]="application.id" mode="applicant" [canUpload]="canUpload(application.status)" /></div>
        @if (application.recommendation) { <div class="card"><h2>System recommendation</h2><ll-status-badge [recommendation]="application.recommendation" />@if (application.recommendationReason) { <p class="reason">{{ application.recommendationReason }}</p> }<p class="note">ⓘ This is the system recommendation only. An Underwriter makes the final decision.</p></div> }
        @if (application.status === 'Decided' && application.decision) { <div class="card decision" [class.decision--approve]="application.decision === 'Approve'" [class.decision--reject]="application.decision === 'Reject'"><h2>Final decision</h2><div class="decision__value">{{ application.decision === 'Approve' ? 'Approved' : 'Rejected' }}</div></div> }
        <ll-application-history #history [applicationId]="application.id" />
      } @else { <div class="card empty-state">Application details could not be loaded.</div> }
    }`,
  styles: [`
    .back{color:#90a4ae;text-decoration:none;font-size:.85rem}.head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin:10px 0 20px}h1{margin:0 0 8px}h2{margin:0 0 14px;font-size:1.1rem}.card{margin-bottom:16px}.actions{display:flex;flex-wrap:wrap;gap:10px}.btn-primary,.btn-ghost,.btn-danger{padding:9px 16px;border-radius:8px;cursor:pointer}.btn-primary{border:none;background:#e67e22;color:#fff;font-weight:600}.btn-ghost{border:1px solid #d0d5dd;background:#fff;color:#263238;text-decoration:none}.btn-danger{border:1px solid #e0b4ae;background:#fff;color:#c0392b}button:disabled{opacity:.6;cursor:not-allowed}.banner{border-left:4px solid #e67e22;background:#fff8f1;color:#a15c00}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.kv{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid #eceff1}.kv span{color:#90a4ae}.kv b{text-align:right}.reason{margin:12px 0 6px;padding:10px 12px;border:1px solid #ffe0c2;border-radius:8px;background:#fff8f1}.note{margin:6px 0 0;color:#90a4ae;font-size:.82rem}.decision__value{font-size:1.4rem;font-weight:700}.decision--approve{border-left:4px solid #1e7a1e}.decision--reject{border-left:4px solid #c0392b}.empty-state{padding:32px;color:#90a4ae;text-align:center}@media(max-width:800px){.head{flex-direction:column}.grid{grid-template-columns:1fr}}
  `]
})
export class ApplicationStatusComponent {
  private readonly applicationService=inject(ApplicationService); private readonly notificationService=inject(NotificationService); private readonly route=inject(ActivatedRoute);
  @ViewChild('history') private history?: ApplicationHistoryComponent;
  readonly rate=ANNUAL_RATE; readonly app=signal<ApplicationResponse|null>(null); readonly loading=signal(true); readonly busy=signal(false);
  constructor(){const id=Number(this.route.snapshot.paramMap.get('id'));if(!Number.isFinite(id)||id<=0){this.loading.set(false);this.notificationService.error('Invalid application ID.');return;}this.fetchApplication(id)}
  private fetchApplication(id:number){this.loading.set(true);this.applicationService.getById(id).subscribe({next:a=>{this.app.set(a);this.loading.set(false)},error:()=>this.loading.set(false)})}
  private changed(a:ApplicationResponse,message:string){this.app.set(a);this.busy.set(false);this.notificationService.success(message);setTimeout(()=>this.history?.load())}
  emi(a:ApplicationResponse){return calculateEmi(a.loanAmount,ANNUAL_RATE,a.tenureMonths)} canWithdraw(s:string){return !['Decided','Withdrawn'].includes(s)} canUpload(s:string){return !['Decided','Withdrawn'].includes(s)}
  submit(id:number){this.busy.set(true);this.applicationService.submit(id).subscribe({next:a=>this.changed(a,'Application submitted successfully.'),error:()=>this.busy.set(false)})}
  reupload(id:number){this.busy.set(true);this.applicationService.reupload(id).subscribe({next:a=>this.changed(a,'Application returned to review.'),error:()=>this.busy.set(false)})}
  withdraw(id:number){if(!confirm('Withdraw this application? This action cannot be undone.'))return;this.busy.set(true);this.applicationService.withdraw(id).subscribe({next:a=>this.changed(a,'Application withdrawn successfully.'),error:()=>this.busy.set(false)})}
}
