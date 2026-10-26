import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { AuthContext } from "./contexts";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionVersion = useRef(0);

  const loadProfile = async () => {
    const version = sessionVersion.current;
    try {
      const res = await api.get("/profile/");
      if (version === sessionVersion.current) setUser(res.data);
      return res.data;
    } catch (error) {
      if (version === sessionVersion.current) setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== "access") return;
      sessionVersion.current += 1;
      if (!event.newValue) setUser(null);
      else loadProfile().catch(() => {});
    };
    window.addEventListener("storage", onStorage);
    const token = localStorage.getItem("access");
    if (token) {
      loadProfile().catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/token/", { username, password });
    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    try {
      await loadProfile();
    } catch (error) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      throw error;
    }
  };

  const logout = () => {
    sessionVersion.current += 1;
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile: loadProfile, updateProfile: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
