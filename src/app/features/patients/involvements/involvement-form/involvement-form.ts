import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { CAUSE_OF_LIMB_LOSS, LIMB_LOSS_LEVELS, humanise } from '../../patient.model';
import {
  BODY_REGIONS,
  INVOLVEMENT_KINDS,
  INVOLVEMENT_STATUSES,
  InvolvementCreate,
  InvolvementKind,
  causeApplies,
  kindLabel,
  levelApplies,
  regionLabel,
} from '../involvement.model';
import { InvolvementsService } from '../involvements.service';

type Mode = 'create' | 'edit' | 'first';

@Component({
  selector: 'app-involvement-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './involvement-form.html',
  styleUrl: './involvement-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvolvementForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(InvolvementsService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly kinds = INVOLVEMENT_KINDS;
  readonly regions = BODY_REGIONS;
  readonly levels = LIMB_LOSS_LEVELS;
  readonly causes = CAUSE_OF_LIMB_LOSS;
  readonly statuses = INVOLVEMENT_STATUSES;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();
  /** `:involvementId` route parameter — absent when creating. */
  readonly involvementId = input<string>();
  /** From route `data`; 'first' = the optional second step of onboarding. */
  readonly mode = input<Mode>('create');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly heading = computed(() =>
    this.mode() === 'edit' ? 'Edit limb involvement' : 'Add a limb involvement',
  );

  readonly form = this.fb.group({
    kind: ['amputation' as InvolvementKind, [Validators.required]],
    region: ['', [Validators.required]],
    level: [''],
    cause: [''],
    onsetDate: [''],
    status: ['active'],
    notes: [''],
  });

  private readonly kindValue = toSignal(this.form.controls.kind.valueChanges, {
    initialValue: 'amputation' as InvolvementKind,
  });
  readonly levelApplies = computed(() => levelApplies(this.kindValue()));
  readonly causeApplies = computed(() => causeApplies(this.kindValue()));

  private readonly existing = rxResource({
    params: () => {
      const involvementId = this.involvementId();
      return involvementId && this.mode() === 'edit'
        ? { patientId: Number(this.id()), involvementId: Number(involvementId) }
        : undefined;
    },
    stream: ({ params }) => this.service.get(params.patientId, params.involvementId),
  });

  constructor() {
    effect(() => {
      const involvement = this.existing.value();
      if (!involvement) {
        return;
      }
      this.form.setValue({
        kind: involvement.kind,
        region: involvement.region,
        level: involvement.level ?? '',
        cause: involvement.cause ?? '',
        onsetDate: involvement.onsetDate ?? '',
        status: involvement.status,
        notes: involvement.notes ?? '',
      });
    });
  }

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
    const payload: InvolvementCreate = {
      kind: raw.kind,
      region: raw.region as InvolvementCreate['region'],
      level: this.levelApplies() ? ((raw.level || null) as InvolvementCreate['level']) : null,
      cause: this.causeApplies() ? ((raw.cause || null) as InvolvementCreate['cause']) : null,
      onsetDate: raw.onsetDate.trim() || null,
      notes: raw.notes.trim() || null,
    };
    if (this.mode() === 'edit') {
      payload.status = raw.status as InvolvementCreate['status'];
    }

    const patientId = Number(this.id());
    const involvementId = this.involvementId() ? Number(this.involvementId()) : null;
    const request$ =
      this.mode() === 'edit' && involvementId !== null
        ? this.service.update(patientId, involvementId, payload)
        : this.service.create(patientId, payload);

    request$.subscribe({
      next: () => this.router.navigate(['/patients', patientId]),
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
    return 'Could not save the involvement. Please try again.';
  }
}
