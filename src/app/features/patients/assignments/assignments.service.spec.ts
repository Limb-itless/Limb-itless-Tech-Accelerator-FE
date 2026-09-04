import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AssignmentsService } from './assignments.service';

const BASE = `${environment.apiBaseUrl}/patients/7/assignments`;

const WIRE = {
  id: 3,
  patient_id: 7,
  user_id: 12,
  user_email: 'kim@northgate.example',
  practice_id: 1,
  site_id: 4,
  role: 'clinician',
  start_date: '2026-01-01',
  end_date: null,
  notes: null,
  created_at: '2026-01-01T00:00:00',
};

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AssignmentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists the full history and camelizes', () => {
    let received: unknown;
    service.list(7).subscribe((rows) => (received = rows));
    http.expectOne(BASE).flush([WIRE]);
    expect(received).toEqual([
      expect.objectContaining({ userId: 12, userEmail: 'kim@northgate.example', endDate: null }),
    ]);
  });

  it('passes ?active=true when asked for current only', () => {
    service.list(7, true).subscribe();
    http.expectOne(`${BASE}?active=true`).flush([]);
  });

  it('creates with a snake_case body', () => {
    service.create(7, { userId: 12, startDate: '2026-02-01' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user_id: 12, start_date: '2026-02-01' });
    req.flush(WIRE);
  });

  it('ends an assignment with an empty body by default', () => {
    service.end(7, 3).subscribe();
    const req = http.expectOne(`${BASE}/3/end`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ ...WIRE, end_date: '2026-03-01' });
  });

  it('fetches the clinical-staff roster', () => {
    let received: unknown;
    service.staff().subscribe((rows) => (received = rows));
    http.expectOne(`${environment.apiBaseUrl}/practice/clinical-staff`).flush([
      {
        id: 12,
        email: 'kim@northgate.example',
        role: 'clinician',
        site_id: 4,
        site_name: 'Main',
      },
    ]);
    expect(received).toEqual([
      expect.objectContaining({ id: 12, role: 'clinician', siteName: 'Main' }),
    ]);
  });
});
