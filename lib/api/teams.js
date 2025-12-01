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