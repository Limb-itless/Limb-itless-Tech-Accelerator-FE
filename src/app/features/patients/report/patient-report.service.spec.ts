import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { PatientReportService } from './patient-report.service';

const BASE = `${environment.apiBaseUrl}/patients/1/report`;

const WIRE = {
  patient: { id: 1, first_name: 'Thabo', last_name: 'Molefe' },
  practice_name: 'Northgate Rehabilitation Network',
  site_name: 'Northgate Main Hospital',
  generated_at: '2026-09-05T10:00:00',
  involvements: [],
  milestone_summary: {
    total: 0,
    completed: 0,
    completed_on_time: 0,
    completed_late: 0,
    in_progress: 0,
    not_started: 0,
    overdue: 0,
  },
  milestones: [],
  prom_trends: [],
};

describe('PatientReportService', () => {
  let service: PatientReportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches and camelizes the report', () => {
    let received: unknown;
    service.get(1).subscribe((r) => (received = r));
    http.expectOne(BASE).flush(WIRE);
    expect(received).toEqual(
      expect.objectContaining({
        practiceName: 'Northgate Rehabilitation Network',
        milestoneSummary: expect.objectContaining({ completedOnTime: 0 }),
      }),
    );
  });
});
