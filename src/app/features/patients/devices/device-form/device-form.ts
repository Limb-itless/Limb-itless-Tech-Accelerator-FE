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
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { LIMB_LOSS_LEVELS, humanise } from '../../patient.model';
import {
  DEVICE_STATUSES,
  DeviceCreate,
  DeviceType,
  LIMB_SIDES,
  ORTHOSIS_TYPES,
  PROSTHESIS_TYPES,
  deviceTypeLabel,
  isOrthosis,
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
  readonly sides = LIMB_SIDES;
  readonly levels = LIMB_LOSS_LEVELS;
  readonly prosthesisTypes = PROSTHESIS_TYPES;
  readonly orthosisTypes = ORTHOSIS_TYPES;
  readonly statuses = DEVICE_STATUSES;

  /** `:id` route parameter — the patient. */
  readonly id = input.required<string>();
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
    limbSide: ['', [Validators.required]],
    limbLevel: [''],
    deviceType: ['', [Validators.required]],
    status: ['planned', [Validators.required]],
    manufacturer: ['', [Validators.maxLength(200)]],
    model: ['', [Validators.maxLength(200)]],
    serialNumber: ['', [Validators.maxLength(120)]],
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

  private readonly deviceTypeValue = toSignal(this.form.controls.deviceType.valueChanges, {
    initialValue: '',
  });

  /** Orthoses have no amputation level; a prosthesis requires one. */
  readonly levelApplies = computed(
    () => !!this.deviceTypeValue() && !isOrthosis(this.deviceTypeValue() as DeviceType),
  );

  private readonly existing = rxResource({
    params: () => {
      const deviceId = this.deviceId();
      return deviceId && this.mode() !== 'create'
        ? { patientId: Number(this.id()), deviceId: Number(deviceId) }
        : undefined;
    },
    stream: ({ params }) => this.service.get(params.patientId, params.deviceId),
  });

  constructor() {
    // An orthosis clears any pending "limb level required" error.
    effect(() => {
      if (!this.levelApplies() && this.form.controls.limbLevel.errors?.['required']) {
        this.form.controls.limbLevel.setErrors(null);
      }
    });

    effect(() => {
      const device = this.existing.value();
      if (!device) {
        return;
      }
      // A replacement starts as a fresh, planned device that inherits the
      // limb and clinical details of the one it supersedes.
      const replacing = this.mode() === 'replace';
      this.form.setValue({
        limbSide: device.limbSide,
        limbLevel: device.limbLevel ?? '',
        deviceType: device.deviceType,
        status: replacing ? 'planned' : device.status,
        manufacturer: replacing ? '' : (device.manufacturer ?? ''),
        model: replacing ? '' : (device.model ?? ''),
        serialNumber: replacing ? '' : (device.serialNumber ?? ''),
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

    const level = this.form.controls.limbLevel;
    if (this.levelApplies() && !level.value) {
      level.setErrors({ required: true });
      level.markAsTouched();
    } else if (level.errors?.['required']) {
      level.setErrors(null);
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
      limbSide: raw.limbSide as DeviceCreate['limbSide'],
      limbLevel: this.levelApplies()
        ? (raw.limbLevel as NonNullable<DeviceCreate['limbLevel']>)
        : null,
      deviceType: raw.deviceType as DeviceCreate['deviceType'],
      status: raw.status as DeviceCreate['status'],
      manufacturer: blankToNull(raw.manufacturer),
      model: blankToNull(raw.model),
      serialNumber: blankToNull(raw.serialNumber),
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
    const deviceId = this.deviceId() ? Number(this.deviceId()) : null;

    let request$;
    if (this.mode() === 'edit' && deviceId !== null) {
      request$ = this.service.update(patientId, deviceId, payload);
    } else if (this.mode() === 'replace' && deviceId !== null) {
      request$ = this.service.replace(patientId, deviceId, payload);
    } else {
      request$ = this.service.create(patientId, payload);
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
      if (error.status === 409) {
        return 'That limb already has an active device. Set the existing device to replaced or retired first.';
      }
      const detail = (error.error as { detail?: string } | null)?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Could not save the device. Please try again.';
  }
}
