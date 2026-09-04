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
import { INSTRUMENT_META, PROM_INSTRUMENTS, PromCreate, PromInstrument } from '../prom.model';
import { PromsService } from '../proms.service';

type Mode = 'create' | 'edit';

@Component({
  selector: 'app-prom-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './prom-form.html',
  styleUrl: './prom-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(PromsService);
  private readonly devices = inject(DevicesService);
  private readonly involvementsService = inject(InvolvementsService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly instruments = PROM_INSTRUMENTS;
  readonly meta = INSTRUMENT_META;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();
  /** `:promId` route parameter — absent when creating. */
  readonly promId = input<string>();
  /** Set from route `data`; defaults to create. */
  readonly mode = input<Mode>('create');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly heading = computed(() =>
    this.mode() === 'edit' ? 'Correct an outcome measure' : 'Record an outcome measure',
  );

  readonly form = this.fb.group({
    instrument: ['', [Validators.required]],
    score: ['', [Validators.required]],
    recordedAt: [''],
    involvementId: [''],
    deviceId: [''],
    notes: [''],
  });

  /** Live meta for the chosen instrument, for scale hints and bounds. */
  readonly selectedMeta = computed(() => {
    const instrument = this.form.controls.instrument.value as PromInstrument | '';
    return instrument ? INSTRUMENT_META[instrument] : null;
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
      const promId = this.promId();
      return promId && this.mode() === 'edit'
        ? { patientId: Number(this.id()), promId: Number(promId) }
        : undefined;
    },
    stream: ({ params }) => this.service.get(params.patientId, params.promId),
  });

  constructor() {
    effect(() => {
      const prom = this.existing.value();
      if (!prom) {
        return;
      }
      const rawScore = prom.responses['score'] ?? prom.score;
      this.form.setValue({
        instrument: prom.instrument,
        score: rawScore === null || rawScore === undefined ? '' : String(rawScore),
        recordedAt: prom.recordedAt ? prom.recordedAt.slice(0, 16) : '',
        involvementId: prom.involvementId === null ? '' : String(prom.involvementId),
        deviceId: prom.deviceId === null ? '' : String(prom.deviceId),
        notes: prom.notes ?? '',
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
    const payload: PromCreate = {
      instrument: raw.instrument as PromInstrument,
      responses: { score: Number(raw.score) },
      involvementId: raw.involvementId ? Number(raw.involvementId) : null,
      deviceId: raw.deviceId ? Number(raw.deviceId) : null,
      recordedAt: raw.recordedAt.trim() ? new Date(raw.recordedAt).toISOString() : null,
      notes: raw.notes.trim() || null,
    };

    const patientId = Number(this.id());
    const promId = this.promId() ? Number(this.promId()) : null;
    const request$ =
      this.mode() === 'edit' && promId !== null
        ? this.service.update(patientId, promId, payload)
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
    return 'Could not save the measure. Please try again.';
  }
}
