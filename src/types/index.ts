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

// Project Types
export type ProjectType = 'DEVELOPMENT' | 'CUSTOMER' | 'PRODUCTION_SUPPORT';

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  DEVELOPMENT: 'Fejlesztési projektek',
  CUSTOMER: 'Vevői projektek',
  PRODUCTION_SUPPORT: 'Gyártás támogatás',
};

export const ALL_PROJECT_TYPES: ProjectType[] = ['DEVELOPMENT', 'CUSTOMER', 'PRODUCTION_SUPPORT'];

// Project Role in Team
export type ProjectRole = 'LEAD' | 'MEMBER' | 'VIEWER';

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  LEAD: 'Projektvezető',
  MEMBER: 'Tag',
  VIEWER: 'Megtekintő',
};

export const ALL_PROJECT_ROLES: ProjectRole[] = ['LEAD', 'MEMBER', 'VIEWER'];

// Attachment
export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

// Project Tag
export interface ProjectTag {
  id: string;
  name: string;
  category?: string;
  createdAt: string;
}

// Task Type
export interface TaskType {
  id: string;
  name: string;
  category?: string;
  createdAt: string;
}

// Priority
export interface Priority {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

// Status
export interface Status {
  id: string;
  name: string;
  order: number;
  isFinal?: boolean;
  createdAt: string;
}

// Project Team Member
export interface ProjectTeamMember {
  userId: string;
  roleInProject: ProjectRole;
}

// Project
export interface Project {
  id: string;
  type: ProjectType;
  name: string;
  code: string;
  descriptionRich?: string;
  goalsRich?: string;
  goalsAttachmentIds: string[];
  kpiRich?: string;
  kpiAttachmentIds: string[];
  expectedSmartOutcome?: string;
  tagIds: string[];
  team: ProjectTeamMember[];
  createdAt: string;
  updatedAt: string;
}

// Task
export interface Task {
  id: string;
  projectId: string;
  parentTaskId?: string;
  typeId: string;
  name: string;
  code: string;
  descriptionRich?: string;
  descriptionAttachmentIds: string[];
  assigneeUserIds: string[];
  dueDateTime?: string;
  priorityId: string;
  statusId: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}
