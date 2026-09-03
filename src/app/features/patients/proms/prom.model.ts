export type PromInstrument =
  'pain_residual_limb' | 'pain_phantom' | 'socket_comfort_score' | 'locomotor_capabilities_index';

export const PROM_INSTRUMENTS: readonly PromInstrument[] = [
  'pain_residual_limb',
  'pain_phantom',
  'socket_comfort_score',
  'locomotor_capabilities_index',
];

export interface InstrumentMeta {
  label: string;
  /** Lowest / highest valid score. */
  min: number;
  max: number;
  /** Score at or beyond which the backend flags the result. */
  threshold: number;
  /** Whether a high score ('gte') or a low score ('lte') is the concern. */
  flagWhen: 'gte' | 'lte';
  /** Short human hint about the scale direction. */
  scaleHint: string;
}

export const INSTRUMENT_META: Record<PromInstrument, InstrumentMeta> = {
  pain_residual_limb: {
    label: 'Residual limb pain (NRS)',
    min: 0,
    max: 10,
    threshold: 7,
    flagWhen: 'gte',
    scaleHint: '0–10, higher is worse',
  },
  pain_phantom: {
    label: 'Phantom pain (NRS)',
    min: 0,
    max: 10,
    threshold: 7,
    flagWhen: 'gte',
    scaleHint: '0–10, higher is worse',
  },
  socket_comfort_score: {
    label: 'Socket Comfort Score',
    min: 0,
    max: 10,
    threshold: 4,
    flagWhen: 'lte',
    scaleHint: '0–10, higher is better',
  },
  locomotor_capabilities_index: {
    label: 'Locomotor Capabilities Index (LCI-5)',
    min: 0,
    max: 56,
    threshold: 21,
    flagWhen: 'lte',
    scaleHint: '0–56, higher is better',
  },
};

export interface Prom {
  id: number;
  patientId: number;
  deviceId: number | null;
  instrument: PromInstrument;
  responses: Record<string, unknown>;
  score: number | null;
  flagged: boolean;
  flagReason: string | null;
  recordedAt: string;
  recordedById: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromCreate {
  instrument: PromInstrument;
  responses: Record<string, unknown>;
  deviceId?: number | null;
  recordedAt?: string | null;
  notes?: string | null;
}

export type PromUpdate = Partial<PromCreate>;

export interface PromListParams {
  instrument?: PromInstrument;
  flagged?: boolean;
}

/** A single point on an instrument's trend line. */
export interface TrendPoint {
  promId: number;
  at: string;
  score: number;
  flagged: boolean;
}

/** Group PROM rows by instrument, each series sorted oldest-first, keeping
 * only rows that carry a numeric score. */
export function toTrends(proms: readonly Prom[]): Map<PromInstrument, TrendPoint[]> {
  const byInstrument = new Map<PromInstrument, TrendPoint[]>();
  for (const prom of proms) {
    if (prom.score === null) {
      continue;
    }
    const series = byInstrument.get(prom.instrument) ?? [];
    series.push({ promId: prom.id, at: prom.recordedAt, score: prom.score, flagged: prom.flagged });
    byInstrument.set(prom.instrument, series);
  }
  for (const series of byInstrument.values()) {
    series.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }
  return byInstrument;
}
