import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../../core/api/case';
import {
  Milestone,
  MilestoneCreate,
  MilestoneListParams,
  MilestoneUpdate,
  PathwayApply,
} from './milestone.model';

@Injectable({ providedIn: 'root' })
export class MilestonesService {
  private readonly http = inject(HttpClient);

  private base(patientId: number): string {
    return `${environment.apiBaseUrl}/patients/${patientId}`;
  }

  list(patientId: number, filters: MilestoneListParams = {}): Observable<Milestone[]> {
    let params = new HttpParams();
    if (filters.carePathway) {
      params = params.set('care_pathway', filters.carePathway);
    }
    if (filters.status) {
      params = params.set('milestone_status', filters.status);
    }
    return this.http
      .get<unknown>(`${this.base(patientId)}/milestones`, { params })
      .pipe(map((body) => camelizeKeys<Milestone[]>(body)));
  }

  get(patientId: number, milestoneId: number): Observable<Milestone> {
    return this.http
      .get<unknown>(`${this.base(patientId)}/milestones/${milestoneId}`)
      .pipe(map((body) => camelizeKeys<Milestone>(body)));
  }

  create(patientId: number, data: MilestoneCreate): Observable<Milestone> {
    return this.http
      .post<unknown>(`${this.base(patientId)}/milestones`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Milestone>(body)));
  }

  update(patientId: number, milestoneId: number, data: MilestoneUpdate): Observable<Milestone> {
    return this.http
      .patch<unknown>(`${this.base(patientId)}/milestones/${milestoneId}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Milestone>(body)));
  }

  complete(
    patientId: number,
    milestoneId: number,
    completedDate?: string | null,
  ): Observable<Milestone> {
    const body = completedDate ? { completed_date: completedDate } : {};
    return this.http
      .post<unknown>(`${this.base(patientId)}/milestones/${milestoneId}/complete`, body)
      .pipe(map((response) => camelizeKeys<Milestone>(response)));
  }

  applyPathway(patientId: number, data: PathwayApply): Observable<Milestone[]> {
    return this.http
      .post<unknown>(`${this.base(patientId)}/pathways`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Milestone[]>(body)));
  }
}
