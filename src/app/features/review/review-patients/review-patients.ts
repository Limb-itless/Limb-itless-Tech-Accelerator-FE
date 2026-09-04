import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ReviewService } from '../review.service';

/** The reviewer's landing page: the patients shared with them. */
@Component({
  selector: 'app-review-patients',
  imports: [RouterLink],
  templateUrl: './review-patients.html',
  styleUrl: './review-patients.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPatients {
  private readonly service = inject(ReviewService);

  readonly patients = rxResource({
    params: () => ({}),
    stream: () => this.service.patients(),
  });
}
