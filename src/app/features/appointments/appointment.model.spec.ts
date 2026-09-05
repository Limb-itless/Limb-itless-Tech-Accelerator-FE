import {
  Appointment,
  appointmentStatusLabel,
  coverageStatusLabel,
  isBooked,
} from './appointment.model';

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1,
    practiceId: 1,
    siteId: null,
    patientId: 3,
    patientName: 'Pat One',
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

describe('appointment.model', () => {
  it('labels appointment and coverage statuses', () => {
    expect(appointmentStatusLabel('booked')).toBe('Booked');
    expect(appointmentStatusLabel('cancelled_by_practitioner')).toBe('Cancelled by practice');
    expect(coverageStatusLabel('pending')).toBe('Pending');
    expect(coverageStatusLabel('denied')).toBe('Denied');
  });

  it('isBooked is true only for a currently booked appointment', () => {
    expect(isBooked(appointment({ status: 'booked' }))).toBe(true);
    expect(isBooked(appointment({ status: 'no_show' }))).toBe(false);
  });
});
