import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { appointmentTypeLabel } from '../../availability/availability.model';
import {
  COVERAGE_STATUSES,
  CoverageDetermination,
  CoverageStatus,
  coverageStatusLabel,
} from '../review.model';
import { ReviewService } from '../review.service';

type DecidingMode = 'approve' | 'deny';

/** The reviewer's coverage queue - every determination for a patient
 * they can see (granted or scheme-matched), decided here rather than
 * fetched live from a scheme's own systems. Defaults to "Pending" - the
 * actual queue - same reasoning as the staff triage view defaulting to
 * "Booked". */
@Component({
  selector: 'app-review-coverage',
  imports: [],
  templateUrl: './review-coverage.html',
  styleUrl: './review-coverage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewCoverage {
  private readonly service = inject(ReviewService);

  readonly statuses = COVERAGE_STATUSES;
  readonly appointmentTypeLabel = appointmentTypeLabel;
  readonly coverageStatusLabel = coverageStatusLabel;

  readonly statusFilter = signal<CoverageStatus | null>('pending');

  readonly queue = rxResource({
    params: () => ({ status: this.statusFilter() ?? undefined }),
    stream: ({ params }) => this.service.coverageQueue(params.status),
  });

  readonly decidingId = signal<number | null>(null);
  readonly decidingMode = signal<DecidingMode | null>(null);

  readonly authorizationNumber = signal('');
  readonly validUntil = signal('');
  readonly notes = signal('');

  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);

  onStatusChange(value: string): void {
    this.statusFilter.set(value ? (value as CoverageStatus) : null);
  }

  startApprove(coverage: CoverageDetermination): void {
    this.decidingId.set(coverage.id);
    this.decidingMode.set('approve');
    this.authorizationNumber.set('');
    this.validUntil.set('');
    this.notes.set('');
    this.actionError.set(null);
  }

  startDeny(coverage: CoverageDetermination): void {
    this.decidingId.set(coverage.id);
    this.decidingMode.set('deny');
    this.notes.set('');
    this.actionError.set(null);
  }

  back(): void {
    this.decidingId.set(null);
    this.decidingMode.set(null);
  }

  confirmApprove(coverageId: number): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);
    this.service
      .approve(coverageId, {
        authorizationNumber: this.authorizationNumber().trim() || null,
        validUntil: this.validUntil() || null,
        notes: this.notes().trim() || null,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.back();
          this.queue.reload();
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.actionError.set(this.messageFor(error));
        },
      });
  }

  confirmDeny(coverageId: number): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);
    this.service.deny(coverageId, { notes: this.notes().trim() || null }).subscribe({
      next: () => {
        this.busy.set(false);
        this.back();
        this.queue.reload();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.actionError.set(this.messageFor(error));
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
    return 'Something went wrong. Please try again.';
  }
}
