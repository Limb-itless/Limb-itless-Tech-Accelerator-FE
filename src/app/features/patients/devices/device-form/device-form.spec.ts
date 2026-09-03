import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DevicesService } from '../devices.service';
import { DeviceForm } from './device-form';

interface ServiceStub {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
}

function stub(): ServiceStub {
  return {
    get: vi.fn(),
    create: vi.fn().mockReturnValue(of({ id: 5 })),
    update: vi.fn().mockReturnValue(of({ id: 5 })),
    replace: vi.fn().mockReturnValue(of({ id: 6 })),
  };
}

const EXISTING = {
  id: 3,
  patientId: 9,
  limbSide: 'right',
  limbLevel: 'transfemoral',
  deviceType: 'body_powered',
  status: 'active',
  replacesDeviceId: null,
  manufacturer: 'Blatchford',
  model: 'Orion',
  serialNumber: 'SN-9',
  socketType: 'Ischial containment',
  linerType: null,
  suspensionType: null,
  terminalDevice: null,
  castScanDate: null,
  deliveryDate: null,
  fittedDate: '2026-02-01',
  warrantyStart: null,
  warrantyExpiry: null,
  notes: 'Original device.',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
};

async function build(service: ServiceStub) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [DeviceForm],
    providers: [provideRouter([]), { provide: DevicesService, useValue: service }],
  }).compileComponents();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return navigate;
}

function fillRequired(component: DeviceForm): void {
  component.form.patchValue({
    limbSide: 'left',
    limbLevel: 'transtibial',
    deviceType: 'myoelectric',
  });
}

describe('DeviceForm', () => {
  it('does not submit until the required fields are set', async () => {
    const service = stub();
    await build(service);
    const fixture = TestBed.createComponent(DeviceForm);
    fixture.componentRef.setInput('id', '9');
    fixture.detectChanges();

    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.limbSide.touched).toBe(true);
  });

  it('creates a device and returns to the patient', async () => {
    const service = stub();
    const navigate = await build(service);
    const fixture = TestBed.createComponent(DeviceForm);
    fixture.componentRef.setInput('id', '9');
    fixture.detectChanges();

    fillRequired(fixture.componentInstance);
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        limbSide: 'left',
        limbLevel: 'transtibial',
        deviceType: 'myoelectric',
        status: 'planned',
        manufacturer: null,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 9]);
  });

  it('prefills and updates in edit mode', async () => {
    const service = stub();
    service.get.mockReturnValue(of(EXISTING));
    const navigate = await build(service);
    const fixture = TestBed.createComponent(DeviceForm);
    fixture.componentRef.setInput('id', '9');
    fixture.componentRef.setInput('deviceId', '3');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.manufacturer.value).toBe('Blatchford');

    fixture.componentInstance.form.patchValue({ status: 'in_repair' });
    fixture.componentInstance.submit();

    expect(service.update).toHaveBeenCalledWith(
      9,
      3,
      expect.objectContaining({ status: 'in_repair' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 9]);
  });

  it('calls replace and resets status to planned when replacing', async () => {
    const service = stub();
    service.get.mockReturnValue(of(EXISTING));
    await build(service);
    const fixture = TestBed.createComponent(DeviceForm);
    fixture.componentRef.setInput('id', '9');
    fixture.componentRef.setInput('deviceId', '3');
    fixture.componentRef.setInput('mode', 'replace');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // limb details inherited, status reset, manufacturer cleared
    expect(fixture.componentInstance.form.controls.limbLevel.value).toBe('transfemoral');
    expect(fixture.componentInstance.form.controls.status.value).toBe('planned');
    expect(fixture.componentInstance.form.controls.manufacturer.value).toBe('');

    fixture.componentInstance.submit();
    expect(service.replace).toHaveBeenCalledWith(
      9,
      3,
      expect.objectContaining({ limbSide: 'right' }),
    );
  });

  it('shows the conflict message on 409', async () => {
    const service = stub();
    service.create.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 409 })));
    await build(service);
    const fixture = TestBed.createComponent(DeviceForm);
    fixture.componentRef.setInput('id', '9');
    fixture.detectChanges();

    fillRequired(fixture.componentInstance);
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toContain('already has an active device');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
