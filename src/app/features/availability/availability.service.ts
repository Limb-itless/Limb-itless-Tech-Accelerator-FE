import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import {
  AvailabilityListParams,
  AvailabilitySlot,
  AvailabilitySlotCreate,
  AvailabilitySlotUpdate,
  ClinicalStaff,
} from './availability.model';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/availability`;

  list(params: AvailabilityListParams = {}): Observable<AvailabilitySlot[]> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(snakeizeKeys<Record<string, unknown>>(params))) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http
      .get<unknown>(this.base, { params: httpParams })
      .pipe(map((body) => camelizeKeys<AvailabilitySlot[]>(body)));
  }

  get(id: number): Observable<AvailabilitySlot> {
    return this.http
      .get<unknown>(`${this.base}/${id}`)
      .pipe(map((body) => camelizeKeys<AvailabilitySlot>(body)));
  }

  create(data: AvailabilitySlotCreate): Observable<AvailabilitySlot> {
    return this.http
      .post<unknown>(this.base, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<AvailabilitySlot>(body)));
  }

  update(id: number, data: AvailabilitySlotUpdate): Observable<AvailabilitySlot> {
    return this.http
      .patch<unknown>(`${this.base}/${id}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<AvailabilitySlot>(body)));
  }

  /** Active clinicians / prosthetists in the caller's practice, for the
   * practitioner filter. */
  staff(): Observable<ClinicalStaff[]> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/practice/clinical-staff`)
      .pipe(map((body) => camelizeKeys<ClinicalStaff[]>(body)));
  }
}
