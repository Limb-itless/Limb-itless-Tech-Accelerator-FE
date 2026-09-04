import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys } from '../../../core/api/case';
import { TimelineEvent } from './timeline.model';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly http = inject(HttpClient);

  list(patientId: number, limit?: number): Observable<TimelineEvent[]> {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', String(limit));
    }
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/patients/${patientId}/timeline`, { params })
      .pipe(map((body) => camelizeKeys<TimelineEvent[]>(body)));
  }
}
