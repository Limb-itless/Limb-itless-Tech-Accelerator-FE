import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../../core/api/case';
import { AvailabilitySlot } from '../../availability/availability.model';
import {
  Appointment,
  AppointmentBook,
  AppointmentReschedule,
  RescheduleResult,
} from './booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/portal`;

  /** Open slots in the patient's own practice — what they can book into. */
  availability(): Observable<AvailabilitySlot[]> {
    return this.http
      .get<unknown>(`${this.base}/availability`)
      .pipe(map((body) => camelizeKeys<AvailabilitySlot[]>(body)));
  }

  myAppointments(): Observable<Appointment[]> {
    return this.http
      .get<unknown>(`${this.base}/appointments`)
      .pipe(map((body) => camelizeKeys<Appointment[]>(body)));
  }

  book(data: AppointmentBook): Observable<Appointment> {
    return this.http
      .post<unknown>(`${this.base}/appointments`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Appointment>(body)));
  }

  cancel(appointmentId: number): Observable<Appointment> {
    return this.http
      .post<unknown>(`${this.base}/appointments/${appointmentId}/cancel`, {})
      .pipe(map((body) => camelizeKeys<Appointment>(body)));
  }

  reschedule(appointmentId: number, data: AppointmentReschedule): Observable<RescheduleResult> {
    return this.http
      .post<unknown>(`${this.base}/appointments/${appointmentId}/reschedule`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<RescheduleResult>(body)));
  }
}
