import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { DevicesService } from './devices.service';

const BASE = `${environment.apiBaseUrl}/patients/9/involvements/4/devices`;

const WIRE_DEVICE = {
  id: 1,
  involvement_id: 4,
  device_type: 'myoelectric',
  status: 'active',
  replaces_device_id: null,
  manufacturer: 'Ottobock',
  model: null,
  serial_number: null,
  mount_location: null,
  socket_type: null,
  liner_type: null,
  suspension_type: null,
  terminal_device: null,
  cast_scan_date: null,
  delivery_date: null,
  fitted_date: null,
  warranty_start: null,
  warranty_expiry: null,
  notes: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

describe('DevicesService', () => {
  let service: DevicesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DevicesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists an involvement’s devices and camelizes them', () => {
    let received: unknown;
    service.list(9, 4).subscribe((rows) => (received = rows));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush([WIRE_DEVICE]);

    expect(received).toEqual([
      expect.objectContaining({
        involvementId: 4,
        deviceType: 'myoelectric',
        replacesDeviceId: null,
      }),
    ]);
  });

  it('lists every device for a patient via the overview route', () => {
    service.listForPatient(9).subscribe();
    const req = http.expectOne(`${environment.apiBaseUrl}/patients/9/devices`);
    expect(req.request.method).toBe('GET');
    req.flush([WIRE_DEVICE]);
  });

  it('passes a status filter as device_status', () => {
    service.list(9, 4, 'active').subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('device_status')).toBe('active');
    req.flush([]);
  });

  it('gets one device', () => {
    service.get(9, 4, 1).subscribe();
    http.expectOne(`${BASE}/1`).flush(WIRE_DEVICE);
  });

  it('creates with a snake_case body', () => {
    service.create(9, 4, { deviceType: 'myoelectric', manufacturer: 'Ottobock' }).subscribe();

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      device_type: 'myoelectric',
      manufacturer: 'Ottobock',
    });
    req.flush(WIRE_DEVICE);
  });

  it('updates via PATCH', () => {
    service.update(9, 4, 1, { status: 'in_repair' }).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'in_repair' });
    req.flush({ ...WIRE_DEVICE, status: 'in_repair' });
  });

  it('replaces via POST to /{id}/replace', () => {
    service.replace(9, 4, 1, { deviceType: 'myoelectric' }).subscribe();
    const req = http.expectOne(`${BASE}/1/replace`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...WIRE_DEVICE, id: 2, replaces_device_id: 1 });
  });
});
