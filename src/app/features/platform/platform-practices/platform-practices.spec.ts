import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PlatformService } from '../platform.service';
import { PlatformPractices } from './platform-practices';

const page = {
  items: [
    {
      id: 1,
      name: 'Northgate Rehabilitation Network',
      type: 'hospital_network',
      address: null,
      createdAt: '',
      updatedAt: '',
      siteCount: 2,
      userCount: 5,
      patientCount: 8,
    },
    {
      id: 2,
      name: 'Cape Mobility Clinic',
      type: 'private_practice',
      address: null,
      createdAt: '',
      updatedAt: '',
      siteCount: 1,
      userCount: 2,
      patientCount: 2,
    },
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

async function setup(overrides: Partial<Record<string, unknown>> = {}) {
  TestBed.resetTestingModule();
  const service = {
    listPractices: vi.fn().mockReturnValue(of(page)),
    addPlatformAdmin: vi.fn().mockReturnValue(of({ id: 9 })),
    ...overrides,
  };
  await TestBed.configureTestingModule({
    imports: [PlatformPractices],
    providers: [provideRouter([]), { provide: PlatformService, useValue: service }],
  }).compileComponents();
  const fixture = TestBed.createComponent(PlatformPractices);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, service };
}

describe('PlatformPractices', () => {
  it('renders a row per practice with its counts', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Northgate Rehabilitation Network');
    expect(text).toContain('Hospital network');
    expect(rows[0].textContent).toContain('8');
  });

  it('pages forward', async () => {
    const { fixture } = await setup({
      listPractices: vi.fn().mockReturnValue(of({ ...page, total: 40 })),
    });
    fixture.componentInstance.next();
    expect(fixture.componentInstance.offset()).toBe(20);
  });

  it('adds a platform administrator and clears the form', async () => {
    const { fixture, service } = await setup();
    fixture.componentInstance.adminForm.setValue({
      email: 'new.platform@limbitless.co.za',
      password: 'longenough1',
    });
    fixture.componentInstance.addPlatformAdmin();
    expect(service.addPlatformAdmin).toHaveBeenCalledWith({
      email: 'new.platform@limbitless.co.za',
      password: 'longenough1',
    });
    expect(fixture.componentInstance.adminMessage()).toContain('added');
    expect(fixture.componentInstance.adminForm.controls.email.value).toBe('');
  });

  it('shows the 409 on a duplicate admin email', async () => {
    const { fixture } = await setup({
      addPlatformAdmin: vi
        .fn()
        .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 }))),
    });
    fixture.componentInstance.adminForm.setValue({ email: 'dup@x.co.za', password: 'longenough1' });
    fixture.componentInstance.addPlatformAdmin();
    expect(fixture.componentInstance.adminError()).toBe(true);
    expect(fixture.componentInstance.adminMessage()).toContain('already exists');
  });
});
