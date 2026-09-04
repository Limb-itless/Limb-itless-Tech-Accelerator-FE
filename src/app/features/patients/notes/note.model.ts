export interface Note {
  id: number;
  patientId: number;
  involvementId: number | null;
  authorId: number | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteCreate {
  body: string;
  involvementId?: number | null;
}

export type NoteUpdate = Partial<NoteCreate>;
