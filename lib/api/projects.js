// Project Management API Client

const API_BASE = '/api/projects';

export const getProjects = async (teamId = null) => {
  const url = teamId ? `${API_BASE}?teamId=${teamId}` : API_BASE;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch projects');
  }
  return response.json();
};

export const getProject = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch project');
  }
  return response.json();
};

export const createProject = async (data) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create project');
  }

  return response.json();
};

export const updateProject = async (id, data) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update project');
  }

  return response.json();
};

export const deleteProject = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete project');
  }

  return response.json();
};
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

export async function getProjects(params = {}) {
  const qs = new URLSearchParams();
  if (params.teamId) qs.set('teamId', params.teamId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/projects${suffix}`, { cache: 'no-store' });
  const data = await handleJsonResponse(res);
  return data.projects || [];
}

export async function createProject(payload) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleJsonResponse(res);
  return data.project;
}

export async function updateProject(id, payload) {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleJsonResponse(res);
  return data.project;
}

export async function deleteProject(id) {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  await handleJsonResponse(res);
  return true;
}
