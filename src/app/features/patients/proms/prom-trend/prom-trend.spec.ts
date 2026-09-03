import { TestBed } from '@angular/core/testing';

import { TrendPoint } from '../prom.model';
import { PromTrend } from './prom-trend';

function make(points: TrendPoint[], instrument = 'pain_residual_limb' as const) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PromTrend] });
  const fixture = TestBed.createComponent(PromTrend);
  fixture.componentRef.setInput('instrument', instrument);
  fixture.componentRef.setInput('points', points);
  fixture.detectChanges();
  return fixture;
}

const P = (score: number, at: string, flagged = false): TrendPoint => ({
  promId: Math.round(Math.random() * 1e6),
  at,
  score,
  flagged,
});

describe('PromTrend', () => {
  it('plots one dot per point and draws a line only with two or more', () => {
    const single = make([P(5, '2026-01-01')]);
    expect(single.nativeElement.querySelectorAll('.prom-trend__dot').length).toBe(1);
    expect(single.nativeElement.querySelector('.prom-trend__line')).toBeNull();

    const many = make([P(5, '2026-01-01'), P(8, '2026-02-01'), P(3, '2026-03-01')]);
    expect(many.nativeElement.querySelectorAll('.prom-trend__dot').length).toBe(3);
    expect(many.nativeElement.querySelector('.prom-trend__line')).not.toBeNull();
  });

  it('marks flagged points and orders x by time', () => {
    const fixture = make([P(8, '2026-01-01', true), P(4, '2026-04-01', false)]);
    const dots = fixture.nativeElement.querySelectorAll('.prom-trend__dot');
    expect(dots[0].classList.contains('prom-trend__dot--flagged')).toBe(true);
    const xs = fixture.componentInstance.plotted().map((p) => p.x);
    expect(xs[0]).toBeLessThan(xs[1]);
  });

  it('places the threshold line lower for a higher threshold score', () => {
    // pain flags at >= 7 out of 10; a higher score sits nearer the top (smaller y)
    const fixture = make([P(5, '2026-01-01')]);
    const yAtTop = fixture.componentInstance.thresholdY();
    fixture.componentRef.setInput('instrument', 'locomotor_capabilities_index');
    fixture.detectChanges();
    // LCI flags at <= 21 out of 56 -> near the bottom -> larger y
    expect(fixture.componentInstance.thresholdY()).toBeGreaterThan(yAtTop);
  });

  it('summarises the series for screen readers', () => {
    const fixture = make([P(4, '2026-01-01'), P(6, '2026-02-01')]);
    expect(fixture.componentInstance.summary()).toContain('2 readings, latest 6, rising');
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-label')).toBe(fixture.componentInstance.summary());
  });
});
