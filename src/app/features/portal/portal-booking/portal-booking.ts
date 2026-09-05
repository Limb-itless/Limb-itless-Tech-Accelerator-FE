import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

import { appointmentTypeLabel } from '../../availability/availability.model';
import {
  Appointment,
  appointmentStatusLabel,
  coverageStatusLabel,
  isBooked,
} from './booking.model';
import { BookingService } from './booking.service';

/** Book a session, and manage the ones you already have. One combined
 * page rather than separate "browse" / "my appointments" routes -
 * rescheduling reuses the same slot list a fresh booking does, just in
 * a different mode (see `reschedulingId`). */
@Component({
  selector: 'app-portal-booking',
  imports: [RouterLink],
  templateUrl: './portal-booking.html',
  styleUrl: './portal-booking.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalBooking {
  private readonly service = inject(BookingService);

  readonly appointmentTypeLabel = appointmentTypeLabel;
  readonly appointmentStatusLabel = appointmentStatusLabel;
  readonly coverageStatusLabel = coverageStatusLabel;

  readonly data = rxResource({
    params: () => ({}),
    stream: () =>
      forkJoin({
        appointments: this.service.myAppointments(),
        slots: this.service.availability(),
      }),
  });

  readonly upcoming = computed<Appointment[]>(() =>
    (this.data.value()?.appointments ?? []).filter(isBooked),
  );
  readonly history = computed<Appointment[]>(() =>
    (this.data.value()?.appointments ?? []).filter((a) => !isBooked(a)),
  );

  /** id of the appointment being moved - while set, the slot list below
   * books into it instead of creating a new appointment. */
  readonly reschedulingId = signal<number | null>(null);

  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly justBooked = signal(false);

  startReschedule(appointment: Appointment): void {
    this.reschedulingId.set(appointment.id);
    this.actionError.set(null);
    this.justBooked.set(false);
  }

  cancelReschedule(): void {
    this.reschedulingId.set(null);
  }

  chooseSlot(slotId: number): void {
    if (this.busy()) {
      return;
    }
    const reschedulingId = this.reschedulingId();
    this.busy.set(true);
    this.actionError.set(null);
    this.justBooked.set(false);

    const request$: Observable<unknown> =
      reschedulingId !== null
        ? this.service.reschedule(reschedulingId, { newSlotId: slotId })
        : this.service.book({ slotId });

    request$.subscribe({
      next: () => {
        this.busy.set(false);
        this.reschedulingId.set(null);
        this.justBooked.set(true);
        this.data.reload();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.actionError.set(this.messageFor(error));
      },
    });
  }

  cancel(appointment: Appointment): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);
    this.justBooked.set(false);
    this.service.cancel(appointment.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.data.reload();
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
