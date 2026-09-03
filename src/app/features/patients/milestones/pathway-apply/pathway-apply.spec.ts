import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MilestonesService } from '../milestones.service';
import { PathwayApply } from './pathway-apply';

async function build(applyPathway: ReturnType<typeof vi.fn>) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PathwayApply],
    providers: [provideRouter([]), { provide: MilestonesService, useValue: { applyPathway } }],
  }).compileComponents();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(PathwayApply);
  fixture.componentRef.setInput('id', '7');
  fixture.detectChanges();
  return { fixture, navigate };
}

describe('PathwayApply', () => {
  it('applies the chosen pathway and returns to the patient', async () => {
    const applyPathway = vi.fn().mockReturnValue(of([{ id: 1 }, { id: 2 }]));
    const { fixture, navigate } = await build(applyPathway);

    fixture.componentInstance.form.patchValue({ carePathway: 'upper_limb', intervalDays: 21 });
    fixture.componentInstance.submit();

    expect(applyPathway).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ carePathway: 'upper_limb', intervalDays: 21, startDate: null }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 7]);
  });

  it('does not submit an out-of-range interval', async () => {
    const applyPathway = vi.fn();
    const { fixture } = await build(applyPathway);
    fixture.componentInstance.form.patchValue({ intervalDays: 0 });
    fixture.componentInstance.submit();
    expect(applyPathway).not.toHaveBeenCalled();
  });

  it('shows the conflict message on 409', async () => {
    const applyPathway = vi
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const { fixture } = await build(applyPathway);
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.errorMessage()).toContain('already has milestones');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
