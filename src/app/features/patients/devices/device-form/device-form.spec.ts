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
  involvementId: 4,
  deviceType: 'body_powered',
  status: 'active',
  replacesDeviceId: null,
  manufacturer: 'Blatchford',
  model: 'Orion',
  serialNumber: 'SN-9',
  mountLocation: null,
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
  const fixture = TestBed.createComponent(DeviceForm);
  fixture.componentRef.setInput('id', '9');
  fixture.componentRef.setInput('involvementId', '4');
  return { fixture, navigate };
}

describe('DeviceForm', () => {
  it('does not submit until the device type is set', async () => {
    const service = stub();
    const { fixture } = await build(service);
    fixture.detectChanges();

    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.deviceType.touched).toBe(true);
  });

  it('creates a device under the involvement and returns to the patient', async () => {
    const service = stub();
    const { fixture, navigate } = await build(service);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ deviceType: 'myoelectric' });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith(
      9,
      4,
      expect.objectContaining({
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
    const { fixture, navigate } = await build(service);
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
      4,
      3,
      expect.objectContaining({ status: 'in_repair' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 9]);
  });

  it('replaces, resetting status and clearing the manufacturer', async () => {
    const service = stub();
    service.get.mockReturnValue(of(EXISTING));
    const { fixture } = await build(service);
    fixture.componentRef.setInput('deviceId', '3');
    fixture.componentRef.setInput('mode', 'replace');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.deviceType.value).toBe('body_powered');
    expect(fixture.componentInstance.form.controls.status.value).toBe('planned');
    expect(fixture.componentInstance.form.controls.manufacturer.value).toBe('');

    fixture.componentInstance.submit();
    expect(service.replace).toHaveBeenCalledWith(
      9,
      4,
      3,
      expect.objectContaining({ deviceType: 'body_powered' }),
    );
  });

  it('shows orthosis componentry for an orthosis type and nulls the prosthesis set', async () => {
    const service = stub();
    const { fixture } = await build(service);
    fixture.detectChanges();

    // prosthesis by default
    expect(fixture.nativeElement.querySelector('#socketType')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#jointType')).toBeNull();

    fixture.componentInstance.form.patchValue({ deviceType: 'orthosis_afo' });
    fixture.detectChanges();
    expect(fixture.componentInstance.showOrthosisFields()).toBe(true);
    expect(fixture.nativeElement.querySelector('#socketType')).toBeNull();
    expect(fixture.nativeElement.querySelector('#jointType')).not.toBeNull();

    fixture.componentInstance.form.patchValue({
      jointType: 'Articulated ankle',
      socketType: 'stale',
    });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith(
      9,
      4,
      expect.objectContaining({
        deviceType: 'orthosis_afo',
        jointType: 'Articulated ankle',
        socketType: null,
        trimline: null,
      }),
    );
  });

  it('prefills orthosis componentry in edit mode', async () => {
    const service = stub();
    service.get.mockReturnValue(
      of({
        ...EXISTING,
        deviceType: 'orthosis_afo',
        socketType: null,
        jointType: 'Free motion',
        trimline: 'Posterior',
        strapConfiguration: '3-strap',
        paddingLiner: null,
      }),
    );
    const { fixture } = await build(service);
    fixture.componentRef.setInput('deviceId', '3');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.jointType.value).toBe('Free motion');
    expect(fixture.nativeElement.querySelector('#jointType').value).toBe('Free motion');
  });

  it('surfaces a backend error detail', async () => {
    const service = stub();
    service.create.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'bad device' } })),
    );
    const { fixture } = await build(service);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ deviceType: 'myoelectric' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toContain('bad device');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
