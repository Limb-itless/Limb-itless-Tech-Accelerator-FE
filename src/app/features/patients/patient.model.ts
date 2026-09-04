export type CauseOfLimbLoss =
  'trauma' | 'dysvascular' | 'infection' | 'tumour' | 'congenital' | 'other';

export type LimbLossLevel =
  | 'partial_foot'
  | 'ankle_disarticulation'
  | 'transtibial'
  | 'knee_disarticulation'
  | 'transfemoral'
  | 'hip_disarticulation'
  | 'partial_hand'
  | 'wrist_disarticulation'
  | 'transradial'
  | 'elbow_disarticulation'
  | 'transhumeral'
  | 'shoulder_disarticulation';

export const CAUSE_OF_LIMB_LOSS: readonly CauseOfLimbLoss[] = [
  'trauma',
  'dysvascular',
  'infection',
  'tumour',
  'congenital',
  'other',
];

export const LIMB_LOSS_LEVELS: readonly LimbLossLevel[] = [
  'partial_foot',
  'ankle_disarticulation',
  'transtibial',
  'knee_disarticulation',
  'transfemoral',
  'hip_disarticulation',
  'partial_hand',
  'wrist_disarticulation',
  'transradial',
  'elbow_disarticulation',
  'transhumeral',
  'shoulder_disarticulation',
];

export interface Patient {
  id: number;
  practiceId: number;
  siteId: number | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationalId: string | null;
  passportNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  medicalHistory: string | null;
  comorbidities: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientPage {
  items: Patient[];
  total: number;
  limit: number;
  offset: number;
}

export interface PatientCreate {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationalId?: string | null;
  passportNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  medicalHistory?: string | null;
  comorbidities?: string | null;
  siteId?: number | null;
}

export type PatientUpdate = Partial<PatientCreate>;

export interface PatientListParams {
  q?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

/** "transtibial" -> "Transtibial", "hip_disarticulation" -> "Hip disarticulation" */
export function humanise(value: string): string {
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
