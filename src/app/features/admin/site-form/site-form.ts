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
import { SITE_TYPES, SiteCreate, SiteType } from '../admin.model';
import { AdminSitesService } from '../admin-sites.service';

type Mode = 'create' | 'edit';

@Component({
  selector: 'app-site-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './site-form.html',
  styleUrl: './site-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminSitesService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly types = SITE_TYPES;

  readonly id = input<string>();
  readonly mode = input<Mode>('create');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly heading = computed(() => (this.mode() === 'edit' ? 'Edit site' : 'New site'));

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    type: ['location' as SiteType, [Validators.required]],
    address: ['', [Validators.maxLength(500)]],
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
      const site = this.existing.value();
      if (site) {
        this.form.setValue({
          name: site.name,
          type: site.type,
          address: site.address ?? '',
        });
      }
    });
  }

  get invalidName(): boolean {
    const field = this.form.controls.name;
    return field.invalid && field.touched;
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
    const payload: SiteCreate = {
      name: raw.name.trim(),
      type: raw.type,
      address: raw.address.trim() || null,
    };

    const request$ =
      this.mode() === 'edit' && this.id()
        ? this.service.update(Number(this.id()), payload)
        : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/users/sites']),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not save the site. Please try again.';
  }
}
