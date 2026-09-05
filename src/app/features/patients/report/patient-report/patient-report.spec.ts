import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PatientReportService } from '../patient-report.service';
import { PatientReport as PatientReportModel } from '../report.model';
import { PatientReport } from './patient-report';

const REPORT: PatientReportModel = {
  patient: {
    id: 1,
    practiceId: 1,
    siteId: null,
    firstName: 'Thabo',
    lastName: 'Molefe',
    dateOfBirth: '1984-02-11',
    nationalId: '8402115032081',
    passportNumber: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    medicalHistory: null,
    comorbidities: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  practiceName: 'Northgate Rehabilitation Network',
  siteName: 'Northgate Main Hospital',
  generatedAt: '2026-09-05T10:00:00',
  involvements: [
    {
      id: 1,
      patientId: 1,
      kind: 'amputation',
      region: 'lower_limb_left',
      level: 'transfemoral',
      cause: 'trauma',
      onsetDate: '2026-01-01',
      status: 'active',
      notes: null,
      createdAt: '',
      updatedAt: '',
      devices: [
        {
          id: 1,
          involvementId: 1,
          deviceType: 'myoelectric',
          status: 'active',
          replacesDeviceId: null,
          manufacturer: 'Ottobock',
          model: 'Genium X3',
          serialNumber: null,
          socketType: null,
          linerType: null,
          suspensionType: null,
          terminalDevice: null,
          jointType: null,
          trimline: null,
          strapConfiguration: null,
          paddingLiner: null,
          mountLocation: null,
          castScanDate: null,
          deliveryDate: null,
          fittedDate: null,
          warrantyStart: null,
          warrantyExpiry: null,
          notes: null,
          createdAt: '',
          updatedAt: '',
        },
      ],
    },
  ],
  milestoneSummary: {
    total: 4,
    completed: 2,
    completedOnTime: 1,
    completedLate: 1,
    inProgress: 1,
    notStarted: 1,
    overdue: 1,
  },
  milestones: [
    {
      id: 1,
      patientId: 1,
      involvementId: null,
      deviceId: null,
      carePathway: 'lower_limb',
      milestoneType: 'gait_functional_training',
      orderIndex: 0,
      status: 'complete',
      targetDate: '2026-01-01',
      completedDate: '2026-01-01',
      notes: null,
      createdAt: '',
      updatedAt: '',
    },
  ],
  promTrends: [
    {
      instrument: 'pain_residual_limb',
      latestScore: 3,
      latestRecordedAt: '2026-02-01T09:00:00',
      flagged: false,
      points: [
        { recordedAt: '2026-01-01T09:00:00', score: 8, flagged: true },
        { recordedAt: '2026-02-01T09:00:00', score: 3, flagged: false },
      ],
    },
  ],
};

async function setup(get = vi.fn().mockReturnValue(of(REPORT))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PatientReport],
    providers: [provideRouter([]), { provide: PatientReportService, useValue: { get } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(PatientReport);
  fixture.componentRef.setInput('id', '1');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, get };
}

describe('PatientReport', () => {
  it('renders the header and involvement/device detail', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.textContent).toContain('Thabo Molefe — progress report');
    expect(fixture.nativeElement.textContent).toContain('Northgate Rehabilitation Network');
    expect(fixture.nativeElement.textContent).toContain('Ottobock');
    expect(fixture.nativeElement.textContent).toContain('Genium X3');
  });

  it('renders the milestone summary and table', async () => {
    const { fixture } = await setup();
    const stats = fixture.nativeElement.querySelector('.report__stats');
    expect(stats.textContent).toContain('2 / 4');
    const rows = fixture.nativeElement.querySelectorAll('.report__table tbody tr');
    expect(rows.length).toBe(1);
  });

  it('renders one trend chart per instrument', async () => {
    const { fixture } = await setup();
    const charts = fixture.nativeElement.querySelectorAll('app-prom-trend');
    expect(charts.length).toBe(1);
  });

  it('calls window.print()', async () => {
    const { fixture } = await setup();
    const spy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    fixture.nativeElement.querySelector('.report__print').click();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('shows an error state', async () => {
    const { fixture } = await setup(vi.fn().mockReturnValue(throwError(() => new Error('x'))));
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
