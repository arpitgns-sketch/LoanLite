import { ApplicationStatus, Decision, Recommendation } from './enums';

// POST /api/applications  &  PUT /api/applications/{id}  body
export interface ApplicationUpsertRequest {
  loanAmount: number;
  tenureMonths: number;
  companyName: string;
  lastSalaryDate: string; // ISO date
  declaredIncome: number;
}

// Full detail — GET /api/applications/{id}
export interface ApplicationResponse {
  id: number;
  applicationNumber: string;
  status: ApplicationStatus;
  loanAmount: number;
  tenureMonths: number;
  companyName: string;
  lastSalaryDate: string;
  declaredIncome: number;
  recommendation: Recommendation | null;
  recommendationReason: string | null;
  decision: Decision | null;
  applicantId: number;
  applicantName: string;
  processorId: number | null;
  underwriterId: number | null;
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string | null;
}

// Compact row — worklists & "mine" lists
export interface ApplicationListItem {
  id: number;
  applicationNumber: string;
  status: ApplicationStatus;
  loanAmount: number;
  tenureMonths: number;
  applicantName: string;
  recommendation: Recommendation | null;
  createdAt: string;
  submittedAt: string | null;
}

// POST /api/applications/{id}/run-checks  response (Phase 5)
export interface RunChecksResponse {
  id: number;
  applicationNumber: string;
  status: ApplicationStatus;
  loanAmount: number;
  tenureMonths: number;
  annualInterestRatePercent: number;
  declaredIncome: number;
  creditScore: number;
  verifiedIncome: number;
  incomeMatchPercent: number;
  emi: number;
  foir: number;
  recommendation: Recommendation;
  recommendationReason: string;
}

// Reason/comment/decision payloads for lifecycle actions.
export interface ReasonRequest {
  reason?: string;
}
export interface RequestDocumentsRequest {
  reason: string;
}
export interface DecideRequest {
  decision: Decision;
  comments?: string;
}
