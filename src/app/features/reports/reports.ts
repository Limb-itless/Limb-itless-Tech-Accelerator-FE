import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { humanise } from '../patients/patient.model';
import {
  REPORT_WINDOWS,
  ReportBreakdown,
  ReportWindow,
  onTimeRate,
  windowLabel,
} from './report.model';
import { ReportsService } from './reports.service';

@Component({
  selector: 'app-reports',
  imports: [],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {
  private readonly service = inject(ReportsService);

  readonly humanise = humanise;
  readonly windowLabel = windowLabel;
  readonly onTimeRate = onTimeRate;
  readonly windows = REPORT_WINDOWS;

  readonly sinceDays = signal<ReportWindow>(30);

  readonly summary = rxResource({
    params: () => ({ sinceDays: this.sinceDays() }),
    stream: ({ params }) => this.service.summary(params.sinceDays),
  });

  readonly forbidden = computed(() => {
    const error = this.summary.error();
    return error instanceof HttpErrorResponse && error.status === 403;
  });

  setWindow(value: string): void {
    this.sinceDays.set(Number(value) as ReportWindow);
  }

  barWidth(count: number, rows: ReportBreakdown[]): string {
    const peak = rows.reduce((max, r) => Math.max(max, r.count), 0);
    return peak === 0 ? '0%' : `${Math.round((count / peak) * 100)}%`;
  }
}
