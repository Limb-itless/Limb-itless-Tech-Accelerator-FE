import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { AdminSitesService } from '../admin-sites.service';
import { SiteForm } from './site-form';

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
    imports: [SiteForm],
    providers: [provideRouter([]), { provide: AdminSitesService, useValue: service }],
  }).compileComponents();
  return vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
}

describe('SiteForm', () => {
  it('does not submit without a name', async () => {
    const service = stub();
    await build(service);
    const fixture = TestBed.createComponent(SiteForm);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates a site and returns to the list', async () => {
    const service = stub();
    const navigate = await build(service);
    const fixture = TestBed.createComponent(SiteForm);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      name: 'Sandton Clinic',
      type: 'department',
      address: '99 Rivonia Rd',
    });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith({
      name: 'Sandton Clinic',
      type: 'department',
      address: '99 Rivonia Rd',
    });
    expect(navigate).toHaveBeenCalledWith(['/users/sites']);
  });

  it('prefills and updates in edit mode', async () => {
    const service = stub();
    service.get.mockReturnValue(
      of({
        id: 3,
        practiceId: 1,
        name: 'Rosebank Gait Lab',
        type: 'department',
        address: null,
        createdAt: '',
        updatedAt: '',
      }),
    );
    const navigate = await build(service);
    const fixture = TestBed.createComponent(SiteForm);
    fixture.componentRef.setInput('id', '3');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.name.value).toBe('Rosebank Gait Lab');
    fixture.componentInstance.form.patchValue({ name: 'Rosebank Lab' });
    fixture.componentInstance.submit();
    expect(service.update).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ name: 'Rosebank Lab' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/users/sites']);
  });
});
