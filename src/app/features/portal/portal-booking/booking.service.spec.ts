import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { BookingService } from './booking.service';

const BASE = `${environment.apiBaseUrl}/portal`;

const SLOT_WIRE = {
  id: 7,
  practice_id: 1,
  site_id: 2,
  practitioner_id: 5,
  practitioner_email: 'clin@northgate.example',
  start_time: '2026-09-05T09:00:00',
  end_time: '2026-09-05T09:30:00',
  appointment_type: 'review',
  status: 'open',
  notes: null,
  created_at: '',
  updated_at: '',
};

const APPT_WIRE = {
  id: 1,
  practice_id: 1,
  site_id: 2,
  patient_id: 1,
  practitioner_id: 5,
  practitioner_email: 'clin@northgate.example',
  slot_id: 7,
  appointment_type: 'review',
  scheduled_start: '2026-09-05T09:00:00',
  scheduled_end: '2026-09-05T09:30:00',
  status: 'booked',
  cancellation_reason: null,
  cancelled_at: null,
  late_cancellation: false,
  rescheduled_to_id: null,
  rescheduled_from_id: null,
  coverage_status: null,
  notes: null,
  created_at: '',
  updated_at: '',
};

describe('BookingService', () => {
  let service: BookingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('browses open availability and camelizes', () => {
    let received: unknown;
    service.availability().subscribe((rows) => (received = rows));
    http.expectOne(`${BASE}/availability`).flush([SLOT_WIRE]);
    expect(received).toEqual([expect.objectContaining({ practitionerId: 5, status: 'open' })]);
  });

  it('lists my appointments', () => {
    let received: unknown;
    service.myAppointments().subscribe((rows) => (received = rows));
    http.expectOne(`${BASE}/appointments`).flush([APPT_WIRE]);
    expect(received).toEqual([expect.objectContaining({ id: 1, status: 'booked' })]);
  });

  it('books a slot with a snake_case body', () => {
    service.book({ slotId: 7 }).subscribe();
    const post = http.expectOne(`${BASE}/appointments`);
    expect(post.request.body).toEqual({ slot_id: 7 });
    post.flush(APPT_WIRE);
  });

  it('cancels an appointment', () => {
    service.cancel(1).subscribe();
    const post = http.expectOne(`${BASE}/appointments/1/cancel`);
    expect(post.request.method).toBe('POST');
    post.flush({ ...APPT_WIRE, status: 'cancelled_by_patient' });
  });

  it('reschedules and camelizes both sides of the result', () => {
    let received: unknown;
    service.reschedule(1, { newSlotId: 9 }).subscribe((r) => (received = r));
    const post = http.expectOne(`${BASE}/appointments/1/reschedule`);
    expect(post.request.body).toEqual({ new_slot_id: 9 });
    post.flush({
      previous: { ...APPT_WIRE, status: 'rescheduled', rescheduled_to_id: 2 },
      new: { ...APPT_WIRE, id: 2, rescheduled_from_id: 1 },
    });
    expect(received).toEqual({
      previous: expect.objectContaining({ status: 'rescheduled', rescheduledToId: 2 }),
      new: expect.objectContaining({ id: 2, rescheduledFromId: 1 }),
    });
  });
});
