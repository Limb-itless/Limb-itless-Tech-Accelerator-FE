import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AdminSitesService } from './admin-sites.service';

const BASE = `${environment.apiBaseUrl}/admin/sites`;

const WIRE = {
  id: 2,
  practice_id: 1,
  name: 'Northgate Main Hospital',
  type: 'location',
  address: '1 Northgate Ave',
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

describe('AdminSitesService', () => {
  let service: AdminSitesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminSitesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists and camelizes, with an optional type filter', () => {
    let received: unknown;
    service.list().subscribe((rows) => (received = rows));
    http.expectOne(BASE).flush([WIRE]);
    expect(received).toEqual([expect.objectContaining({ practiceId: 1, name: WIRE.name })]);

    service.list('department').subscribe();
    const filtered = http.expectOne((r) => r.url === BASE);
    expect(filtered.request.params.get('type')).toBe('department');
    filtered.flush([]);
  });

  it('creates and updates with snake_case bodies', () => {
    service.create({ name: 'Sandton Clinic', type: 'department', address: null }).subscribe();
    const post = http.expectOne(BASE);
    expect(post.request.body).toEqual({
      name: 'Sandton Clinic',
      type: 'department',
      address: null,
    });
    post.flush(WIRE);

    service.update(2, { name: 'Renamed' }).subscribe();
    const patch = http.expectOne(`${BASE}/2`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ name: 'Renamed' });
    patch.flush(WIRE);
  });
});
