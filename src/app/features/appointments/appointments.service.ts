import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import {
  Appointment,
  AppointmentCancel,
  AppointmentListParams,
  AppointmentReschedule,
  RescheduleResult,
} from './appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/appointments`;

  list(params: AppointmentListParams = {}): Observable<Appointment[]> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(snakeizeKeys<Record<string, unknown>>(params))) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http
      .get<unknown>(this.base, { params: httpParams })
      .pipe(map((body) => camelizeKeys<Appointment[]>(body)));
  }

  cancel(id: number, data: AppointmentCancel): Observable<Appointment> {
    return this.http
      .post<unknown>(`${this.base}/${id}/cancel`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Appointment>(body)));
  }

  noShow(id: number): Observable<Appointment> {
    return this.http
      .post<unknown>(`${this.base}/${id}/no-show`, {})
      .pipe(map((body) => camelizeKeys<Appointment>(body)));
  }

  reschedule(id: number, data: AppointmentReschedule): Observable<RescheduleResult> {
    return this.http
      .post<unknown>(`${this.base}/${id}/reschedule`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<RescheduleResult>(body)));
  }
}
