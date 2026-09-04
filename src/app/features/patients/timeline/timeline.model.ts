import { Milestone } from '../milestones/milestone.model';
import { Note } from '../notes/note.model';
import { Prom } from '../proms/prom.model';

export type TimelineKind = 'milestone' | 'prom' | 'note';

export interface TimelineEvent {
  kind: TimelineKind;
  occurredAt: string;
  refId: number;
  title: string;
  milestone: Milestone | null;
  prom: Prom | null;
  note: Note | null;
}

export const TIMELINE_KINDS: readonly TimelineKind[] = ['milestone', 'prom', 'note'];

export const KIND_LABEL: Record<TimelineKind, string> = {
  milestone: 'Milestone',
  prom: 'Outcome measure',
  note: 'Note',
};
