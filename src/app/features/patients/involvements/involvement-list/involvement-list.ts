import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Auth } from '../../../../core/auth/auth';
import { humanise } from '../../patient.model';
import { Device, deviceTypeLabel } from '../../devices/device.model';
import { DevicesService } from '../../devices/devices.service';
import { Involvement, kindLabel, regionLabel } from '../involvement.model';
import { InvolvementsService } from '../involvements.service';

interface InvolvementRow {
  involvement: Involvement;
  devices: Device[];
}

/** Panel on the patient detail page: the patient's limb involvements,
 * each with its devices nested. Writers can add an involvement, add a
 * device to one, edit either, and replace a device. */
@Component({
  selector: 'app-involvement-list',
  imports: [RouterLink],
  templateUrl: './involvement-list.html',
  styleUrl: './involvement-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvolvementList {
  private readonly involvements = inject(InvolvementsService);
  private readonly devices = inject(DevicesService);
  private readonly auth = inject(Auth);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly deviceTypeLabel = deviceTypeLabel;

  readonly patientId = input.required<number>();

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly data = rxResource({
    params: () => ({ patientId: this.patientId() }),
    stream: ({ params }) =>
      forkJoin({
        involvements: this.involvements.list(params.patientId),
        devices: this.devices.listForPatient(params.patientId),
      }),
  });

  readonly rows = computed<InvolvementRow[]>(() => {
    const value = this.data.value();
    if (!value) {
      return [];
    }
    return value.involvements.map((involvement) => ({
      involvement,
      devices: value.devices.filter((d) => d.involvementId === involvement.id),
    }));
  });

  statusModifier(status: string): string {
    return `involvements__badge--${status}`;
  }

  deviceStatusModifier(status: string): string {
    return `involvements__device-badge--${status}`;
  }
}
