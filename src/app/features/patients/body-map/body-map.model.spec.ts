import { kindMarkerColor, regionAnchor } from './body-map.model';

describe('body-map.model', () => {
  it('anchors an anatomical left limb on the viewer right and vice versa', () => {
    const left = regionAnchor('upper_limb_left');
    const right = regionAnchor('upper_limb_right');
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    // viewBox is 0..240, centre 120 — left limb sits to the right of centre
    expect(left!.x).toBeGreaterThan(120);
    expect(right!.x).toBeLessThan(120);
  });

  it('has no anchor for "other"', () => {
    expect(regionAnchor('other')).toBeNull();
  });

  it('gives each involvement kind its own marker colour', () => {
    const colors = new Set([
      kindMarkerColor('amputation'),
      kindMarkerColor('congenital_absence'),
      kindMarkerColor('orthotic_need'),
    ]);
    expect(colors.size).toBe(3);
  });
});
