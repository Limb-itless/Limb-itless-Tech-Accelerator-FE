import { Prom, toTrends } from './prom.model';

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
