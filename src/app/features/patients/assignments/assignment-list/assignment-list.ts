import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { Assignment, assignmentRoleLabel } from '../assignment.model';
import { AssignmentsService } from '../assignments.service';

/** Panel on the patient detail page: who is looking after this patient.
 * Current assignments up top with an "End" action for writers; ended
 * assignments collapsed below. Add goes to a routed form. */
@Component({
  selector: 'app-assignment-list',
  imports: [RouterLink],
  templateUrl: './assignment-list.html',
  styleUrl: './assignment-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentList {
  private readonly service = inject(AssignmentsService);
  private readonly auth = inject(Auth);

  readonly roleLabel = assignmentRoleLabel;

  readonly patientId = input.required<number>();

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly data = rxResource({
    params: () => ({ patientId: this.patientId() }),
    stream: ({ params }) => this.service.list(params.patientId),
  });

  readonly current = computed<Assignment[]>(() =>
    (this.data.value() ?? []).filter((a) => a.endDate === null),
  );
  readonly past = computed<Assignment[]>(() =>
    (this.data.value() ?? []).filter((a) => a.endDate !== null),
  );

  /** id of the assignment whose "End" request is in flight */
  readonly ending = signal<number | null>(null);
  readonly endError = signal(false);

  end(assignment: Assignment): void {
    if (this.ending() !== null) {
      return;
    }
    this.ending.set(assignment.id);
    this.endError.set(false);
    this.service.end(this.patientId(), assignment.id).subscribe({
      next: () => {
        this.ending.set(null);
        this.data.reload();
      },
      error: () => {
        this.ending.set(null);
        this.endError.set(true);
      },
    });
  }
}
