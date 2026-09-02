import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { Auth, AuthenticatedUser } from '../../../core/auth/auth';
import { Login } from './login';

class FakeAuth {
  authed = false;
  isAuthenticated = (): boolean => this.authed;
  login = vi.fn((_email: string, _password: string): Observable<AuthenticatedUser> =>
    of({} as AuthenticatedUser),
  );
}

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let auth: FakeAuth;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let returnUrl: string | null;

  beforeEach(async () => {
    auth = new FakeAuth();
    navigateByUrl = vi.fn();
    returnUrl = null;

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => returnUrl } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  function fillForm(email = 'doc@clinic.io', password = 'secret'): void {
    fixture.componentInstance.form.setValue({ email, password });
  }

  it('does not call the backend when the form is empty', () => {
    fixture.componentInstance.submit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('does not submit an invalid email', () => {
    fillForm('not-an-email');
    fixture.componentInstance.submit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('logs in and navigates to the dashboard by default', () => {
    fillForm();
    fixture.componentInstance.submit();

    expect(auth.login).toHaveBeenCalledWith('doc@clinic.io', 'secret');
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to the returnUrl when one is present', () => {
    returnUrl = '/reports';
    fillForm();
    fixture.componentInstance.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/reports');
  });

  it('shows an error and re-enables the form when login fails', () => {
    auth.login.mockReturnValueOnce(throwError(() => new Error('401')));
    fillForm('doc@clinic.io', 'wrong');
    fixture.componentInstance.submit();

    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage()).toBeTruthy();
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('redirects away when the visitor is already signed in', () => {
    navigateByUrl.mockClear();
    auth.authed = true;

    const alreadyIn = TestBed.createComponent(Login);
    alreadyIn.detectChanges();

    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
