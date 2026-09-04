import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { humanise } from '../../patient.model';
import { Device, deviceTypeLabel } from '../../devices/device.model';
import { DevicesService } from '../../devices/devices.service';
import { Involvement, kindLabel, regionLabel } from '../../involvements/involvement.model';
import { InvolvementsService } from '../../involvements/involvements.service';
import { Point, kindMarkerColor, regionAnchor } from '../body-map.model';

interface PlacedInvolvement {
  involvement: Involvement;
  devices: Device[];
  /** anchor on the figure, or null when the region has none (`other`) */
  anchor: Point | null;
}

interface Marker extends PlacedInvolvement {
  anchor: Point;
  /** horizontal nudge so several markers on one region don't overlap */
  dx: number;
  color: string;
}

/** Full-page view: a body diagram with a marker per limb involvement
 * (positioned by its region), and a list beside it of each involvement
 * and the devices mounted on it. Read-only. */
@Component({
  selector: 'app-patient-body-map',
  imports: [RouterLink],
  templateUrl: './patient-body-map.html',
  styleUrl: './patient-body-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientBodyMap {
  private readonly involvements = inject(InvolvementsService);
  private readonly devices = inject(DevicesService);

  readonly humanise = humanise;
  readonly kindLabel = kindLabel;
  readonly regionLabel = regionLabel;
  readonly deviceTypeLabel = deviceTypeLabel;
  readonly markerColor = kindMarkerColor;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();

  /** id of the involvement whose marker / card is highlighted */
  readonly selected = signal<number | null>(null);

  readonly data = rxResource({
    params: () => ({ patientId: Number(this.id()) }),
    stream: ({ params }) =>
      forkJoin({
        involvements: this.involvements.list(params.patientId),
        devices: this.devices.listForPatient(params.patientId),
      }),
  });

  readonly placed = computed<PlacedInvolvement[]>(() => {
    const value = this.data.value();
    if (!value) {
      return [];
    }
    return value.involvements.map((involvement) => ({
      involvement,
      devices: value.devices.filter((d) => d.involvementId === involvement.id),
      anchor: regionAnchor(involvement.region),
    }));
  });

  /** placed involvements that have an anchor, fanned out per region */
  readonly markers = computed<Marker[]>(() => {
    const onFigure = this.placed().filter((p) => p.anchor !== null);
    const perRegion = new Map<string, PlacedInvolvement[]>();
    for (const p of onFigure) {
      const group = perRegion.get(p.involvement.region) ?? [];
      group.push(p);
      perRegion.set(p.involvement.region, group);
    }
    const out: Marker[] = [];
    for (const group of perRegion.values()) {
      const mid = (group.length - 1) / 2;
      group.forEach((p, index) => {
        out.push({
          ...p,
          anchor: p.anchor as Point,
          dx: (index - mid) * 15,
          color: kindMarkerColor(p.involvement.kind),
        });
      });
    }
    return out;
  });

  readonly unmapped = computed<PlacedInvolvement[]>(() =>
    this.placed().filter((p) => p.anchor === null),
  );

  select(involvementId: number): void {
    this.selected.update((current) => (current === involvementId ? null : involvementId));
  }

  markerRadius(marker: Marker): number {
    return this.selected() === marker.involvement.id ? 11 : 8;
  }

  markerOpacity(marker: Marker): number {
    return marker.involvement.status === 'resolved' ? 0.4 : 1;
  }
}
