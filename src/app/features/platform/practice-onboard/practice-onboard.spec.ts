import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PlatformService } from '../platform.service';
import { PracticeOnboard } from './practice-onboard';

async function build(onboard: ReturnType<typeof vi.fn>) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PracticeOnboard],
    providers: [provideRouter([]), { provide: PlatformService, useValue: { onboard } }],
  }).compileComponents();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(PracticeOnboard);
  fixture.detectChanges();
  return { fixture, navigate };
}

function fillValid(component: PracticeOnboard): void {
  component.form.patchValue({
    practiceName: 'Sunrise Prosthetics',
    practiceType: 'private_practice',
    siteName: 'Sunrise Main Rooms',
    siteType: 'location',
    adminEmail: 'admin@sunrise.co.za',
    adminPassword: 'temp12345',
  });
}

describe('PracticeOnboard', () => {
  it('does not submit an incomplete form', async () => {
    const onboard = vi.fn();
    const { fixture } = await build(onboard);
    fixture.componentInstance.submit();
    expect(onboard).not.toHaveBeenCalled();
  });

  it('submits a nested payload and navigates to the new practice', async () => {
    const onboard = vi.fn().mockReturnValue(of({ practice: { id: 12 } }));
    const { fixture, navigate } = await build(onboard);

    fillValid(fixture.componentInstance);
    fixture.componentInstance.submit();

    expect(onboard).toHaveBeenCalledWith({
      practice: { name: 'Sunrise Prosthetics', type: 'private_practice', address: null },
      firstSite: { name: 'Sunrise Main Rooms', type: 'location', address: null },
      firstAdmin: { email: 'admin@sunrise.co.za', password: 'temp12345' },
    });
    expect(navigate).toHaveBeenCalledWith(['/platform', 12]);
  });

  it('shows a rollback message on a duplicate admin email', async () => {
    const onboard = vi
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const { fixture } = await build(onboard);
    fillValid(fixture.componentInstance);
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.errorMessage()).toContain('Nothing was created');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
