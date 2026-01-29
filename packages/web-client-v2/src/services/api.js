import { fetchAuthSession } from 'aws-amplify/auth';
import { config } from '../config';

const API_BASE_URL = config.api.baseUrl;

const getToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
};

const fetchWithAuth = async (url, options = {}) => {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = token;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response;
};

export const api = {
  getSchedules: async (period) => {
    const response = await fetchWithAuth(`/api/schedules/${period}`);
    return response.json();
  },

  createSchedule: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createComments: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createNotice: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/notices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteNotice: async (groupId, period) => {
    await fetchWithAuth(`/api/groups/${groupId}/notices/${period}`, {
      method: 'DELETE',
    });
  },
};
