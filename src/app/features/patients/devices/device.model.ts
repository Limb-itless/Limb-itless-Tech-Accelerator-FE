import { LimbLossLevel, humanise } from '../patient.model';

export type LimbSide = 'left' | 'right' | 'bilateral';

/** Prostheses replace a missing limb segment. */
export type ProsthesisType =
  'body_powered' | 'myoelectric' | 'passive_cosmetic' | 'activity_specific';

/** Orthoses support or align an intact body part; they carry no
 * amputation level. */
export type OrthosisType =
  'orthosis_afo' | 'orthosis_kafo' | 'orthosis_spinal' | 'orthosis_upper_limb';

export type DeviceType = ProsthesisType | OrthosisType;

export type DeviceStatus =
  'planned' | 'in_fitting' | 'active' | 'in_repair' | 'replaced' | 'retired';

export const LIMB_SIDES: readonly LimbSide[] = ['left', 'right', 'bilateral'];

export const PROSTHESIS_TYPES: readonly ProsthesisType[] = [
  'body_powered',
  'myoelectric',
  'passive_cosmetic',
  'activity_specific',
];

export const ORTHOSIS_TYPES: readonly OrthosisType[] = [
  'orthosis_afo',
  'orthosis_kafo',
  'orthosis_spinal',
  'orthosis_upper_limb',
];

export const DEVICE_TYPES: readonly DeviceType[] = [...PROSTHESIS_TYPES, ...ORTHOSIS_TYPES];

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  body_powered: 'Body-powered prosthesis',
  myoelectric: 'Myoelectric prosthesis',
  passive_cosmetic: 'Passive / cosmetic prosthesis',
  activity_specific: 'Activity-specific prosthesis',
  orthosis_afo: 'Ankle-foot orthosis (AFO)',
  orthosis_kafo: 'Knee-ankle-foot orthosis (KAFO)',
  orthosis_spinal: 'Spinal orthosis / brace',
  orthosis_upper_limb: 'Upper-limb orthosis',
};

export function deviceTypeLabel(type: DeviceType): string {
  return DEVICE_TYPE_LABELS[type] ?? humanise(type);
}

export function isOrthosis(type: DeviceType): boolean {
  return (ORTHOSIS_TYPES as readonly string[]).includes(type);
}

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
  limbLevel: LimbLossLevel | null;
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
  /** Required for a prosthesis; null for an orthosis. */
  limbLevel?: LimbLossLevel | null;
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
