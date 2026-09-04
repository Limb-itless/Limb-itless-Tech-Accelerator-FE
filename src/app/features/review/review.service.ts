import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys } from '../../core/api/case';
import { ReviewBundle, ReviewPatientSummary } from './review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/review`;

  patients(): Observable<ReviewPatientSummary[]> {
    return this.http
      .get<unknown>(`${this.base}/patients`)
      .pipe(map((body) => camelizeKeys<ReviewPatientSummary[]>(body)));
  }

  bundle(patientId: number): Observable<ReviewBundle> {
    return this.http
      .get<unknown>(`${this.base}/patients/${patientId}`)
      .pipe(map((body) => camelizeKeys<ReviewBundle>(body)));
  }
}
