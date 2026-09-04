import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { InvolvementsService } from './involvements.service';

const BASE = `${environment.apiBaseUrl}/patients/7/involvements`;

const WIRE = {
  id: 1,
  patient_id: 7,
  kind: 'amputation',
  region: 'lower_limb_left',
  level: 'transtibial',
  cause: 'trauma',
  onset_date: '2025-11-01',
  status: 'active',
  notes: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

describe('InvolvementsService', () => {
  let service: InvolvementsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvolvementsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists and camelizes', () => {
    let received: unknown;
    service.list(7).subscribe((rows) => (received = rows));
    http.expectOne(BASE).flush([WIRE]);
    expect(received).toEqual([
      expect.objectContaining({
        patientId: 7,
        kind: 'amputation',
        region: 'lower_limb_left',
        onsetDate: '2025-11-01',
      }),
    ]);
  });

  it('gets one involvement with its devices', () => {
    service.get(7, 1).subscribe();
    http.expectOne(`${BASE}/1`).flush({ ...WIRE, devices: [] });
  });

  it('creates with a snake_case body', () => {
    service.create(7, { kind: 'orthotic_need', region: 'spine' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ kind: 'orthotic_need', region: 'spine' });
    req.flush(WIRE);
  });

  it('updates via PATCH', () => {
    service.update(7, 1, { status: 'resolved' }).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'resolved' });
    req.flush({ ...WIRE, status: 'resolved' });
  });
});
