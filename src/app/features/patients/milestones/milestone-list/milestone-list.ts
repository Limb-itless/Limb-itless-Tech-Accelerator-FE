import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { humanise } from '../../patient.model';
import { Milestone, MilestoneStatus, isOverdue } from '../milestone.model';
import { MilestonesService } from '../milestones.service';

/** Ordered recovery-milestone timeline for a patient, embedded in the
 * patient detail page. Writers can add a milestone, apply a standard
 * pathway, edit, and mark a milestone complete. */
@Component({
  selector: 'app-milestone-list',
  imports: [RouterLink],
  templateUrl: './milestone-list.html',
  styleUrl: './milestone-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MilestoneList {
  private readonly service = inject(MilestonesService);
  private readonly auth = inject(Auth);

  readonly humanise = humanise;
  readonly isOverdue = isOverdue;

  readonly patientId = input.required<number>();

  readonly busyId = signal<number | null>(null);

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly milestones = rxResource({
    params: () => ({ patientId: this.patientId() }),
    stream: ({ params }) => this.service.list(params.patientId),
  });

  statusModifier(status: MilestoneStatus): string {
    return `milestones__badge--${status}`;
  }

  markComplete(milestone: Milestone): void {
    if (this.busyId() !== null || milestone.status === 'complete') {
      return;
    }
    this.busyId.set(milestone.id);
    this.service.complete(this.patientId(), milestone.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.milestones.reload();
      },
      error: () => this.busyId.set(null),
    });
  }
}
