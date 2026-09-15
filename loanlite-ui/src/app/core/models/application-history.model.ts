import { Role } from './enums';

/** One immutable workflow event returned by GET /api/applications/{id}/history. */
export interface ApplicationHistoryItem {
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
