import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DevicesService } from '../../devices/devices.service';
import { InvolvementsService } from '../../involvements/involvements.service';
import { PatientBodyMap } from './patient-body-map';

const INVOLVEMENTS = [
  {
    id: 11,
    patientId: 5,
    kind: 'amputation',
    region: 'lower_limb_left',
    level: 'transfemoral',
    cause: 'trauma',
    onsetDate: null,
    status: 'active',
    notes: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 12,
    patientId: 5,
    kind: 'orthotic_need',
    region: 'other',
    level: null,
    cause: null,
    onsetDate: null,
    status: 'active',
    notes: null,
    createdAt: '',
    updatedAt: '',
  },
];

const DEVICES = [
  {
    id: 1,
    involvementId: 11,
    deviceType: 'body_powered',
    status: 'active',
    replacesDeviceId: null,
    manufacturer: 'Ottobock',
    model: '3R80',
    serialNumber: null,
    mountLocation: 'posterior strut',
    socketType: null,
    linerType: null,
    suspensionType: null,
    terminalDevice: null,
    castScanDate: null,
    deliveryDate: null,
    fittedDate: null,
    warrantyStart: null,
    warrantyExpiry: null,
    notes: null,
    createdAt: '',
    updatedAt: '',
  },
];

async function setup(
  list = vi.fn().mockReturnValue(of(INVOLVEMENTS)),
  listForPatient = vi.fn().mockReturnValue(of(DEVICES)),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PatientBodyMap],
    providers: [
      provideRouter([]),
      { provide: InvolvementsService, useValue: { list } },
      { provide: DevicesService, useValue: { listForPatient } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PatientBodyMap);
  fixture.componentRef.setInput('id', '5');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture };
}

describe('PatientBodyMap', () => {
  it('draws a marker only for involvements with a mappable region', async () => {
    const { fixture } = await setup();
    // one on the figure (lower_limb_left), the "other" one is not drawn
    expect(fixture.nativeElement.querySelectorAll('.body-map__marker').length).toBe(1);
  });

  it('lists every involvement with its devices and mount location', async () => {
    const { fixture } = await setup();
    const cards = fixture.nativeElement.querySelectorAll('.body-map__card');
    expect(cards.length).toBe(2);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Left leg — Amputation');
    expect(text).toContain('Body-powered prosthesis');
    expect(text).toContain('posterior strut');
    // the unmapped involvement says so
    expect(fixture.nativeElement.querySelector('.body-map__card--unmapped')).not.toBeNull();
  });

  it('selecting a card highlights it and toggles off', async () => {
    const { fixture } = await setup();
    const card = fixture.nativeElement.querySelector('.body-map__card');
    card.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(11);
    card.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBeNull();
  });

  it('shows an empty state when there are no involvements', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(of([])));
    expect(fixture.nativeElement.querySelector('.body-map__empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(throwError(() => new Error('x'))));
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
