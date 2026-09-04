import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { humanise } from '../../patients/patient.model';
import { AUDIT_ACTIONS, AuditAction } from '../admin.model';
import { AdminAuditService } from '../admin-audit.service';
import { AdminNav } from '../admin-nav/admin-nav';

const PAGE_SIZE = 20;

/** Read-only view of the practice's audit trail (BE R-31). */
@Component({
  selector: 'app-admin-audit',
  imports: [AdminNav],
  templateUrl: './admin-audit.html',
  styleUrl: './admin-audit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAudit {
  private readonly service = inject(AdminAuditService);

  readonly humanise = humanise;
  readonly actions = AUDIT_ACTIONS;

  readonly actorId = signal<number | ''>('');
  readonly action = signal<AuditAction | ''>('');
  readonly entityType = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly offset = signal(0);

  readonly facets = rxResource({
    params: () => ({}),
    stream: () => this.service.facets(),
  });

  readonly page = rxResource({
    params: () => ({
      actorId: this.actorId() === '' ? undefined : Number(this.actorId()),
      action: this.action() || undefined,
      entityType: this.entityType() || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      limit: PAGE_SIZE,
      offset: this.offset(),
    }),
    stream: ({ params }) => this.service.list(params),
  });

  readonly total = computed(() => this.page.value()?.total ?? 0);
  readonly rangeStart = computed(() => (this.total() === 0 ? 0 : this.offset() + 1));
  readonly rangeEnd = computed(() => Math.min(this.offset() + PAGE_SIZE, this.total()));
  readonly hasPrev = computed(() => this.offset() > 0);
  readonly hasNext = computed(() => this.offset() + PAGE_SIZE < this.total());

  constructor() {
    effect(() => {
      this.actorId();
      this.action();
      this.entityType();
      this.dateFrom();
      this.dateTo();
      this.offset.set(0);
    });
  }

  onActor(value: string): void {
    this.actorId.set(value === '' ? '' : Number(value));
  }

  onAction(value: string): void {
    this.action.set((value as AuditAction) || '');
  }

  onEntityType(value: string): void {
    this.entityType.set(value);
  }

  onDateFrom(value: string): void {
    this.dateFrom.set(value);
  }

  onDateTo(value: string): void {
    this.dateTo.set(value);
  }

  clearFilters(): void {
    this.actorId.set('');
    this.action.set('');
    this.entityType.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  prev(): void {
    this.offset.update((o) => Math.max(0, o - PAGE_SIZE));
  }

  next(): void {
    this.offset.update((o) => o + PAGE_SIZE);
  }

  /** "2026-09-03T09:00:00" -> "2026-09-03 09:00" */
  when(iso: string): string {
    return iso.replace('T', ' ').slice(0, 16);
  }
}
