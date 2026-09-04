import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminSitesService } from '../admin-sites.service';
import { AdminUsersService } from '../admin-users.service';
import { UserForm } from './user-form';

interface Stub {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  setPassword: ReturnType<typeof vi.fn>;
}

function stub(): Stub {
  return {
    get: vi.fn(),
    create: vi.fn().mockReturnValue(of({ id: 8 })),
    update: vi.fn().mockReturnValue(of({ id: 8 })),
    setPassword: vi.fn().mockReturnValue(of({ id: 8 })),
  };
}

const SITES = [
  {
    id: 2,
    practiceId: 1,
    name: 'Northgate Main Hospital',
    type: 'location',
    address: null,
    createdAt: '',
    updatedAt: '',
  },
];

async function build(service: Stub) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [UserForm],
    providers: [
      provideRouter([]),
      { provide: AdminUsersService, useValue: service },
      { provide: AdminSitesService, useValue: { list: vi.fn().mockReturnValue(of(SITES)) } },
    ],
  }).compileComponents();
  return vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
}

describe('UserForm', () => {
  it('requires an email and a password to create', async () => {
    const service = stub();
    await build(service);
    const fixture = TestBed.createComponent(UserForm);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates a user with the chosen role and site', async () => {
    const service = stub();
    const navigate = await build(service);
    const fixture = TestBed.createComponent(UserForm);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      email: 'new.clinician@northgate-rehab.co.za',
      role: 'prosthetist',
      siteId: '2',
      password: 'temp12345',
    });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith({
      email: 'new.clinician@northgate-rehab.co.za',
      password: 'temp12345',
      role: 'prosthetist',
      siteId: 2,
    });
    expect(navigate).toHaveBeenCalledWith(['/users']);
  });

  it('prefills in edit mode and patches without a password', async () => {
    const service = stub();
    service.get.mockReturnValue(
      of({
        id: 5,
        email: 'old@northgate-rehab.co.za',
        role: 'clinician',
        isActive: true,
        practiceId: 1,
        siteId: null,
        practiceName: 'Northgate',
        siteName: null,
      }),
    );
    const navigate = await build(service);
    const fixture = TestBed.createComponent(UserForm);
    fixture.componentRef.setInput('id', '5');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.email.value).toBe('old@northgate-rehab.co.za');

    fixture.componentInstance.form.patchValue({ isActive: false });
    fixture.componentInstance.submit();
    expect(service.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ isActive: false, role: 'clinician' }),
    );
    expect(navigate).toHaveBeenCalled();
  });

  it('sets a password through the dedicated form', async () => {
    const service = stub();
    service.get.mockReturnValue(
      of({
        id: 5,
        email: 'a@b.co.za',
        role: 'clinician',
        isActive: true,
        practiceId: 1,
        siteId: null,
        practiceName: null,
        siteName: null,
      }),
    );
    await build(service);
    const fixture = TestBed.createComponent(UserForm);
    fixture.componentRef.setInput('id', '5');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.passwordForm.setValue({ password: 'freshpass1' });
    fixture.componentInstance.submitPassword();
    expect(service.setPassword).toHaveBeenCalledWith(5, 'freshpass1');
    expect(fixture.componentInstance.passwordMessage()).toContain('updated');
  });

  it('surfaces the 409 and the self-deactivate 403', async () => {
    const service = stub();
    service.create.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 409 })));
    await build(service);
    const fixture = TestBed.createComponent(UserForm);
    fixture.detectChanges();
    fixture.componentInstance.form.patchValue({ email: 'dup@x.co.za', password: 'temp12345' });
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.errorMessage()).toContain('already exists');

    service.create.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { detail: 'You cannot deactivate your own account' },
          }),
      ),
    );
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.errorMessage()).toContain('your own account');
  });
});
