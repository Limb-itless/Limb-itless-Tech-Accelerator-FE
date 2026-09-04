import { Patient } from '../patients/patient.model';
import { InvolvementDetail } from '../patients/involvements/involvement.model';
import { Milestone } from '../patients/milestones/milestone.model';
import { Note } from '../patients/notes/note.model';
import { Prom } from '../patients/proms/prom.model';

/** One row of the reviewer's shared-patients list. */
export interface ReviewPatientSummary {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  practiceId: number;
  practiceName: string | null;
  involvementCount: number;
}

/** Everything a reviewer sees for one granted patient — read-only. */
export interface ReviewBundle {
  patient: Patient;
  practiceName: string | null;
  siteName: string | null;
  involvements: InvolvementDetail[];
  milestones: Milestone[];
  proms: Prom[];
  notes: Note[];
}
