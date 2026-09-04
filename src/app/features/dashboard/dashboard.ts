import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { humanise } from '../patients/patient.model';
import { DashboardView, phaseBreakdown } from './dashboard.model';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly service = inject(DashboardService);

  readonly humanise = humanise;

  readonly view = signal<DashboardView>('practice');

  readonly summary = rxResource({
    params: () => ({ view: this.view() }),
    stream: ({ params }) => this.service.summary(params.view),
  });

  readonly phases = computed(() => {
    const value = this.summary.value();
    return value ? phaseBreakdown(value) : [];
  });

  /** Whichever phase has the most patients, for the mini bar scale. */
  readonly phasePeak = computed(() => this.phases().reduce((max, p) => Math.max(max, p.count), 0));

  readonly forbidden = computed(() => {
    const error = this.summary.error();
    return error instanceof HttpErrorResponse && error.status === 403;
  });

  setView(view: DashboardView): void {
    this.view.set(view);
  }

  barWidth(count: number): string {
    const peak = this.phasePeak();
    return peak === 0 ? '0%' : `${Math.round((count / peak) * 100)}%`;
  }
}
