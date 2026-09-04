import { Patient } from '../patients/patient.model';
import { PromInstrument } from '../patients/proms/prom.model';

/** The patient's own record, plus the resolved practice / site names. */
export interface PortalProfile extends Patient {
  practiceName: string | null;
  siteName: string | null;
}

export interface PortalInstruments {
  instruments: PromInstrument[];
}

export interface PortalPromCreate {
  instrument: PromInstrument;
  responses: Record<string, unknown>;
  recordedAt?: string | null;
  notes?: string | null;
}
