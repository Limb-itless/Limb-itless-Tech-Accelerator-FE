import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import {
  AdminCredentials,
  OnboardResult,
  PracticeDetail,
  PracticeListParams,
  PracticeOnboard,
  PracticePage,
  PracticeUpdate,
} from './platform.model';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/platform`;

  listPractices(params: PracticeListParams = {}): Observable<PracticePage> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(snakeizeKeys<Record<string, unknown>>(params))) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http
      .get<unknown>(`${this.base}/practices`, { params: httpParams })
      .pipe(map((body) => camelizeKeys<PracticePage>(body)));
  }

  getPractice(id: number): Observable<PracticeDetail> {
    return this.http
      .get<unknown>(`${this.base}/practices/${id}`)
      .pipe(map((body) => camelizeKeys<PracticeDetail>(body)));
  }

  onboard(data: PracticeOnboard): Observable<OnboardResult> {
    return this.http
      .post<unknown>(`${this.base}/practices`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<OnboardResult>(body)));
  }

  updatePractice(id: number, data: PracticeUpdate): Observable<PracticeDetail> {
    return this.http
      .patch<unknown>(`${this.base}/practices/${id}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<PracticeDetail>(body)));
  }

  addPracticeAdmin(practiceId: number, creds: AdminCredentials): Observable<{ id: number }> {
    return this.http
      .post<unknown>(`${this.base}/practices/${practiceId}/admins`, snakeizeKeys(creds))
      .pipe(map((body) => camelizeKeys<{ id: number }>(body)));
  }

  addPlatformAdmin(creds: AdminCredentials): Observable<{ id: number }> {
    return this.http
      .post<unknown>(`${this.base}/admins`, snakeizeKeys(creds))
      .pipe(map((body) => camelizeKeys<{ id: number }>(body)));
  }
}
