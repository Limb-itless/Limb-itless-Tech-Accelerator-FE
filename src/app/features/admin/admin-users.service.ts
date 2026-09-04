import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { camelizeKeys, snakeizeKeys } from '../../core/api/case';
import {
  AdminUser,
  AdminUserCreate,
  AdminUserListParams,
  AdminUserPage,
  AdminUserUpdate,
} from './admin.model';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin/users`;

  list(params: AdminUserListParams = {}): Observable<AdminUserPage> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(snakeizeKeys<Record<string, unknown>>(params))) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http
      .get<unknown>(this.base, { params: httpParams })
      .pipe(map((body) => camelizeKeys<AdminUserPage>(body)));
  }

  get(id: number): Observable<AdminUser> {
    return this.http
      .get<unknown>(`${this.base}/${id}`)
      .pipe(map((body) => camelizeKeys<AdminUser>(body)));
  }

  create(data: AdminUserCreate): Observable<AdminUser> {
    return this.http
      .post<unknown>(this.base, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<AdminUser>(body)));
  }

  update(id: number, data: AdminUserUpdate): Observable<AdminUser> {
    return this.http
      .patch<unknown>(`${this.base}/${id}`, snakeizeKeys(data))
      .pipe(map((body) => camelizeKeys<AdminUser>(body)));
  }

  setPassword(id: number, password: string): Observable<AdminUser> {
    return this.http
      .post<unknown>(`${this.base}/${id}/set-password`, { password })
      .pipe(map((body) => camelizeKeys<AdminUser>(body)));
  }
}
