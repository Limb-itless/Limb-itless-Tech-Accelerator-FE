import { AppointmentType } from '../../availability/availability.model';

export type AppointmentStatus =
  'booked' | 'cancelled_by_patient' | 'cancelled_by_practitioner' | 'no_show' | 'rescheduled';

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  booked: 'Booked',
  cancelled_by_patient: 'Cancelled by you',
  cancelled_by_practitioner: 'Cancelled by the practice',
  no_show: 'Missed',
  rescheduled: 'Rescheduled',
};

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status];
}

export type CoverageStatus = 'pending' | 'approved' | 'denied';

const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  pending: 'Awaiting medical-aid approval',
  approved: 'Medical aid approved',
  denied: 'Medical aid did not approve this',
};

export function coverageStatusLabel(status: CoverageStatus): string {
  return COVERAGE_STATUS_LABELS[status];
}

export interface AppointmentBook {
  slotId: number;
  notes?: string | null;
}

export interface AppointmentReschedule {
  newSlotId: number;
}

/** A patient's own booked visit — same entity the staff/reviewer
 * screens see, trimmed to what the portal shows. */
export interface Appointment {
  id: number;
  practiceId: number;
  siteId: number | null;
  patientId: number;
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

/** Reschedule is one atomic action — the API hands back both sides so
 * the caller never has to re-fetch to see the new booking. */
export interface RescheduleResult {
  previous: Appointment;
  new: Appointment;
}

export function isBooked(appointment: Appointment): boolean {
  return appointment.status === 'booked';
}
