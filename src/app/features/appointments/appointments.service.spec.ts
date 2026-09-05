import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AppointmentsService } from './appointments.service';

const BASE = `${environment.apiBaseUrl}/appointments`;

const WIRE = {
  id: 1,
  practice_id: 1,
  site_id: 2,
  patient_id: 3,
  patient_name: 'Pat One',
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

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppointmentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists and camelizes, with optional practitioner/status filters', () => {
    let received: unknown;
    service.list().subscribe((rows) => (received = rows));
    http.expectOne(BASE).flush([WIRE]);
    expect(received).toEqual([
      expect.objectContaining({ patientName: 'Pat One', status: 'booked' }),
    ]);

    service.list({ practitionerId: 5, status: 'booked' }).subscribe();
    const filtered = http.expectOne((r) => r.url === BASE);
    expect(filtered.request.params.get('practitioner_id')).toBe('5');
    expect(filtered.request.params.get('status')).toBe('booked');
    filtered.flush([]);
  });

  it('cancels with a snake_case body', () => {
    service.cancel(1, { reason: 'Practitioner unavailable' }).subscribe();
    const post = http.expectOne(`${BASE}/1/cancel`);
    expect(post.request.body).toEqual({ reason: 'Practitioner unavailable' });
    post.flush({ ...WIRE, status: 'cancelled_by_practitioner' });
  });

  it('marks a no-show', () => {
    service.noShow(1).subscribe();
    const post = http.expectOne(`${BASE}/1/no-show`);
    expect(post.request.method).toBe('POST');
    post.flush({ ...WIRE, status: 'no_show' });
  });

  it('reschedules and camelizes both sides of the result', () => {
    let received: unknown;
    service.reschedule(1, { newSlotId: 9 }).subscribe((r) => (received = r));
    const post = http.expectOne(`${BASE}/1/reschedule`);
    expect(post.request.body).toEqual({ new_slot_id: 9 });
    post.flush({
      previous: { ...WIRE, status: 'rescheduled', rescheduled_to_id: 2 },
      new: { ...WIRE, id: 2, rescheduled_from_id: 1 },
    });
    expect(received).toEqual({
      previous: expect.objectContaining({ status: 'rescheduled', rescheduledToId: 2 }),
      new: expect.objectContaining({ id: 2, rescheduledFromId: 1 }),
    });
  });
});
