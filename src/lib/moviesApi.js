const API_PREFIX = "/api";

export const APP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzXzMxIiwicm9sZSI6InVzZXIiLCJhcGlfYWNjZXNzIjp0cnVlLCJpYXQiOjE3NjUzNjE3NjgsImV4cCI6MTc3MDU0NTc2OH0.O4I48nov3NLaKDSBhrPe9rKZtNs9q2Tkv4yK0uMthoo";

export function getImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_PREFIX}${image.startsWith("/") ? "" : "/"}${image}`;
}

async function fetchJson(path, { signal, token = APP_TOKEN } = {}) {
  const res = await fetch(`${API_PREFIX}${path}`, {
    method: "GET",
    headers: {
      "x-app-token": token,
      Accept: "application/json",
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  return res.json();
}

export async function fetchMovies(path, { signal, token = APP_TOKEN } = {}) {
  const json = await fetchJson(path, { signal, token });
  return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
}

export async function fetchPaged(path, { signal, token = APP_TOKEN } = {}) {
  const json = await fetchJson(path, { signal, token });
  return {
    data: Array.isArray(json?.data) ? json.data : [],
    pagination: json?.pagination || null,
  };
}

// Fetch nhiều trang persons (mặc định 20 pages × 100 = 2000 persons)
export async function fetchPersonsPages(
  { pages = 20, limit = 100 },
  { signal, token = APP_TOKEN } = {}
) {
  const requests = Array.from({ length: pages }, (_, i) => {
    const page = i + 1;
    return fetchPaged(`/persons?page=${page}&limit=${limit}`, { signal, token });
  });

  const results = await Promise.all(requests);
  return results.flatMap((r) => r.data || []);
}

export async function fetchPersonById(id, { signal, token = APP_TOKEN } = {}) {
  return fetchJson(`/persons/${encodeURIComponent(id)}`, { signal, token });
}

export async function fetchMovieById(id, { signal, token = APP_TOKEN } = {}) {
  return fetchJson(`/movies/${encodeURIComponent(id)}`, { signal, token });
}

export function uniqById(items = []) {
  const map = new Map();
  for (const m of items || []) map.set(m.id, m);
  return Array.from(map.values());
}

// Generic: fetch nhiều trang của một endpoint trả movies
export async function fetchManyPages(
  endpoint,
  { pages = 50, limit = 100, signal, token = APP_TOKEN } = {}
) {
  const requests = Array.from({ length: pages }, (_, i) => {
    const page = i + 1;
    return fetchMovies(`${endpoint}?page=${page}&limit=${limit}`, {
      signal,
      token,
    });
  });

  const results = await Promise.all(requests);
  return results.flat();
}