import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { DashboardSummary } from './dashboard.model';
import { DashboardService } from './dashboard.service';

const URL = `${environment.apiBaseUrl}/dashboard`;

const WIRE = {
  active_patients: 7,
  patients_by_phase: { gait_functional_training: 3, initial_fitting_delivery: 1 },
  overdue_count: 2,
  overdue: [
    {
      milestone_id: 1,
      patient_id: 5,
      patient_name: 'Ann Bell',
      milestone_type: 'gait_functional_training',
      status: 'in_progress',
      target_date: '2026-08-01',
      days_overdue: 34,
    },
  ],
  upcoming_count: 1,
  upcoming: [],
  flagged_prom_count: 1,
  flagged_proms: [
    {
      prom_id: 9,
      patient_id: 5,
      patient_name: 'Ann Bell',
      instrument: 'pain_residual_limb',
      score: 8,
      flag_reason: 'Residual limb pain 7+/10',
      recorded_at: '2026-09-01T09:00:00',
    },
  ],
};

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the practice view by default and camelizes the summary', () => {
    let received: DashboardSummary | undefined;
    service.summary().subscribe((s) => (received = s));

    const req = http.expectOne((r) => r.url === URL);
    expect(req.request.params.get('view')).toBe('practice');
    expect(req.request.params.has('upcoming_days')).toBe(false);
    req.flush(WIRE);

    expect(received?.activePatients).toBe(7);
    expect(received?.overdueCount).toBe(2);
    expect(received?.patientsByPhase).toEqual({
      gait_functional_training: 3,
      initial_fitting_delivery: 1,
    });
    expect(received?.overdue[0]).toMatchObject({
      milestoneId: 1,
      patientName: 'Ann Bell',
      daysOverdue: 34,
    });
    expect(received?.flaggedProms[0]).toMatchObject({
      promId: 9,
      flagReason: 'Residual limb pain 7+/10',
      recordedAt: '2026-09-01T09:00:00',
    });
  });

  it('passes the mine view and an upcoming window', () => {
    service.summary('mine', 30).subscribe();
    const req = http.expectOne((r) => r.url === URL);
    expect(req.request.params.get('view')).toBe('mine');
    expect(req.request.params.get('upcoming_days')).toBe('30');
    req.flush(WIRE);
  });
});
