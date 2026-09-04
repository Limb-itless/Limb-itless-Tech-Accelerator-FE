import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys } from '../../core/api/case';
import { ReportSummary } from './report.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/reports/summary`;

  /** The breakdowns are `{key, count}` lists, so the generic camelizer
   * is safe here — no enum-keyed dicts to protect. */
  summary(sinceDays = 30): Observable<ReportSummary> {
    const params = new HttpParams().set('since_days', String(sinceDays));
    return this.http
      .get<unknown>(this.url, { params })
      .pipe(map((body) => camelizeKeys<ReportSummary>(body)));
  }
}
