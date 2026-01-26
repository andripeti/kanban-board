import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from './db';
import Team from './models/Team';

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return session;
}

export async function requireAdminOrProjectManager() {
  const session = await requireAuth();

  if (session.user.role !== 'admin' && session.user.role !== 'project_manager') {
    throw new Error('Forbidden: Admin or Project Manager access required');
  }

  return session;
}

export const TEAM_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEW_ONLY: 'viewOnly',
};

export const ROLE_DISPLAY_NAMES = {
  admin: 'Admin',
  member: 'Member',
  viewOnly: 'View Only',
};

export async function getTeamMemberRole(userId, teamId) {
  if (!teamId) return null;

  await dbConnect();
  const team = await Team.findById(teamId);

  if (!team) return null;

  const member = team.members.find(
    m => m.userId.toString() === userId.toString()
  );

  return member?.role || null;
}

export async function hasTeamRole(userId, teamId, roles) {
  const memberRole = await getTeamMemberRole(userId, teamId);
  if (!memberRole) return false;
  return roles.includes(memberRole);
}

export async function isTeamAdmin(userId, teamId) {
  return await hasTeamRole(userId, teamId, [TEAM_ROLES.ADMIN]);
}

export async function canEditInTeam(userId, teamId) {
  if (!teamId) return false;
  return await hasTeamRole(userId, teamId, [TEAM_ROLES.ADMIN, TEAM_ROLES.MEMBER]);
}

export async function canViewTeam(userId, teamId) {
  if (!teamId) return false;
  return await hasTeamRole(userId, teamId, [TEAM_ROLES.ADMIN, TEAM_ROLES.MEMBER, TEAM_ROLES.VIEW_ONLY]);
}

export async function canManageTeam(userId, teamId) {
  if (!teamId) return false;
  return await isTeamAdmin(userId, teamId);
}

export async function canCreateTasks(session, teamId = null) {
  if (!teamId) return false;
  return await canEditInTeam(session.user.id, teamId);
}

export async function canManageProjects(session, teamId = null) {
  if (!teamId) return false;
  return await canEditInTeam(session.user.id, teamId);
}

export function isAdmin(session) {
  return session?.user?.role === 'admin';
}

export function isProjectManager(session) {
  return session?.user?.role === 'project_manager';
}

export function isAdminOrProjectManager(session) {
  return isAdmin(session) || isProjectManager(session);
}

