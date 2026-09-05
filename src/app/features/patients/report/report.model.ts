import { Patient } from '../patient.model';
import { InvolvementDetail } from '../involvements/involvement.model';
import { Milestone } from '../milestones/milestone.model';
import { PromInstrument } from '../proms/prom.model';

export interface MilestoneReportSummary {
  total: number;
  completed: number;
  completedOnTime: number;
  completedLate: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
}

export interface PromTrendPoint {
  recordedAt: string;
  score: number | null;
  flagged: boolean;
}

/** One instrument's readings, oldest first. */
export interface PromTrend {
  instrument: PromInstrument;
  latestScore: number | null;
  latestRecordedAt: string;
  flagged: boolean;
  points: PromTrendPoint[];
}

/** A per-patient progress report (requirements Section 5.5) — milestones
 * met, current PROM trends — viewable on screen and exportable (the FE
 * prints it) for sharing with a receiving clinician at handover. */
export interface PatientReport {
  patient: Patient;
  practiceName: string | null;
  siteName: string | null;
  generatedAt: string;
  involvements: InvolvementDetail[];
  milestoneSummary: MilestoneReportSummary;
  milestones: Milestone[];
  promTrends: PromTrend[];
}
