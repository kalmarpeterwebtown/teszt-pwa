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
