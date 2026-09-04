import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../../core/api/case';
import { Note, NoteCreate, NoteUpdate } from './note.model';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly http = inject(HttpClient);

  private base(patientId: number): string {
    return `${environment.apiBaseUrl}/patients/${patientId}/notes`;
  }

  list(patientId: number): Observable<Note[]> {
    return this.http
      .get<unknown>(this.base(patientId))
      .pipe(map((body) => camelizeKeys<Note[]>(body)));
  }

  get(patientId: number, noteId: number): Observable<Note> {
    return this.http
      .get<unknown>(`${this.base(patientId)}/${noteId}`)
      .pipe(map((body) => camelizeKeys<Note>(body)));
  }

  create(patientId: number, data: NoteCreate): Observable<Note> {
    return this.http
      .post<unknown>(this.base(patientId), snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Note>(body)));
  }

  update(patientId: number, noteId: number, data: NoteUpdate): Observable<Note> {
    return this.http
      .patch<unknown>(`${this.base(patientId)}/${noteId}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Note>(body)));
  }
}
