import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicationListItem,
  ApplicationResponse,
  ApplicationUpsertRequest,
  DecideRequest,
  ReasonRequest,
  RequestDocumentsRequest,
  RunChecksResponse,
} from '../models/application.model';
import { ApplicationHistoryItem } from '../models/application-history.model';
import { PagedResult, WorkListQuery } from '../models/paged-result.model';

/**
 * Single gateway to every /api/applications and /api/worklists endpoint.
 * Components call these typed methods; the auth interceptor adds the JWT.
 */
@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api`;

  // ---- Applicant ----
  create(body: ApplicationUpsertRequest): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications`,
      body
    );
  }

  update(
    id: number,
    body: ApplicationUpsertRequest
  ): Observable<ApplicationResponse> {
    return this.http.put<ApplicationResponse>(
      `${this.base}/applications/${id}`,
      body
    );
  }

  getById(id: number): Observable<ApplicationResponse> {
    return this.http.get<ApplicationResponse>(
      `${this.base}/applications/${id}`
    );
  }

  history(id: number): Observable<ApplicationHistoryItem[]> {
    return this.http.get<ApplicationHistoryItem[]>(
      `${this.base}/applications/${id}/history`
    );
  }

  mine(): Observable<ApplicationListItem[]> {
    return this.http.get<ApplicationListItem[]>(
      `${this.base}/applications/mine`
    );
  }

  submit(id: number): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications/${id}/submit`,
      {}
    );
  }

  withdraw(id: number): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications/${id}/withdraw`,
      {}
    );
  }

  reupload(id: number): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications/${id}/reupload`,
      {}
    );
  }

  // ---- Processor ----
  pickup(id: number): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications/${id}/pickup`,
      {}
    );
  }

  requestDocuments(
    id: number,
    body: RequestDocumentsRequest
  ): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications/${id}/request-documents`,
      body
    );
  }

  refer(
    id: number,
    body: ReasonRequest = {}
  ): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications/${id}/refer`,
      body
    );
  }

  runChecks(id: number): Observable<RunChecksResponse> {
    return this.http.post<RunChecksResponse>(
      `${this.base}/applications/${id}/run-checks`,
      {}
    );
  }

  // ---- Underwriter ----
  decide(id: number, body: DecideRequest): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications/${id}/decide`,
      body
    );
  }

  sendBack(
    id: number,
    body: ReasonRequest = {}
  ): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.base}/applications/${id}/send-back`,
      body
    );
  }

  // ---- Work lists (paged) ----
  processorWorkList(
    q: WorkListQuery
  ): Observable<PagedResult<ApplicationListItem>> {
    return this.http.get<PagedResult<ApplicationListItem>>(
      `${this.base}/worklists/processor`,
      { params: this.toParams(q) }
    );
  }

  underwriterWorkList(
    q: WorkListQuery
  ): Observable<PagedResult<ApplicationListItem>> {
    return this.http.get<PagedResult<ApplicationListItem>>(
      `${this.base}/worklists/underwriter`,
      { params: this.toParams(q) }
    );
  }

  private toParams(q: WorkListQuery): HttpParams {
    let params = new HttpParams();

    if (q.page != null) params = params.set('page', q.page);
    if (q.pageSize != null) params = params.set('pageSize', q.pageSize);
    if (q.search) params = params.set('search', q.search);
    if (q.sortBy) params = params.set('sortBy', q.sortBy);
    if (q.desc != null) params = params.set('desc', q.desc);

    return params;
  }
}
