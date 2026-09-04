import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { NotesService } from './notes.service';

const BASE = `${environment.apiBaseUrl}/patients/4/notes`;

const WIRE_NOTE = {
  id: 1,
  patient_id: 4,
  author_id: 9,
  body: 'Reviewed gait, no issues.',
  created_at: '2026-03-01T09:00:00',
  updated_at: '2026-03-01T09:00:00',
};

describe('NotesService', () => {
  let service: NotesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists notes and camelizes them', () => {
    let received: unknown;
    service.list(4).subscribe((rows) => (received = rows));
    http.expectOne(BASE).flush([WIRE_NOTE]);
    expect(received).toEqual([
      expect.objectContaining({ patientId: 4, authorId: 9, body: 'Reviewed gait, no issues.' }),
    ]);
  });

  it('creates with a snake_case body', () => {
    service.create(4, { body: 'New note' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ body: 'New note' });
    req.flush(WIRE_NOTE);
  });

  it('updates via PATCH', () => {
    service.update(4, 1, { body: 'Corrected' }).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ body: 'Corrected' });
    req.flush({ ...WIRE_NOTE, body: 'Corrected' });
  });
});
