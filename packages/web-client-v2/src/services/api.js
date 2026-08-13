import { fetchAuthSession } from 'aws-amplify/auth';

const getToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
};

// Error carrying the HTTP status, so callers (e.g. InvitePage) can branch
// terminal (404) vs not-approved (403) vs retryable (5xx / network).
export class ApiError extends Error {
  constructor(status, message) {
    super(message || `API error: ${status}`);
    this.name = 'ApiError';
    this.status = status; // 0 = network/transport failure
  }
}

// `err.message` on an ApiError is always the literal "API error: <status>" — it is
// diagnostic, never something to render. Every place that shows a failure to a
// person goes through this instead.
//
// `overrides` takes status keys plus `fallback`, because the same status means
// different things in different places: 403 on a group page is "you're not a member
// any more", 403 on an invite is "you're not approved yet".
export const errorMessage = (err, overrides = {}) => {
  const status = err instanceof ApiError ? err.status : null;
  if (status != null && overrides[status]) return overrides[status];
  const fallback = overrides.fallback ?? 'Something went wrong.';
  switch (status) {
    case 0:
      return "Couldn't reach the server. Check your connection and try again.";
    case 401:
      return 'Your session has expired — sign in again.';
    case 403:
      return "You don't have access to this any more.";
    case 404:
      return "This isn't here any more.";
    case 409:
      return 'Someone changed this first. Refresh and try again.';
    default:
      if (status >= 500) return 'The server had a problem. Try again in a moment.';
      return fallback;
  }
};

const fetchWithAuth = async (url, options = {}) => {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = token;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (e) {
    throw new ApiError(0, e?.message || 'Network error');
  }
  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.status}`);
  }
  return response;
};

export const api = {
  getSchedules: async (period) => {
    const response = await fetchWithAuth(`/api/schedules/${period}`);
    return response.json();
  },
  createSchedule: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/schedules`, { method: 'POST', body: JSON.stringify(data) });
  },
  createComments: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/comments`, { method: 'POST', body: JSON.stringify(data) });
  },
  createNotice: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/notices`, { method: 'POST', body: JSON.stringify(data) });
  },
  deleteNotice: async (groupId, period) => {
    await fetchWithAuth(`/api/groups/${groupId}/notices/${period}`, { method: 'DELETE' });
  },

  // --- Group management ---
  createGroup: async (name) => {
    const r = await fetchWithAuth('/api/groups', { method: 'POST', body: JSON.stringify({ name }) });
    return r.json(); // { id, name, createdAt }
  },
  renameGroup: async (groupId, name) => {
    const r = await fetchWithAuth(`/api/groups/${groupId}`, { method: 'PUT', body: JSON.stringify({ name }) });
    return r.json();
  },
  deleteGroup: async (groupId) => {
    await fetchWithAuth(`/api/groups/${groupId}`, { method: 'DELETE' });
  },
  createInvite: async (groupId) => {
    const r = await fetchWithAuth(`/api/groups/${groupId}/invites`, { method: 'POST' });
    return r.json(); // { code, expiresAt }
  },
  listInvites: async (groupId) => {
    const r = await fetchWithAuth(`/api/groups/${groupId}/invites`);
    return r.json(); // { invites: [{ code, expiresAt }] }
  },
  getInvite: async (code) => {
    const r = await fetchWithAuth(`/api/invites/${code}`);
    return r.json(); // { groupName, expiresAt }
  },
  redeemInvite: async (code) => {
    const r = await fetchWithAuth(`/api/invites/${code}/redeem`, { method: 'POST' });
    return r.json(); // { groupId, groupName, alreadyMember }
  },
  revokeInvite: async (groupId, code) => {
    await fetchWithAuth(`/api/groups/${groupId}/invites/${code}`, { method: 'DELETE' });
  },
  kickMember: async (groupId, memberId) => {
    await fetchWithAuth(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
  },
  // Same route as kickMember; the backend dispatches on caller-id vs path-id
  // (path id == caller → voluntary leave; else → admin kick). Callers pass user.memberId.
  leaveGroup: async (groupId, memberId) => {
    await fetchWithAuth(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
  },
};
