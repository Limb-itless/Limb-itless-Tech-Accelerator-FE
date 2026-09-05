import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ReviewService } from './review.service';

const BASE = `${environment.apiBaseUrl}/review`;

describe('ReviewService', () => {
  let service: ReviewService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists shared patients and camelizes', () => {
    let received: unknown;
    service.patients().subscribe((r) => (received = r));
    http.expectOne(`${BASE}/patients`).flush([
      {
        id: 1,
        first_name: 'Thabo',
        last_name: 'Molefe',
        practice_name: 'NG',
        involvement_count: 1,
      },
    ]);
    expect(received).toEqual([
      expect.objectContaining({ firstName: 'Thabo', practiceName: 'NG', involvementCount: 1 }),
    ]);
  });

  it('fetches one bundle', () => {
    let received: unknown;
    service.bundle(7).subscribe((b) => (received = b));
    http.expectOne(`${BASE}/patients/7`).flush({
      patient: { id: 7, first_name: 'A' },
      practice_name: 'NG',
      involvements: [],
      milestones: [],
      proms: [],
      notes: [],
    });
    expect(received).toEqual(
      expect.objectContaining({ patient: expect.objectContaining({ firstName: 'A' }) }),
    );
  });

  const COVERAGE_WIRE = {
    id: 3,
    appointment_id: 1,
    patient_id: 1,
    patient_name: 'Thabo Molefe',
    practice_name: 'Northgate Rehabilitation Network',
    scheme_name: 'Discovery Health',
    appointment_type: 'review',
    scheduled_start: '2026-09-05T09:00:00',
    status: 'pending',
    authorization_number: null,
    valid_until: null,
    decided_by_id: null,
    decided_at: null,
    notes: null,
    created_at: '',
    updated_at: '',
  };

  it('lists the coverage queue and camelizes, with an optional status filter', () => {
    let received: unknown;
    service.coverageQueue().subscribe((r) => (received = r));
    http.expectOne(`${BASE}/coverage`).flush([COVERAGE_WIRE]);
    expect(received).toEqual([
      expect.objectContaining({ patientName: 'Thabo Molefe', schemeName: 'Discovery Health' }),
    ]);

    service.coverageQueue('pending').subscribe();
    const filtered = http.expectOne((r) => r.url === `${BASE}/coverage`);
    expect(filtered.request.params.get('status')).toBe('pending');
    filtered.flush([]);
  });

  it('approves with a snake_case body', () => {
    service
      .approve(3, { authorizationNumber: 'AUTH-1', validUntil: '2027-01-01', notes: 'ok' })
      .subscribe();
    const post = http.expectOne(`${BASE}/coverage/3/approve`);
    expect(post.request.body).toEqual({
      authorization_number: 'AUTH-1',
      valid_until: '2027-01-01',
      notes: 'ok',
    });
    post.flush({ ...COVERAGE_WIRE, status: 'approved' });
  });

  it('denies with a snake_case body', () => {
    service.deny(3, { notes: 'Not covered' }).subscribe();
    const post = http.expectOne(`${BASE}/coverage/3/deny`);
    expect(post.request.body).toEqual({ notes: 'Not covered' });
    post.flush({ ...COVERAGE_WIRE, status: 'denied' });
  });
});
