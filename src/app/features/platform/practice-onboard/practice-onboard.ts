import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SITE_TYPES, SiteType } from '../../admin/admin.model';
import { humanise } from '../../patients/patient.model';
import { PRACTICE_TYPES, PracticeOnboard as OnboardPayload, PracticeType } from '../platform.model';
import { PlatformService } from '../platform.service';

@Component({
  selector: 'app-practice-onboard',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './practice-onboard.html',
  styleUrl: './practice-onboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeOnboard {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(PlatformService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly practiceTypes = PRACTICE_TYPES;
  readonly siteTypes = SITE_TYPES;

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    practiceName: ['', [Validators.required, Validators.maxLength(255)]],
    practiceType: ['hospital_network' as PracticeType, [Validators.required]],
    practiceAddress: ['', [Validators.maxLength(500)]],
    siteName: ['', [Validators.required, Validators.maxLength(255)]],
    siteType: ['location' as SiteType, [Validators.required]],
    siteAddress: ['', [Validators.maxLength(500)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

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
    const payload: OnboardPayload = {
      practice: {
        name: raw.practiceName.trim(),
        type: raw.practiceType,
        address: raw.practiceAddress.trim() || null,
      },
      firstSite: {
        name: raw.siteName.trim(),
        type: raw.siteType,
        address: raw.siteAddress.trim() || null,
      },
      firstAdmin: { email: raw.adminEmail.trim(), password: raw.adminPassword },
    };

    this.service.onboard(payload).subscribe({
      next: (result) => this.router.navigate(['/platform', result.practice.id]),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'A user with that administrator email already exists. Nothing was created.';
      }
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not onboard the practice. Please try again.';
  }
}
