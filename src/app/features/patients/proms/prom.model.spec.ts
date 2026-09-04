import { INSTRUMENT_GROUPS, INSTRUMENT_META, PROM_INSTRUMENTS, Prom, toTrends } from './prom.model';

function prom(overrides: Partial<Prom>): Prom {
  return {
    id: 1,
    patientId: 1,
    involvementId: null,
    deviceId: null,
    instrument: 'pain_residual_limb',
    responses: {},
    score: 5,
    flagged: false,
    flagReason: null,
    recordedAt: '2026-01-01T00:00:00',
    recordedById: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

describe('toTrends', () => {
  it('groups by instrument and sorts each series oldest-first', () => {
    const trends = toTrends([
      prom({ id: 1, instrument: 'pain_phantom', score: 6, recordedAt: '2026-03-01T00:00:00' }),
      prom({ id: 2, instrument: 'pain_phantom', score: 4, recordedAt: '2026-01-01T00:00:00' }),
      prom({
        id: 3,
        instrument: 'socket_comfort_score',
        score: 7,
        recordedAt: '2026-02-01T00:00:00',
      }),
    ]);

    expect([...trends.keys()]).toEqual(['pain_phantom', 'socket_comfort_score']);
    expect(trends.get('pain_phantom')!.map((p) => p.promId)).toEqual([2, 1]);
    expect(trends.get('socket_comfort_score')!).toHaveLength(1);
  });

  it('drops rows without a numeric score', () => {
    const trends = toTrends([prom({ id: 1, score: null }), prom({ id: 2, score: 3 })]);
    expect(trends.get('pain_residual_limb')!.map((p) => p.promId)).toEqual([2]);
  });
});

describe('INSTRUMENT_GROUPS', () => {
  it('puts every instrument in exactly one group', () => {
    const grouped = INSTRUMENT_GROUPS.flatMap((g) => g.instruments);
    expect(grouped.slice().sort()).toEqual(PROM_INSTRUMENTS.slice().sort());
  });

  it('groups the orthosis comfort score under Orthotic, not Amputation', () => {
    const orthotic = INSTRUMENT_GROUPS.find((g) => g.label === 'Orthotic')!;
    const amputation = INSTRUMENT_GROUPS.find((g) => g.label === 'Amputation')!;
    expect(orthotic.instruments).toContain('orthosis_comfort_score');
    expect(amputation.instruments).toContain('socket_comfort_score');
    expect(amputation.instruments).not.toContain('orthosis_comfort_score');
  });

  it('has meta for the QUEST satisfaction scale (1-5, flag low)', () => {
    const m = INSTRUMENT_META.quest_satisfaction;
    expect([m.min, m.max, m.flagWhen]).toEqual([1, 5, 'lte']);
  });
});
