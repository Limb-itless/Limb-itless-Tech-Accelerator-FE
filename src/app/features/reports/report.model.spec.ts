import { MilestoneAdherenceReport, onTimeRate, windowLabel } from './report.model';

describe('report.model', () => {
  it('labels the known windows', () => {
    expect(windowLabel(7)).toBe('last 7 days');
    expect(windowLabel(365)).toBe('last year');
    expect(windowLabel(45)).toBe('last 45 days');
  });

  it('computes the on-time rate, or null when nothing is completed', () => {
    const m = (completed: number, onTime: number): MilestoneAdherenceReport => ({
      completed,
      completedOnTime: onTime,
      completedLate: completed - onTime,
      avgDaysLate: null,
      openOverdue: 0,
    });
    expect(onTimeRate(m(20, 15))).toBe(75);
    expect(onTimeRate(m(0, 0))).toBeNull();
  });
});
