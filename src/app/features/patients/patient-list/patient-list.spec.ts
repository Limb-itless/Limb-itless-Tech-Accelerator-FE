import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { PatientsService } from '../patients.service';
import { PatientList } from './patient-list';

const page = {
  items: [
    {
      id: 1,
      firstName: 'Ann',
      lastName: 'Bell',
      dateOfBirth: '1990-01-01',
      nationalId: '900',
      passportNumber: null,
      isActive: true,
    },
    {
      id: 2,
      firstName: 'Cy',
      lastName: 'Doe',
      dateOfBirth: '1980-02-02',
      nationalId: null,
      passportNumber: 'P1',
      isActive: false,
    },
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

function fakeAuth(role: string) {
  return { currentUser: signal({ role }) };
}

async function setup(role = 'clinician') {
  TestBed.resetTestingModule();
  const list = vi.fn().mockReturnValue(of(page));
  await TestBed.configureTestingModule({
    imports: [PatientList],
    providers: [
      provideRouter([]),
      { provide: PatientsService, useValue: { list } },
      { provide: Auth, useValue: fakeAuth(role) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PatientList);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list };
}

describe('PatientList', () => {
  it('renders a row per patient', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Bell, Ann');
  });

  it('shows the New patient link only to writers', async () => {
    const writer = await setup('clinician');
    expect(writer.fixture.nativeElement.querySelector('.patients__new')).not.toBeNull();

    const admin = await setup('practice_administrator');
    expect(admin.fixture.nativeElement.querySelector('.patients__new')).toBeNull();
  });

  it('updates the search term from the input', async () => {
    const { fixture } = await setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
    input.value = 'bell';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.searchTerm()).toBe('bell');
  });

  it('pages forward', async () => {
    const many = { ...page, total: 50 };
    const list = vi.fn().mockReturnValue(of(many));
    await TestBed.configureTestingModule({
      imports: [PatientList],
      providers: [
        provideRouter([]),
        { provide: PatientsService, useValue: { list } },
        { provide: Auth, useValue: fakeAuth('clinician') },
      ],
    }).compileComponents();
    const fixture: ComponentFixture<PatientList> = TestBed.createComponent(PatientList);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.next();
    expect(fixture.componentInstance.offset()).toBe(20);
  });
});
