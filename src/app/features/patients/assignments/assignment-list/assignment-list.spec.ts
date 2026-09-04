import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../../core/auth/auth';
import { AssignmentsService } from '../assignments.service';
import { AssignmentList } from './assignment-list';

const CURRENT = {
  id: 1,
  patientId: 5,
  userId: 12,
  userEmail: 'kim@northgate.example',
  practiceId: 1,
  siteId: null,
  role: 'clinician',
  startDate: '2026-01-01',
  endDate: null,
  notes: null,
  createdAt: '',
};

const PAST = {
  ...CURRENT,
  id: 2,
  userEmail: 'lee@northgate.example',
  role: 'prosthetist',
  startDate: '2025-06-01',
  endDate: '2025-12-31',
};

async function setup(
  role = 'clinician',
  list = vi.fn().mockReturnValue(of([CURRENT, PAST])),
  end = vi.fn().mockReturnValue(of({ ...CURRENT, endDate: '2026-03-01' })),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AssignmentList],
    providers: [
      provideRouter([]),
      { provide: AssignmentsService, useValue: { list, end } },
      { provide: Auth, useValue: { currentUser: signal({ role }) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(AssignmentList);
  fixture.componentRef.setInput('patientId', 5);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list, end };
}

describe('AssignmentList', () => {
  it('splits current from past assignments', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.care-team__row');
    // one current row + one past row rendered
    expect(rows.length).toBe(2);
    const current = fixture.nativeElement.querySelector(
      '.care-team__row:not(.care-team__row--past)',
    );
    expect(current.textContent).toContain('Clinician');
    expect(current.textContent).toContain('kim@northgate.example');
    const details: HTMLElement = fixture.nativeElement.querySelector('.care-team__past summary');
    expect(details.textContent).toContain('Past assignments (1)');
  });

  it('lets a writer end a current assignment', async () => {
    const { fixture, end } = await setup('clinician');
    fixture.nativeElement.querySelector('.care-team__end').click();
    expect(end).toHaveBeenCalledWith(5, 1);
  });

  it('hides add / end for a practice administrator', async () => {
    const { fixture } = await setup('practice_administrator');
    expect(fixture.nativeElement.querySelector('.care-team__add')).toBeNull();
    expect(fixture.nativeElement.querySelector('.care-team__end')).toBeNull();
  });

  it('shows an empty state when no one is current', async () => {
    const { fixture } = await setup('clinician', vi.fn().mockReturnValue(of([PAST])));
    expect(fixture.nativeElement.querySelector('.care-team__empty')).not.toBeNull();
    // the past assignment is still listed
    expect(fixture.nativeElement.querySelector('.care-team__past')).not.toBeNull();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(
      'clinician',
      vi.fn().mockReturnValue(throwError(() => new Error('x'))),
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
