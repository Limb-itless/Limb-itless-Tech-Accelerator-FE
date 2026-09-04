import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import { InvolvementDetail } from '../patients/involvements/involvement.model';
import { Milestone } from '../patients/milestones/milestone.model';
import { Prom } from '../patients/proms/prom.model';
import { PortalInstruments, PortalProfile, PortalPromCreate } from './portal.model';

@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/portal/me`;

  profile(): Observable<PortalProfile> {
    return this.http.get<unknown>(this.base).pipe(map((body) => camelizeKeys<PortalProfile>(body)));
  }

  involvements(): Observable<InvolvementDetail[]> {
    return this.http
      .get<unknown>(`${this.base}/involvements`)
      .pipe(map((body) => camelizeKeys<InvolvementDetail[]>(body)));
  }

  milestones(): Observable<Milestone[]> {
    return this.http
      .get<unknown>(`${this.base}/milestones`)
      .pipe(map((body) => camelizeKeys<Milestone[]>(body)));
  }

  proms(): Observable<Prom[]> {
    return this.http
      .get<unknown>(`${this.base}/proms`)
      .pipe(map((body) => camelizeKeys<Prom[]>(body)));
  }

  instruments(): Observable<PortalInstruments> {
    return this.http
      .get<unknown>(`${this.base}/instruments`)
      .pipe(map((body) => camelizeKeys<PortalInstruments>(body)));
  }

  submitProm(data: PortalPromCreate): Observable<Prom> {
    return this.http
      .post<unknown>(`${this.base}/proms`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Prom>(body)));
  }
}
