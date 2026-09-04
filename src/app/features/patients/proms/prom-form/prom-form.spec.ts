import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DevicesService } from '../../devices/devices.service';
import { InvolvementsService } from '../../involvements/involvements.service';
import { PromsService } from '../proms.service';
import { PromForm } from './prom-form';

interface ServiceStub {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

function stub(): ServiceStub {
  return {
    get: vi.fn(),
    create: vi.fn().mockReturnValue(of({ id: 9 })),
    update: vi.fn().mockReturnValue(of({ id: 9 })),
  };
}

const EXISTING = {
  id: 9,
  patientId: 3,
  involvementId: null,
  deviceId: null,
  instrument: 'socket_comfort_score',
  responses: { score: 3 },
  score: 3,
  flagged: true,
  flagReason: 'Socket Comfort Score 4 or below out of 10',
  recordedAt: '2026-03-01T09:00:00',
  recordedById: 5,
  notes: 'Rubbing at the brim',
  createdAt: '2026-03-01T09:00:00',
  updatedAt: '2026-03-01T09:00:00',
};

async function build(service: ServiceStub) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PromForm],
    providers: [
      provideRouter([]),
      { provide: PromsService, useValue: service },
      {
        provide: DevicesService,
        useValue: { listForPatient: vi.fn().mockReturnValue(of([])) },
      },
      { provide: InvolvementsService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
    ],
  }).compileComponents();
  return vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
}

describe('PromForm', () => {
  it('does not submit without instrument and score', async () => {
    const service = stub();
    await build(service);
    const fixture = TestBed.createComponent(PromForm);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates, wrapping the score in a responses blob', async () => {
    const service = stub();
    const navigate = await build(service);
    const fixture = TestBed.createComponent(PromForm);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      instrument: 'pain_residual_limb',
      score: '8',
      notes: 'after PT',
    });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        instrument: 'pain_residual_limb',
        responses: { score: 8 },
        notes: 'after PT',
        deviceId: null,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 3]);
  });

  it('prefills the score from responses and updates', async () => {
    const service = stub();
    service.get.mockReturnValue(of(EXISTING));
    const navigate = await build(service);
    const fixture = TestBed.createComponent(PromForm);
    fixture.componentRef.setInput('id', '3');
    fixture.componentRef.setInput('promId', '9');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.score.value).toBe('3');
    expect(fixture.componentInstance.form.controls.instrument.value).toBe('socket_comfort_score');

    fixture.componentInstance.form.patchValue({ score: '6' });
    fixture.componentInstance.submit();
    expect(service.update).toHaveBeenCalledWith(
      3,
      9,
      expect.objectContaining({ responses: { score: 6 } }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 3]);
  });

  it('surfaces the backend range error', async () => {
    const service = stub();
    service.create.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { detail: "'score' must be between 0 and 10" },
          }),
      ),
    );
    await build(service);
    const fixture = TestBed.createComponent(PromForm);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
    fixture.componentInstance.form.patchValue({ instrument: 'pain_phantom', score: '99' });
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.errorMessage()).toContain('between 0 and 10');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
