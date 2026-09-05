import {
  Appointment,
  appointmentStatusLabel,
  coverageStatusLabel,
  isBooked,
} from './booking.model';

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1,
    practiceId: 1,
    siteId: null,
    patientId: 1,
    practitionerId: 5,
    practitionerEmail: 'clin@northgate.example',
    slotId: 7,
    appointmentType: 'review',
    scheduledStart: '2026-09-05T09:00:00',
    scheduledEnd: '2026-09-05T09:30:00',
    status: 'booked',
    cancellationReason: null,
    cancelledAt: null,
    lateCancellation: false,
    rescheduledToId: null,
    rescheduledFromId: null,
    coverageStatus: null,
    notes: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('booking.model', () => {
  it('labels appointment and coverage statuses', () => {
    expect(appointmentStatusLabel('booked')).toBe('Booked');
    expect(appointmentStatusLabel('cancelled_by_patient')).toBe('Cancelled by you');
    expect(coverageStatusLabel('pending')).toBe('Awaiting medical-aid approval');
    expect(coverageStatusLabel('approved')).toBe('Medical aid approved');
  });

  it('isBooked is true only for a currently booked appointment', () => {
    expect(isBooked(appointment({ status: 'booked' }))).toBe(true);
    expect(isBooked(appointment({ status: 'rescheduled' }))).toBe(false);
    expect(isBooked(appointment({ status: 'cancelled_by_patient' }))).toBe(false);
  });
});
