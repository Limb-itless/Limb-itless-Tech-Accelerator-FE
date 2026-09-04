import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { humanise } from '../../patient.model';
import { DeviceStatus, deviceTypeLabel } from '../device.model';
import { DevicesService } from '../devices.service';

/** Read-only panel of a patient's prosthetic devices, embedded in the
 * patient detail page. Writers get "Add device" plus per-device edit and
 * replace links; everyone else just sees the list. */
@Component({
  selector: 'app-device-list',
  imports: [RouterLink],
  templateUrl: './device-list.html',
  styleUrl: './device-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceList {
  private readonly service = inject(DevicesService);
  private readonly auth = inject(Auth);

  readonly humanise = humanise;
  readonly deviceTypeLabel = deviceTypeLabel;

  readonly patientId = input.required<number>();

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly devices = rxResource({
    params: () => ({ patientId: this.patientId() }),
    stream: ({ params }) => this.service.list(params.patientId),
  });

  statusModifier(status: DeviceStatus): string {
    return `devices__badge--${status}`;
  }
}
