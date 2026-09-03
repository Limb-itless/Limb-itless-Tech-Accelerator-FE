import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PatientsService } from './patients.service';

const BASE = `${environment.apiBaseUrl}/patients`;

const WIRE_PATIENT = {
  id: 1,
  practice_id: 2,
  site_id: null,
  first_name: 'Ann',
  last_name: 'Bell',
  date_of_birth: '1990-01-01',
  national_id: '900',
  passport_number: null,
  contact_email: null,
  contact_phone: null,
  address: null,
  medical_history: null,
  comorbidities: null,
  cause_of_limb_loss: 'trauma',
  limb_loss_level: 'transtibial',
  is_active: true,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

describe('PatientsService', () => {
  let service: PatientsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists with snake_case params and camelizes the response', () => {
    let received: unknown;
    service
      .list({ q: 'bell', active: true, limit: 20, offset: 0 })
      .subscribe((page) => (received = page));

    const req = http.expectOne((r) => r.url === BASE && r.params.get('q') === 'bell');
    expect(req.request.params.get('active')).toBe('true');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({ items: [WIRE_PATIENT], total: 1, limit: 20, offset: 0 });

    expect(received).toEqual({
      items: [expect.objectContaining({ firstName: 'Ann', limbLossLevel: 'transtibial' })],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  it('omits blank/undefined params', () => {
    service.list({ q: '', offset: 0 }).subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.has('q')).toBe(false);
    expect(req.request.params.get('offset')).toBe('0');
    req.flush({ items: [], total: 0, limit: 20, offset: 0 });
  });

  it('gets one patient', () => {
    service.get(1).subscribe();
    http.expectOne(`${BASE}/1`).flush(WIRE_PATIENT);
  });

  it('creates with a snake_case body', () => {
    service
      .create({
        firstName: 'Ann',
        lastName: 'Bell',
        dateOfBirth: '1990-01-01',
        nationalId: '900',
      })
      .subscribe();

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      first_name: 'Ann',
      last_name: 'Bell',
      date_of_birth: '1990-01-01',
      national_id: '900',
    });
    req.flush(WIRE_PATIENT);
  });

  it('setActive hits deactivate / reactivate', () => {
    service.setActive(5, false).subscribe();
    http.expectOne(`${BASE}/5/deactivate`).flush({ ...WIRE_PATIENT, id: 5 });

    service.setActive(5, true).subscribe();
    http.expectOne(`${BASE}/5/reactivate`).flush({ ...WIRE_PATIENT, id: 5 });
  });
});
