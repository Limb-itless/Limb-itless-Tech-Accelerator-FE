import { LimbLossLevel } from '../patient.model';

export type LimbSide = 'left' | 'right';

export type DeviceType = 'body_powered' | 'myoelectric' | 'passive_cosmetic' | 'activity_specific';

export type DeviceStatus =
  'planned' | 'in_fitting' | 'active' | 'in_repair' | 'replaced' | 'retired';

export const LIMB_SIDES: readonly LimbSide[] = ['left', 'right'];

export const DEVICE_TYPES: readonly DeviceType[] = [
  'body_powered',
  'myoelectric',
  'passive_cosmetic',
  'activity_specific',
];

export const DEVICE_STATUSES: readonly DeviceStatus[] = [
  'planned',
  'in_fitting',
  'active',
  'in_repair',
  'replaced',
  'retired',
];

export interface Device {
  id: number;
  patientId: number;
  limbSide: LimbSide;
  limbLevel: LimbLossLevel;
  deviceType: DeviceType;
  status: DeviceStatus;
  replacesDeviceId: number | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  socketType: string | null;
  linerType: string | null;
  suspensionType: string | null;
  terminalDevice: string | null;
  castScanDate: string | null;
  deliveryDate: string | null;
  fittedDate: string | null;
  warrantyStart: string | null;
  warrantyExpiry: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCreate {
  limbSide: LimbSide;
  limbLevel: LimbLossLevel;
  deviceType: DeviceType;
  status?: DeviceStatus;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  socketType?: string | null;
  linerType?: string | null;
  suspensionType?: string | null;
  terminalDevice?: string | null;
  castScanDate?: string | null;
  deliveryDate?: string | null;
  fittedDate?: string | null;
  warrantyStart?: string | null;
  warrantyExpiry?: string | null;
  notes?: string | null;
}

export type DeviceUpdate = Partial<DeviceCreate>;

/** Device statuses that count as "currently on the patient". The backend
 * allows only one such device per limb side. */
export const LIVE_STATUSES: readonly DeviceStatus[] = [
  'planned',
  'in_fitting',
  'active',
  'in_repair',
];
