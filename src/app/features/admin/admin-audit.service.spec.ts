import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AdminAuditService } from './admin-audit.service';

const BASE = `${environment.apiBaseUrl}/admin/audit`;

const WIRE = {
  id: 3,
  actor_id: 12,
  actor_email: 'kim@northgate.example',
  action: 'create',
  entity_type: 'prom_record',
  entity_id: 9,
  timestamp: '2026-09-03T09:00:00',
};

describe('AdminAuditService', () => {
  let service: AdminAuditService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminAuditService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists and camelizes, snakeizing the filter params', () => {
    let received: unknown;
    service
      .list({ actorId: 12, action: 'create', entityType: 'device', dateFrom: '2026-09-01' })
      .subscribe((r) => (received = r));
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('actor_id')).toBe('12');
    expect(req.request.params.get('entity_type')).toBe('device');
    expect(req.request.params.get('date_from')).toBe('2026-09-01');
    req.flush({ items: [WIRE], total: 1, limit: 20, offset: 0 });
    expect(received).toEqual(
      expect.objectContaining({
        items: [expect.objectContaining({ actorEmail: 'kim@northgate.example', entityId: 9 })],
      }),
    );
  });

  it('omits blank params', () => {
    service.list({ actorId: undefined, action: '' as never, limit: 20 }).subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.has('action')).toBe(false);
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({ items: [], total: 0, limit: 20, offset: 0 });
  });

  it('fetches facets', () => {
    let received: unknown;
    service.facets().subscribe((f) => (received = f));
    http
      .expectOne(`${BASE}/facets`)
      .flush({ entity_types: ['device', 'patient'], actors: [{ id: 12, email: 'k@x' }] });
    expect(received).toEqual({
      entityTypes: ['device', 'patient'],
      actors: [{ id: 12, email: 'k@x' }],
    });
  });
});
