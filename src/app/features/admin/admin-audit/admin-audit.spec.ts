import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AdminAuditService } from '../admin-audit.service';
import { AdminAudit } from './admin-audit';

const PAGE = {
  items: [
    {
      id: 3,
      actorId: 12,
      actorEmail: 'kim@northgate.example',
      action: 'create',
      entityType: 'prom_record',
      entityId: 9,
      timestamp: '2026-09-03T09:00:00',
    },
    {
      id: 2,
      actorId: null,
      actorEmail: null,
      action: 'read',
      entityType: 'dashboard',
      entityId: null,
      timestamp: '2026-09-02T11:00:00',
    },
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

const FACETS = {
  entityTypes: ['dashboard', 'prom_record'],
  actors: [{ id: 12, email: 'kim@northgate.example' }],
};

async function setup(
  list = vi.fn().mockReturnValue(of(PAGE)),
  facets = vi.fn().mockReturnValue(of(FACETS)),
) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AdminAudit],
    providers: [provideRouter([]), { provide: AdminAuditService, useValue: { list, facets } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(AdminAudit);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list, facets };
}

describe('AdminAudit', () => {
  it('renders a row per entry, formatting the timestamp and the missing actor', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('2026-09-03 09:00');
    expect(rows[0].textContent).toContain('Prom record');
    expect(rows[1].textContent).toContain('deleted user');
  });

  it('populates the filter dropdowns from facets', async () => {
    const { fixture } = await setup();
    const actorOptions = fixture.nativeElement.querySelectorAll('select option');
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('kim@northgate.example');
    expect(actorOptions.length).toBeGreaterThan(3);
  });

  it('passes filters to the service and resets the offset', async () => {
    const { fixture, list } = await setup();
    fixture.componentInstance.next();
    fixture.detectChanges();
    await fixture.whenStable();
    list.mockClear();

    fixture.componentInstance.onAction('create');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', offset: 0 }));
  });

  it('clearFilters resets every filter', async () => {
    const { fixture } = await setup();
    const c = fixture.componentInstance;
    c.onActor('12');
    c.onEntityType('device');
    c.onDateFrom('2026-09-01');
    c.clearFilters();
    expect(c.actorId()).toBe('');
    expect(c.entityType()).toBe('');
    expect(c.dateFrom()).toBe('');
  });
});
