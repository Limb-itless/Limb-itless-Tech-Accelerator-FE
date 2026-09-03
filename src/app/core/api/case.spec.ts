import { camelizeKeys, snakeizeKeys } from './case';

describe('case', () => {
  it('camelizes nested object and array keys', () => {
    const input = {
      first_name: 'Ann',
      contact_email: null,
      limb_loss_level: 'transtibial',
      recent_events: [{ event_type: 'note', ref_id: 3 }],
    };

    expect(camelizeKeys(input)).toEqual({
      firstName: 'Ann',
      contactEmail: null,
      limbLossLevel: 'transtibial',
      recentEvents: [{ eventType: 'note', refId: 3 }],
    });
  });

  it('snakeizes camelCase keys', () => {
    expect(snakeizeKeys({ firstName: 'Ann', assignedTo: 4 })).toEqual({
      first_name: 'Ann',
      assigned_to: 4,
    });
  });

  it('leaves primitives and dates untouched', () => {
    const date = new Date('2026-01-01');
    expect(camelizeKeys({ a_b: date, c: 2, d: 'x' })).toEqual({
      aB: date,
      c: 2,
      d: 'x',
    });
  });

  it('round-trips', () => {
    const camel = { firstName: 'A', nested: { siteId: 1 }, list: [{ isActive: true }] };
    expect(camelizeKeys(snakeizeKeys(camel))).toEqual(camel);
  });
});
