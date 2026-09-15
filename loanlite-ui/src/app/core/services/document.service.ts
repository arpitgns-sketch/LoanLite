import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DocumentResponse,
  DocumentType,
  MAX_DOCUMENT_BYTES,
  VerifyDocumentRequest,
} from '../models/document.model';

const MOCK_STORAGE_KEY = 'loanlite.mockDocuments';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api`;
  readonly isMockMode = !environment.documentsApiReady;

  list(applicationId: number): Observable<DocumentResponse[]> {
    if (this.isMockMode) return of(this.readMock(applicationId)).pipe(delay(150));
    return this.http.get<DocumentResponse[]>(`${this.base}/applications/${applicationId}/documents`);
  }

  upload(applicationId: number, documentType: DocumentType, file: File): Observable<DocumentResponse> {
    const error = this.validate(file);
    if (error) return throwError(() => new Error(error));
    if (this.isMockMode) return of(this.createMock(applicationId, documentType, file)).pipe(delay(350));

    const form = new FormData();
    form.append('documentType', documentType);
    form.append('file', file, file.name);
    return this.http.post<DocumentResponse>(`${this.base}/applications/${applicationId}/documents`, form);
  }

  download(applicationId: number, documentId: number): Observable<Blob> {
    return this.http.get(
      `${this.base}/applications/${applicationId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
  }

  verify(applicationId: number, documentId: number, body: VerifyDocumentRequest): Observable<DocumentResponse> {
    if (this.isMockMode) return of(this.updateMock(applicationId, documentId, {
      status: body.status,
      rejectionReason: body.rejectionReason ?? null,
    })).pipe(delay(200));
    return this.http.post<DocumentResponse>(`${this.base}/applications/${applicationId}/documents/${documentId}/verify`, body);
  }

  remove(applicationId: number, documentId: number): Observable<void> {
    if (this.isMockMode) {
      const all = this.readAllMock();
      all[String(applicationId)] = (all[String(applicationId)] ?? []).filter(d => d.id !== documentId);
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(all));
      return of(void 0);
    }
    return this.http.delete<void>(`${this.base}/applications/${applicationId}/documents/${documentId}`);
  }

  validate(file: File): string | null {
    if (!file) return 'Please choose a file.';
    if (file.size <= 0) return 'That file is empty.';
    if (file.size > MAX_DOCUMENT_BYTES) return 'File is too large. Maximum size is 5 MB.';
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type)) return 'Upload a PDF, JPG or PNG.';
    return null;
  }

  private readAllMock(): Record<string, DocumentResponse[]> {
    try { return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) ?? '{}'); } catch { return {}; }
  }
  private readMock(id: number): DocumentResponse[] { return this.readAllMock()[String(id)] ?? []; }
  private createMock(applicationId: number, documentType: DocumentType, file: File): DocumentResponse {
    const all=this.readAllMock(); const key=String(applicationId);
    const doc: DocumentResponse={id:Date.now(),applicationId,documentType,fileName:file.name,contentType:file.type,sizeBytes:file.size,status:'Pending',uploadedAt:new Date().toISOString(),verifiedAt:null,verifiedByName:null,rejectionReason:null};
    all[key]=[...(all[key]??[]),doc]; localStorage.setItem(MOCK_STORAGE_KEY,JSON.stringify(all)); return doc;
  }
  private updateMock(applicationId:number,documentId:number,patch:Partial<DocumentResponse>):DocumentResponse{
    const all=this.readAllMock(),key=String(applicationId); all[key]=(all[key]??[]).map(d=>d.id===documentId?{...d,...patch}:d); localStorage.setItem(MOCK_STORAGE_KEY,JSON.stringify(all));
    const found=all[key].find(d=>d.id===documentId); if(!found) throw new Error('Document not found.'); return found;
  }
}
