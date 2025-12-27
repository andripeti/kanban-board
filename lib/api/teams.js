// Team Management API Client
// Use these functions in your React components

const API_BASE = '/api/teams';

export const getTeams = async () => {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch teams');
  }
  return response.json();
};

export const getTeam = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch team');
  }
  return response.json();
};

export const createTeam = async (data) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create team');
  }

  return response.json();
};

export const updateTeam = async (id, data) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update team');
  }

  return response.json();
};

export const deleteTeam = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete team');
  }

  return response.json();
};

// Team Members API
export const addTeamMember = async (teamId, memberData) => {
  const response = await fetch(`${API_BASE}/${teamId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(memberData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add team member');
  }

  return response.json();
};

export const removeTeamMember = async (teamId, userId) => {
  const response = await fetch(`${API_BASE}/${teamId}/members?userId=${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove team member');
  }

  return response.json();
};

// Usage Examples:

/*
// Create a team
import { createTeam } from '@/lib/api/teams';

const handleCreateTeam = async () => {
  try {
    const result = await createTeam({ name: 'Development Team' });
    console.log('Team created:', result.team);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Add a member to a team
import { addTeamMember } from '@/lib/api/teams';

const handleAddMember = async (teamId) => {
  try {
    const result = await addTeamMember(teamId, {
      email: 'user@example.com',
      role: 'member'
    });
    console.log('Member added:', result.team);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Get all teams
import { getTeams } from '@/lib/api/teams';

const fetchTeams = async () => {
  try {
    const { teams } = await getTeams();
    setTeams(teams);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Remove a member from a team
import { removeTeamMember } from '@/lib/api/teams';

const handleRemoveMember = async (teamId, userId) => {
  try {
    const result = await removeTeamMember(teamId, userId);
    console.log('Member removed:', result.message);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
*/
async function handleJsonResponse(res) {
  if (res.ok) return res.json();
  let payload = { error: 'Unknown error' };
  try {
    payload = await res.json();
  } catch (e) {
    // ignore
  }
  throw new Error(payload.error || payload.message || 'Request failed');
}

export async function getTeams() {
  const res = await fetch('/api/teams', { cache: 'no-store' });
  const data = await handleJsonResponse(res);
  return data.teams || [];
}

export async function createTeam(payload) {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleJsonResponse(res);
  return data.team;
}

export async function updateTeam(id, payload) {
  const res = await fetch(`/api/teams/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleJsonResponse(res);
  return data.team;
}

export async function deleteTeam(id) {
  const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
  await handleJsonResponse(res);
  return true;
}
