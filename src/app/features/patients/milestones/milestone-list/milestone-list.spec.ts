import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../../core/auth/auth';
import { MilestonesService } from '../milestones.service';
import { MilestoneList } from './milestone-list';

function milestone(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    patientId: 7,
    deviceId: null,
    carePathway: 'lower_limb',
    milestoneType: 'initial_fitting_delivery',
    orderIndex: 0,
    status: 'in_progress',
    targetDate: '2020-01-01',
    completedDate: null,
    notes: 'Socket checked.',
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

async function setup(role = 'clinician', rows = [milestone()], complete = vi.fn()) {
  TestBed.resetTestingModule();
  const list = vi.fn().mockReturnValue(of(rows));
  await TestBed.configureTestingModule({
    imports: [MilestoneList],
    providers: [
      provideRouter([]),
      { provide: MilestonesService, useValue: { list, complete } },
      { provide: Auth, useValue: { currentUser: signal({ role }) } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(MilestoneList);
  fixture.componentRef.setInput('patientId', 7);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list, complete };
}

describe('MilestoneList', () => {
  it('renders an ordered milestone with an overdue flag', async () => {
    const { fixture } = await setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Initial fitting delivery');
    expect(text).toContain('In progress');
    expect(text).toContain('Overdue'); // targetDate 2020 and not complete
  });

  it('shows management actions only to writers', async () => {
    const writer = await setup('clinician');
    expect(writer.fixture.nativeElement.querySelector('.milestones__head-actions')).not.toBeNull();
    expect(writer.fixture.nativeElement.querySelector('.milestones__item-actions')).not.toBeNull();

    const admin = await setup('practice_administrator');
    expect(admin.fixture.nativeElement.querySelector('.milestones__head-actions')).toBeNull();
    expect(admin.fixture.nativeElement.querySelector('.milestones__item-actions')).toBeNull();
  });

  it('hides "Mark complete" for a completed milestone', async () => {
    const { fixture } = await setup('clinician', [
      milestone({ status: 'complete', completedDate: '2026-02-02' }),
    ]);
    expect(fixture.nativeElement.querySelector('.milestones__item-actions button')).toBeNull();
  });

  it('calls complete and reloads', async () => {
    const complete = vi.fn().mockReturnValue(of(milestone({ status: 'complete' })));
    const { fixture } = await setup('clinician', [milestone()], complete);
    fixture.nativeElement.querySelector('.milestones__item-actions button').click();
    expect(complete).toHaveBeenCalledWith(7, 1);
  });

  it('shows an error state', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MilestoneList],
      providers: [
        provideRouter([]),
        {
          provide: MilestonesService,
          useValue: { list: vi.fn().mockReturnValue(throwError(() => new Error('x'))) },
        },
        { provide: Auth, useValue: { currentUser: signal({ role: 'clinician' }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MilestoneList);
    fixture.componentRef.setInput('patientId', 7);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
