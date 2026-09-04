import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { AvailabilityService } from '../availability.service';
import { SlotForm } from './slot-form';

interface Stub {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

function stub(): Stub {
  return {
    get: vi.fn(),
    create: vi.fn().mockReturnValue(of({ id: 9 })),
    update: vi.fn().mockReturnValue(of({ id: 9 })),
  };
}

async function build(service: Stub) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [SlotForm],
    providers: [provideRouter([]), { provide: AvailabilityService, useValue: service }],
  }).compileComponents();
  return vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
}

describe('SlotForm', () => {
  it('does not submit without a start time', async () => {
    const service = stub();
    await build(service);
    const fixture = TestBed.createComponent(SlotForm);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('publishes a slot, deriving endTime from the duration', async () => {
    const service = stub();
    const navigate = await build(service);
    const fixture = TestBed.createComponent(SlotForm);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      startTime: '2026-09-05T09:00',
      duration: 45,
      appointmentType: 'fitting',
      status: 'open',
      notes: 'Bring the trial socket',
    });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith({
      startTime: '2026-09-05T09:00',
      endTime: '2026-09-05T09:45',
      appointmentType: 'fitting',
      status: 'open',
      notes: 'Bring the trial socket',
    });
    expect(navigate).toHaveBeenCalledWith(['/availability']);
  });

  it('prefills duration from the existing slot and updates in edit mode', async () => {
    const service = stub();
    service.get.mockReturnValue(
      of({
        id: 3,
        practiceId: 1,
        siteId: null,
        practitionerId: 5,
        practitionerEmail: 'clin@northgate.example',
        startTime: '2026-09-06T14:00:00',
        endTime: '2026-09-06T15:00:00',
        appointmentType: 'fitting',
        status: 'blocked',
        notes: 'Admin time',
        createdAt: '',
        updatedAt: '',
      }),
    );
    const navigate = await build(service);
    const fixture = TestBed.createComponent(SlotForm);
    fixture.componentRef.setInput('id', '3');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.duration.value).toBe(60);
    expect(fixture.componentInstance.form.controls.status.value).toBe('blocked');

    fixture.componentInstance.form.patchValue({ status: 'open' });
    fixture.componentInstance.submit();

    expect(service.update).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ status: 'open', startTime: '2026-09-06T14:00' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/availability']);
  });

  it('surfaces a 409 overlap as a friendly message', async () => {
    const { HttpErrorResponse } = await import('@angular/common/http');
    const { throwError } = await import('rxjs');
    const service = stub();
    service.create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    await build(service);
    const fixture = TestBed.createComponent(SlotForm);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ startTime: '2026-09-05T09:00' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe('This overlaps a slot you already have.');
  });
});
