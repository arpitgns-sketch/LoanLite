import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentService } from '../../../core/services/document.service';
import { NotificationService } from '../../../core/services/notification.service';

import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  DOCUMENT_TYPE_LABELS,
  DocumentResponse,
  DocumentType,
  REQUIRED_DOCUMENT_TYPES,
  UPLOADABLE_DOCUMENT_TYPES,
  formatFileSize,
} from '../../../core/models/document.model';

@Component({
  selector: 'll-documents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="docs">
      <div class="docs__head">
        <div>
          <h2>Documents</h2>

          <p class="muted">
            @if (mode === 'applicant') {
              Upload your PAN card and latest salary slip.
            } @else if (mode === 'processor') {
              Review and verify the Applicant's supporting documents.
            } @else {
              Review the Applicant's supporting documents and verification
              results.
            }
          </p>
        </div>

        @if (documentService.isMockMode) {
          <span
            class="pill"
            title="Document files are currently stored in browser demo mode"
          >
            Local demo mode
          </span>
        }
      </div>

      <!-- Required-document checklist -->
      <div class="checklist">
        @for (type of requiredTypes; track type) {
          <div
            class="req"
            [class.req--ok]="statusOf(type) === 'Verified'"
            [class.req--pending]="statusOf(type) === 'Pending'"
            [class.req--bad]="
              statusOf(type) === 'Rejected' ||
              statusOf(type) === 'Missing'
            "
          >
            <span class="req__dot"></span>

            <span class="req__name">
              {{ label(type) }}
            </span>

            <span class="req__state">
              {{ statusOf(type) }}
            </span>
          </div>
        }
      </div>

      <!-- Applicant upload section -->
      @if (mode === 'applicant' && canUpload) {
        <div class="upload">
          <div class="upload__row">
            <label class="field">
              <span class="field__label">Document type</span>

              <select
                [value]="selectedType()"
                (change)="onTypeChange($event)"
                [disabled]="uploading()"
              >
                @for (type of uploadableTypes; track type) {
                  <option [value]="type">
                    {{ label(type) }}
                  </option>
                }
              </select>
            </label>

            <label class="field field--grow">
              <span class="field__label">File</span>

              <input
                #fileInput
                type="file"
                [accept]="acceptedExtensions"
                (change)="onFileChange($event)"
                [disabled]="uploading()"
              />
            </label>

            <button
              type="button"
              class="btn-primary"
              (click)="upload(fileInput)"
              [disabled]="uploading() || !chosenFile()"
            >
              {{ uploading() ? 'Uploading…' : 'Upload' }}
            </button>
          </div>

          @if (chosenFile(); as file) {
            <p class="chosen">
              Selected:
              <b>{{ file.name }}</b>
              ({{ size(file.size) }})
            </p>
          }

          <p class="hint">
            Accepted formats: PDF, JPG, JPEG or PNG. Maximum size: 5 MB.
          </p>
        </div>
      }

      <!-- Loading and document list -->
      @if (loading()) {
        <div class="state">
          Loading documents…
        </div>
      } @else {
        @if (documents().length === 0) {
          <div class="state">
            @if (mode === 'applicant') {
              No documents have been uploaded yet.
            } @else {
              The Applicant has not uploaded any documents yet.
            }
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>File</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                @for (doc of documents(); track doc.id) {
                  <tr>
                    <td>
                      {{ label(doc.documentType) }}
                    </td>

                    <td class="file">
                      {{ doc.fileName }}
                    </td>

                    <td>
                      {{ size(doc.sizeBytes) }}
                    </td>

                    <td>
                      {{ doc.uploadedAt | date: 'dd MMM yyyy, HH:mm' }}
                    </td>

                    <td>
                      <span
                        class="badge"
                        [class.badge--ok]="doc.status === 'Verified'"
                        [class.badge--bad]="doc.status === 'Rejected'"
                        [class.badge--wait]="doc.status === 'Pending'"
                      >
                        {{ doc.status }}
                      </span>

                      @if (doc.rejectionReason) {
                        <div class="reason">
                          {{ doc.rejectionReason }}
                        </div>
                      }
                    </td>

                    <td class="row-actions">
                      <!-- Available to Applicant, Processor and Underwriter -->
                      <button
                        type="button"
                        class="link link--view"
                        (click)="view(doc)"
                        [disabled]="busyId() === doc.id"
                      >
                        View
                      </button>

                      <!-- Only the Processor can verify or reject documents -->
                      @if (mode === 'processor') {
                        <button
                          type="button"
                          class="link link--ok"
                          (click)="verify(doc)"
                          [disabled]="
                            busyId() === doc.id ||
                            doc.status === 'Verified'
                          "
                        >
                          Verify
                        </button>

                        <button
                          type="button"
                          class="link link--bad"
                          (click)="reject(doc)"
                          [disabled]="busyId() === doc.id"
                        >
                          Reject
                        </button>
                      }

                      <!-- Only the Applicant can delete documents -->
                      @if (mode === 'applicant' && canUpload) {
                        <button
                          type="button"
                          class="link link--bad"
                          (click)="remove(doc)"
                          [disabled]="busyId() === doc.id"
                        >
                          Delete
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      @if (documentService.isMockMode) {
        <p class="note">
          ⓘ The backend document endpoints are not active. Document metadata
          is stored only in this browser, and uploaded file contents cannot be
          opened in Local Demo Mode.
        </p>
      } @else {
        <p class="note">
          ⓘ Documents are securely stored by the LoanLite API. Access to each
          file is controlled through authenticated document endpoints.
        </p>
      }
    </div>
  `,
  styles: [
    `
      .docs__head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 14px;
      }

      h2 {
        margin: 0 0 2px;
        font-size: 1.1rem;
      }

      .muted {
        margin: 0;
        color: #90a4ae;
        font-size: 0.86rem;
      }

      .pill {
        padding: 3px 10px;
        border-radius: 999px;
        background: #eceff1;
        color: #607d8b;
        font-size: 0.72rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .checklist {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }

      .req {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border: 1px solid #eceff1;
        border-radius: 999px;
        font-size: 0.85rem;
      }

      .req__dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #cfd8dc;
      }

      .req__state {
        color: #90a4ae;
        font-size: 0.78rem;
      }

      .req--ok {
        border-color: #c8e6c9;
        background: #f3faf3;
      }

      .req--ok .req__dot {
        background: #1e7a1e;
      }

      .req--pending {
        border-color: #ffe0b2;
        background: #fff8f1;
      }

      .req--pending .req__dot {
        background: #e67e22;
      }

      .req--bad {
        border-color: #ffcdd2;
        background: #fff8f8;
      }

      .req--bad .req__dot {
        background: #c0392b;
      }

      .upload {
        padding: 14px;
        border: 1px dashed #cfd8dc;
        border-radius: 10px;
        margin-bottom: 16px;
      }

      .upload__row {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        flex-wrap: wrap;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .field--grow {
        flex: 1;
        min-width: 220px;
      }

      .field__label {
        color: #455a64;
        font-size: 0.8rem;
      }

      .field select,
      .field input {
        padding: 9px 12px;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        font-size: 0.9rem;
      }

      .field select:focus,
      .field input:focus {
        outline: none;
        border-color: #e67e22;
        box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.15);
      }

      .btn-primary {
        padding: 10px 18px;
        border: none;
        border-radius: 8px;
        background: #e67e22;
        color: #ffffff;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .chosen {
        margin: 10px 0 0;
        font-size: 0.85rem;
      }

      .hint {
        margin: 8px 0 0;
        color: #90a4ae;
        font-size: 0.8rem;
      }

      .state {
        padding: 24px;
        color: #90a4ae;
        text-align: center;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .file {
        max-width: 240px;
        word-break: break-word;
      }

      .badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        background: #eceff1;
        color: #607d8b;
        font-size: 0.78rem;
        font-weight: 600;
      }

      .badge--ok {
        background: #e8f5e9;
        color: #1e7a1e;
      }

      .badge--bad {
        background: #fbe9e7;
        color: #c0392b;
      }

      .badge--wait {
        background: #fff3e0;
        color: #e67e22;
      }

      .reason {
        max-width: 220px;
        margin-top: 4px;
        color: #c0392b;
        font-size: 0.76rem;
        white-space: normal;
      }

      .row-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        white-space: nowrap;
      }

      .link {
        padding: 0;
        border: none;
        background: none;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
      }

      .link:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .link--view {
        color: #2f5496;
      }

      .link--ok {
        color: #1e7a1e;
      }

      .link--bad {
        color: #c0392b;
      }

      .note {
        margin: 14px 0 0;
        color: #90a4ae;
        font-size: 0.8rem;
      }

      @media (max-width: 800px) {
        .docs__head {
          flex-direction: column;
        }

        .upload__row {
          flex-direction: column;
          align-items: stretch;
        }

        .row-actions {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class DocumentsComponent implements OnInit {
  readonly documentService = inject(DocumentService);

  private readonly notificationService =
    inject(NotificationService);

  @Input({ required: true })
  applicationId!: number;

  @Input()
  mode: 'applicant' | 'processor' | 'underwriter' = 'applicant';

  @Input()
  canUpload = true;

  readonly requiredTypes = REQUIRED_DOCUMENT_TYPES;
  readonly uploadableTypes = UPLOADABLE_DOCUMENT_TYPES;
  readonly acceptedExtensions = ALLOWED_DOCUMENT_EXTENSIONS;

  readonly documents = signal<DocumentResponse[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly busyId = signal<number | null>(null);

  readonly selectedType = signal<DocumentType>('PanCard');
  readonly chosenFile = signal<File | null>(null);

  readonly allRequiredVerified = computed(() =>
    this.requiredTypes.every(
      (type) => this.statusOf(type) === 'Verified'
    )
  );

  ngOnInit(): void {
    this.load();
  }

  label(type: DocumentType): string {
    return DOCUMENT_TYPE_LABELS[type];
  }

  size(bytes: number): string {
    return formatFileSize(bytes);
  }

  statusOf(type: DocumentType): string {
    const matchingDocuments = this.documents().filter(
      (document) => document.documentType === type
    );

    if (matchingDocuments.length === 0) {
      return 'Missing';
    }

    if (
      matchingDocuments.some(
        (document) => document.status === 'Verified'
      )
    ) {
      return 'Verified';
    }

    if (
      matchingDocuments.some(
        (document) => document.status === 'Pending'
      )
    ) {
      return 'Pending';
    }

    return 'Rejected';
  }

  load(): void {
    this.loading.set(true);

    this.documentService.list(this.applicationId).subscribe({
      next: (documents) => {
        this.documents.set(documents);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;

    this.selectedType.set(target.value as DocumentType);
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;

    this.onFileSelected(target.files);
  }

  onFileSelected(files: FileList | null): void {
    const file = files?.item(0) ?? null;

    if (!file) {
      this.chosenFile.set(null);
      return;
    }

    const validationError =
      this.documentService.validate(file);

    if (validationError) {
      this.chosenFile.set(null);
      this.notificationService.error(validationError);
      return;
    }

    this.chosenFile.set(file);
  }

  upload(fileInput: HTMLInputElement): void {
    const file = this.chosenFile();

    if (!file) {
      return;
    }

    this.uploading.set(true);

    this.documentService
      .upload(
        this.applicationId,
        this.selectedType(),
        file
      )
      .subscribe({
        next: () => {
          this.uploading.set(false);
          this.chosenFile.set(null);
          fileInput.value = '';

          this.notificationService.success(
            'Document uploaded successfully.'
          );

          this.load();
        },
        error: (error: unknown) => {
          this.uploading.set(false);

          if (error instanceof Error) {
            this.notificationService.error(error.message);
          }
        },
      });
  }

  view(documentResponse: DocumentResponse): void {
    if (this.documentService.isMockMode) {
      this.notificationService.warning(
        'File contents are unavailable in Local Demo Mode.'
      );

      return;
    }

    this.busyId.set(documentResponse.id);

    this.documentService
      .download(
        this.applicationId,
        documentResponse.id
      )
      .subscribe({
        next: (blob) => {
          this.busyId.set(null);

          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');

          anchor.href = objectUrl;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.click();

          setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
          }, 60000);
        },
        error: () => {
          this.busyId.set(null);
        },
      });
  }

  verify(documentResponse: DocumentResponse): void {
    this.busyId.set(documentResponse.id);

    this.documentService
      .verify(
        this.applicationId,
        documentResponse.id,
        {
          status: 'Verified',
        }
      )
      .subscribe({
        next: () => {
          this.busyId.set(null);

          this.notificationService.success(
            `${this.label(
              documentResponse.documentType
            )} verified.`
          );

          this.load();
        },
        error: () => {
          this.busyId.set(null);
        },
      });
  }

  reject(documentResponse: DocumentResponse): void {
    const rejectionReason = prompt(
      `Why is the ${this.label(
        documentResponse.documentType
      )} being rejected?`,
      ''
    );

    if (rejectionReason === null) {
      return;
    }

    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      this.notificationService.warning(
        'A rejection reason is required.'
      );

      return;
    }

    this.busyId.set(documentResponse.id);

    this.documentService
      .verify(
        this.applicationId,
        documentResponse.id,
        {
          status: 'Rejected',
          rejectionReason: trimmedReason,
        }
      )
      .subscribe({
        next: () => {
          this.busyId.set(null);

          this.notificationService.success(
            'Document rejected successfully.'
          );

          this.load();
        },
        error: () => {
          this.busyId.set(null);
        },
      });
  }

  remove(documentResponse: DocumentResponse): void {
    const confirmed = confirm(
      `Delete ${documentResponse.fileName}?`
    );

    if (!confirmed) {
      return;
    }

    this.busyId.set(documentResponse.id);

    this.documentService
      .remove(
        this.applicationId,
        documentResponse.id
      )
      .subscribe({
        next: () => {
          this.busyId.set(null);

          this.notificationService.success(
            'Document deleted successfully.'
          );

          this.load();
        },
        error: () => {
          this.busyId.set(null);
        },
      });
  }
}