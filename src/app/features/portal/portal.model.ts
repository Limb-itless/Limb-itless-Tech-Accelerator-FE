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

/** Claim an existing walk-in record (requirements Section 5.11): the
 * identity number on file, plus a contact detail as a second factor. */
export interface AccountLinkClaim {
  identifier: string;
  contactValue: string;
}
