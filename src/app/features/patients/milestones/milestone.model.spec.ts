import {
  CARE_PATHWAYS,
  MILESTONE_TYPES,
  TEMPLATED_PATHWAYS,
  isOverdue,
  type Milestone,
} from './milestone.model';

describe('milestone.model', () => {
  it('offers the orthotic pathway and marks it as templated', () => {
    expect(CARE_PATHWAYS).toContain('orthotic');
    expect(TEMPLATED_PATHWAYS).toContain('orthotic');
    expect(TEMPLATED_PATHWAYS).not.toContain('other');
  });

  it('knows the orthotic milestone types', () => {
    expect(MILESTONE_TYPES).toContain('orthotic_assessment');
    expect(MILESTONE_TYPES).toContain('orthosis_casting');
  });

  it('flags a past-due, incomplete milestone as overdue', () => {
    const base: Milestone = {
      id: 1,
      patientId: 1,
      involvementId: null,
      deviceId: null,
      carePathway: 'orthotic',
      milestoneType: 'orthotic_assessment',
      orderIndex: 0,
      status: 'in_progress',
      targetDate: '2020-01-01',
      completedDate: null,
      notes: null,
      createdAt: '',
      updatedAt: '',
    };
    expect(isOverdue(base)).toBe(true);
    expect(isOverdue({ ...base, status: 'complete' })).toBe(false);
    expect(isOverdue({ ...base, targetDate: null })).toBe(false);
  });
});
