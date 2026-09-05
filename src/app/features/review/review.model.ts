import { AppointmentType } from '../availability/availability.model';
import { Patient } from '../patients/patient.model';
import { InvolvementDetail } from '../patients/involvements/involvement.model';
import { Milestone } from '../patients/milestones/milestone.model';
import { Note } from '../patients/notes/note.model';
import { Prom } from '../patients/proms/prom.model';

/** One row of the reviewer's shared-patients list. */
export interface ReviewPatientSummary {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  practiceId: number;
  practiceName: string | null;
  involvementCount: number;
}

/** Everything a reviewer sees for one granted patient — read-only. */
export interface ReviewBundle {
  patient: Patient;
  practiceName: string | null;
  siteName: string | null;
  involvements: InvolvementDetail[];
  milestones: Milestone[];
  proms: Prom[];
  notes: Note[];
}

export type CoverageStatus = 'pending' | 'approved' | 'denied';

export const COVERAGE_STATUSES: readonly CoverageStatus[] = ['pending', 'approved', 'denied'];

const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

export function coverageStatusLabel(status: CoverageStatus): string {
  return COVERAGE_STATUS_LABELS[status];
}

/** A coverage determination for one booked appointment (requirements
 * Section 5.9) — captured manually here, never fetched live from a
 * scheme's own systems. Visible to a reviewer either because a treating
 * practice granted them access to the patient, or because the
 * reviewer's own scheme matches the patient's membership. */
export interface CoverageDetermination {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  practiceName: string | null;
  schemeName: string;
  appointmentType: AppointmentType;
  scheduledStart: string;
  status: CoverageStatus;
  authorizationNumber: string | null;
  validUntil: string | null;
  decidedById: number | null;
  decidedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoverageApprove {
  authorizationNumber?: string | null;
  validUntil?: string | null;
  notes?: string | null;
}

export interface CoverageDeny {
  notes?: string | null;
}
