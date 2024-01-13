import { fetchToken } from '../security';

// const basePath = 'https://meal-planner.isnan.eu';

const get = async (url) => {
  const token = await fetchToken();
  const response = await fetch(url, { method: 'GET', headers: { Authorization: token } });
  const json = await response.json();
  return json;
};

const post = async (url, data) => {
  const token = await fetchToken();
  await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { Authorization: token },
  });
};

export default {
  get,
  post,
};
