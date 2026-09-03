import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../../core/auth/auth';
import { DevicesService } from '../devices.service';
import { DeviceList } from './device-list';

const device = {
  id: 4,
  patientId: 9,
  limbSide: 'left',
  limbLevel: 'transtibial',
  deviceType: 'myoelectric',
  status: 'active',
  replacesDeviceId: 2,
  manufacturer: 'Ottobock',
  model: 'Genium',
  serialNumber: 'SN-1',
  socketType: null,
  linerType: null,
  suspensionType: null,
  terminalDevice: null,
  castScanDate: null,
  deliveryDate: null,
  fittedDate: '2026-02-01',
  warrantyStart: null,
  warrantyExpiry: null,
  notes: 'Fitted without issue.',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
};

async function setup(role = 'clinician', list = vi.fn().mockReturnValue(of([device]))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [DeviceList],
    providers: [
      provideRouter([]),
      { provide: DevicesService, useValue: { list } },
      { provide: Auth, useValue: { currentUser: signal({ role }) } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DeviceList);
  fixture.componentRef.setInput('patientId', 9);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list };
}

describe('DeviceList', () => {
  it('renders a card per device', async () => {
    const { fixture, list } = await setup();
    expect(list).toHaveBeenCalledWith(9);
    const cards = fixture.nativeElement.querySelectorAll('.devices__card');
    expect(cards.length).toBe(1);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Left Transtibial — Myoelectric');
    expect(text).toContain('Ottobock');
    expect(text).toContain('Replaces device #2');
  });

  it('shows Add device and per-device actions only to writers', async () => {
    const writer = await setup('clinician');
    expect(writer.fixture.nativeElement.querySelector('.devices__add')).not.toBeNull();
    expect(writer.fixture.nativeElement.querySelector('.devices__actions')).not.toBeNull();

    const admin = await setup('practice_administrator');
    expect(admin.fixture.nativeElement.querySelector('.devices__add')).toBeNull();
    expect(admin.fixture.nativeElement.querySelector('.devices__actions')).toBeNull();
  });

  it('shows an empty state when there are no devices', async () => {
    const { fixture } = await setup('clinician', vi.fn().mockReturnValue(of([])));
    expect(fixture.nativeElement.querySelector('.devices__empty')).not.toBeNull();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(
      'clinician',
      vi.fn().mockReturnValue(throwError(() => new Error('boom'))),
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
