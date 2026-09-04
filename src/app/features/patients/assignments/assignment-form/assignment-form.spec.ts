import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AssignmentsService } from '../assignments.service';
import { AssignmentForm } from './assignment-form';

const STAFF = [
  { id: 12, email: 'kim@northgate.example', role: 'clinician', siteId: null, siteName: null },
  { id: 13, email: 'lee@northgate.example', role: 'prosthetist', siteId: 4, siteName: 'Main' },
];

async function build(
  create: ReturnType<typeof vi.fn>,
  staff: ReturnType<typeof vi.fn> = vi.fn().mockReturnValue(of(STAFF)),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AssignmentForm],
    providers: [provideRouter([]), { provide: AssignmentsService, useValue: { create, staff } }],
  }).compileComponents();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AssignmentForm);
  fixture.componentRef.setInput('id', '7');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, navigate };
}

describe('AssignmentForm', () => {
  it('will not submit without a staff member', async () => {
    const create = vi.fn();
    const { fixture } = await build(create);
    fixture.componentInstance.submit();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates the assignment and returns to the patient', async () => {
    const create = vi.fn().mockReturnValue(of({ id: 1 }));
    const { fixture, navigate } = await build(create);

    fixture.componentInstance.form.patchValue({ userId: '13', startDate: '2026-02-01' });
    fixture.componentInstance.submit();

    expect(create).toHaveBeenCalledWith(7, {
      userId: 13,
      startDate: '2026-02-01',
      notes: null,
    });
    expect(navigate).toHaveBeenCalledWith(['/patients', 7]);
  });

  it('shows the conflict message on 409', async () => {
    const create = vi
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const { fixture } = await build(create);
    fixture.componentInstance.form.patchValue({ userId: '12' });
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.errorMessage()).toContain('already on this');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('renders one option per staff member', async () => {
    const { fixture } = await build(vi.fn());
    const options = fixture.nativeElement.querySelectorAll('#userId option');
    // placeholder + 2 staff
    expect(options.length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('kim@northgate.example');
    expect(fixture.nativeElement.textContent).toContain('Prosthetist');
  });
});
