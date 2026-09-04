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

import { kindLabel, regionLabel } from '../../involvements/involvement.model';
import { InvolvementsService } from '../../involvements/involvements.service';
import { NoteCreate } from '../note.model';
import { NotesService } from '../notes.service';

type Mode = 'create' | 'edit';

@Component({
  selector: 'app-note-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './note-form.html',
  styleUrl: './note-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(NotesService);
  private readonly involvementsService = inject(InvolvementsService);
  private readonly router = inject(Router);

  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();
  /** `:noteId` route parameter — absent when creating. */
  readonly noteId = input<string>();
  /** Set from route `data`; defaults to create. */
  readonly mode = input<Mode>('create');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly heading = computed(() => (this.mode() === 'edit' ? 'Edit note' : 'Add a note'));

  readonly form = this.fb.group({
    body: ['', [Validators.required, Validators.minLength(1)]],
    involvementId: [''],
  });

  readonly involvementOptions = rxResource({
    params: () => ({ patientId: Number(this.id()) }),
    stream: ({ params }) => this.involvementsService.list(params.patientId),
  });

  private readonly existing = rxResource({
    params: () => {
      const noteId = this.noteId();
      return noteId && this.mode() === 'edit'
        ? { patientId: Number(this.id()), noteId: Number(noteId) }
        : undefined;
    },
    stream: ({ params }) => this.service.get(params.patientId, params.noteId),
  });

  constructor() {
    effect(() => {
      const note = this.existing.value();
      if (note) {
        this.form.setValue({
          body: note.body,
          involvementId: note.involvementId === null ? '' : String(note.involvementId),
        });
      }
    });
  }

  get invalidBody(): boolean {
    const field = this.form.controls.body;
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
    const payload: NoteCreate = {
      body: raw.body.trim(),
      involvementId: raw.involvementId ? Number(raw.involvementId) : null,
    };
    const patientId = Number(this.id());
    const noteId = this.noteId() ? Number(this.noteId()) : null;
    const request$ =
      this.mode() === 'edit' && noteId !== null
        ? this.service.update(patientId, noteId, payload)
        : this.service.create(patientId, payload);

    request$.subscribe({
      next: () => this.router.navigate(['/patients', patientId, 'timeline']),
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
    return 'Could not save the note. Please try again.';
  }
}
