import { causeApplies, kindLabel, levelApplies, regionLabel } from './involvement.model';

describe('involvement.model', () => {
  it('level applies to amputation and congenital absence, not orthotic need', () => {
    expect(levelApplies('amputation')).toBe(true);
    expect(levelApplies('congenital_absence')).toBe(true);
    expect(levelApplies('orthotic_need')).toBe(false);
    expect(levelApplies('')).toBe(false);
  });

  it('cause applies only to acquired amputations', () => {
    expect(causeApplies('amputation')).toBe(true);
    expect(causeApplies('congenital_absence')).toBe(false);
    expect(causeApplies('orthotic_need')).toBe(false);
  });

  it('gives readable labels', () => {
    expect(kindLabel('orthotic_need')).toBe('Orthotic need');
    expect(regionLabel('lower_limb_right')).toBe('Right leg');
    expect(regionLabel('spine')).toBe('Spine');
  });
});
