import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CoverageDetermination } from '../review.model';
import { ReviewService } from '../review.service';
import { ReviewCoverage } from './review-coverage';

const PENDING: CoverageDetermination = {
  id: 3,
  appointmentId: 1,
  patientId: 1,
  patientName: 'Thabo Molefe',
  practiceName: 'Northgate Rehabilitation Network',
  schemeName: 'Discovery Health',
  appointmentType: 'review',
  scheduledStart: '2026-09-05T09:00:00',
  status: 'pending',
  authorizationNumber: null,
  validUntil: null,
  decidedById: null,
  decidedAt: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
};

async function setup(
  coverageQueue = vi.fn().mockReturnValue(of([PENDING])),
  approve = vi.fn().mockReturnValue(of({ ...PENDING, status: 'approved' })),
  deny = vi.fn().mockReturnValue(of({ ...PENDING, status: 'denied' })),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ReviewCoverage],
    providers: [{ provide: ReviewService, useValue: { coverageQueue, approve, deny } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(ReviewCoverage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, coverageQueue, approve, deny };
}

describe('ReviewCoverage', () => {
  it('defaults the status filter to Pending, visibly and in the query', async () => {
    const { fixture, coverageQueue } = await setup();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector(
      '.coverage__filter select',
    );
    expect(select.value).toBe('pending');
    expect(coverageQueue).toHaveBeenCalledWith('pending');
  });

  it('lists a pending determination with patient/scheme detail', async () => {
    const { fixture } = await setup();
    const item = fixture.nativeElement.querySelector('.coverage__item');
    expect(item.textContent).toContain('Thabo Molefe');
    expect(item.textContent).toContain('Discovery Health');
    expect(item.querySelector('.coverage__badge--pending')).not.toBeNull();
  });

  it('approves with the entered details', async () => {
    const { fixture, approve } = await setup();
    fixture.nativeElement.querySelectorAll('.coverage__item-actions button')[0].click();
    fixture.detectChanges();

    const [authInput, validInput, notesInput] = fixture.nativeElement.querySelectorAll(
      '.coverage__decision-form input',
    );
    authInput.value = 'AUTH-1';
    authInput.dispatchEvent(new Event('input'));
    validInput.value = '2027-01-01';
    validInput.dispatchEvent(new Event('input'));
    notesInput.value = 'Looks good';
    notesInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.coverage__decision-form button').click();

    expect(approve).toHaveBeenCalledWith(3, {
      authorizationNumber: 'AUTH-1',
      validUntil: '2027-01-01',
      notes: 'Looks good',
    });
  });

  it('denies with a reason', async () => {
    const { fixture, deny } = await setup();
    fixture.nativeElement.querySelectorAll('.coverage__item-actions button')[1].click();
    fixture.detectChanges();

    const notesInput = fixture.nativeElement.querySelector('.coverage__decision-form input');
    notesInput.value = 'Not covered under this plan';
    notesInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.coverage__decision-form button').click();

    expect(deny).toHaveBeenCalledWith(3, { notes: 'Not covered under this plan' });
  });

  it('hides actions once a determination is decided', async () => {
    const { fixture } = await setup(
      vi.fn().mockReturnValue(of([{ ...PENDING, status: 'approved' }])),
    );
    expect(fixture.nativeElement.querySelector('.coverage__item-actions')).toBeNull();
  });

  it('shows an empty state', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(of([])));
    expect(fixture.nativeElement.textContent).toContain('Nothing here right now.');
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(throwError(() => new Error('x'))));
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
