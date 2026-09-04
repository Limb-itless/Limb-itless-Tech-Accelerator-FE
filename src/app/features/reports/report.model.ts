/** One grouped count. `key` is a raw enum value — humanise it for display. */
export interface ReportBreakdown {
  key: string;
  count: number;
}

export interface CaseloadReport {
  activePatients: number;
  inactivePatients: number;
  newPatients: number;
  byInvolvementKind: ReportBreakdown[];
}

export interface MilestoneAdherenceReport {
  completed: number;
  completedOnTime: number;
  completedLate: number;
  avgDaysLate: number | null;
  openOverdue: number;
}

export interface OutcomeMeasureReport {
  records: number;
  recordedInPeriod: number;
  flagged: number;
  patientsWithFlag: number;
  byInstrument: ReportBreakdown[];
}

export interface DeviceReport {
  total: number;
  prostheses: number;
  orthoses: number;
  byType: ReportBreakdown[];
  byStatus: ReportBreakdown[];
}

export interface ReportSummary {
  sinceDays: number;
  caseload: CaseloadReport;
  milestones: MilestoneAdherenceReport;
  outcomeMeasures: OutcomeMeasureReport;
  devices: DeviceReport;
}

/** Windows offered by the period picker. */
export const REPORT_WINDOWS = [7, 30, 90, 365] as const;
export type ReportWindow = (typeof REPORT_WINDOWS)[number];

export function windowLabel(days: number): string {
  if (days === 7) return 'last 7 days';
  if (days === 30) return 'last 30 days';
  if (days === 90) return 'last 90 days';
  if (days === 365) return 'last year';
  return `last ${days} days`;
}

/** completed-on-time as a whole-number percentage, or null when nothing
 * measurable is completed yet. */
export function onTimeRate(m: MilestoneAdherenceReport): number | null {
  return m.completed === 0 ? null : Math.round((m.completedOnTime / m.completed) * 100);
}
