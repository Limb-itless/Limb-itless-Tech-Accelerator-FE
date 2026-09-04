import { CauseOfLimbLoss, LimbLossLevel } from '../patient.model';
import { Device } from '../devices/device.model';

export type InvolvementKind = 'amputation' | 'congenital_absence' | 'orthotic_need';

export type BodyRegion =
  | 'lower_limb_left'
  | 'lower_limb_right'
  | 'upper_limb_left'
  | 'upper_limb_right'
  | 'spine'
  | 'trunk'
  | 'other';

export type InvolvementStatus = 'active' | 'resolved';

export const INVOLVEMENT_KINDS: readonly InvolvementKind[] = [
  'amputation',
  'congenital_absence',
  'orthotic_need',
];

export const BODY_REGIONS: readonly BodyRegion[] = [
  'lower_limb_left',
  'lower_limb_right',
  'upper_limb_left',
  'upper_limb_right',
  'spine',
  'trunk',
  'other',
];

export const INVOLVEMENT_STATUSES: readonly InvolvementStatus[] = ['active', 'resolved'];

const KIND_LABELS: Record<InvolvementKind, string> = {
  amputation: 'Amputation',
  congenital_absence: 'Congenital absence',
  orthotic_need: 'Orthotic need',
};

const REGION_LABELS: Record<BodyRegion, string> = {
  lower_limb_left: 'Left leg',
  lower_limb_right: 'Right leg',
  upper_limb_left: 'Left arm',
  upper_limb_right: 'Right arm',
  spine: 'Spine',
  trunk: 'Trunk',
  other: 'Other',
};

export function kindLabel(kind: InvolvementKind): string {
  return KIND_LABELS[kind];
}

export function regionLabel(region: BodyRegion): string {
  return REGION_LABELS[region];
}

/** An amputation level only makes sense for an amputation or a congenital
 * absence. */
export function levelApplies(kind: InvolvementKind | ''): boolean {
  return kind === 'amputation' || kind === 'congenital_absence';
}

/** Cause is recorded for acquired amputations. */
export function causeApplies(kind: InvolvementKind | ''): boolean {
  return kind === 'amputation';
}

export interface Involvement {
  id: number;
  patientId: number;
  kind: InvolvementKind;
  region: BodyRegion;
  level: LimbLossLevel | null;
  cause: CauseOfLimbLoss | null;
  onsetDate: string | null;
  status: InvolvementStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvolvementDetail extends Involvement {
  devices: Device[];
}

export interface InvolvementCreate {
  kind: InvolvementKind;
  region: BodyRegion;
  level?: LimbLossLevel | null;
  cause?: CauseOfLimbLoss | null;
  onsetDate?: string | null;
  status?: InvolvementStatus;
  notes?: string | null;
}

export type InvolvementUpdate = Partial<InvolvementCreate>;
