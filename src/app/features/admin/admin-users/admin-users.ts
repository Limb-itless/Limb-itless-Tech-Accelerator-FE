import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { humanise } from '../../patients/patient.model';
import { ASSIGNABLE_ROLES, AssignableRole } from '../admin.model';
import { AdminUsersService } from '../admin-users.service';
import { AdminNav } from '../admin-nav/admin-nav';

const PAGE_SIZE = 20;
type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-admin-users',
  imports: [RouterLink, AdminNav],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
  private readonly service = inject(AdminUsersService);

  readonly humanise = humanise;
  readonly roles = ASSIGNABLE_ROLES;

  readonly search = signal('');
  readonly role = signal<AssignableRole | ''>('');
  readonly status = signal<StatusFilter>('all');
  readonly offset = signal(0);

  private readonly query = toSignal(toObservable(this.search).pipe(debounceTime(250)), {
    initialValue: '',
  });

  readonly page = rxResource({
    params: () => ({
      q: this.query().trim() || undefined,
      role: this.role() || undefined,
      active: this.status() === 'all' ? undefined : this.status() === 'active',
      limit: PAGE_SIZE,
      offset: this.offset(),
    }),
    stream: ({ params }) => this.service.list(params),
  });

  readonly rangeStart = computed(() =>
    (this.page.value()?.total ?? 0) === 0 ? 0 : this.offset() + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.offset() + PAGE_SIZE, this.page.value()?.total ?? 0),
  );
  readonly hasPrev = computed(() => this.offset() > 0);
  readonly hasNext = computed(() => this.offset() + PAGE_SIZE < (this.page.value()?.total ?? 0));

  constructor() {
    effect(() => {
      this.query();
      this.role();
      this.status();
      this.offset.set(0);
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  onRole(value: string): void {
    this.role.set((value as AssignableRole) || '');
  }

  onStatus(value: string): void {
    this.status.set(value === 'active' || value === 'inactive' ? value : 'all');
  }

  prev(): void {
    this.offset.update((o) => Math.max(0, o - PAGE_SIZE));
  }

  next(): void {
    this.offset.update((o) => o + PAGE_SIZE);
  }
}
