import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import { AuditFacets, AuditListParams, AuditPage } from './admin.model';

@Injectable({ providedIn: 'root' })
export class AdminAuditService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin/audit`;

  list(params: AuditListParams = {}): Observable<AuditPage> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(snakeizeKeys<Record<string, unknown>>(params))) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http
      .get<unknown>(this.base, { params: httpParams })
      .pipe(map((body) => camelizeKeys<AuditPage>(body)));
  }

  facets(): Observable<AuditFacets> {
    return this.http
      .get<unknown>(`${this.base}/facets`)
      .pipe(map((body) => camelizeKeys<AuditFacets>(body)));
  }
}
