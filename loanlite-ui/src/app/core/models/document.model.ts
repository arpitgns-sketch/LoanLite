/**
 * Document contract for LoanLite.
 *
 * These types define the agreed shape between the Angular UI and the
 * (still planned) backend document endpoints. When the API is built it should
 * return exactly these field names so the frontend needs no changes.
 */

/** The document kinds LoanLite requires for a personal loan application. */
export type DocumentType = 'PanCard' | 'SalarySlip';

/** Verification state set by a Processor. */
export type DocumentStatus = 'Pending' | 'Verified' | 'Rejected';

/** A single stored document as returned by GET .../documents. */
export interface DocumentResponse {
  id: number;
  applicationId: number;
  documentType: DocumentType;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: DocumentStatus;
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedByName: string | null;
  rejectionReason: string | null;
}

/** Body for POST .../documents/{docId}/verify */
export interface VerifyDocumentRequest {
  status: Extract<DocumentStatus, 'Verified' | 'Rejected'>;
  rejectionReason?: string;
}

/** Human-readable labels for each document type. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PanCard: 'PAN Card',
  SalarySlip: 'Salary Slip'
};

/** Documents an applicant must supply before a file can progress. */
export const REQUIRED_DOCUMENT_TYPES: DocumentType[] = [
  'PanCard',
  'SalarySlip',
];

/** All types the applicant may choose when uploading. */
export const UPLOADABLE_DOCUMENT_TYPES: DocumentType[] = [
  'PanCard',
  'SalarySlip'
];

/** Upload constraints enforced client-side before hitting the API. */
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

export const ALLOWED_DOCUMENT_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';

/** Formats a byte count for display, e.g. 245 KB. */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) {
    return '0 KB';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
