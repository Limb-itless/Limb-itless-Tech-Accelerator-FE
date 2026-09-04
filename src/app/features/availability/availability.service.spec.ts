import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AvailabilityService } from './availability.service';

const BASE = `${environment.apiBaseUrl}/availability`;

const WIRE = {
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
  created_at: '2026-09-04T00:00:00',
  updated_at: '2026-09-04T00:00:00',
};

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AvailabilityService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists and camelizes, with optional practitioner/status filters', () => {
    let received: unknown;
    service.list().subscribe((rows) => (received = rows));
    http.expectOne(BASE).flush([WIRE]);
    expect(received).toEqual([expect.objectContaining({ practitionerId: 5, status: 'open' })]);

    service.list({ practitionerId: 5, status: 'open' }).subscribe();
    const filtered = http.expectOne((r) => r.url === BASE);
    expect(filtered.request.params.get('practitioner_id')).toBe('5');
    expect(filtered.request.params.get('status')).toBe('open');
    filtered.flush([]);
  });

  it('gets one slot', () => {
    service.get(7).subscribe();
    http.expectOne(`${BASE}/7`).flush(WIRE);
  });

  it('creates with a snake_case body', () => {
    service
      .create({
        startTime: '2026-09-05T09:00',
        endTime: '2026-09-05T09:30',
        appointmentType: 'review',
        status: 'open',
        notes: null,
      })
      .subscribe();
    const post = http.expectOne(BASE);
    expect(post.request.body).toEqual({
      start_time: '2026-09-05T09:00',
      end_time: '2026-09-05T09:30',
      appointment_type: 'review',
      status: 'open',
      notes: null,
    });
    post.flush(WIRE);
  });

  it('updates with a PATCH', () => {
    service.update(7, { status: 'blocked' }).subscribe();
    const patch = http.expectOne(`${BASE}/7`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ status: 'blocked' });
    patch.flush(WIRE);
  });

  it('lists the practice-scoped staff roster for the picker', () => {
    let received: unknown;
    service.staff().subscribe((rows) => (received = rows));
    http
      .expectOne(`${environment.apiBaseUrl}/practice/clinical-staff`)
      .flush([
        {
          id: 5,
          email: 'clin@northgate.example',
          role: 'clinician',
          site_id: null,
          site_name: null,
        },
      ]);
    expect(received).toEqual([expect.objectContaining({ id: 5, email: 'clin@northgate.example' })]);
  });
});
