export type Role = 'Admin' | 'OsztalyVezeto' | 'CsoportVezeto' | 'Munkatars' | 'Megtekinto';

export interface Contact {
  email: string;
  phone?: string;
}

export interface Vacation {
  id: string;
  from: string;
  to: string;
  type: 'vacation' | 'sick' | 'other';
  note?: string;
}

export interface WorkSchedule {
  workdayStart: string;
  workdayEnd: string;
  vacations: Vacation[];
}

export interface User {
  id: string;
  name: string;
  contacts: Contact;
  jobTitle: string;
  role: Role;
  competencyIds: string[];
  workSchedule: WorkSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface Competency {
  id: string;
  name: string;
  category?: string;
  createdAt: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  Admin: 5,
  OsztalyVezeto: 4,
  CsoportVezeto: 3,
  Munkatars: 2,
  Megtekinto: 1,
};

export const ROLE_LABELS: Record<Role, string> = {
  Admin: 'Admin',
  OsztalyVezeto: 'Osztályvezető',
  CsoportVezeto: 'Csoportvezető',
  Munkatars: 'Munkatárs',
  Megtekinto: 'Megtekintő',
};

export const ALL_ROLES: Role[] = ['Admin', 'OsztalyVezeto', 'CsoportVezeto', 'Munkatars', 'Megtekinto'];
