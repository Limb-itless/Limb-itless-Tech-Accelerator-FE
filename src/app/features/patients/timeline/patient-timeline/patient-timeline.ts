import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { KIND_LABEL, TIMELINE_KINDS, TimelineEvent, TimelineKind } from '../timeline.model';
import { TimelineService } from '../timeline.service';

type Filter = 'all' | TimelineKind;

@Component({
  selector: 'app-patient-timeline',
  imports: [RouterLink],
  templateUrl: './patient-timeline.html',
  styleUrl: './patient-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientTimeline {
  private readonly service = inject(TimelineService);
  private readonly auth = inject(Auth);

  readonly kinds = TIMELINE_KINDS;
  readonly kindLabel = KIND_LABEL;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();

  readonly filter = signal<Filter>('all');

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly events = rxResource({
    params: () => ({ patientId: Number(this.id()) }),
    stream: ({ params }) => this.service.list(params.patientId),
  });

  readonly visible = computed<TimelineEvent[]>(() => {
    const all = this.events.value() ?? [];
    const active = this.filter();
    return active === 'all' ? all : all.filter((event) => event.kind === active);
  });

  readonly filterLabel = computed(() =>
    this.filter() === 'all' ? 'timeline' : KIND_LABEL[this.filter() as TimelineKind],
  );

  readonly counts = computed<Record<Filter, number>>(() => {
    const all = this.events.value() ?? [];
    return {
      all: all.length,
      milestone: all.filter((e) => e.kind === 'milestone').length,
      prom: all.filter((e) => e.kind === 'prom').length,
      note: all.filter((e) => e.kind === 'note').length,
    };
  });

  setFilter(value: Filter): void {
    this.filter.set(value);
  }
}
