import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Auth } from '../../../../core/auth/auth';
import { Prom } from '../prom.model';
import { PromsService } from '../proms.service';
import { PromList } from './prom-list';

function prom(overrides: Partial<Prom>): Prom {
  return {
    id: 1,
    patientId: 3,
    involvementId: null,
    deviceId: null,
    instrument: 'pain_residual_limb',
    responses: { score: 8 },
    score: 8,
    flagged: true,
    flagReason: 'Residual limb pain 7+/10',
    recordedAt: '2026-03-01T09:00:00',
    recordedById: 5,
    notes: 'Worse after long walk',
    createdAt: '2026-03-01T09:00:00',
    updatedAt: '2026-03-01T09:00:00',
    ...overrides,
  };
}

async function setup(role = 'clinician', rows: Prom[] = [prom({})]) {
  TestBed.resetTestingModule();
  const list = vi.fn().mockReturnValue(of(rows));
  await TestBed.configureTestingModule({
    imports: [PromList],
    providers: [
      provideRouter([]),
      { provide: PromsService, useValue: { list } },
      { provide: Auth, useValue: { currentUser: signal({ role }) } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PromList);
  fixture.componentRef.setInput('patientId', 3);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list };
}

describe('PromList', () => {
  it('renders a trend per instrument and a flagged table row', async () => {
    const { fixture } = await setup('clinician', [
      prom({
        id: 1,
        instrument: 'pain_residual_limb',
        score: 8,
        recordedAt: '2026-01-01T00:00:00',
      }),
      prom({
        id: 2,
        instrument: 'pain_residual_limb',
        score: 5,
        recordedAt: '2026-02-01T00:00:00',
      }),
      prom({
        id: 3,
        instrument: 'socket_comfort_score',
        score: 3,
        flagged: true,
        recordedAt: '2026-02-10T00:00:00',
      }),
    ]);
    expect(fixture.nativeElement.querySelectorAll('app-prom-trend').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.proms__row--flagged')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Residual limb pain (NRS)');
  });

  it('shows record + edit only to writers', async () => {
    const writer = await setup('clinician');
    expect(writer.fixture.nativeElement.querySelector('.proms__add')).not.toBeNull();
    expect(writer.fixture.nativeElement.querySelector('tbody a')).not.toBeNull();

    const admin = await setup('practice_administrator');
    expect(admin.fixture.nativeElement.querySelector('.proms__add')).toBeNull();
    expect(admin.fixture.nativeElement.querySelector('tbody a')).toBeNull();
  });

  it('shows an empty state', async () => {
    const { fixture } = await setup('clinician', []);
    expect(fixture.nativeElement.querySelector('.proms__empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-prom-trend')).toBeNull();
  });

  it('shows an error state', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PromList],
      providers: [
        provideRouter([]),
        {
          provide: PromsService,
          useValue: { list: vi.fn().mockReturnValue(throwError(() => new Error('x'))) },
        },
        { provide: Auth, useValue: { currentUser: signal({ role: 'clinician' }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PromList);
    fixture.componentRef.setInput('patientId', 3);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
