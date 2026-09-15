import { Role } from './enums';

export interface AuditLogItem {
  id: number;
  applicationId: number;
  applicationNumber: string;
  action: string;
  details: string;
  performedByUserId: number;
  performedByName: string;
  performedByEmail: string;
  performedByRole: Role;
  createdAt: string;
}

export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: string;
  role?: Role | '';
  fromDate?: string;
  toDate?: string;
  desc?: boolean;
}

export interface AdminUserListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
}

export interface AdminUserQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role | '';
  desc?: boolean;
}

export interface AdminDashboardResponse {
  totalUsers: number;
  applicants: number;
  processors: number;
  underwriters: number;
  admins: number;

  totalApplications: number;
  draft: number;
  submitted: number;
  inReview: number;
  waitingForDocuments: number;
  referred: number;
  decided: number;
  withdrawn: number;

  totalAuditRecords: number;
}
