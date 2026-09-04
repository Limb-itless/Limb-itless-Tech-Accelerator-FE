import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { InvolvementsService } from '../involvements.service';
import { InvolvementForm } from './involvement-form';

interface Stub {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

function stub(): Stub {
  return {
    get: vi.fn(),
    create: vi.fn().mockReturnValue(of({ id: 4 })),
    update: vi.fn().mockReturnValue(of({ id: 4 })),
  };
}

async function build(service: Stub) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [InvolvementForm],
    providers: [provideRouter([]), { provide: InvolvementsService, useValue: service }],
  }).compileComponents();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(InvolvementForm);
  fixture.componentRef.setInput('id', '9');
  return { fixture, navigate };
}

describe('InvolvementForm', () => {
  it('does not submit without a region', async () => {
    const service = stub();
    const { fixture } = await build(service);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates an amputation with a level and cause', async () => {
    const service = stub();
    const { fixture, navigate } = await build(service);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      kind: 'amputation',
      region: 'lower_limb_left',
      level: 'transtibial',
      cause: 'trauma',
    });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        kind: 'amputation',
        region: 'lower_limb_left',
        level: 'transtibial',
        cause: 'trauma',
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 9]);
  });

  it('nulls the level and cause for an orthotic need', async () => {
    const service = stub();
    const { fixture } = await build(service);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      kind: 'amputation',
      region: 'spine',
      level: 'transtibial',
      cause: 'trauma',
    });
    fixture.componentInstance.form.patchValue({ kind: 'orthotic_need' });
    fixture.detectChanges();
    expect(fixture.componentInstance.levelApplies()).toBe(false);

    fixture.componentInstance.submit();
    expect(service.create).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ kind: 'orthotic_need', level: null, cause: null }),
    );
  });

  it('prefills and updates in edit mode', async () => {
    const service = stub();
    service.get.mockReturnValue(
      of({
        id: 3,
        patientId: 9,
        kind: 'amputation',
        region: 'lower_limb_right',
        level: 'transfemoral',
        cause: 'dysvascular',
        onsetDate: '2025-06-01',
        status: 'active',
        notes: 'x',
        devices: [],
        createdAt: '',
        updatedAt: '',
      }),
    );
    const { fixture } = await build(service);
    fixture.componentRef.setInput('involvementId', '3');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.region.value).toBe('lower_limb_right');
    fixture.componentInstance.form.patchValue({ status: 'resolved' });
    fixture.componentInstance.submit();
    expect(service.update).toHaveBeenCalledWith(
      9,
      3,
      expect.objectContaining({ status: 'resolved' }),
    );
  });
});
