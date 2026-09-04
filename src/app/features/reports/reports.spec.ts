import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ReportSummary } from './report.model';
import { Reports } from './reports';
import { ReportsService } from './reports.service';

const SUMMARY: ReportSummary = {
  sinceDays: 30,
  caseload: {
    activePatients: 9,
    inactivePatients: 1,
    newPatients: 2,
    byInvolvementKind: [
      { key: 'amputation', count: 8 },
      { key: 'orthotic_need', count: 1 },
    ],
  },
  milestones: {
    completed: 20,
    completedOnTime: 15,
    completedLate: 5,
    avgDaysLate: 3.4,
    openOverdue: 4,
  },
  outcomeMeasures: {
    records: 30,
    recordedInPeriod: 6,
    flagged: 6,
    patientsWithFlag: 5,
    byInstrument: [{ key: 'socket_comfort_score', count: 9 }],
  },
  devices: {
    total: 14,
    prostheses: 12,
    orthoses: 2,
    byType: [
      { key: 'body_powered', count: 8 },
      { key: 'orthosis_afo', count: 1 },
    ],
    byStatus: [{ key: 'active', count: 11 }],
  },
};

async function setup(summary = vi.fn().mockReturnValue(of(SUMMARY))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [Reports],
    providers: [{ provide: ReportsService, useValue: { summary } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(Reports);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, summary };
}

describe('Reports', () => {
  it('renders the four sections with humanised breakdown labels', async () => {
    const { fixture } = await setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Caseload');
    expect(text).toContain('Milestone adherence');
    expect(text).toContain('Outcome measures');
    expect(text).toContain('Devices');
    // 15 / 20 completed on time
    expect(text).toContain('75%');
    // enum keys are humanised for display
    expect(text).toContain('Amputation');
    expect(text).toContain('Body powered');
    expect(fixture.nativeElement.querySelectorAll('.reports__bar-fill').length).toBeGreaterThan(0);
  });

  it('refetches when the period changes', async () => {
    const { fixture, summary } = await setup();
    expect(summary).toHaveBeenCalledWith(30);
    fixture.componentInstance.setWindow('90');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(summary).toHaveBeenCalledWith(90);
  });

  it('shows the forbidden message on 403', async () => {
    const { fixture } = await setup(
      vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 }))),
    );
    expect(fixture.nativeElement.textContent).toContain('only available to clinical staff');
  });

  it('shows a generic error otherwise', async () => {
    const { fixture } = await setup(
      vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))),
    );
    expect(fixture.nativeElement.textContent).toContain('could not be loaded');
  });
});
