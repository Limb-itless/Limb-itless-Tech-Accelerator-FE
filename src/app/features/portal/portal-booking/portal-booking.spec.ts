import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Appointment } from './booking.model';
import { BookingService } from './booking.service';
import { PortalBooking } from './portal-booking';

const BOOKED: Appointment = {
  id: 1,
  practiceId: 1,
  siteId: null,
  patientId: 1,
  practitionerId: 5,
  practitionerEmail: 'clin@northgate.example',
  slotId: 7,
  appointmentType: 'review',
  scheduledStart: '2026-09-05T09:00:00',
  scheduledEnd: '2026-09-05T09:30:00',
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

const CANCELLED: Appointment = {
  ...BOOKED,
  id: 2,
  status: 'cancelled_by_patient',
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
  myAppointments = vi.fn().mockReturnValue(of([BOOKED, CANCELLED])),
  availability = vi.fn().mockReturnValue(of([SLOT])),
  book = vi.fn().mockReturnValue(of({ ...SLOT, id: 3 })),
  cancel = vi.fn().mockReturnValue(of({ ...BOOKED, status: 'cancelled_by_patient' })),
  reschedule = vi
    .fn()
    .mockReturnValue(
      of({ previous: { ...BOOKED, status: 'rescheduled' }, new: { ...BOOKED, id: 4 } }),
    ),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PortalBooking],
    providers: [
      provideRouter([]),
      {
        provide: BookingService,
        useValue: { myAppointments, availability, book, cancel, reschedule },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PortalBooking);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, myAppointments, availability, book, cancel, reschedule };
}

describe('PortalBooking', () => {
  it('splits upcoming from past appointments', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.textContent).toContain('Upcoming');
    expect(fixture.nativeElement.textContent).toContain('Past appointments (1)');
    expect(fixture.nativeElement.querySelectorAll('.booking__item').length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('shows a coverage badge on a pending appointment', async () => {
    const { fixture } = await setup();
    const badge = fixture.nativeElement.querySelector('.booking__badge');
    expect(badge?.textContent).toContain('Awaiting medical-aid approval');
  });

  it('books an open slot', async () => {
    const { fixture, book } = await setup();
    const bookButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.trim() === 'Book',
    );
    bookButton.click();
    expect(book).toHaveBeenCalledWith({ slotId: 9 });
  });

  it('cancels an upcoming appointment', async () => {
    const { fixture, cancel } = await setup();
    const cancelButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.trim() === 'Cancel appointment',
    );
    cancelButton.click();
    expect(cancel).toHaveBeenCalledWith(1);
  });

  it('reschedules by choosing a slot after starting reschedule mode', async () => {
    const { fixture, reschedule } = await setup();
    const rescheduleButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.trim() === 'Reschedule',
    );
    rescheduleButton.click();
    fixture.detectChanges();

    const moveButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.trim() === 'Move here',
    );
    expect(moveButton).toBeTruthy();
    moveButton.click();
    expect(reschedule).toHaveBeenCalledWith(1, { newSlotId: 9 });
  });

  it('shows an empty state with no upcoming appointments', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(of([])));
    expect(fixture.nativeElement.textContent).toContain('You have no upcoming appointments.');
  });

  it('surfaces a friendly error on failure', async () => {
    const { fixture } = await setup(
      vi.fn().mockReturnValue(of([BOOKED])),
      vi.fn().mockReturnValue(throwError(() => new Error('x'))),
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
