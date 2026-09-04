import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { TimelineService } from './timeline.service';

const BASE = `${environment.apiBaseUrl}/patients/5/timeline`;

describe('TimelineService', () => {
  let service: TimelineService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TimelineService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches the merged feed and camelizes each event', () => {
    let received: unknown;
    service.list(5).subscribe((rows) => (received = rows));

    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.has('limit')).toBe(false);
    req.flush([
      {
        kind: 'prom',
        occurred_at: '2026-03-02T10:00:00',
        ref_id: 9,
        title: 'pain residual limb: 8 (flagged)',
        prom: { id: 9, flagged: true, flag_reason: 'Residual limb pain 7+/10' },
      },
    ]);

    expect(received).toEqual([
      expect.objectContaining({
        kind: 'prom',
        occurredAt: '2026-03-02T10:00:00',
        refId: 9,
        prom: expect.objectContaining({ flagReason: 'Residual limb pain 7+/10' }),
      }),
    ]);
  });

  it('passes a limit when given', () => {
    service.list(5, 25).subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('limit')).toBe('25');
    req.flush([]);
  });
});
