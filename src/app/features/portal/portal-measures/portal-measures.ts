import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { humanise } from '../../patients/patient.model';
import { INSTRUMENT_META, PromInstrument } from '../../patients/proms/prom.model';
import { PortalService } from '../portal.service';

@Component({
  selector: 'app-portal-measures',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './portal-measures.html',
  styleUrl: './portal-measures.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalMeasures {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly portal = inject(PortalService);

  readonly humanise = humanise;
  readonly meta = INSTRUMENT_META;

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly justSaved = signal(false);

  readonly data = rxResource({
    params: () => ({}),
    stream: () =>
      forkJoin({
        history: this.portal.proms(),
        instruments: this.portal.instruments(),
      }),
  });

  readonly form = this.fb.group({
    instrument: ['', [Validators.required]],
    score: [null as number | null, [Validators.required]],
    notes: [''],
  });

  private readonly instrumentValue = toSignal(this.form.controls.instrument.valueChanges, {
    initialValue: '',
  });
  readonly selectedMeta = computed(() => {
    const key = this.instrumentValue() as PromInstrument | '';
    return key ? INSTRUMENT_META[key] : null;
  });

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && field.touched;
  }

  submit(): void {
    if (this.submitting() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.justSaved.set(false);

    const raw = this.form.getRawValue();
    this.portal
      .submitProm({
        instrument: raw.instrument as PromInstrument,
        responses: { score: Number(raw.score) },
        notes: raw.notes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.justSaved.set(true);
          this.form.reset({ instrument: '', score: null, notes: '' });
          this.data.reload();
        },
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
    return 'Sorry, we could not save that. Please try again.';
  }
}
