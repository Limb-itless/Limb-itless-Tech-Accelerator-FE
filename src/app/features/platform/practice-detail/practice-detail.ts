import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { humanise } from '../../patients/patient.model';
import { PlatformService } from '../platform.service';

@Component({
  selector: 'app-practice-detail',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './practice-detail.html',
  styleUrl: './practice-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeDetail {
  private readonly service = inject(PlatformService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly humanise = humanise;

  readonly id = input.required<string>();

  readonly practice = rxResource({
    params: () => ({ id: Number(this.id()) }),
    stream: ({ params }) => this.service.getPractice(params.id),
  });

  readonly adminForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly adminBusy = signal(false);
  readonly adminMessage = signal<string | null>(null);
  readonly adminError = signal(false);

  addAdmin(): void {
    if (this.adminBusy() || this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.adminBusy.set(true);
    this.adminMessage.set(null);
    this.adminError.set(false);
    const { email, password } = this.adminForm.getRawValue();
    this.service.addPracticeAdmin(Number(this.id()), { email: email.trim(), password }).subscribe({
      next: () => {
        this.adminBusy.set(false);
        this.adminForm.reset({ email: '', password: '' });
        this.adminMessage.set('Practice administrator added.');
        this.practice.reload();
      },
      error: (error: unknown) => {
        this.adminBusy.set(false);
        this.adminError.set(true);
        this.adminMessage.set(
          error instanceof HttpErrorResponse && error.status === 409
            ? 'A user with that email already exists.'
            : 'Could not add the administrator.',
        );
      },
    });
  }
}
