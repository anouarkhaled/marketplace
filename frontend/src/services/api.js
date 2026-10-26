import axios from "axios";

export function redirectToLogin(location = window.location) {
  const next = `${location.pathname}${location.search}`;
  if (location.pathname !== "/login") location.replace(`/login?expired=1&next=${encodeURIComponent(next)}`);
}

export function createApiClient({ baseURL, storage, onSessionExpired }) {
  const client = axios.create({ baseURL, timeout: 20000 });
  const refreshClient = axios.create({ baseURL, timeout: 20000 });
  let refreshPromise = null;
  let sessionExpired = false;
  const publicAuthEndpoint = (url = "") => /\/(token|register|password-reset)(\/|$)/.test(url);

  function expireSession() {
    storage.removeItem("access");
    storage.removeItem("refresh");
    if (!sessionExpired) { sessionExpired = true; onSessionExpired(); }
  }

  client.interceptors.request.use((config) => {
    const token = storage.getItem("access");
    if (token && !publicAuthEndpoint(config.url)) config.headers.Authorization = `Bearer ${token}`;
    else delete config.headers.Authorization;
    return config;
  });

  client.interceptors.response.use((response) => response, async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || publicAuthEndpoint(original.url)) throw error;
    if (original._retry) {
      if (original.headers.Authorization === `Bearer ${storage.getItem("access")}`) expireSession();
      throw error;
    }
    const refresh = storage.getItem("refresh");
    if (!refresh) { expireSession(); throw error; }
    original._retry = true;
    try {
      const currentAccess = storage.getItem("access");
      if (currentAccess && original.headers.Authorization !== `Bearer ${currentAccess}`) return client(original);
      if (!refreshPromise) {
        refreshPromise = refreshClient.post("/token/refresh/", { refresh }).then(({ data }) => {
          // A completed refresh must not restore a session after logout.
          if (storage.getItem("refresh") !== refresh) throw new axios.CanceledError("Session modifiée");
          storage.setItem("access", data.access);
          if (data.refresh) storage.setItem("refresh", data.refresh);
          sessionExpired = false;
          return data.access;
        }).finally(() => { refreshPromise = null; });
      }
      await refreshPromise;
      return client(original);
    } catch (refreshError) {
      if ([400, 401].includes(refreshError.response?.status) && storage.getItem("refresh") === refresh) expireSession();
      throw refreshError;
    }
  });
  return { client, refreshClient };
}

const rawUrl = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000/api";
const { client: api } = createApiClient({
  baseURL: rawUrl.replace(/\/$/, ""),
  storage: typeof localStorage !== "undefined" ? localStorage : null,
  onSessionExpired: redirectToLogin,
});

export default api;
