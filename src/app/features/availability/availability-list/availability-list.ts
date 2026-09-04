import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../core/auth/auth';
import {
  AvailabilitySlot,
  SLOT_STATUSES,
  SlotStatus,
  appointmentTypeLabel,
  slotStatusLabel,
} from '../availability.model';
import { AvailabilityService } from '../availability.service';

/** The practice's published availability — every practitioner's slots,
 * newest first isn't meaningful here so it's soonest-first (the API's
 * own order). Anyone who can see the schedule (clinician / prosthetist
 * / practice_administrator) sees everyone's slots; only the owning
 * practitioner gets Edit / Block / Reopen on a given row. */
@Component({
  selector: 'app-availability-list',
  imports: [RouterLink],
  templateUrl: './availability-list.html',
  styleUrl: './availability-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityList {
  private readonly service = inject(AvailabilityService);
  private readonly auth = inject(Auth);

  readonly statuses = SLOT_STATUSES;
  readonly appointmentTypeLabel = appointmentTypeLabel;
  readonly slotStatusLabel = slotStatusLabel;

  readonly practitionerFilter = signal<number | null>(null);
  readonly statusFilter = signal<SlotStatus | null>(null);

  readonly canWrite = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly staff = rxResource({
    params: () => ({}),
    stream: () => this.service.staff(),
  });

  readonly slots = rxResource({
    params: () => ({
      practitionerId: this.practitionerFilter() ?? undefined,
      status: this.statusFilter() ?? undefined,
    }),
    stream: ({ params }) => this.service.list(params),
  });

  /** id of the slot whose block/reopen request is in flight */
  readonly toggling = signal<number | null>(null);
  readonly toggleError = signal(false);

  isMine(slot: AvailabilitySlot): boolean {
    return slot.practitionerId === this.auth.currentUser()?.id;
  }

  timeRange(slot: AvailabilitySlot): string {
    const date = slot.startTime.slice(0, 10);
    const start = slot.startTime.slice(11, 16);
    const end = slot.endTime.slice(11, 16);
    return `${date}, ${start}–${end}`;
  }

  onPractitionerChange(value: string): void {
    this.practitionerFilter.set(value ? Number(value) : null);
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value ? (value as SlotStatus) : null);
  }

  toggleBlock(slot: AvailabilitySlot): void {
    if (this.toggling() !== null || slot.status === 'booked') {
      return;
    }
    this.toggling.set(slot.id);
    this.toggleError.set(false);
    const next: SlotStatus = slot.status === 'blocked' ? 'open' : 'blocked';
    this.service.update(slot.id, { status: next }).subscribe({
      next: () => {
        this.toggling.set(null);
        this.slots.reload();
      },
      error: () => {
        this.toggling.set(null);
        this.toggleError.set(true);
      },
    });
  }
}
