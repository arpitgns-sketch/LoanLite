import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminDashboardResponse,
  AdminUserListItem,
  AdminUserQuery,
  AuditLogItem,
  AuditLogQuery,
} from '../models/admin.model';
import { PagedResult } from '../models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin`;

  auditLog(query: AuditLogQuery): Observable<PagedResult<AuditLogItem>> {
    let params = new HttpParams();

    if (query.page != null) params = params.set('page', query.page);
    if (query.pageSize != null) params = params.set('pageSize', query.pageSize);
    if (query.search) params = params.set('search', query.search);
    if (query.action) params = params.set('action', query.action);
    if (query.role) params = params.set('role', query.role);
    if (query.fromDate) {
      params = params.set('fromDate', `${query.fromDate}T00:00:00Z`);
    }
    if (query.toDate) {
      params = params.set('toDate', `${query.toDate}T23:59:59.999Z`);
    }
    if (query.desc != null) params = params.set('desc', query.desc);

    return this.http.get<PagedResult<AuditLogItem>>(
      `${this.base}/audit`,
      { params }
    );
  }

  users(query: AdminUserQuery): Observable<PagedResult<AdminUserListItem>> {
    let params = new HttpParams();

    if (query.page != null) params = params.set('page', query.page);
    if (query.pageSize != null) params = params.set('pageSize', query.pageSize);
    if (query.search) params = params.set('search', query.search);
    if (query.role) params = params.set('role', query.role);
    if (query.desc != null) params = params.set('desc', query.desc);

    return this.http.get<PagedResult<AdminUserListItem>>(
      `${this.base}/users`,
      { params }
    );
  }

  dashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${this.base}/dashboard`);
  }
}
