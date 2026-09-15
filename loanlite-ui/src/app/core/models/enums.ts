// The API sends and receives these as EXACT PascalCase strings
// (JsonStringEnumConverter on the backend). Never send numbers.

export type Role = 'Applicant' | 'Processor' | 'Underwriter' | 'Admin';

export const ROLES: Role[] = ['Applicant', 'Processor', 'Underwriter', 'Admin'];

// 7-state lifecycle (Draft/Submitted/InReview/WaitingForDocuments/Referred/Decided/Withdrawn)
export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'InReview'
  | 'WaitingForDocuments'
  | 'Referred'
  | 'Decided'
  | 'Withdrawn';

// Ordered lifecycle for the Status Timeline component (Withdrawn is a branch).
export const STATUS_FLOW: ApplicationStatus[] = [
  'Draft',
  'Submitted',
  'InReview',
  'WaitingForDocuments',
  'Referred',
  'Decided',
];

// Rule-engine output (recommendation only — never the final answer).
export type Recommendation = 'Approve' | 'Reject' | 'Refer';

// The human Underwriter's real decision.
export type Decision = 'Approve' | 'Reject';

// Allowed tenures in months (fixed 14% p.a., reducing-balance EMI).
export const TENURES = [12, 24, 36, 48, 60] as const;

export const LOAN_MIN = 50_000;
export const LOAN_MAX = 25_00_000;

// Human-readable labels for the PascalCase status strings.
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  InReview: 'In Review',
  WaitingForDocuments: 'Waiting for Docs',
  Referred: 'Referred',
  Decided: 'Decided',
  Withdrawn: 'Withdrawn',
};
