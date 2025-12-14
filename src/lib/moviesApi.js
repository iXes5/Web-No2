const API_PREFIX = "/api";

export function getImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_PREFIX}${image.startsWith("/") ? "" : "/"}${image}`;
}

export async function fetchMovies(path, { signal, token } = {}) {
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

  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}