import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../../core/api/case';
import { Prom, PromCreate, PromListParams, PromUpdate } from './prom.model';

@Injectable({ providedIn: 'root' })
export class PromsService {
  private readonly http = inject(HttpClient);

  private base(patientId: number): string {
    return `${environment.apiBaseUrl}/patients/${patientId}/proms`;
  }

  list(patientId: number, filters: PromListParams = {}): Observable<Prom[]> {
    let params = new HttpParams();
    if (filters.instrument) {
      params = params.set('instrument', filters.instrument);
    }
    if (filters.flagged !== undefined) {
      params = params.set('flagged', String(filters.flagged));
    }
    return this.http
      .get<unknown>(this.base(patientId), { params })
      .pipe(map((body) => camelizeKeys<Prom[]>(body)));
  }

  get(patientId: number, promId: number): Observable<Prom> {
    return this.http
      .get<unknown>(`${this.base(patientId)}/${promId}`)
      .pipe(map((body) => camelizeKeys<Prom>(body)));
  }

  create(patientId: number, data: PromCreate): Observable<Prom> {
    return this.http
      .post<unknown>(this.base(patientId), snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Prom>(body)));
  }

  update(patientId: number, promId: number, data: PromUpdate): Observable<Prom> {
    return this.http
      .patch<unknown>(`${this.base(patientId)}/${promId}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Prom>(body)));
  }
}
