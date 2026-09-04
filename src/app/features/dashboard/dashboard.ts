import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../core/auth/auth';
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
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly humanise = humanise;

  readonly view = signal<DashboardView>('practice');

  constructor() {
    // Roles with no caseload land here from the static '' redirect; send
    // them to their own area.
    effect(() => {
      const role = this.auth.currentUser()?.role;
      if (role === 'platform_administrator') {
        void this.router.navigateByUrl('/platform');
      } else if (role === 'patient') {
        void this.router.navigateByUrl('/portal');
      }
    });
  }

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
