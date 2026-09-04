export type AssignableRole = 'clinician' | 'prosthetist' | 'practice_administrator';

export const ASSIGNABLE_ROLES: readonly AssignableRole[] = [
  'clinician',
  'prosthetist',
  'practice_administrator',
];

export type SiteType = 'location' | 'department';

export const SITE_TYPES: readonly SiteType[] = ['location', 'department'];

export interface AdminUser {
  id: number;
  email: string;
  role: AssignableRole;
  isActive: boolean;
  practiceId: number | null;
  siteId: number | null;
  practiceName: string | null;
  siteName: string | null;
}

export interface AdminUserPage {
  items: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUserCreate {
  email: string;
  password: string;
  role: AssignableRole;
  siteId?: number | null;
}

export interface AdminUserUpdate {
  email?: string;
  role?: AssignableRole;
  siteId?: number | null;
  isActive?: boolean;
}

export interface AdminUserListParams {
  q?: string;
  role?: AssignableRole;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface Site {
  id: number;
  practiceId: number;
  name: string;
  type: SiteType;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteCreate {
  name: string;
  type: SiteType;
  address?: string | null;
}

export type SiteUpdate = Partial<SiteCreate>;

// --- audit trail (read-only) ----------------------------------------

export type AuditAction = 'read' | 'create' | 'update' | 'delete';

export const AUDIT_ACTIONS: readonly AuditAction[] = ['read', 'create', 'update', 'delete'];

export interface AuditEntry {
  id: number;
  actorId: number | null;
  /** null if the acting user has since been deleted */
  actorEmail: string | null;
  action: AuditAction;
  entityType: string;
  entityId: number | null;
  timestamp: string;
}

export interface AuditPage {
  items: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditActor {
  id: number;
  email: string;
}

export interface AuditFacets {
  entityTypes: string[];
  actors: AuditActor[];
}

export interface AuditListParams {
  actorId?: number;
  action?: AuditAction;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}
