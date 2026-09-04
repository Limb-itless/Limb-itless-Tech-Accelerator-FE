import { Site, SiteCreate } from '../admin/admin.model';

export type PracticeType = 'hospital_network' | 'private_practice';

export const PRACTICE_TYPES: readonly PracticeType[] = ['hospital_network', 'private_practice'];

export interface Practice {
  id: number;
  name: string;
  type: PracticeType;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeSummary extends Practice {
  siteCount: number;
  userCount: number;
  patientCount: number;
}

export interface PracticeDetail extends PracticeSummary {
  sites: Site[];
}

export interface PracticePage {
  items: PracticeSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface PracticeCreate {
  name: string;
  type: PracticeType;
  address?: string | null;
}

export type PracticeUpdate = Partial<PracticeCreate>;

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface PracticeOnboard {
  practice: PracticeCreate;
  firstSite: SiteCreate;
  firstAdmin: AdminCredentials;
}

export interface OnboardResult {
  practice: Practice;
  firstSite: Site;
  firstAdmin: { id: number; email: string; role: string };
}

export interface PracticeListParams {
  q?: string;
  limit?: number;
  offset?: number;
}
