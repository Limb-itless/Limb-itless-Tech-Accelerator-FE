export type AppointmentType =
  'initial_assessment' | 'fitting' | 'review' | 'adjustment' | 'follow_up' | 'other';

export const APPOINTMENT_TYPES: readonly AppointmentType[] = [
  'initial_assessment',
  'fitting',
  'review',
  'adjustment',
  'follow_up',
  'other',
];

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  initial_assessment: 'Initial assessment',
  fitting: 'Fitting',
  review: 'Review',
  adjustment: 'Adjustment',
  follow_up: 'Follow-up',
  other: 'Other',
};

export function appointmentTypeLabel(type: AppointmentType): string {
  return APPOINTMENT_TYPE_LABELS[type];
}

export type SlotStatus = 'open' | 'booked' | 'blocked';

export const SLOT_STATUSES: readonly SlotStatus[] = ['open', 'booked', 'blocked'];

const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  open: 'Open',
  booked: 'Booked',
  blocked: 'Blocked',
};

export function slotStatusLabel(status: SlotStatus): string {
  return SLOT_STATUS_LABELS[status];
}

/** A block of time a practitioner has published for booking, or blocked
 * off (requirements Section 5.9). Publishing *is* the confirmation — a
 * patient booking into it flips `open` straight to `booked`, no
 * approval step. */
export interface AvailabilitySlot {
  id: number;
  practiceId: number;
  siteId: number | null;
  practitionerId: number;
  practitionerEmail: string;
  startTime: string;
  endTime: string;
  appointmentType: AppointmentType;
  status: SlotStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlotCreate {
  startTime: string;
  endTime: string;
  appointmentType: AppointmentType;
  status?: SlotStatus;
  notes?: string | null;
}

export interface AvailabilitySlotUpdate {
  startTime?: string;
  endTime?: string;
  appointmentType?: AppointmentType;
  status?: SlotStatus;
  notes?: string | null;
}

export interface AvailabilityListParams {
  practitionerId?: number;
  status?: SlotStatus;
}

/** A clinician / prosthetist who can publish availability — the same
 * practice-scoped staff roster the care-team picker uses (Assignment's
 * `ClinicalStaff`), reused here for the practitioner filter. */
export interface ClinicalStaff {
  id: number;
  email: string;
  role: 'clinician' | 'prosthetist';
  siteId: number | null;
  siteName: string | null;
}

/**
 * The API's datetimes are naive (no timezone) — the server never
 * converts them, and every seed/test fixture treats them as plain wall
 * -clock values. `Date#toISOString()` would convert to UTC and silently
 * shift a slot's advertised time whenever the browser isn't in UTC, so
 * these helpers stay entirely in local-field arithmetic and never touch
 * it. Both directions match a `datetime-local` input's own
 * "YYYY-MM-DDTHH:mm" format.
 */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateTimeLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `dateTimeLocal` plus `minutes`, formatted back as the same kind of
 * local string — used to derive a slot's end time from its start time
 * and a chosen duration. */
export function addMinutesLocal(dateTimeLocal: string, minutes: number): string {
  const d = new Date(dateTimeLocal);
  d.setMinutes(d.getMinutes() + minutes);
  return toDateTimeLocal(d);
}

/** Whole minutes between two local datetime strings — used to prefill a
 * slot's duration field when editing. */
export function minutesBetweenLocal(startLocal: string, endLocal: string): number {
  const start = new Date(startLocal).getTime();
  const end = new Date(endLocal).getTime();
  return Math.round((end - start) / 60000);
}
