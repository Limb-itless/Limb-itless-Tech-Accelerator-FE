import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { AvailabilityService } from '../availability.service';
import { AvailabilityList } from './availability-list';

const MINE_OPEN = {
  id: 1,
  practiceId: 1,
  siteId: null,
  practitionerId: 5,
  practitionerEmail: 'clin@northgate.example',
  startTime: '2026-09-05T09:00:00',
  endTime: '2026-09-05T09:30:00',
  appointmentType: 'review',
  status: 'open',
  notes: null,
  createdAt: '',
  updatedAt: '',
};

const OTHERS_BOOKED = {
  ...MINE_OPEN,
  id: 2,
  practitionerId: 9,
  practitionerEmail: 'pros@northgate.example',
  status: 'booked',
};

async function setup(
  role = 'clinician',
  list = vi.fn().mockReturnValue(of([MINE_OPEN, OTHERS_BOOKED])),
  update = vi.fn().mockReturnValue(of({ ...MINE_OPEN, status: 'blocked' })),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AvailabilityList],
    providers: [
      provideRouter([]),
      {
        provide: AvailabilityService,
        useValue: { list, update, staff: vi.fn().mockReturnValue(of([])) },
      },
      { provide: Auth, useValue: { currentUser: signal({ id: 5, role }) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(AvailabilityList);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list, update };
}

describe('AvailabilityList', () => {
  it('lists every slot in the practice', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.availability__table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('clin@northgate.example');
    expect(rows[1].textContent).toContain('pros@northgate.example');
  });

  it("only shows Edit/Block on the caller's own open slot", async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.availability__table tbody tr');
    expect(rows[0].querySelector('a')?.textContent).toBe('Edit');
    expect(rows[0].querySelector('button')?.textContent?.trim()).toBe('Block');
    // Someone else's (and a booked) slot gets no actions.
    expect(rows[1].querySelector('a')).toBeNull();
    expect(rows[1].querySelector('button')).toBeNull();
  });

  it('blocks an open slot and reloads', async () => {
    const { fixture, update } = await setup();
    fixture.nativeElement.querySelector('.availability__actions button').click();
    expect(update).toHaveBeenCalledWith(1, { status: 'blocked' });
  });

  it('hides "Publish slot" for a practice administrator', async () => {
    const { fixture } = await setup('practice_administrator');
    expect(fixture.nativeElement.querySelector('.availability__new')).toBeNull();
  });

  it('shows an empty state when nothing matches', async () => {
    const { fixture } = await setup('clinician', vi.fn().mockReturnValue(of([])));
    expect(fixture.nativeElement.textContent).toContain('No slots match these filters.');
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(
      'clinician',
      vi.fn().mockReturnValue(throwError(() => new Error('x'))),
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
