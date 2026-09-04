import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ReviewService } from './review.service';

const BASE = `${environment.apiBaseUrl}/review`;

describe('ReviewService', () => {
  let service: ReviewService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists shared patients and camelizes', () => {
    let received: unknown;
    service.patients().subscribe((r) => (received = r));
    http.expectOne(`${BASE}/patients`).flush([
      {
        id: 1,
        first_name: 'Thabo',
        last_name: 'Molefe',
        practice_name: 'NG',
        involvement_count: 1,
      },
    ]);
    expect(received).toEqual([
      expect.objectContaining({ firstName: 'Thabo', practiceName: 'NG', involvementCount: 1 }),
    ]);
  });

  it('fetches one bundle', () => {
    let received: unknown;
    service.bundle(7).subscribe((b) => (received = b));
    http.expectOne(`${BASE}/patients/7`).flush({
      patient: { id: 7, first_name: 'A' },
      practice_name: 'NG',
      involvements: [],
      milestones: [],
      proms: [],
      notes: [],
    });
    expect(received).toEqual(
      expect.objectContaining({ patient: expect.objectContaining({ firstName: 'A' }) }),
    );
  });
});
