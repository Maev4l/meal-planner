import { fetchToken } from '../security';

const basePath = 'https://api-meal-planner.isnan.eu';

const get = async (path) => {
  const token = await fetchToken();
  const response = await fetch(`${basePath}${path}`, {
    method: 'GET',
    headers: { Authorization: token },
  });
  const json = await response.json();
  return json;
};

const post = async (path, data) => {
  const token = await fetchToken();
  await fetch(`${basePath}${path}`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  });
};

const del = async (path) => {
  const token = await fetchToken();
  await fetch(`${basePath}${path}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  });
};

export default {
  get,
  post,
  del,
};
