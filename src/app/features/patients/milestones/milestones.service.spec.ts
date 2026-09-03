import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { MilestonesService } from './milestones.service';

const BASE = `${environment.apiBaseUrl}/patients/7`;

const WIRE_MILESTONE = {
  id: 1,
  patient_id: 7,
  device_id: null,
  care_pathway: 'lower_limb',
  milestone_type: 'initial_fitting_delivery',
  order_index: 2,
  status: 'in_progress',
  target_date: '2026-04-01',
  completed_date: null,
  notes: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

describe('MilestonesService', () => {
  let service: MilestonesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MilestonesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists milestones and camelizes them', () => {
    let received: unknown;
    service.list(7).subscribe((rows) => (received = rows));
    http.expectOne(`${BASE}/milestones`).flush([WIRE_MILESTONE]);
    expect(received).toEqual([
      expect.objectContaining({
        patientId: 7,
        carePathway: 'lower_limb',
        milestoneType: 'initial_fitting_delivery',
        orderIndex: 2,
      }),
    ]);
  });

  it('maps list filters to query params', () => {
    service.list(7, { carePathway: 'upper_limb', status: 'delayed' }).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/milestones`);
    expect(req.request.params.get('care_pathway')).toBe('upper_limb');
    expect(req.request.params.get('milestone_status')).toBe('delayed');
    req.flush([]);
  });

  it('creates with a snake_case body', () => {
    service
      .create(7, { milestoneType: 'gait_functional_training', carePathway: 'lower_limb' })
      .subscribe();
    const req = http.expectOne(`${BASE}/milestones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      milestone_type: 'gait_functional_training',
      care_pathway: 'lower_limb',
    });
    req.flush(WIRE_MILESTONE);
  });

  it('completes a milestone, sending a date only when given', () => {
    service.complete(7, 1).subscribe();
    const bare = http.expectOne(`${BASE}/milestones/1/complete`);
    expect(bare.request.body).toEqual({});
    bare.flush({ ...WIRE_MILESTONE, status: 'complete' });

    service.complete(7, 1, '2026-05-01').subscribe();
    const dated = http.expectOne(`${BASE}/milestones/1/complete`);
    expect(dated.request.body).toEqual({ completed_date: '2026-05-01' });
    dated.flush({ ...WIRE_MILESTONE, status: 'complete' });
  });

  it('applies a pathway template', () => {
    let received: unknown;
    service
      .applyPathway(7, { carePathway: 'lower_limb', intervalDays: 21 })
      .subscribe((rows) => (received = rows));
    const req = http.expectOne(`${BASE}/pathways`);
    expect(req.request.body).toEqual({ care_pathway: 'lower_limb', interval_days: 21 });
    req.flush([WIRE_MILESTONE, { ...WIRE_MILESTONE, id: 2, order_index: 3 }]);
    expect((received as unknown[]).length).toBe(2);
  });
});
