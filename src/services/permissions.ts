import type { Role } from '../types';
import { ROLE_HIERARCHY } from '../types';

export function canCreateUser(currentRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto;
}

export function canEditUser(currentRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto;
}

export function canDeleteUser(currentRole: Role): boolean {
  return currentRole === 'Admin';
}

export function canManageCompetencies(currentRole: Role): boolean {
  return currentRole === 'Admin';
}

export function canCreateRole(currentRole: Role, targetRole: Role): boolean {
  if (currentRole === 'Admin') {
    return true;
  }
  if (currentRole === 'OsztalyVezeto') {
    return ['CsoportVezeto', 'Munkatars', 'Megtekinto'].includes(targetRole);
  }
  if (currentRole === 'CsoportVezeto') {
    return ['Munkatars', 'Megtekinto'].includes(targetRole);
  }
  return false;
}

export function getCreatableRoles(currentRole: Role): Role[] {
  if (currentRole === 'Admin') {
    return ['Admin', 'OsztalyVezeto', 'CsoportVezeto', 'Munkatars', 'Megtekinto'];
  }
  if (currentRole === 'OsztalyVezeto') {
    return ['CsoportVezeto', 'Munkatars', 'Megtekinto'];
  }
  if (currentRole === 'CsoportVezeto') {
    return ['Munkatars', 'Megtekinto'];
  }
  return [];
}

export function canEditTargetUser(currentRole: Role, targetRole: Role): boolean {
  if (currentRole === 'Admin') return true;
  return ROLE_HIERARCHY[currentRole] > ROLE_HIERARCHY[targetRole];
}

// Project permissions
export function canManageMasterData(currentRole: Role): boolean {
  return currentRole === 'Admin';
}

export function canCreateProject(currentRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto;
}

export function canEditProject(currentRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto;
}

export function canDeleteProject(currentRole: Role): boolean {
  return currentRole === 'Admin';
}

export function canManageProjectTeam(currentRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto;
}

// Task permissions
export function canCreateTask(currentRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto;
}

export function canEditTask(currentRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto;
}

export function canDeleteTask(currentRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto;
}

// Munkatars can edit actualHours and status on tasks assigned to them
export function canEditTaskProgress(currentRole: Role, assigneeUserIds: string[], currentUserId: string): boolean {
  if (ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto) return true;
  if (currentRole === 'Munkatars' && assigneeUserIds.includes(currentUserId)) return true;
  return false;
}

// Check if user has access to project (is in team or has high enough role)
export function hasProjectAccess(
  currentRole: Role, 
  currentUserId: string, 
  projectTeam: { userId: string }[]
): boolean {
  if (ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY.CsoportVezeto) return true;
  return projectTeam.some(member => member.userId === currentUserId);
}
