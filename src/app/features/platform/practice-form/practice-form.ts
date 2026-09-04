import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { humanise } from '../../patients/patient.model';
import { PRACTICE_TYPES, PracticeType, PracticeUpdate } from '../platform.model';
import { PlatformService } from '../platform.service';

/** Edit a practice's name / type / address. Onboarding a new practice is
 * a different flow (PracticeOnboard). */
@Component({
  selector: 'app-practice-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './practice-form.html',
  styleUrl: './practice-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(PlatformService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly types = PRACTICE_TYPES;

  readonly id = input.required<string>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    type: ['hospital_network' as PracticeType, [Validators.required]],
    address: ['', [Validators.maxLength(500)]],
  });

  private readonly existing = rxResource({
    params: () => ({ id: Number(this.id()) }),
    stream: ({ params }) => this.service.getPractice(params.id),
  });

  constructor() {
    effect(() => {
      const practice = this.existing.value();
      if (practice) {
        this.form.setValue({
          name: practice.name,
          type: practice.type,
          address: practice.address ?? '',
        });
      }
    });
  }

  get invalidName(): boolean {
    const field = this.form.controls.name;
    return field.invalid && field.touched;
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
    const payload: PracticeUpdate = {
      name: raw.name.trim(),
      type: raw.type,
      address: raw.address.trim() || null,
    };

    this.service.updatePractice(Number(this.id()), payload).subscribe({
      next: () => this.router.navigate(['/platform', Number(this.id())]),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not save the practice. Please try again.';
  }
}
