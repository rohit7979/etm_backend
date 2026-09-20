import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE';
export type Status = 'PENDING_INVITE' | 'ACTIVE' | 'DEACTIVATED' | 'active' | 'inactive';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
  companyId?: string;
}
