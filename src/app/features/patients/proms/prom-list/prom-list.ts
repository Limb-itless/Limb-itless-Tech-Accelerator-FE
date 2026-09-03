import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { INSTRUMENT_META, PromInstrument, TrendPoint, toTrends } from '../prom.model';
import { PromsService } from '../proms.service';
import { PromTrend } from '../prom-trend/prom-trend';

interface TrendView {
  instrument: PromInstrument;
  label: string;
  points: TrendPoint[];
}

/** PROM panel on the patient detail page: a trend chart per instrument
 * that has readings, plus a table of the most recent measures. Writers
 * can record a new measure and correct an existing one. */
@Component({
  selector: 'app-prom-list',
  imports: [RouterLink, PromTrend],
  templateUrl: './prom-list.html',
  styleUrl: './prom-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromList {
  private readonly service = inject(PromsService);
  private readonly auth = inject(Auth);

  readonly meta = INSTRUMENT_META;

  readonly patientId = input.required<number>();

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly proms = rxResource({
    params: () => ({ patientId: this.patientId() }),
    stream: ({ params }) => this.service.list(params.patientId),
  });

  /** All rows, newest first (the API already returns them that way when
   * no instrument filter is applied). */
  readonly recent = computed(() => this.proms.value() ?? []);

  readonly trends = computed<TrendView[]>(() => {
    const grouped = toTrends(this.proms.value() ?? []);
    return [...grouped.entries()].map(([instrument, points]) => ({
      instrument,
      label: INSTRUMENT_META[instrument].label,
      points,
    }));
  });

  labelFor(instrument: PromInstrument): string {
    return INSTRUMENT_META[instrument].label;
  }
}
