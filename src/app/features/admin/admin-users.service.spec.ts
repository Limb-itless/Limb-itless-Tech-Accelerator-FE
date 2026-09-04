import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AdminUsersService } from './admin-users.service';

const BASE = `${environment.apiBaseUrl}/admin/users`;

const WIRE = {
  id: 3,
  email: 'clinician@northgate-rehab.co.za',
  role: 'clinician',
  is_active: true,
  practice_id: 1,
  site_id: 2,
  practice_name: 'Northgate Rehabilitation Network',
  site_name: 'Northgate Main Hospital',
};

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminUsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists with snake_case params and camelizes the page', () => {
    let received: unknown;
    service.list({ q: 'north', role: 'clinician', active: false, offset: 0 }).subscribe((p) => {
      received = p;
    });
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('role')).toBe('clinician');
    expect(req.request.params.get('active')).toBe('false');
    expect(req.request.params.get('q')).toBe('north');
    req.flush({ items: [WIRE], total: 1, limit: 20, offset: 0 });
    expect(received).toEqual({
      items: [expect.objectContaining({ email: WIRE.email, siteName: 'Northgate Main Hospital' })],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  it('creates with a snake_case body', () => {
    service
      .create({ email: 'x@y.co.za', password: 'longenough', role: 'prosthetist', siteId: 2 })
      .subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'x@y.co.za',
      password: 'longenough',
      role: 'prosthetist',
      site_id: 2,
    });
    req.flush(WIRE);
  });

  it('patches and sets a password', () => {
    service.update(3, { isActive: false }).subscribe();
    const patch = http.expectOne(`${BASE}/3`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ is_active: false });
    patch.flush({ ...WIRE, is_active: false });

    service.setPassword(3, 'brandnewpass').subscribe();
    const pw = http.expectOne(`${BASE}/3/set-password`);
    expect(pw.request.body).toEqual({ password: 'brandnewpass' });
    pw.flush(WIRE);
  });
});
