import { DEVICE_TYPES, deviceTypeLabel, isOrthosis } from './device.model';

describe('device.model', () => {
  it('exposes prosthesis and orthosis types together', () => {
    expect(DEVICE_TYPES).toContain('myoelectric');
    expect(DEVICE_TYPES).toContain('orthosis_afo');
  });

  it('isOrthosis distinguishes the two families', () => {
    expect(isOrthosis('orthosis_spinal')).toBe(true);
    expect(isOrthosis('body_powered')).toBe(false);
  });

  it('gives readable labels', () => {
    expect(deviceTypeLabel('orthosis_afo')).toBe('Ankle-foot orthosis (AFO)');
    expect(deviceTypeLabel('myoelectric')).toBe('Myoelectric prosthesis');
  });
});
