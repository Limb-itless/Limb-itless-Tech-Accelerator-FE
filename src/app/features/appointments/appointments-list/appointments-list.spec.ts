import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { AvailabilityService } from '../../availability/availability.service';
import { Appointment } from '../appointment.model';
import { AppointmentsService } from '../appointments.service';
import { AppointmentsList } from './appointments-list';

const PAST_BOOKED: Appointment = {
  id: 1,
  practiceId: 1,
  siteId: null,
  patientId: 3,
  patientName: 'Pat One',
  practitionerId: 5,
  practitionerEmail: 'clin@northgate.example',
  slotId: 7,
  appointmentType: 'review',
  scheduledStart: '2020-01-01T09:00:00',
  scheduledEnd: '2020-01-01T09:30:00',
  status: 'booked',
  cancellationReason: null,
  cancelledAt: null,
  lateCancellation: false,
  rescheduledToId: null,
  rescheduledFromId: null,
  coverageStatus: 'pending',
  notes: null,
  createdAt: '',
  updatedAt: '',
};

const FUTURE_BOOKED: Appointment = {
  ...PAST_BOOKED,
  id: 2,
  scheduledStart: '2099-01-01T09:00:00',
  scheduledEnd: '2099-01-01T09:30:00',
  coverageStatus: null,
};

const SLOT = {
  id: 9,
  practiceId: 1,
  siteId: null,
  practitionerId: 6,
  practitionerEmail: 'pros@northgate.example',
  startTime: '2026-09-06T10:00:00',
  endTime: '2026-09-06T10:30:00',
  appointmentType: 'fitting' as const,
  status: 'open' as const,
  notes: null,
  createdAt: '',
  updatedAt: '',
};

async function setup(
  role = 'clinician',
  list = vi.fn().mockReturnValue(of([PAST_BOOKED, FUTURE_BOOKED])),
  cancel = vi.fn().mockReturnValue(of({ ...PAST_BOOKED, status: 'cancelled_by_practitioner' })),
  noShow = vi.fn().mockReturnValue(of({ ...PAST_BOOKED, status: 'no_show' })),
  reschedule = vi
    .fn()
    .mockReturnValue(
      of({ previous: { ...PAST_BOOKED, status: 'rescheduled' }, new: { ...PAST_BOOKED, id: 3 } }),
    ),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AppointmentsList],
    providers: [
      { provide: AppointmentsService, useValue: { list, cancel, noShow, reschedule } },
      {
        provide: AvailabilityService,
        useValue: {
          staff: vi.fn().mockReturnValue(of([])),
          list: vi.fn().mockReturnValue(of([SLOT])),
        },
      },
      { provide: Auth, useValue: { currentUser: signal({ role }) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(AppointmentsList);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list, cancel, noShow, reschedule };
}

describe('AppointmentsList', () => {
  it('defaults the status filter to Booked, visibly and in the query', async () => {
    const { fixture, list } = await setup();
    const selects = fixture.nativeElement.querySelectorAll('.triage__filter select');
    const statusSelect: HTMLSelectElement = selects[1];
    expect(statusSelect.value).toBe('booked');
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ status: 'booked' }));
  });

  it('lists appointments with a coverage badge when one exists', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.triage__table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Pat One');
    expect(rows[0].querySelector('.triage__badge--cov-pending')).not.toBeNull();
  });

  it('only offers No-show for a past booked appointment', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.triage__table tbody tr');
    const pastButtons = [...rows[0].querySelectorAll('button')].map((b: HTMLButtonElement) =>
      b.textContent?.trim(),
    );
    expect(pastButtons).toContain('No-show');
    const futureButtons = [...rows[1].querySelectorAll('button')].map((b: HTMLButtonElement) =>
      b.textContent?.trim(),
    );
    expect(futureButtons).not.toContain('No-show');
  });

  it('cancels with a required reason', async () => {
    const { fixture, cancel } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.triage__table tbody tr');
    const cancelButton = [...rows[0].querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.trim() === 'Cancel',
    );
    cancelButton.click();
    fixture.detectChanges();

    const confirmButton = rows[0].querySelector('.triage__cancel-form button');
    // Nothing typed yet - Confirm stays disabled.
    expect(confirmButton.disabled).toBe(true);

    fixture.componentInstance.cancelReason.set('Practitioner unavailable');
    fixture.detectChanges();
    rows[0].querySelector('.triage__cancel-form button').click();

    expect(cancel).toHaveBeenCalledWith(1, { reason: 'Practitioner unavailable' });
  });

  it('marks a no-show', async () => {
    const { fixture, noShow } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.triage__table tbody tr');
    const noShowButton = [...rows[0].querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.trim() === 'No-show',
    );
    noShowButton.click();
    expect(noShow).toHaveBeenCalledWith(1);
  });

  it('reschedules by choosing an open slot', async () => {
    const { fixture, reschedule } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.triage__table tbody tr');
    const rescheduleButton = [...rows[0].querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.trim() === 'Reschedule',
    );
    rescheduleButton.click();
    fixture.detectChanges();

    const moveButton = fixture.nativeElement.querySelector('.triage__slot button');
    expect(moveButton).toBeTruthy();
    moveButton.click();
    expect(reschedule).toHaveBeenCalledWith(1, { newSlotId: 9 });
  });

  it('hides all actions for a practice administrator', async () => {
    const { fixture } = await setup('practice_administrator');
    expect(fixture.nativeElement.querySelector('.triage__actions button')).toBeNull();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(
      'clinician',
      vi.fn().mockReturnValue(throwError(() => new Error('x'))),
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
