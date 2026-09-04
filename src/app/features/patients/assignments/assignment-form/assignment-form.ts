import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { AssignmentCreate, assignmentRoleLabel } from '../assignment.model';
import { AssignmentsService } from '../assignments.service';

/** Adds a clinician or prosthetist to a patient's care team. The role
 * comes from the chosen user, so the form is just a staff picker plus an
 * optional start date and note. Assignments are ended, never edited, so
 * there is no edit mode. */
@Component({
  selector: 'app-assignment-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './assignment-form.html',
  styleUrl: './assignment-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AssignmentsService);
  private readonly router = inject(Router);

  readonly roleLabel = assignmentRoleLabel;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly staff = rxResource({
    params: () => ({}),
    stream: () => this.service.staff(),
  });

  readonly form = this.fb.group({
    userId: ['', [Validators.required]],
    startDate: [''],
    notes: [''],
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
    const payload: AssignmentCreate = {
      userId: Number(raw.userId),
      startDate: raw.startDate.trim() || null,
      notes: raw.notes.trim() || null,
    };

    const patientId = Number(this.id());
    this.service.create(patientId, payload).subscribe({
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
        return "That person is already on this patient's care team.";
      }
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not assign that person. Please try again.';
  }
}
