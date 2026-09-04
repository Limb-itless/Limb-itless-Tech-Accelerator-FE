import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ReportsService } from './reports.service';

const URL = `${environment.apiBaseUrl}/reports/summary`;

const WIRE = {
  since_days: 30,
  caseload: {
    active_patients: 9,
    inactive_patients: 1,
    new_patients: 2,
    by_involvement_kind: [
      { key: 'amputation', count: 7 },
      { key: 'orthotic_need', count: 1 },
    ],
  },
  milestones: {
    completed: 20,
    completed_on_time: 15,
    completed_late: 5,
    avg_days_late: 3.4,
    open_overdue: 4,
  },
  outcome_measures: {
    records: 30,
    recorded_in_period: 6,
    flagged: 6,
    patients_with_flag: 5,
    by_instrument: [{ key: 'pain_residual_limb', count: 12 }],
  },
  devices: {
    total: 14,
    prostheses: 12,
    orthoses: 2,
    by_type: [{ key: 'body_powered', count: 8 }],
    by_status: [{ key: 'active', count: 11 }],
  },
};

describe('ReportsService', () => {
  let service: ReportsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the default 30-day window and camelizes', () => {
    let received: unknown;
    service.summary().subscribe((r) => (received = r));
    const req = http.expectOne((r) => r.url === URL);
    expect(req.request.params.get('since_days')).toBe('30');
    req.flush(WIRE);
    expect(received).toEqual(
      expect.objectContaining({
        sinceDays: 30,
        caseload: expect.objectContaining({ activePatients: 9, newPatients: 2 }),
        milestones: expect.objectContaining({ completedOnTime: 15, avgDaysLate: 3.4 }),
      }),
    );
  });

  it('keeps breakdown keys untouched', () => {
    let received: { caseload: { byInvolvementKind: { key: string }[] } } | undefined;
    service.summary(90).subscribe((r) => (received = r as never));
    const req = http.expectOne((r) => r.url === URL);
    expect(req.request.params.get('since_days')).toBe('90');
    req.flush(WIRE);
    expect(received!.caseload.byInvolvementKind[0].key).toBe('amputation');
  });
});
