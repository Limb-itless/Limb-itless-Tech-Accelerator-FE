import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ReviewService } from '../review.service';
import { ReviewPatient } from './review-patient';

const BUNDLE = {
  patient: {
    id: 1,
    firstName: 'Thabo',
    lastName: 'Molefe',
    dateOfBirth: '1984-02-11',
    nationalId: '8402',
    passportNumber: null,
    isActive: true,
    medicalHistory: 'PVD',
    comorbidities: null,
  },
  practiceName: 'Northgate',
  siteName: 'Main',
  involvements: [
    {
      id: 11,
      kind: 'orthotic_need',
      region: 'lower_limb_left',
      level: null,
      cause: null,
      status: 'active',
      devices: [
        {
          id: 1,
          deviceType: 'orthosis_afo',
          status: 'active',
          manufacturer: 'Blatchford',
          model: 'Carbon AFO',
          jointType: 'Articulated ankle',
          trimline: 'Posterior',
          socketType: null,
        },
      ],
    },
  ],
  milestones: [
    {
      id: 1,
      milestoneType: 'orthotic_assessment',
      status: 'in_progress',
      targetDate: '2020-01-01',
    },
  ],
  proms: [
    {
      id: 5,
      instrument: 'orthosis_comfort_score',
      score: 3,
      flagged: true,
      recordedAt: '2026-08-30T09:00:00',
    },
  ],
  notes: [{ id: 2, body: 'AFO issued.', createdAt: '2026-08-01T00:00:00' }],
};

async function setup(bundle = vi.fn().mockReturnValue(of(BUNDLE))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ReviewPatient],
    providers: [provideRouter([]), { provide: ReviewService, useValue: { bundle } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(ReviewPatient);
  fixture.componentRef.setInput('id', '1');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture };
}

describe('ReviewPatient', () => {
  it('shows the record read-only with device componentry and flags', async () => {
    const { fixture } = await setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Thabo Molefe');
    expect(text).toContain('read-only');
    expect(text).toContain('PVD');
    expect(text).toContain('Ankle-foot orthosis (AFO)');
    expect(text).toContain('Articulated ankle'); // orthosis componentry rendered
    expect(text).toContain('overdue'); // 2020 target milestone
    expect(text).toContain('1 flagged');
    expect(fixture.nativeElement.querySelector('.review__row--flagged')).not.toBeNull();
    // no form controls / buttons anywhere
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(throwError(() => new Error('x'))));
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
