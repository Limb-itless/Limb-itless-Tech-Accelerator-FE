import {
  addMinutesLocal,
  appointmentTypeLabel,
  minutesBetweenLocal,
  slotStatusLabel,
} from './availability.model';

describe('availability.model', () => {
  it('labels appointment types and slot statuses', () => {
    expect(appointmentTypeLabel('initial_assessment')).toBe('Initial assessment');
    expect(appointmentTypeLabel('follow_up')).toBe('Follow-up');
    expect(slotStatusLabel('open')).toBe('Open');
    expect(slotStatusLabel('booked')).toBe('Booked');
  });

  it('adds minutes without any UTC conversion (stays on the local clock)', () => {
    expect(addMinutesLocal('2026-09-05T09:00', 30)).toBe('2026-09-05T09:30');
    // crosses midnight
    expect(addMinutesLocal('2026-09-05T23:45', 30)).toBe('2026-09-06T00:15');
  });

  it('computes whole minutes between two local datetimes', () => {
    expect(minutesBetweenLocal('2026-09-05T09:00', '2026-09-05T09:45')).toBe(45);
    expect(minutesBetweenLocal('2026-09-05T23:30', '2026-09-06T00:00')).toBe(30);
  });
});
