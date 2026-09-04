import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../../core/api/case';
import { Assignment, AssignmentCreate, AssignmentEnd, ClinicalStaff } from './assignment.model';

@Injectable({ providedIn: 'root' })
export class AssignmentsService {
  private readonly http = inject(HttpClient);

  private base(patientId: number): string {
    return `${environment.apiBaseUrl}/patients/${patientId}/assignments`;
  }

  /** `active` omitted = full history; `true` = current only. */
  list(patientId: number, active?: boolean): Observable<Assignment[]> {
    const url =
      active === undefined ? this.base(patientId) : `${this.base(patientId)}?active=${active}`;
    return this.http.get<unknown>(url).pipe(map((body) => camelizeKeys<Assignment[]>(body)));
  }

  create(patientId: number, data: AssignmentCreate): Observable<Assignment> {
    return this.http
      .post<unknown>(this.base(patientId), snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Assignment>(body)));
  }

  end(patientId: number, assignmentId: number, data: AssignmentEnd = {}): Observable<Assignment> {
    return this.http
      .post<unknown>(`${this.base(patientId)}/${assignmentId}/end`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Assignment>(body)));
  }

  /** Active clinicians / prosthetists in the caller's practice, for the picker. */
  staff(): Observable<ClinicalStaff[]> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/practice/clinical-staff`)
      .pipe(map((body) => camelizeKeys<ClinicalStaff[]>(body)));
  }
}
