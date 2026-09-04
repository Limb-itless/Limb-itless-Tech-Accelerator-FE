export type CarePathway = 'lower_limb' | 'upper_limb' | 'other';

export type MilestoneType =
  | 'pre_prosthetic_assessment'
  | 'cast_socket_fabrication'
  | 'initial_fitting_delivery'
  | 'wear_schedule_desensitization'
  | 'gait_functional_training'
  | 'independent_ambulation_adl'
  | 'community_reintegration_followup'
  | 'prosthetic_use_training'
  | 'myoelectric_training'
  | 'other';

export type MilestoneStatus = 'not_started' | 'in_progress' | 'complete' | 'delayed';

export const CARE_PATHWAYS: readonly CarePathway[] = ['lower_limb', 'upper_limb', 'other'];

/** Pathways that have a standard milestone template on the backend. */
export const TEMPLATED_PATHWAYS: readonly CarePathway[] = ['lower_limb', 'upper_limb'];

export const MILESTONE_TYPES: readonly MilestoneType[] = [
  'pre_prosthetic_assessment',
  'cast_socket_fabrication',
  'initial_fitting_delivery',
  'wear_schedule_desensitization',
  'gait_functional_training',
  'independent_ambulation_adl',
  'community_reintegration_followup',
  'prosthetic_use_training',
  'myoelectric_training',
  'other',
];

export const MILESTONE_STATUSES: readonly MilestoneStatus[] = [
  'not_started',
  'in_progress',
  'complete',
  'delayed',
];

export interface Milestone {
  id: number;
  patientId: number;
  involvementId: number | null;
  deviceId: number | null;
  carePathway: CarePathway;
  milestoneType: MilestoneType;
  orderIndex: number;
  status: MilestoneStatus;
  targetDate: string | null;
  completedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneCreate {
  milestoneType: MilestoneType;
  carePathway?: CarePathway;
  involvementId?: number | null;
  deviceId?: number | null;
  orderIndex?: number;
  status?: MilestoneStatus;
  targetDate?: string | null;
  completedDate?: string | null;
  notes?: string | null;
}

export type MilestoneUpdate = Partial<MilestoneCreate>;

export interface MilestoneListParams {
  carePathway?: CarePathway;
  status?: MilestoneStatus;
}

export interface PathwayApply {
  carePathway: CarePathway;
  involvementId?: number | null;
  deviceId?: number | null;
  startDate?: string | null;
  intervalDays?: number;
}

/** True when a milestone's target date has passed and it is not complete. */
export function isOverdue(milestone: Milestone, today = new Date()): boolean {
  if (!milestone.targetDate || milestone.status === 'complete') {
    return false;
  }
  const target = new Date(milestone.targetDate);
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return target < midnight;
}
