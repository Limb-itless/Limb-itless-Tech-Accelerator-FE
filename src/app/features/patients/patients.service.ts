import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import {
  Patient,
  PatientCreate,
  PatientListParams,
  PatientPage,
  PatientUpdate,
} from './patient.model';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/patients`;

  list(params: PatientListParams = {}): Observable<PatientPage> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(snakeizeKeys<Record<string, unknown>>(params))) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http
      .get<unknown>(this.base, { params: httpParams })
      .pipe(map((body) => camelizeKeys<PatientPage>(body)));
  }

  get(id: number): Observable<Patient> {
    return this.http
      .get<unknown>(`${this.base}/${id}`)
      .pipe(map((body) => camelizeKeys<Patient>(body)));
  }

  create(data: PatientCreate): Observable<Patient> {
    return this.http
      .post<unknown>(this.base, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Patient>(body)));
  }

  update(id: number, data: PatientUpdate): Observable<Patient> {
    return this.http
      .patch<unknown>(`${this.base}/${id}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Patient>(body)));
  }

  setActive(id: number, active: boolean): Observable<Patient> {
    const action = active ? 'reactivate' : 'deactivate';
    return this.http
      .post<unknown>(`${this.base}/${id}/${action}`, {})
      .pipe(map((body) => camelizeKeys<Patient>(body)));
  }
}
