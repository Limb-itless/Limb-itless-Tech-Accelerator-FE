import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { humanise } from '../../patients/patient.model';
import { ASSIGNABLE_ROLES, AdminUserCreate, AdminUserUpdate, AssignableRole } from '../admin.model';
import { AdminSitesService } from '../admin-sites.service';
import { AdminUsersService } from '../admin-users.service';

type Mode = 'create' | 'edit';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminUsersService);
  private readonly sitesService = inject(AdminSitesService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly roles = ASSIGNABLE_ROLES;

  readonly id = input<string>();
  readonly mode = input<Mode>('create');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly passwordBusy = signal(false);
  readonly passwordMessage = signal<string | null>(null);

  readonly heading = computed(() => (this.mode() === 'edit' ? 'Edit user' : 'New user'));

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['clinician' as AssignableRole, [Validators.required]],
    siteId: [''],
    password: ['', [Validators.minLength(8)]],
    isActive: [true],
  });

  readonly passwordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly sites = rxResource({
    params: () => ({}),
    stream: () => this.sitesService.list(),
  });

  private readonly existing = rxResource({
    params: () => {
      const id = this.id();
      return id && this.mode() === 'edit' ? { id: Number(id) } : undefined;
    },
    stream: ({ params }) => this.service.get(params.id),
  });

  constructor() {
    effect(() => {
      const user = this.existing.value();
      if (!user) {
        return;
      }
      this.form.patchValue({
        email: user.email,
        role: user.role,
        siteId: user.siteId === null ? '' : String(user.siteId),
        isActive: user.isActive,
      });
    });

    // The password field is only part of the create payload.
    effect(() => {
      const control = this.form.controls.password;
      if (this.mode() === 'create') {
        control.addValidators(Validators.required);
      } else {
        control.removeValidators(Validators.required);
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && field.touched;
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    const raw = this.form.getRawValue();
    const siteId = raw.siteId ? Number(raw.siteId) : null;

    if (this.mode() === 'edit' && this.id()) {
      const payload: AdminUserUpdate = {
        email: raw.email.trim(),
        role: raw.role,
        siteId,
        isActive: raw.isActive,
      };
      this.service.update(Number(this.id()), payload).subscribe({
        next: (user) => this.router.navigate(['/users'], { queryParams: { updated: user.id } }),
        error: (error: unknown) => this.fail(error),
      });
      return;
    }

    const payload: AdminUserCreate = {
      email: raw.email.trim(),
      password: raw.password,
      role: raw.role,
      siteId,
    };
    this.service.create(payload).subscribe({
      next: () => this.router.navigate(['/users']),
      error: (error: unknown) => this.fail(error),
    });
  }

  submitPassword(): void {
    if (this.passwordBusy() || !this.id()) {
      return;
    }
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.passwordBusy.set(true);
    this.passwordMessage.set(null);
    this.service
      .setPassword(Number(this.id()), this.passwordForm.controls.password.value)
      .subscribe({
        next: () => {
          this.passwordBusy.set(false);
          this.passwordForm.reset({ password: '' });
          this.passwordMessage.set('Password updated.');
        },
        error: (error: unknown) => {
          this.passwordBusy.set(false);
          this.passwordMessage.set(this.messageFor(error));
        },
      });
  }

  private fail(error: unknown): void {
    this.submitting.set(false);
    this.errorMessage.set(this.messageFor(error));
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'A user with that email already exists.';
      }
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not save the user. Please try again.';
  }
}
