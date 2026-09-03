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
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { CAUSE_OF_LIMB_LOSS, LIMB_LOSS_LEVELS, PatientCreate, humanise } from '../patient.model';
import { PatientsService } from '../patients.service';

function identityRequired(group: AbstractControl): ValidationErrors | null {
  const nationalId = (group.get('nationalId')?.value ?? '').trim();
  const passport = (group.get('passportNumber')?.value ?? '').trim();
  return nationalId || passport ? null : { identityRequired: true };
}

@Component({
  selector: 'app-patient-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(PatientsService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly causes = CAUSE_OF_LIMB_LOSS;
  readonly levels = LIMB_LOSS_LEVELS;

  /** `:id` route parameter; absent when creating. */
  readonly id = input<string>();
  readonly mode = computed<'create' | 'edit'>(() => (this.id() ? 'edit' : 'create'));

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(120)]],
      lastName: ['', [Validators.required, Validators.maxLength(120)]],
      dateOfBirth: ['', [Validators.required]],
      nationalId: ['', [Validators.maxLength(20)]],
      passportNumber: ['', [Validators.maxLength(40)]],
      contactEmail: ['', [Validators.email]],
      contactPhone: ['', [Validators.maxLength(40)]],
      address: ['', [Validators.maxLength(500)]],
      causeOfLimbLoss: [''],
      limbLossLevel: [''],
      medicalHistory: [''],
      comorbidities: [''],
    },
    { validators: identityRequired },
  );

  private readonly existing = rxResource({
    params: () => {
      const id = this.id();
      return id ? { id: Number(id) } : undefined;
    },
    stream: ({ params }) => this.service.get(params.id),
  });

  constructor() {
    effect(() => {
      const patient = this.existing.value();
      if (!patient) {
        return;
      }
      this.form.setValue({
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        nationalId: patient.nationalId ?? '',
        passportNumber: patient.passportNumber ?? '',
        contactEmail: patient.contactEmail ?? '',
        contactPhone: patient.contactPhone ?? '',
        address: patient.address ?? '',
        causeOfLimbLoss: patient.causeOfLimbLoss ?? '',
        limbLossLevel: patient.limbLossLevel ?? '',
        medicalHistory: patient.medicalHistory ?? '',
        comorbidities: patient.comorbidities ?? '',
      });
    });
  }

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && field.touched;
  }

  get identityMissing(): boolean {
    return this.form.hasError('identityRequired') && this.form.touched;
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
    const blankToNull = (value: string): string | null => value.trim() || null;
    const payload: PatientCreate = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      dateOfBirth: raw.dateOfBirth,
      nationalId: blankToNull(raw.nationalId),
      passportNumber: blankToNull(raw.passportNumber),
      contactEmail: blankToNull(raw.contactEmail),
      contactPhone: blankToNull(raw.contactPhone),
      address: blankToNull(raw.address),
      medicalHistory: blankToNull(raw.medicalHistory),
      comorbidities: blankToNull(raw.comorbidities),
      causeOfLimbLoss: (raw.causeOfLimbLoss || null) as PatientCreate['causeOfLimbLoss'],
      limbLossLevel: (raw.limbLossLevel || null) as PatientCreate['limbLossLevel'],
    };

    const id = this.id();
    const request$ = id ? this.service.update(Number(id), payload) : this.service.create(payload);

    request$.subscribe({
      next: (patient) => this.router.navigate(['/patients', patient.id]),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'Another patient in this practice already has that ID or passport number.';
      }
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not save the patient. Please try again.';
  }
}
