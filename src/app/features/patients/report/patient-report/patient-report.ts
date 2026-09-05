import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { deviceTypeLabel } from '../../devices/device.model';
import { kindLabel, regionLabel } from '../../involvements/involvement.model';
import { humanise } from '../../patient.model';
import { PromTrend as PromTrendChart } from '../../proms/prom-trend/prom-trend';
import { PromTrend } from '../report.model';
import { PatientReportService } from '../patient-report.service';

/** A per-patient progress report — milestones met, current PROM trends —
 * viewable on screen and printed to PDF for handover (there's no PDF
 * library here; the browser's own print dialog does the job and keeps
 * this dependency-free, matching how the rest of the app avoids
 * charting/PDF libraries in favour of small dependency-free pieces). */
@Component({
  selector: 'app-patient-report',
  imports: [RouterLink, PromTrendChart],
  templateUrl: './patient-report.html',
  styleUrl: './patient-report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientReport {
  private readonly service = inject(PatientReportService);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly deviceTypeLabel = deviceTypeLabel;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();

  readonly report = rxResource({
    params: () => ({ patientId: Number(this.id()) }),
    stream: ({ params }) => this.service.get(params.patientId),
  });

  /** Reuses the existing prom-trend chart (built for the patient-detail
   * PROM panel) rather than a second trend renderer — same point shape,
   * only readings with a score plot. */
  chartPoints(trend: PromTrend) {
    return trend.points
      .filter((p) => p.score !== null)
      .map((p, index) => ({
        promId: index,
        at: p.recordedAt,
        score: p.score as number,
        flagged: p.flagged,
      }));
  }

  print(): void {
    window.print();
  }
}
