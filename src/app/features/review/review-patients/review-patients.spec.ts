import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ReviewService } from '../review.service';
import { ReviewPatients } from './review-patients';

const ROWS = [
  {
    id: 1,
    firstName: 'Thabo',
    lastName: 'Molefe',
    dateOfBirth: '1984-02-11',
    practiceId: 2,
    practiceName: 'Northgate',
    involvementCount: 1,
  },
];

async function setup(patients = vi.fn().mockReturnValue(of(ROWS))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ReviewPatients],
    providers: [provideRouter([]), { provide: ReviewService, useValue: { patients } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(ReviewPatients);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture };
}

describe('ReviewPatients', () => {
  it('renders a row per shared patient linking to the detail', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Molefe, Thabo');
    expect(rows[0].querySelector('a').getAttribute('href')).toBe('/review/1');
  });

  it('shows an empty state', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(of([])));
    expect(fixture.nativeElement.querySelector('.review-list__empty')).not.toBeNull();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(throwError(() => new Error('x'))));
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
