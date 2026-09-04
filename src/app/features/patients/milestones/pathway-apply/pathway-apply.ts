import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { humanise } from '../../patient.model';
import { kindLabel, regionLabel } from '../../involvements/involvement.model';
import { InvolvementsService } from '../../involvements/involvements.service';
import { PathwayApply as PathwayApplyPayload, TEMPLATED_PATHWAYS } from '../milestone.model';
import { MilestonesService } from '../milestones.service';

/** Applies a standard milestone template (lower- or upper-limb) to a
 * patient in one step, staggering the target dates by a fixed interval. */
@Component({
  selector: 'app-pathway-apply',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pathway-apply.html',
  styleUrl: './pathway-apply.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathwayApply {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(MilestonesService);
  private readonly involvementsService = inject(InvolvementsService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly pathways = TEMPLATED_PATHWAYS;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    carePathway: ['lower_limb', [Validators.required]],
    involvementId: [''],
    startDate: [''],
    intervalDays: [14, [Validators.required, Validators.min(1), Validators.max(365)]],
  });

  readonly involvementOptions = rxResource({
    params: () => ({ patientId: Number(this.id()) }),
    stream: ({ params }) => this.involvementsService.list(params.patientId),
  });

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && field.touched;
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const payload: PathwayApplyPayload = {
      carePathway: raw.carePathway as PathwayApplyPayload['carePathway'],
      involvementId: raw.involvementId ? Number(raw.involvementId) : null,
      startDate: raw.startDate.trim() || null,
      intervalDays: Number(raw.intervalDays) || 14,
    };

    const patientId = Number(this.id());
    this.service.applyPathway(patientId, payload).subscribe({
      next: () => this.router.navigate(['/patients', patientId]),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'This patient already has milestones for that pathway.';
      }
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not apply the pathway. Please try again.';
  }
}
