import { Role } from './enums';

// POST /api/auth/login  body
export interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/register  body (always creates an Applicant)
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

// POST /api/auth/staff  body (Admin only)
export interface CreateStaffRequest extends RegisterRequest {
  role: Role;
}

// POST /api/auth/login  response
export interface AuthResponse {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  token: string;
  expiresAtUtc: string;
}

// GET /api/auth/me  response
export interface MeResponse {
  userId: number;
  name: string;
  role: Role;
}

// The signed-in user we keep in memory / localStorage.
export interface CurrentUser {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  token: string;
  expiresAtUtc: string;
}
