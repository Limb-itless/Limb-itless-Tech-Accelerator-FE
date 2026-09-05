import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { Auth } from '../../../core/auth/auth';
import { appointmentTypeLabel } from '../../availability/availability.model';
import { AvailabilityService } from '../../availability/availability.service';
import {
  APPOINTMENT_STATUSES,
  Appointment,
  AppointmentStatus,
  appointmentStatusLabel,
  coverageStatusLabel,
} from '../appointment.model';
import { AppointmentsService } from '../appointments.service';

/** The practice's appointments, for front-desk/clinical staff to
 * triage: filter, cancel (reason required), mark a no-show, or
 * reschedule. Reschedule reuses one shared "pick an open slot" panel
 * below the table (same pattern as the patient portal's booking page)
 * rather than a separate picker per row. Read-only for a practice
 * administrator. */
@Component({
  selector: 'app-appointments-list',
  imports: [],
  templateUrl: './appointments-list.html',
  styleUrl: './appointments-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentsList {
  private readonly service = inject(AppointmentsService);
  private readonly availability = inject(AvailabilityService);
  private readonly auth = inject(Auth);

  readonly statuses = APPOINTMENT_STATUSES;
  readonly appointmentTypeLabel = appointmentTypeLabel;
  readonly appointmentStatusLabel = appointmentStatusLabel;
  readonly coverageStatusLabel = coverageStatusLabel;

  readonly practitionerFilter = signal<number | null>(null);
  // "booked" by default - a triage view is about what still needs
  // attention, not the full history. "All statuses" clears it.
  readonly statusFilter = signal<AppointmentStatus | null>('booked');

  readonly canWrite = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly staff = rxResource({
    params: () => ({}),
    stream: () => this.availability.staff(),
  });

  readonly openSlots = rxResource({
    params: () => ({}),
    stream: () => this.availability.list({ status: 'open' }),
  });

  readonly appointments = rxResource({
    params: () => ({
      practitionerId: this.practitionerFilter() ?? undefined,
      status: this.statusFilter() ?? undefined,
    }),
    stream: ({ params }) => this.service.list(params),
  });

  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly cancellingId = signal<number | null>(null);
  readonly cancelReason = signal('');

  readonly reschedulingId = signal<number | null>(null);

  isPast(iso: string): boolean {
    return new Date(iso).getTime() < Date.now();
  }

  onPractitionerChange(value: string): void {
    this.practitionerFilter.set(value ? Number(value) : null);
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value ? (value as AppointmentStatus) : null);
  }

  startCancel(appointment: Appointment): void {
    this.cancellingId.set(appointment.id);
    this.cancelReason.set('');
    this.actionError.set(null);
  }

  backFromCancel(): void {
    this.cancellingId.set(null);
  }

  confirmCancel(appointmentId: number): void {
    const reason = this.cancelReason().trim();
    if (!reason || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);
    this.service.cancel(appointmentId, { reason }).subscribe({
      next: () => {
        this.busy.set(false);
        this.cancellingId.set(null);
        this.appointments.reload();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.actionError.set(this.messageFor(error));
      },
    });
  }

  noShow(appointment: Appointment): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);
    this.service.noShow(appointment.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.appointments.reload();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.actionError.set(this.messageFor(error));
      },
    });
  }

  startReschedule(appointment: Appointment): void {
    this.reschedulingId.set(appointment.id);
    this.actionError.set(null);
  }

  cancelReschedule(): void {
    this.reschedulingId.set(null);
  }

  chooseSlot(slotId: number): void {
    const id = this.reschedulingId();
    if (id === null || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);
    this.service.reschedule(id, { newSlotId: slotId }).subscribe({
      next: () => {
        this.busy.set(false);
        this.reschedulingId.set(null);
        this.appointments.reload();
        this.openSlots.reload();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.actionError.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'That slot is no longer available. Please choose another.';
      }
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
