import { useEffect, useState } from "react";
import { CarnetContext } from "./contexts";
import { CARNET_KEY, readCarnet, toggleCarnet } from "../services/carnet";
import { useToast } from "../hooks/useToast";

export function CarnetProvider({ children }) {
  const [ids, setIds] = useState(() => readCarnet({ getItem: (key) => window.localStorage.getItem(key) }));
  const toast = useToast();
  useEffect(() => {
    try { window.localStorage.setItem(CARNET_KEY, JSON.stringify(ids)); } catch { /* Selection remains usable when storage is unavailable. */ }
  }, [ids]);
  const toggle = (id) => {
    if (!ids.includes(id) && ids.length === 3) { toast.info("Votre carnet est plein. Retirez une annonce pour en ajouter une autre."); return; }
    setIds((current) => toggleCarnet(current, id));
  };
  return <CarnetContext.Provider value={{ ids, toggle, clear: () => setIds([]) }}>{children}</CarnetContext.Provider>;
}
