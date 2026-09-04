import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { PlatformService } from '../platform.service';
import { PracticeForm } from './practice-form';

const detail = {
  id: 3,
  name: 'Cape Mobility Clinic',
  type: 'private_practice',
  address: '45 Kloof St',
  createdAt: '',
  updatedAt: '',
  siteCount: 2,
  userCount: 2,
  patientCount: 2,
  sites: [],
};

async function build(update = vi.fn().mockReturnValue(of(detail))) {
  TestBed.resetTestingModule();
  const service = { getPractice: vi.fn().mockReturnValue(of(detail)), updatePractice: update };
  await TestBed.configureTestingModule({
    imports: [PracticeForm],
    providers: [provideRouter([]), { provide: PlatformService, useValue: service }],
  }).compileComponents();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(PracticeForm);
  fixture.componentRef.setInput('id', '3');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, service, navigate };
}

describe('PracticeForm', () => {
  it('prefills from the practice and patches on save', async () => {
    const { fixture, service, navigate } = await build();
    expect(fixture.componentInstance.form.controls.name.value).toBe('Cape Mobility Clinic');

    fixture.componentInstance.form.patchValue({ name: 'Cape Mobility', address: '' });
    fixture.componentInstance.submit();

    expect(service.updatePractice).toHaveBeenCalledWith(3, {
      name: 'Cape Mobility',
      type: 'private_practice',
      address: null,
    });
    expect(navigate).toHaveBeenCalledWith(['/platform', 3]);
  });

  it('does not submit an empty name', async () => {
    const { fixture, service } = await build();
    fixture.componentInstance.form.patchValue({ name: '' });
    fixture.componentInstance.submit();
    expect(service.updatePractice).not.toHaveBeenCalled();
  });
});
