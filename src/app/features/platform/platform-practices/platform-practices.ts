import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { humanise } from '../../patients/patient.model';
import { PlatformService } from '../platform.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-platform-practices',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './platform-practices.html',
  styleUrl: './platform-practices.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformPractices {
  private readonly service = inject(PlatformService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly humanise = humanise;

  readonly search = signal('');
  readonly offset = signal(0);

  private readonly query = toSignal(toObservable(this.search).pipe(debounceTime(250)), {
    initialValue: '',
  });

  readonly page = rxResource({
    params: () => ({
      q: this.query().trim() || undefined,
      limit: PAGE_SIZE,
      offset: this.offset(),
    }),
    stream: ({ params }) => this.service.listPractices(params),
  });

  readonly rangeStart = computed(() =>
    (this.page.value()?.total ?? 0) === 0 ? 0 : this.offset() + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.offset() + PAGE_SIZE, this.page.value()?.total ?? 0),
  );
  readonly hasPrev = computed(() => this.offset() > 0);
  readonly hasNext = computed(() => this.offset() + PAGE_SIZE < (this.page.value()?.total ?? 0));

  // --- add a platform administrator ---
  readonly adminForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly adminBusy = signal(false);
  readonly adminMessage = signal<string | null>(null);
  readonly adminError = signal(false);

  constructor() {
    effect(() => {
      this.query();
      this.offset.set(0);
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  prev(): void {
    this.offset.update((o) => Math.max(0, o - PAGE_SIZE));
  }

  next(): void {
    this.offset.update((o) => o + PAGE_SIZE);
  }

  addPlatformAdmin(): void {
    if (this.adminBusy() || this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.adminBusy.set(true);
    this.adminMessage.set(null);
    this.adminError.set(false);
    const { email, password } = this.adminForm.getRawValue();
    this.service.addPlatformAdmin({ email: email.trim(), password }).subscribe({
      next: () => {
        this.adminBusy.set(false);
        this.adminForm.reset({ email: '', password: '' });
        this.adminMessage.set('Platform administrator added.');
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
