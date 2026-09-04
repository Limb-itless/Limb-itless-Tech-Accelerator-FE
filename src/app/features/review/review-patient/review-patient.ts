import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { humanise } from '../../patients/patient.model';
import { deviceTypeLabel } from '../../patients/devices/device.model';
import { kindLabel, regionLabel } from '../../patients/involvements/involvement.model';
import { isOverdue } from '../../patients/milestones/milestone.model';
import { ReviewService } from '../review.service';

/** Read-only clinical record for a shared patient. No edit controls. */
@Component({
  selector: 'app-review-patient',
  imports: [RouterLink],
  templateUrl: './review-patient.html',
  styleUrl: './review-patient.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPatient {
  private readonly service = inject(ReviewService);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly deviceTypeLabel = deviceTypeLabel;
  readonly overdue = isOverdue;

  /** `:id` route parameter. */
  readonly id = input.required<string>();

  readonly data = rxResource({
    params: () => ({ id: Number(this.id()) }),
    stream: ({ params }) => this.service.bundle(params.id),
  });

  readonly flaggedProms = computed(
    () => (this.data.value()?.proms ?? []).filter((p) => p.flagged).length,
  );

  /** componentry entries to show for a device, label -> value, non-empty only */
  fields(device: Record<string, unknown>): { label: string; value: string }[] {
    const map: [string, string][] = [
      ['manufacturer', 'Manufacturer'],
      ['model', 'Model'],
      ['serialNumber', 'Serial'],
      ['mountLocation', 'Mount location'],
      ['socketType', 'Socket'],
      ['linerType', 'Liner'],
      ['suspensionType', 'Suspension'],
      ['terminalDevice', 'Terminal device'],
      ['jointType', 'Joint type'],
      ['trimline', 'Trimline'],
      ['strapConfiguration', 'Strap configuration'],
      ['paddingLiner', 'Padding / lining'],
    ];
    return map
      .filter(([key]) => !!device[key])
      .map(([key, label]) => ({ label, value: String(device[key]) }));
  }
}
