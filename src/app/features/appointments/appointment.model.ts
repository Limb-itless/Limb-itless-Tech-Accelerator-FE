import { AppointmentType } from '../availability/availability.model';

export type AppointmentStatus =
  'booked' | 'cancelled_by_patient' | 'cancelled_by_practitioner' | 'no_show' | 'rescheduled';

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  'booked',
  'cancelled_by_patient',
  'cancelled_by_practitioner',
  'no_show',
  'rescheduled',
];

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  booked: 'Booked',
  cancelled_by_patient: 'Cancelled by patient',
  cancelled_by_practitioner: 'Cancelled by practice',
  no_show: 'No-show',
  rescheduled: 'Rescheduled',
};

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status];
}

export type CoverageStatus = 'pending' | 'approved' | 'denied';

const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

export function coverageStatusLabel(status: CoverageStatus): string {
  return COVERAGE_STATUS_LABELS[status];
}

/** A booked visit, the staff/triage view of it — same entity the
 * patient's own `/portal/booking` sees, plus who it's for. */
export interface Appointment {
  id: number;
  practiceId: number;
  siteId: number | null;
  patientId: number;
  patientName: string;
  practitionerId: number;
  practitionerEmail: string;
  slotId: number | null;
  appointmentType: AppointmentType;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  cancelledAt: string | null;
  lateCancellation: boolean;
  rescheduledToId: number | null;
  rescheduledFromId: number | null;
  coverageStatus: CoverageStatus | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListParams {
  patientId?: number;
  practitionerId?: number;
  status?: AppointmentStatus;
}

export interface AppointmentCancel {
  reason: string;
}

export interface AppointmentReschedule {
  newSlotId: number;
}

/** Reschedule is one atomic action - the API hands back both sides so
 * the caller never has to re-fetch to see the new booking. */
export interface RescheduleResult {
  previous: Appointment;
  new: Appointment;
}

export function isBooked(appointment: Appointment): boolean {
  return appointment.status === 'booked';
}
