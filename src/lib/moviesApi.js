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

// general helper cho dạng { data, pagination }
export async function fetchPaged(path, { signal, token = APP_TOKEN } = {}) {
  const json = await fetchJson(path, { signal, token });
  return {
    data: Array.isArray(json?.data) ? json.data : [],
    pagination: json?.pagination || null,
  };
}

export async function fetchPersonsByName(
  { name, page = 1, limit = 10 },
  { signal, token = APP_TOKEN } = {}
) {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  // giả định backend hỗ trợ filter theo name
  if (name) qs.set("name", name);

  return fetchPaged(`/persons?${qs.toString()}`, { signal, token });
}

export async function fetchPersonById(id, { signal, token = APP_TOKEN } = {}) {
  return fetchJson(`/persons/${encodeURIComponent(id)}`, { signal, token });
}

export function uniqById(items = []) {
  const map = new Map();
  for (const m of items || []) map.set(m.id, m);
  return Array.from(map.values());
}

export async function fetchManyPages(
  endpoint,
  { pages = 3, limit = 10, signal, token = APP_TOKEN } = {}
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