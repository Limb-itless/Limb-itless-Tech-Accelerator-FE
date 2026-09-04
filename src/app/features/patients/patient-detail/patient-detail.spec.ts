import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { PatientsService } from '../patients.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { InvolvementsService } from '../involvements/involvements.service';
import { DevicesService } from '../devices/devices.service';
import { PatientDetail } from './patient-detail';

const patient = {
  id: 1,
  practiceId: 2,
  siteId: null,
  firstName: 'Ann',
  lastName: 'Bell',
  dateOfBirth: '1990-01-01',
  nationalId: '900',
  passportNumber: null,
  contactEmail: 'ann@example.com',
  contactPhone: null,
  address: null,
  medicalHistory: 'PVD',
  comorbidities: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
};

async function setup(role = 'clinician', overrides: Record<string, unknown> = {}) {
  const service = {
    get: vi.fn().mockReturnValue(of({ ...patient, ...overrides })),
    setActive: vi.fn().mockReturnValue(of({ ...patient, ...overrides, isActive: false })),
  };
  await TestBed.configureTestingModule({
    imports: [PatientDetail],
    providers: [
      provideRouter([]),
      { provide: PatientsService, useValue: service },
      { provide: Auth, useValue: { currentUser: signal({ role }) } },
      { provide: AssignmentsService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
      { provide: InvolvementsService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
      {
        provide: DevicesService,
        useValue: { listForPatient: vi.fn().mockReturnValue(of([])) },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PatientDetail);
  fixture.componentRef.setInput('id', '1');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, service };
}

describe('PatientDetail', () => {
  it('renders the patient', async () => {
    const { fixture } = await setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Ann Bell');
    expect(text).toContain('PVD');
    expect(text).toContain('ann@example.com');
  });

  it('computes age', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance.age()).toBeGreaterThan(30);
  });

  it('deactivates and reloads', async () => {
    const { fixture, service } = await setup();
    fixture.nativeElement.querySelector('.patient__actions button').click();
    expect(service.setActive).toHaveBeenCalledWith(1, false);
  });

  it('hides edit / deactivate for a practice administrator but keeps the timeline link', async () => {
    const { fixture } = await setup('practice_administrator');
    const links = [...fixture.nativeElement.querySelectorAll('.patient__actions a')].map(
      (a: HTMLAnchorElement) => a.textContent?.trim(),
    );
    expect(links).toEqual(['View timeline']);
    expect(fixture.nativeElement.querySelector('.patient__actions button')).toBeNull();
  });

  it('shows an error state', async () => {
    const service = {
      get: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 }))),
      setActive: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [PatientDetail],
      providers: [
        provideRouter([]),
        { provide: PatientsService, useValue: service },
        { provide: Auth, useValue: { currentUser: signal({ role: 'clinician' }) } },
        { provide: AssignmentsService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
        { provide: InvolvementsService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
        {
          provide: DevicesService,
          useValue: { listForPatient: vi.fn().mockReturnValue(of([])) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientDetail);
    fixture.componentRef.setInput('id', '99');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
