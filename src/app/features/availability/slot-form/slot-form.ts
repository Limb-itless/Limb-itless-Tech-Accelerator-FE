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
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import {
  APPOINTMENT_TYPES,
  AppointmentType,
  AvailabilitySlotCreate,
  AvailabilitySlotUpdate,
  SlotStatus,
  addMinutesLocal,
  appointmentTypeLabel,
  minutesBetweenLocal,
} from '../availability.model';
import { AvailabilityService } from '../availability.service';

type Mode = 'create' | 'edit';

const DEFAULT_DURATION = 30;

/** Publish a slot, or edit one of your own that hasn't been booked yet
 * (the API 400s on an edit once it has — see `messageFor`). Duration
 * (minutes) drives `endTime` rather than a separate end-time picker;
 * the API itself only stores start/end. */
@Component({
  selector: 'app-slot-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './slot-form.html',
  styleUrl: './slot-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AvailabilityService);
  private readonly router = inject(Router);

  readonly appointmentTypeLabel = appointmentTypeLabel;
  readonly types = APPOINTMENT_TYPES;

  readonly id = input<string>();
  readonly mode = input<Mode>('create');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly heading = computed(() => (this.mode() === 'edit' ? 'Edit slot' : 'Publish a slot'));

  readonly form = this.fb.group({
    startTime: ['', [Validators.required]],
    duration: [DEFAULT_DURATION, [Validators.required, Validators.min(5), Validators.max(480)]],
    appointmentType: ['review' as AppointmentType, [Validators.required]],
    status: ['open' as SlotStatus, [Validators.required]],
    notes: [''],
  });

  private readonly existing = rxResource({
    params: () => {
      const id = this.id();
      return id && this.mode() === 'edit' ? { id: Number(id) } : undefined;
    },
    stream: ({ params }) => this.service.get(params.id),
  });

  constructor() {
    effect(() => {
      const slot = this.existing.value();
      if (slot) {
        const startLocal = slot.startTime.slice(0, 16);
        const endLocal = slot.endTime.slice(0, 16);
        this.form.setValue({
          startTime: startLocal,
          duration: minutesBetweenLocal(startLocal, endLocal),
          appointmentType: slot.appointmentType,
          status: slot.status === 'blocked' ? 'blocked' : 'open',
          notes: slot.notes ?? '',
        });
      }
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
    const startTime = raw.startTime;
    const endTime = addMinutesLocal(startTime, raw.duration);

    const id = this.id();
    if (this.mode() === 'edit' && id) {
      const payload: AvailabilitySlotUpdate = {
        startTime,
        endTime,
        appointmentType: raw.appointmentType,
        status: raw.status,
        notes: raw.notes.trim() || null,
      };
      this.service.update(Number(id), payload).subscribe({
        next: () => this.router.navigate(['/availability']),
        error: (error: unknown) => {
          this.submitting.set(false);
          this.errorMessage.set(this.messageFor(error));
        },
      });
      return;
    }

    const payload: AvailabilitySlotCreate = {
      startTime,
      endTime,
      appointmentType: raw.appointmentType,
      status: raw.status,
      notes: raw.notes.trim() || null,
    };
    this.service.create(payload).subscribe({
      next: () => this.router.navigate(['/availability']),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'This overlaps a slot you already have.';
      }
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not save this slot. Please try again.';
  }
}
