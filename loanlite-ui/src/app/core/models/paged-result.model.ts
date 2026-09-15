// Shape returned by the work-list endpoints.
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Query params for GET /api/worklists/processor|underwriter
export interface WorkListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'createdAt' | 'loanAmount' | 'status';
  desc?: boolean;
}

// Consistent API error body: { status, title, detail, errors }
export interface ApiError {
  status: number;
  title: string;
  detail?: string;
  errors?: Record<string, string[]>;
}
