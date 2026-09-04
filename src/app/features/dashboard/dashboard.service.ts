import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys } from '../../core/api/case';
import { DashboardSummary, DashboardView } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/dashboard`;

  summary(view: DashboardView = 'practice', upcomingDays?: number): Observable<DashboardSummary> {
    let params = new HttpParams().set('view', view);
    if (upcomingDays !== undefined) {
      params = params.set('upcoming_days', String(upcomingDays));
    }
    return this.http.get<unknown>(this.url, { params }).pipe(
      map((body) => {
        const summary = camelizeKeys<DashboardSummary>(body);
        // patients_by_phase is keyed by milestone-type enum values, which
        // must stay snake_case; the generic camelizer would mangle them.
        const raw = (body ?? {}) as { patients_by_phase?: Record<string, number> };
        summary.patientsByPhase = raw.patients_by_phase ?? {};
        return summary;
      }),
    );
  }
}
