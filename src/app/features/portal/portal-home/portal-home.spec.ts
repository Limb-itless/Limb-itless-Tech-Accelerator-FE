import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PortalService } from '../portal.service';
import { PortalHome } from './portal-home';

const PROFILE = { firstName: 'Thabo', practiceName: 'Northgate', siteName: 'Main' };

const INVOLVEMENTS = [
  {
    id: 11,
    kind: 'amputation',
    region: 'lower_limb_left',
    level: 'transfemoral',
    devices: [
      {
        id: 1,
        deviceType: 'myoelectric',
        manufacturer: 'Ottobock',
        model: 'Genium',
        status: 'active',
      },
    ],
  },
];

const MILESTONES = [
  {
    id: 1,
    milestoneType: 'gait_functional_training',
    status: 'in_progress',
    targetDate: '2026-09-20',
  },
  {
    id: 2,
    milestoneType: 'pre_prosthetic_assessment',
    status: 'complete',
    targetDate: '2026-01-01',
  },
];

async function setup(over: Record<string, unknown> = {}) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PortalHome],
    providers: [
      provideRouter([]),
      {
        provide: PortalService,
        useValue: {
          profile: vi.fn().mockReturnValue(of(PROFILE)),
          involvements: vi.fn().mockReturnValue(of(INVOLVEMENTS)),
          milestones: vi.fn().mockReturnValue(of(MILESTONES)),
          ...over,
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PortalHome);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture };
}

describe('PortalHome', () => {
  it('greets the patient and shows their involvement + device', async () => {
    const { fixture } = await setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Hello, Thabo');
    expect(text).toContain('Left leg — Amputation');
    expect(text).toContain('Myoelectric prosthesis');
  });

  it('lists only incomplete milestones as next steps', async () => {
    const { fixture } = await setup();
    const steps = fixture.nativeElement.querySelectorAll('.portal__steps li');
    expect(steps.length).toBe(1);
    expect(steps[0].textContent).toContain('Gait functional training');
  });

  it('shows a friendly error', async () => {
    const { fixture } = await setup({
      profile: vi.fn().mockReturnValue(throwError(() => new Error('x'))),
    });
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
