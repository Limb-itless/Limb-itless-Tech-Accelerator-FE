import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { humanise } from '../../patient.model';
import {
  DEVICE_STATUSES,
  DeviceCreate,
  ORTHOSIS_TYPES,
  PROSTHESIS_TYPES,
  deviceTypeLabel,
} from '../device.model';
import { DevicesService } from '../devices.service';

type Mode = 'create' | 'edit' | 'replace';

@Component({
  selector: 'app-device-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './device-form.html',
  styleUrl: './device-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(DevicesService);
  private readonly router = inject(Router);

  readonly humanise = humanise;
  readonly deviceTypeLabel = deviceTypeLabel;
  readonly prosthesisTypes = PROSTHESIS_TYPES;
  readonly orthosisTypes = ORTHOSIS_TYPES;
  readonly statuses = DEVICE_STATUSES;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();
  /** `:involvementId` route parameter — the involvement the device is for. */
  readonly involvementId = input.required<string>();
  /** `:deviceId` route parameter — absent when creating. */
  readonly deviceId = input<string>();
  /** Set from route `data`; defaults to create. */
  readonly mode = input<Mode>('create');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly heading = computed(() => {
    switch (this.mode()) {
      case 'edit':
        return 'Edit device';
      case 'replace':
        return 'Replace device';
      default:
        return 'Add device';
    }
  });

  readonly form = this.fb.group({
    deviceType: ['', [Validators.required]],
    status: ['planned', [Validators.required]],
    manufacturer: ['', [Validators.maxLength(200)]],
    model: ['', [Validators.maxLength(200)]],
    serialNumber: ['', [Validators.maxLength(120)]],
    mountLocation: ['', [Validators.maxLength(200)]],
    socketType: ['', [Validators.maxLength(200)]],
    linerType: ['', [Validators.maxLength(200)]],
    suspensionType: ['', [Validators.maxLength(200)]],
    terminalDevice: ['', [Validators.maxLength(200)]],
    castScanDate: [''],
    deliveryDate: [''],
    fittedDate: [''],
    warrantyStart: [''],
    warrantyExpiry: [''],
    notes: [''],
  });

  private readonly existing = rxResource({
    params: () => {
      const deviceId = this.deviceId();
      return deviceId && this.mode() !== 'create'
        ? {
            patientId: Number(this.id()),
            involvementId: Number(this.involvementId()),
            deviceId: Number(deviceId),
          }
        : undefined;
    },
    stream: ({ params }) =>
      this.service.get(params.patientId, params.involvementId, params.deviceId),
  });

  constructor() {
    effect(() => {
      const device = this.existing.value();
      if (!device) {
        return;
      }
      // A replacement starts as a fresh, planned device that inherits the
      // clinical details of the one it supersedes.
      const replacing = this.mode() === 'replace';
      this.form.setValue({
        deviceType: device.deviceType,
        status: replacing ? 'planned' : device.status,
        manufacturer: replacing ? '' : (device.manufacturer ?? ''),
        model: replacing ? '' : (device.model ?? ''),
        serialNumber: replacing ? '' : (device.serialNumber ?? ''),
        mountLocation: device.mountLocation ?? '',
        socketType: device.socketType ?? '',
        linerType: device.linerType ?? '',
        suspensionType: device.suspensionType ?? '',
        terminalDevice: device.terminalDevice ?? '',
        castScanDate: replacing ? '' : (device.castScanDate ?? ''),
        deliveryDate: replacing ? '' : (device.deliveryDate ?? ''),
        fittedDate: replacing ? '' : (device.fittedDate ?? ''),
        warrantyStart: replacing ? '' : (device.warrantyStart ?? ''),
        warrantyExpiry: replacing ? '' : (device.warrantyExpiry ?? ''),
        notes: replacing ? '' : (device.notes ?? ''),
      });
    });
  }

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && field.touched;
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const blankToNull = (value: string): string | null => value.trim() || null;
    const payload: DeviceCreate = {
      deviceType: raw.deviceType as DeviceCreate['deviceType'],
      status: raw.status as DeviceCreate['status'],
      manufacturer: blankToNull(raw.manufacturer),
      model: blankToNull(raw.model),
      serialNumber: blankToNull(raw.serialNumber),
      mountLocation: blankToNull(raw.mountLocation),
      socketType: blankToNull(raw.socketType),
      linerType: blankToNull(raw.linerType),
      suspensionType: blankToNull(raw.suspensionType),
      terminalDevice: blankToNull(raw.terminalDevice),
      castScanDate: blankToNull(raw.castScanDate),
      deliveryDate: blankToNull(raw.deliveryDate),
      fittedDate: blankToNull(raw.fittedDate),
      warrantyStart: blankToNull(raw.warrantyStart),
      warrantyExpiry: blankToNull(raw.warrantyExpiry),
      notes: blankToNull(raw.notes),
    };

    const patientId = Number(this.id());
    const involvementId = Number(this.involvementId());
    const deviceId = this.deviceId() ? Number(this.deviceId()) : null;

    let request$;
    if (this.mode() === 'edit' && deviceId !== null) {
      request$ = this.service.update(patientId, involvementId, deviceId, payload);
    } else if (this.mode() === 'replace' && deviceId !== null) {
      request$ = this.service.replace(patientId, involvementId, deviceId, payload);
    } else {
      request$ = this.service.create(patientId, involvementId, payload);
    }

    request$.subscribe({
      next: () => this.router.navigate(['/patients', patientId]),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not save the device. Please try again.';
  }
}
