import { coverageStatusLabel } from './review.model';

describe('review.model', () => {
  it('labels coverage statuses', () => {
    expect(coverageStatusLabel('pending')).toBe('Pending');
    expect(coverageStatusLabel('approved')).toBe('Approved');
    expect(coverageStatusLabel('denied')).toBe('Denied');
  });
});
