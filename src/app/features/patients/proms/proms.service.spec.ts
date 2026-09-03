import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { PromsService } from './proms.service';

const BASE = `${environment.apiBaseUrl}/patients/3/proms`;

const WIRE_PROM = {
  id: 1,
  patient_id: 3,
  device_id: null,
  instrument: 'pain_residual_limb',
  responses: { score: 8 },
  score: 8,
  flagged: true,
  flag_reason: 'Residual limb pain 7+/10',
  recorded_at: '2026-03-01T09:00:00',
  recorded_by_id: 5,
  notes: null,
  created_at: '2026-03-01T09:00:00',
  updated_at: '2026-03-01T09:00:00',
};

describe('PromsService', () => {
  let service: PromsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PromsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists PROMs and camelizes them', () => {
    let received: unknown;
    service.list(3).subscribe((rows) => (received = rows));
    http.expectOne(BASE).flush([WIRE_PROM]);
    expect(received).toEqual([
      expect.objectContaining({
        patientId: 3,
        instrument: 'pain_residual_limb',
        score: 8,
        flagged: true,
        flagReason: 'Residual limb pain 7+/10',
      }),
    ]);
  });

  it('maps instrument and flagged filters to query params', () => {
    service.list(3, { instrument: 'socket_comfort_score', flagged: true }).subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('instrument')).toBe('socket_comfort_score');
    expect(req.request.params.get('flagged')).toBe('true');
    req.flush([]);
  });

  it('creates with a snake_case body', () => {
    service
      .create(3, { instrument: 'socket_comfort_score', responses: { score: 3 }, notes: 'sore' })
      .subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      instrument: 'socket_comfort_score',
      responses: { score: 3 },
      notes: 'sore',
    });
    req.flush(WIRE_PROM);
  });

  it('updates via PATCH', () => {
    service.update(3, 1, { responses: { score: 2 } }).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ responses: { score: 2 } });
    req.flush({ ...WIRE_PROM, responses: { score: 2 }, score: 2 });
  });
});
