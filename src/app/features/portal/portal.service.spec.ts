import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PortalService } from './portal.service';

const BASE = `${environment.apiBaseUrl}/portal/me`;

describe('PortalService', () => {
  let service: PortalService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PortalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('camelizes the profile', () => {
    let received: unknown;
    service.profile().subscribe((p) => (received = p));
    http.expectOne(BASE).flush({
      id: 1,
      first_name: 'Thabo',
      practice_name: 'Northgate',
      site_name: 'Main',
      user_id: 9,
    });
    expect(received).toEqual(
      expect.objectContaining({ firstName: 'Thabo', practiceName: 'Northgate', userId: 9 }),
    );
  });

  it('lists involvements / milestones / proms / instruments', () => {
    service.involvements().subscribe();
    http.expectOne(`${BASE}/involvements`).flush([]);
    service.milestones().subscribe();
    http.expectOne(`${BASE}/milestones`).flush([]);
    service.proms().subscribe();
    http.expectOne(`${BASE}/proms`).flush([]);
    service.instruments().subscribe();
    http.expectOne(`${BASE}/instruments`).flush({ instruments: ['socket_comfort_score'] });
  });

  it('submits a PROM with a snake_case body', () => {
    service
      .submitProm({ instrument: 'socket_comfort_score', responses: { score: 3 }, notes: null })
      .subscribe();
    const req = http.expectOne(`${BASE}/proms`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      instrument: 'socket_comfort_score',
      responses: { score: 3 },
      notes: null,
    });
    req.flush({ id: 5, instrument: 'socket_comfort_score', score: 3, flagged: true });
  });

  it('claims a walk-in record with a snake_case body', () => {
    let received: unknown;
    service
      .claim({ identifier: '9107035800086', contactValue: 'lerato.dlamini@example.co.za' })
      .subscribe((p) => (received = p));

    const req = http.expectOne(`${environment.apiBaseUrl}/account-link-requests`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      identifier: '9107035800086',
      contact_value: 'lerato.dlamini@example.co.za',
    });
    req.flush({ id: 2, first_name: 'Lerato', practice_name: 'Northgate', site_name: 'Main' });

    expect(received).toEqual(
      expect.objectContaining({ firstName: 'Lerato', practiceName: 'Northgate' }),
    );
  });
});
