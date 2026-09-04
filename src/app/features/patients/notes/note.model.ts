export interface Note {
  id: number;
  patientId: number;
  authorId: number | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteCreate {
  body: string;
}

export type NoteUpdate = Partial<NoteCreate>;
