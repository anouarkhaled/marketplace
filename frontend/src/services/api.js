import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// --- Intercepteur de REQUÊTE : ajoute le token (comme avant) ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Intercepteur de RÉPONSE : gère l'expiration du token ---
api.interceptors.response.use(
  (response) => response,            // réponse OK → rien à faire
  async (error) => {
    const originalRequest = error.config;

    // Si 401 et qu'on n'a pas déjà tenté de rafraîchir pour cette requête
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refresh");

      if (!refresh) {
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        // Demander un nouvel access token
        const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", { refresh });
        const newAccess = res.data.access;
        localStorage.setItem("access", newAccess);

        // Rejouer la requête d'origine avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Le refresh a échoué (expiré) → déconnexion
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/login";
}

export default api;