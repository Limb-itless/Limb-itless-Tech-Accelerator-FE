import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../../core/auth/auth';
import { TimelineEvent } from '../timeline.model';
import { TimelineService } from '../timeline.service';
import { PatientTimeline } from './patient-timeline';

function event(over: Partial<TimelineEvent>): TimelineEvent {
  return {
    kind: 'note',
    occurredAt: '2026-03-01T09:00:00',
    refId: 1,
    title: 'A note',
    milestone: null,
    prom: null,
    note: null,
    ...over,
  };
}

const FEED: TimelineEvent[] = [
  event({
    kind: 'note',
    refId: 1,
    title: 'Reviewed gait',
    occurredAt: '2026-03-03T09:00:00',
    note: {
      id: 1,
      patientId: 5,
      involvementId: null,
      authorId: 9,
      body: 'Full note body here',
      createdAt: '',
      updatedAt: '',
    },
  }),
  event({
    kind: 'prom',
    refId: 9,
    title: 'pain residual limb: 8 (flagged)',
    occurredAt: '2026-03-02T09:00:00',
    prom: {
      id: 9,
      patientId: 5,
      involvementId: null,
      deviceId: null,
      instrument: 'pain_residual_limb',
      responses: { score: 8 },
      score: 8,
      flagged: true,
      flagReason: 'Residual limb pain 7+/10',
      recordedAt: '2026-03-02T09:00:00',
      recordedById: 9,
      notes: null,
      createdAt: '',
      updatedAt: '',
    },
  }),
  event({
    kind: 'milestone',
    refId: 4,
    title: 'Initial fitting delivery — complete',
    occurredAt: '2026-03-01T09:00:00',
  }),
];

async function setup(role = 'clinician', feed = FEED, list = vi.fn().mockReturnValue(of(feed))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PatientTimeline],
    providers: [
      provideRouter([]),
      { provide: TimelineService, useValue: { list } },
      { provide: Auth, useValue: { currentUser: signal({ role }) } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PatientTimeline);
  fixture.componentRef.setInput('id', '5');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list };
}

describe('PatientTimeline', () => {
  it('renders every event with its note body and flag reason', async () => {
    const { fixture, list } = await setup();
    expect(list).toHaveBeenCalledWith(5);
    expect(fixture.nativeElement.querySelectorAll('.timeline__item').length).toBe(3);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Full note body here');
    expect(text).toContain('Residual limb pain 7+/10');
  });

  it('filters by kind and counts each', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance.counts()).toEqual({ all: 3, milestone: 1, prom: 1, note: 1 });

    fixture.componentInstance.setFilter('prom');
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.timeline__item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('pain residual limb: 8');
  });

  it('shows "Add note" and note edit links only to writers', async () => {
    const writer = await setup('clinician');
    expect(writer.fixture.nativeElement.querySelector('.timeline__add')).not.toBeNull();
    expect(writer.fixture.nativeElement.querySelector('.timeline__edit')).not.toBeNull();

    const admin = await setup('practice_administrator');
    expect(admin.fixture.nativeElement.querySelector('.timeline__add')).toBeNull();
    expect(admin.fixture.nativeElement.querySelector('.timeline__edit')).toBeNull();
  });

  it('shows an empty state when there are no events', async () => {
    const { fixture } = await setup('clinician', []);
    expect(fixture.nativeElement.querySelector('.timeline__empty')).not.toBeNull();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(
      'clinician',
      [],
      vi.fn().mockReturnValue(throwError(() => new Error('x'))),
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
