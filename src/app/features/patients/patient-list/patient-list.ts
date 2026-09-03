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

import { Auth } from '../../../core/auth/auth';
import { humanise } from '../patient.model';
import { PatientsService } from '../patients.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-patient-list',
  imports: [RouterLink],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientList {
  private readonly service = inject(PatientsService);
  private readonly auth = inject(Auth);

  readonly humanise = humanise;

  readonly searchTerm = signal('');
  readonly status = signal<'active' | 'inactive'>('active');
  readonly offset = signal(0);

  private readonly query = toSignal(toObservable(this.searchTerm).pipe(debounceTime(250)), {
    initialValue: '',
  });

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly page = rxResource({
    params: () => ({
      q: this.query().trim() || undefined,
      active: this.status() === 'active',
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
    // Any change to the search or filter starts again from the first page.
    effect(() => {
      this.query();
      this.status();
      this.offset.set(0);
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  onStatusChange(value: string): void {
    this.status.set(value === 'inactive' ? 'inactive' : 'active');
  }

  prev(): void {
    this.offset.update((o) => Math.max(0, o - PAGE_SIZE));
  }

  next(): void {
    this.offset.update((o) => o + PAGE_SIZE);
  }
}
