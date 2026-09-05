import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import {
  CoverageApprove,
  CoverageDeny,
  CoverageDetermination,
  CoverageStatus,
  ReviewBundle,
  ReviewPatientSummary,
} from './review.model';

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

  /** This reviewer's coverage queue — granted or scheme-matched patients'
   * determinations, newest first. `status` typically narrows this to
   * `pending`, the actual queue. */
  coverageQueue(status?: CoverageStatus): Observable<CoverageDetermination[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<unknown>(`${this.base}/coverage`, { params })
      .pipe(map((body) => camelizeKeys<CoverageDetermination[]>(body)));
  }

  approve(coverageId: number, data: CoverageApprove): Observable<CoverageDetermination> {
    return this.http
      .post<unknown>(`${this.base}/coverage/${coverageId}/approve`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<CoverageDetermination>(body)));
  }

  deny(coverageId: number, data: CoverageDeny): Observable<CoverageDetermination> {
    return this.http
      .post<unknown>(`${this.base}/coverage/${coverageId}/deny`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<CoverageDetermination>(body)));
  }
}
