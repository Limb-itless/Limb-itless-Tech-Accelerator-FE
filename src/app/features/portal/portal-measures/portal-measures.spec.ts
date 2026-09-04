import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PortalService } from '../portal.service';
import { PortalMeasures } from './portal-measures';

const HISTORY = [
  {
    id: 9,
    instrument: 'socket_comfort_score',
    score: 3,
    flagged: true,
    recordedAt: '2026-08-30T09:00:00',
  },
];

const INSTRUMENTS = { instruments: ['socket_comfort_score', 'locomotor_capabilities_index'] };

async function setup(submitProm = vi.fn().mockReturnValue(of({ id: 10 }))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PortalMeasures],
    providers: [
      provideRouter([]),
      {
        provide: PortalService,
        useValue: {
          proms: vi.fn().mockReturnValue(of(HISTORY)),
          instruments: vi.fn().mockReturnValue(of(INSTRUMENTS)),
          submitProm,
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PortalMeasures);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, submitProm };
}

describe('PortalMeasures', () => {
  it('lists the history and offers only the allowed instruments', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    const options = fixture.nativeElement.querySelectorAll('#instrument option');
    // placeholder + 2
    expect(options.length).toBe(3);
    expect(fixture.nativeElement.querySelector('.measures__row--flagged')).not.toBeNull();
  });

  it('will not submit without an instrument and score', async () => {
    const { fixture, submitProm } = await setup();
    fixture.componentInstance.submit();
    expect(submitProm).not.toHaveBeenCalled();
  });

  it('submits a score and confirms', async () => {
    const { fixture, submitProm } = await setup();
    fixture.componentInstance.form.patchValue({ instrument: 'socket_comfort_score', score: 4 });
    fixture.componentInstance.submit();
    expect(submitProm).toHaveBeenCalledWith(
      expect.objectContaining({
        instrument: 'socket_comfort_score',
        responses: { score: 4 },
      }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.justSaved()).toBe(true);
  });
});
