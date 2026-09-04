import { MilestoneStatus, MilestoneType } from '../patients/milestones/milestone.model';
import { PromInstrument } from '../patients/proms/prom.model';

export type DashboardView = 'practice' | 'mine';

export interface OverdueMilestone {
  milestoneId: number;
  patientId: number;
  patientName: string;
  milestoneType: MilestoneType;
  status: MilestoneStatus;
  targetDate: string;
  daysOverdue: number;
}

export interface UpcomingMilestone {
  milestoneId: number;
  patientId: number;
  patientName: string;
  milestoneType: MilestoneType;
  status: MilestoneStatus;
  targetDate: string;
  daysUntil: number;
}

export interface FlaggedProm {
  promId: number;
  patientId: number;
  patientName: string;
  instrument: PromInstrument;
  score: number | null;
  flagReason: string | null;
  recordedAt: string;
}

export interface DashboardSummary {
  activePatients: number;
  patientsByPhase: Record<string, number>;
  overdueCount: number;
  overdue: OverdueMilestone[];
  upcomingCount: number;
  upcoming: UpcomingMilestone[];
  flaggedPromCount: number;
  flaggedProms: FlaggedProm[];
}

/** patientsByPhase as a sorted array, most patients first. */
export function phaseBreakdown(summary: DashboardSummary): { phase: string; count: number }[] {
  return Object.entries(summary.patientsByPhase)
    .map(([phase, count]) => ({ phase, count }))
    .sort((a, b) => b.count - a.count);
}
