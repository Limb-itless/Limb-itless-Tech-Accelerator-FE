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

import { humanise } from '../../patient.model';
import { DevicesService } from '../../devices/devices.service';
import { kindLabel, regionLabel } from '../../involvements/involvement.model';
import { InvolvementsService } from '../../involvements/involvements.service';
import {
  CARE_PATHWAYS,
  MILESTONE_STATUSES,
  MILESTONE_TYPES,
  MilestoneCreate,
} from '../milestone.model';
import { MilestonesService } from '../milestones.service';

type Mode = 'create' | 'edit';

@Component({
  selector: 'app-milestone-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './milestone-form.html',
  styleUrl: './milestone-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MilestoneForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(MilestonesService);
  private readonly devices = inject(DevicesService);
  private readonly involvementsService = inject(InvolvementsService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly types = MILESTONE_TYPES;
  readonly pathways = CARE_PATHWAYS;
  readonly statuses = MILESTONE_STATUSES;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();
  /** `:milestoneId` route parameter — absent when creating. */
  readonly milestoneId = input<string>();
  /** Set from route `data`; defaults to create. */
  readonly mode = input<Mode>('create');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly heading = computed(() => (this.mode() === 'edit' ? 'Edit milestone' : 'Add milestone'));

  readonly form = this.fb.group({
    milestoneType: ['', [Validators.required]],
    carePathway: ['other', [Validators.required]],
    involvementId: [''],
    deviceId: [''],
    orderIndex: [0, [Validators.min(0)]],
    status: ['not_started', [Validators.required]],
    targetDate: [''],
    completedDate: [''],
    notes: [''],
  });

  readonly deviceOptions = rxResource({
    params: () => ({ patientId: Number(this.id()) }),
    stream: ({ params }) => this.devices.listForPatient(params.patientId),
  });

  readonly involvementOptions = rxResource({
    params: () => ({ patientId: Number(this.id()) }),
    stream: ({ params }) => this.involvementsService.list(params.patientId),
  });

  private readonly existing = rxResource({
    params: () => {
      const milestoneId = this.milestoneId();
      return milestoneId && this.mode() === 'edit'
        ? { patientId: Number(this.id()), milestoneId: Number(milestoneId) }
        : undefined;
    },
    stream: ({ params }) => this.service.get(params.patientId, params.milestoneId),
  });

  constructor() {
    effect(() => {
      const milestone = this.existing.value();
      if (!milestone) {
        return;
      }
      this.form.setValue({
        milestoneType: milestone.milestoneType,
        carePathway: milestone.carePathway,
        involvementId: milestone.involvementId === null ? '' : String(milestone.involvementId),
        deviceId: milestone.deviceId === null ? '' : String(milestone.deviceId),
        orderIndex: milestone.orderIndex,
        status: milestone.status,
        targetDate: milestone.targetDate ?? '',
        completedDate: milestone.completedDate ?? '',
        notes: milestone.notes ?? '',
      });
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
    const payload: MilestoneCreate = {
      milestoneType: raw.milestoneType as MilestoneCreate['milestoneType'],
      carePathway: raw.carePathway as MilestoneCreate['carePathway'],
      involvementId: raw.involvementId ? Number(raw.involvementId) : null,
      deviceId: raw.deviceId ? Number(raw.deviceId) : null,
      orderIndex: Number(raw.orderIndex) || 0,
      status: raw.status as MilestoneCreate['status'],
      targetDate: raw.targetDate.trim() || null,
      completedDate: raw.completedDate.trim() || null,
      notes: raw.notes.trim() || null,
    };

    const patientId = Number(this.id());
    const milestoneId = this.milestoneId() ? Number(this.milestoneId()) : null;
    const request$ =
      this.mode() === 'edit' && milestoneId !== null
        ? this.service.update(patientId, milestoneId, payload)
        : this.service.create(patientId, payload);

    request$.subscribe({
      next: () => this.router.navigate(['/patients', patientId]),
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
    return 'Could not save the milestone. Please try again.';
  }
}
