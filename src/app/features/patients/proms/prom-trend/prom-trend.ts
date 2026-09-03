import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { INSTRUMENT_META, PromInstrument, TrendPoint } from '../prom.model';

interface PlottedPoint {
  x: number;
  y: number;
  score: number;
  flagged: boolean;
}

const VIEW_W = 320;
const VIEW_H = 120;
const PAD = { top: 10, right: 12, bottom: 22, left: 28 };

/** Small dependency-free SVG line chart of one instrument's score over
 * time, with the clinical threshold drawn as a reference line. */
@Component({
  selector: 'app-prom-trend',
  imports: [],
  templateUrl: './prom-trend.html',
  styleUrl: './prom-trend.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromTrend {
  readonly instrument = input.required<PromInstrument>();
  readonly points = input.required<readonly TrendPoint[]>();

  readonly viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  readonly meta = computed(() => INSTRUMENT_META[this.instrument()]);

  private readonly plotWidth = VIEW_W - PAD.left - PAD.right;
  private readonly plotHeight = VIEW_H - PAD.top - PAD.bottom;

  private yFor(score: number): number {
    const { min, max } = this.meta();
    const ratio = max === min ? 0 : (score - min) / (max - min);
    return PAD.top + (1 - ratio) * this.plotHeight;
  }

  readonly plotted = computed<PlottedPoint[]>(() => {
    const series = this.points();
    if (series.length === 0) {
      return [];
    }
    const times = series.map((p) => new Date(p.at).getTime());
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const span = maxT - minT;
    return series.map((point, index) => {
      const ratio =
        span === 0
          ? series.length === 1
            ? 0.5
            : index / (series.length - 1)
          : (times[index] - minT) / span;
      return {
        x: PAD.left + ratio * this.plotWidth,
        y: this.yFor(point.score),
        score: point.score,
        flagged: point.flagged,
      };
    });
  });

  readonly linePath = computed(() =>
    this.plotted()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' '),
  );

  readonly thresholdY = computed(() => this.yFor(this.meta().threshold));

  readonly axis = { x0: PAD.left, x1: VIEW_W - PAD.right, y0: PAD.top, y1: VIEW_H - PAD.bottom };

  readonly latest = computed(() => {
    const series = this.points();
    return series.length ? series[series.length - 1] : null;
  });

  readonly summary = computed(() => {
    const series = this.points();
    const m = this.meta();
    if (series.length === 0) {
      return `${m.label}: no readings`;
    }
    const last = series[series.length - 1];
    const trend =
      series.length > 1
        ? last.score > series[series.length - 2].score
          ? ', rising'
          : last.score < series[series.length - 2].score
            ? ', falling'
            : ', unchanged'
        : '';
    return `${m.label}: ${series.length} reading${series.length === 1 ? '' : 's'}, latest ${last.score}${trend}`;
  });
}
