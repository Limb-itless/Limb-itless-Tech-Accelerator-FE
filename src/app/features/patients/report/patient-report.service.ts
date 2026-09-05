import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys } from '../../../core/api/case';
import { PatientReport } from './report.model';

@Injectable({ providedIn: 'root' })
export class PatientReportService {
  private readonly http = inject(HttpClient);

  get(patientId: number): Observable<PatientReport> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/patients/${patientId}/report`)
      .pipe(map((body) => camelizeKeys<PatientReport>(body)));
  }
}
