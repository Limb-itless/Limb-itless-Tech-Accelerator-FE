import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../../core/auth/auth';
import { DevicesService } from '../../devices/devices.service';
import { InvolvementsService } from '../involvements.service';
import { InvolvementList } from './involvement-list';

const INVOLVEMENTS = [
  {
    id: 11,
    patientId: 5,
    kind: 'amputation',
    region: 'lower_limb_left',
    level: 'transfemoral',
    cause: 'trauma',
    onsetDate: '2025-01-01',
    status: 'active',
    notes: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 12,
    patientId: 5,
    kind: 'orthotic_need',
    region: 'spine',
    level: null,
    cause: null,
    onsetDate: null,
    status: 'active',
    notes: 'Lumbar support',
    createdAt: '',
    updatedAt: '',
  },
];

const DEVICES = [
  {
    id: 1,
    involvementId: 11,
    deviceType: 'myoelectric',
    status: 'active',
    replacesDeviceId: null,
    manufacturer: 'Ottobock',
    model: 'Genium',
    serialNumber: null,
    mountLocation: null,
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
  role = 'clinician',
  list = vi.fn().mockReturnValue(of(INVOLVEMENTS)),
  listForPatient = vi.fn().mockReturnValue(of(DEVICES)),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [InvolvementList],
    providers: [
      provideRouter([]),
      { provide: InvolvementsService, useValue: { list } },
      { provide: DevicesService, useValue: { listForPatient } },
      { provide: Auth, useValue: { currentUser: signal({ role }) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(InvolvementList);
  fixture.componentRef.setInput('patientId', 5);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list, listForPatient };
}

describe('InvolvementList', () => {
  it('renders a card per involvement with its devices grouped', async () => {
    const { fixture } = await setup();
    const cards = fixture.nativeElement.querySelectorAll('.involvements__card');
    expect(cards.length).toBe(2);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Left leg — Amputation');
    expect(text).toContain('Spine — Orthotic need');
    // the device sits under its involvement
    expect(cards[0].textContent).toContain('Myoelectric prosthesis');
    expect(cards[1].textContent).toContain('No devices for this involvement.');
  });

  it('shows add / edit / replace only to writers', async () => {
    const writer = await setup('clinician');
    expect(writer.fixture.nativeElement.querySelector('.involvements__add')).not.toBeNull();
    expect(writer.fixture.nativeElement.querySelector('.involvements__device-link')).not.toBeNull();

    const admin = await setup('practice_administrator');
    expect(admin.fixture.nativeElement.querySelector('.involvements__add')).toBeNull();
    expect(admin.fixture.nativeElement.querySelector('.involvements__device-link')).toBeNull();
  });

  it('shows an empty state', async () => {
    const { fixture } = await setup('clinician', vi.fn().mockReturnValue(of([])));
    expect(fixture.nativeElement.querySelector('.involvements__empty')).not.toBeNull();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(
      'clinician',
      vi.fn().mockReturnValue(throwError(() => new Error('x'))),
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
