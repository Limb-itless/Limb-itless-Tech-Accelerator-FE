export type AssignmentRole = 'clinician' | 'prosthetist';

/** A clinician or prosthetist assigned to a patient over a time window.
 * A current assignment has `endDate === null`; ending one sets the date
 * rather than deleting the row. */
export interface Assignment {
  id: number;
  patientId: number;
  userId: number;
  userEmail: string;
  practiceId: number;
  siteId: number | null;
  role: AssignmentRole;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AssignmentCreate {
  userId: number;
  siteId?: number | null;
  startDate?: string | null;
  notes?: string | null;
}

export interface AssignmentEnd {
  endDate?: string | null;
}

/** A user who can be assigned: an active clinician / prosthetist in the
 * practice. `User` has no name fields, so the picker shows the email. */
export interface ClinicalStaff {
  id: number;
  email: string;
  role: AssignmentRole;
  siteId: number | null;
  siteName: string | null;
}

const ROLE_LABELS: Record<AssignmentRole, string> = {
  clinician: 'Clinician',
  prosthetist: 'Prosthetist',
};

export function assignmentRoleLabel(role: AssignmentRole): string {
  return ROLE_LABELS[role];
}
