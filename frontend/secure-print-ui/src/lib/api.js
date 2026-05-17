export const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export const APP_BASE =
  import.meta.env.VITE_APP_BASE?.replace(/\/$/, "") || window.location.origin;

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message = body?.detail || res.statusText || "Request failed";
    throw new Error(message);
  }
  return body;
}
