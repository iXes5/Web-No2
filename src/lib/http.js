import { APP_TOKEN } from "@/lib/moviesApi";

export const API_BASE = "https://34.124.214.214:2423/api";

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // LUÔN gắn x-app-token (theo yêu cầu backend)
  if (!headers.has("x-app-token")) {
    headers.set("x-app-token", APP_TOKEN);
  }

  // Gắn Bearer nếu có token (một số endpoint có thể cần)
  const bearer = localStorage.getItem("app_token");
  if (bearer && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${bearer}`);
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    try {
      const body = await res.text();
      console.warn(`[apiFetch] ${res.status} ${url} ->`, body);
    } catch {
      console.warn(`[apiFetch] ${res.status} ${url} (no body)`);
    }
  }

  return res;
}