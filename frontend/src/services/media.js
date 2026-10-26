const rawApiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const API_URL = rawApiUrl.replace(/\/$/, "");

// Origine du backend (sans le préfixe /api), pour préfixer les chemins relatifs.
export const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function mediaUrl(path) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${BACKEND_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
