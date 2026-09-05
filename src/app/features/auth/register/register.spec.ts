import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { Auth, AuthenticatedUser } from '../../../core/auth/auth';
import { Register } from './register';

class FakeAuth {
  register = vi.fn((_email: string, _password: string): Observable<AuthenticatedUser> =>
    of({} as AuthenticatedUser),
  );
}

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let auth: FakeAuth;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    auth = new FakeAuth();
    navigateByUrl = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: { navigateByUrl } },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
  });

  function fillForm(
    email = 'new@example.co.za',
    password = 'password1',
    confirmPassword = password,
  ): void {
    fixture.componentInstance.form.setValue({ email, password, confirmPassword });
  }

  it('does not call the backend when the form is empty', () => {
    fixture.componentInstance.submit();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('does not submit an invalid email', () => {
    fillForm('not-an-email');
    fixture.componentInstance.submit();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('does not submit a password shorter than 8 characters', () => {
    fillForm('new@example.co.za', 'short', 'short');
    fixture.componentInstance.submit();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('does not submit when the passwords do not match', () => {
    fillForm('new@example.co.za', 'password1', 'password2');
    fixture.componentInstance.submit();
    expect(auth.register).not.toHaveBeenCalled();
    expect(fixture.componentInstance.passwordMismatch).toBe(true);
  });

  it('registers and navigates to the portal', () => {
    fillForm();
    fixture.componentInstance.submit();

    expect(auth.register).toHaveBeenCalledWith('new@example.co.za', 'password1');
    expect(navigateByUrl).toHaveBeenCalledWith('/portal');
  });

  it('shows a duplicate-email message on a 409 and re-enables the form', () => {
    auth.register.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 409 })));
    fillForm();
    fixture.componentInstance.submit();

    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage()).toContain('already exists');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('shows a generic error on other failures', () => {
    auth.register.mockReturnValueOnce(throwError(() => new Error('boom')));
    fillForm();
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Could not create your account. Please try again.',
    );
  });
});
