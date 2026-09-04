import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PlatformService } from './platform.service';

const BASE = `${environment.apiBaseUrl}/platform`;

const WIRE_SUMMARY = {
  id: 1,
  name: 'Northgate Rehabilitation Network',
  type: 'hospital_network',
  address: '1 Northgate Ave',
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  site_count: 2,
  user_count: 5,
  patient_count: 8,
};

describe('PlatformService', () => {
  let service: PlatformService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlatformService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists practices and camelizes the summaries', () => {
    let received: unknown;
    service.listPractices({ q: 'north', offset: 0 }).subscribe((p) => (received = p));
    const req = http.expectOne((r) => r.url === `${BASE}/practices`);
    expect(req.request.params.get('q')).toBe('north');
    req.flush({ items: [WIRE_SUMMARY], total: 1, limit: 20, offset: 0 });
    expect(received).toEqual({
      items: [expect.objectContaining({ name: WIRE_SUMMARY.name, siteCount: 2, patientCount: 8 })],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  it('onboards with a nested snake_case body', () => {
    service
      .onboard({
        practice: { name: 'New Practice', type: 'private_practice', address: null },
        firstSite: { name: 'Main Rooms', type: 'location', address: null },
        firstAdmin: { email: 'admin@new.co.za', password: 'longenough' },
      })
      .subscribe();

    const req = http.expectOne(`${BASE}/practices`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      practice: { name: 'New Practice', type: 'private_practice', address: null },
      first_site: { name: 'Main Rooms', type: 'location', address: null },
      first_admin: { email: 'admin@new.co.za', password: 'longenough' },
    });
    req.flush({ practice: { id: 9 }, first_site: { id: 3 }, first_admin: { id: 4 } });
  });

  it('patches a practice and posts admins', () => {
    service.updatePractice(1, { name: 'Renamed' }).subscribe();
    const patch = http.expectOne(`${BASE}/practices/1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ name: 'Renamed' });
    patch.flush(WIRE_SUMMARY);

    service.addPracticeAdmin(1, { email: 'a@b.co.za', password: 'longenough' }).subscribe();
    const pa = http.expectOne(`${BASE}/practices/1/admins`);
    expect(pa.request.body).toEqual({ email: 'a@b.co.za', password: 'longenough' });
    pa.flush({ id: 7 });

    service.addPlatformAdmin({ email: 'p@b.co.za', password: 'longenough' }).subscribe();
    const pl = http.expectOne(`${BASE}/admins`);
    expect(pl.request.body).toEqual({ email: 'p@b.co.za', password: 'longenough' });
    pl.flush({ id: 8 });
  });
});
