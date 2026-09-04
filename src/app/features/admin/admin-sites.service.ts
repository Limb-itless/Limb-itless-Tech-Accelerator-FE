import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import { Site, SiteCreate, SiteType, SiteUpdate } from './admin.model';

@Injectable({ providedIn: 'root' })
export class AdminSitesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin/sites`;

  list(type?: SiteType): Observable<Site[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http
      .get<unknown>(this.base, { params })
      .pipe(map((body) => camelizeKeys<Site[]>(body)));
  }

  get(id: number): Observable<Site> {
    return this.http
      .get<unknown>(`${this.base}/${id}`)
      .pipe(map((body) => camelizeKeys<Site>(body)));
  }

  create(data: SiteCreate): Observable<Site> {
    return this.http
      .post<unknown>(this.base, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Site>(body)));
  }

  update(id: number, data: SiteUpdate): Observable<Site> {
    return this.http
      .patch<unknown>(`${this.base}/${id}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Site>(body)));
  }
}
