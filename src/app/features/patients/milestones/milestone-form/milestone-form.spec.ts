import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { DevicesService } from '../../devices/devices.service';
import { InvolvementsService } from '../../involvements/involvements.service';
import { MilestonesService } from '../milestones.service';
import { MilestoneForm } from './milestone-form';

interface ServiceStub {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

function stub(): ServiceStub {
  return {
    get: vi.fn(),
    create: vi.fn().mockReturnValue(of({ id: 4 })),
    update: vi.fn().mockReturnValue(of({ id: 4 })),
  };
}

const EXISTING = {
  id: 4,
  patientId: 7,
  involvementId: null,
  deviceId: null,
  carePathway: 'lower_limb',
  milestoneType: 'gait_functional_training',
  orderIndex: 3,
  status: 'in_progress',
  targetDate: '2026-04-01',
  completedDate: null,
  notes: 'Started training.',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
};

async function build(service: ServiceStub) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [MilestoneForm],
    providers: [
      provideRouter([]),
      { provide: MilestonesService, useValue: service },
      {
        provide: DevicesService,
        useValue: { listForPatient: vi.fn().mockReturnValue(of([])) },
      },
      { provide: InvolvementsService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
    ],
  }).compileComponents();
  return vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
}

describe('MilestoneForm', () => {
  it('does not submit without a milestone type', async () => {
    const service = stub();
    await build(service);
    const fixture = TestBed.createComponent(MilestoneForm);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();

    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates a milestone and returns to the patient', async () => {
    const service = stub();
    const navigate = await build(service);
    const fixture = TestBed.createComponent(MilestoneForm);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      milestoneType: 'gait_functional_training',
      carePathway: 'lower_limb',
      targetDate: '2026-06-01',
    });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        milestoneType: 'gait_functional_training',
        carePathway: 'lower_limb',
        targetDate: '2026-06-01',
        deviceId: null,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 7]);
  });

  it('prefills and updates in edit mode', async () => {
    const service = stub();
    service.get.mockReturnValue(of(EXISTING));
    const navigate = await build(service);
    const fixture = TestBed.createComponent(MilestoneForm);
    fixture.componentRef.setInput('id', '7');
    fixture.componentRef.setInput('milestoneId', '4');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.milestoneType.value).toBe(
      'gait_functional_training',
    );

    fixture.componentInstance.form.patchValue({ status: 'complete' });
    fixture.componentInstance.submit();
    expect(service.update).toHaveBeenCalledWith(
      7,
      4,
      expect.objectContaining({ status: 'complete' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 7]);
  });
});
