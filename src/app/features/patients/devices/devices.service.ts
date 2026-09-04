import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../../core/api/case';
import { Device, DeviceCreate, DeviceStatus, DeviceUpdate } from './device.model';

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private readonly http = inject(HttpClient);

  private base(patientId: number, involvementId: number): string {
    return `${environment.apiBaseUrl}/patients/${patientId}/involvements/${involvementId}/devices`;
  }

  /** Every device across all of a patient's involvements. */
  listForPatient(patientId: number): Observable<Device[]> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/patients/${patientId}/devices`)
      .pipe(map((body) => camelizeKeys<Device[]>(body)));
  }

  list(patientId: number, involvementId: number, status?: DeviceStatus): Observable<Device[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('device_status', status);
    }
    return this.http
      .get<unknown>(this.base(patientId, involvementId), { params })
      .pipe(map((body) => camelizeKeys<Device[]>(body)));
  }

  get(patientId: number, involvementId: number, deviceId: number): Observable<Device> {
    return this.http
      .get<unknown>(`${this.base(patientId, involvementId)}/${deviceId}`)
      .pipe(map((body) => camelizeKeys<Device>(body)));
  }

  create(patientId: number, involvementId: number, data: DeviceCreate): Observable<Device> {
    return this.http
      .post<unknown>(this.base(patientId, involvementId), snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Device>(body)));
  }

  update(
    patientId: number,
    involvementId: number,
    deviceId: number,
    data: DeviceUpdate,
  ): Observable<Device> {
    return this.http
      .patch<unknown>(`${this.base(patientId, involvementId)}/${deviceId}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<Device>(body)));
  }

  replace(
    patientId: number,
    involvementId: number,
    deviceId: number,
    data: DeviceCreate,
  ): Observable<Device> {
    return this.http
      .post<unknown>(
        `${this.base(patientId, involvementId)}/${deviceId}/replace`,
        snakeizeKeys(data),
      )
      .pipe(map((body) => camelizeKeys<Device>(body)));
  }
}
