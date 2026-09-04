import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../../core/api/case';
import {
  Involvement,
  InvolvementCreate,
  InvolvementDetail,
  InvolvementUpdate,
} from './involvement.model';

@Injectable({ providedIn: 'root' })
export class InvolvementsService {
  private readonly http = inject(HttpClient);

  private base(patientId: number): string {
    return `${environment.apiBaseUrl}/patients/${patientId}/involvements`;
  }

  list(patientId: number): Observable<Involvement[]> {
    return this.http
      .get<unknown>(this.base(patientId))
      .pipe(map((body) => camelizeKeys<Involvement[]>(body)));
  }

  get(patientId: number, involvementId: number): Observable<InvolvementDetail> {
    return this.http
      .get<unknown>(`${this.base(patientId)}/${involvementId}`)
      .pipe(map((body) => camelizeKeys<InvolvementDetail>(body)));
  }

  create(patientId: number, data: InvolvementCreate): Observable<Involvement> {
    return this.http
      .post<unknown>(this.base(patientId), snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Involvement>(body)));
  }

  update(
    patientId: number,
    involvementId: number,
    data: InvolvementUpdate,
  ): Observable<Involvement> {
    return this.http
      .patch<unknown>(`${this.base(patientId)}/${involvementId}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Involvement>(body)));
  }
}
