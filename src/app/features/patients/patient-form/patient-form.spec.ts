import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PatientsService } from '../patients.service';
import { PatientForm } from './patient-form';

interface ServiceStub {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

async function build(service: ServiceStub) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PatientForm],
    providers: [provideRouter([]), { provide: PatientsService, useValue: service }],
  }).compileComponents();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return navigate;
}

function stub(): ServiceStub {
  return {
    get: vi.fn(),
    create: vi.fn().mockReturnValue(of({ id: 7 })),
    update: vi.fn().mockReturnValue(of({ id: 7 })),
  };
}

async function setup() {
  const service = stub();
  const navigate = await build(service);
  const fixture = TestBed.createComponent(PatientForm);
  fixture.detectChanges();
  return { fixture, service, navigate };
}

function fillValid(component: PatientForm): void {
  component.form.patchValue({
    firstName: 'Ann',
    lastName: 'Bell',
    dateOfBirth: '1990-01-01',
    nationalId: '9001010000001',
  });
}

describe('PatientForm', () => {
  it('does not submit an empty form', async () => {
    const { fixture, service } = await setup();
    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('requires a national id or passport', async () => {
    const { fixture, service } = await setup();
    fixture.componentInstance.form.patchValue({
      firstName: 'Ann',
      lastName: 'Bell',
      dateOfBirth: '1990-01-01',
    });
    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.hasError('identityRequired')).toBe(true);
  });

  it('creates and navigates to the new patient', async () => {
    const { fixture, service, navigate } = await setup();
    fillValid(fixture.componentInstance);
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ann',
        lastName: 'Bell',
        nationalId: '9001010000001',
        passportNumber: null,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 7, 'involvements', 'first']);
  });

  it('shows the conflict message on 409', async () => {
    const { fixture, service } = await setup();
    service.create.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 409 })));
    fillValid(fixture.componentInstance);
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toContain('already has');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('edits an existing patient', async () => {
    const service = stub();
    service.update.mockReturnValue(of({ id: 3 }));
    service.get.mockReturnValue(
      of({
        id: 3,
        firstName: 'Old',
        lastName: 'Name',
        dateOfBirth: '1970-01-01',
        nationalId: '111',
        passportNumber: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
        medicalHistory: null,
        comorbidities: null,
      }),
    );
    const navigate = await build(service);
    const fixture = TestBed.createComponent(PatientForm);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.firstName.value).toBe('Old');

    fixture.componentInstance.form.patchValue({ firstName: 'New' });
    fixture.componentInstance.submit();
    expect(service.update).toHaveBeenCalledWith(3, expect.objectContaining({ firstName: 'New' }));
    expect(navigate).toHaveBeenCalledWith(['/patients', 3]);
  });
});
