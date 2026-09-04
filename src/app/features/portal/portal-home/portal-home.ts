import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { humanise } from '../../patients/patient.model';
import { deviceTypeLabel } from '../../patients/devices/device.model';
import { kindLabel, regionLabel } from '../../patients/involvements/involvement.model';
import { Milestone, isOverdue } from '../../patients/milestones/milestone.model';
import { PortalService } from '../portal.service';

@Component({
  selector: 'app-portal-home',
  imports: [RouterLink],
  templateUrl: './portal-home.html',
  styleUrl: './portal-home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalHome {
  private readonly portal = inject(PortalService);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly deviceTypeLabel = deviceTypeLabel;

  readonly data = rxResource({
    params: () => ({}),
    stream: () =>
      forkJoin({
        profile: this.portal.profile(),
        involvements: this.portal.involvements(),
        milestones: this.portal.milestones(),
      }),
  });

  /** milestones still to come, earliest first */
  readonly nextSteps = computed<Milestone[]>(() => {
    const all = this.data.value()?.milestones ?? [];
    return all
      .filter((m) => m.status !== 'complete')
      .slice()
      .sort((a, b) => (a.targetDate ?? '').localeCompare(b.targetDate ?? ''));
  });

  readonly overdue = isOverdue;
}
