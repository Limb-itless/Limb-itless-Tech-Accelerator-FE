import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { humanise } from '../../patients/patient.model';
import { deviceTypeLabel } from '../../patients/devices/device.model';
import { kindLabel, regionLabel } from '../../patients/involvements/involvement.model';
import { Milestone, isOverdue } from '../../patients/milestones/milestone.model';
import { PortalService } from '../portal.service';

@Component({
  selector: 'app-portal-home',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './portal-home.html',
  styleUrl: './portal-home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalHome {
  private readonly portal = inject(PortalService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly deviceTypeLabel = deviceTypeLabel;

  readonly data = rxResource({
    params: () => ({}),
    stream: () =>
      forkJoin({
        profile: this.portal.profile(),
        involvements: this.portal.involvements(),
        milestones: this.portal.milestones(),
      }),
  });

  /** milestones still to come, earliest first */
  readonly nextSteps = computed<Milestone[]>(() => {
    const all = this.data.value()?.milestones ?? [];
    return all
      .filter((m) => m.status !== 'complete')
      .slice()
      .sort((a, b) => (a.targetDate ?? '').localeCompare(b.targetDate ?? ''));
  });

  readonly overdue = isOverdue;

  /** A signed-in patient with no linked record yet gets a claim form
   * instead of the generic error (Section 5.11); anything else is an
   * unexpected failure. */
  readonly unlinked = computed(
    () =>
      this.data.error() instanceof HttpErrorResponse &&
      (this.data.error() as HttpErrorResponse).status === 404,
  );

  readonly claimForm = this.fb.group({
    identifier: ['', [Validators.required]],
    contactValue: ['', [Validators.required]],
  });

  readonly claiming = signal(false);
  readonly claimError = signal<string | null>(null);

  submitClaim(): void {
    if (this.claiming()) {
      return;
    }
    if (this.claimForm.invalid) {
      this.claimForm.markAllAsTouched();
      return;
    }

    this.claiming.set(true);
    this.claimError.set(null);

    this.portal.claim(this.claimForm.getRawValue()).subscribe({
      next: () => {
        this.claiming.set(false);
        this.data.reload();
      },
      error: () => {
        this.claiming.set(false);
        this.claimError.set("We couldn't find a matching record with those details.");
      },
    });
  }
}
