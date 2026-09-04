import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DashboardSummary } from './dashboard.model';
import { DashboardService } from './dashboard.service';
import { Dashboard } from './dashboard';

const SUMMARY: DashboardSummary = {
  activePatients: 7,
  patientsByPhase: { gait_functional_training: 3, initial_fitting_delivery: 1 },
  overdueCount: 1,
  overdue: [
    {
      milestoneId: 1,
      patientId: 5,
      patientName: 'Ann Bell',
      milestoneType: 'gait_functional_training',
      status: 'in_progress',
      targetDate: '2026-08-01',
      daysOverdue: 34,
    },
  ],
  upcomingCount: 0,
  upcoming: [],
  flaggedPromCount: 1,
  flaggedProms: [
    {
      promId: 9,
      patientId: 5,
      patientName: 'Ann Bell',
      instrument: 'pain_residual_limb',
      score: 8,
      flagReason: 'Residual limb pain 7+/10',
      recordedAt: '2026-09-01T09:00:00',
    },
  ],
};

async function setup(summary = vi.fn().mockReturnValue(of(SUMMARY))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [provideRouter([]), { provide: DashboardService, useValue: { summary } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(Dashboard);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, summary };
}

describe('Dashboard', () => {
  it('shows the headline stats and lists', async () => {
    const { fixture } = await setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Active patients');
    expect(text).toContain('7');
    expect(text).toContain('Ann Bell');
    expect(text).toContain('Gait functional training');
    expect(text).toContain('34d overdue');
    expect(text).toContain('Residual limb pain 7+/10');
  });

  it('renders a bar per phase, widest for the busiest', async () => {
    const { fixture } = await setup();
    const fills = fixture.nativeElement.querySelectorAll('.dashboard__phase-fill');
    expect(fills.length).toBe(2);
    expect(fills[0].style.width).toBe('100%');
    expect(fills[1].style.width).toBe('33%');
  });

  it('switches the view and refetches', async () => {
    const { fixture, summary } = await setup();
    expect(summary).toHaveBeenCalledWith('practice');

    fixture.componentInstance.setView('mine');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(summary).toHaveBeenCalledWith('mine');
  });

  it('shows a role message on 403', async () => {
    const { fixture } = await setup(
      vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 }))),
    );
    expect(fixture.componentInstance.forbidden()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('only available to clinical staff');
  });

  it('shows a generic error otherwise', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(throwError(() => new Error('boom'))));
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'could not be loaded',
    );
  });
});
