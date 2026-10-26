import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastContext } from "./contexts";

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback((message, type = "info", duration = 4000) => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => Object.values(activeTimers).forEach(clearTimeout);
  }, []);

  const toast = useMemo(() => ({
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
    info: (message) => push(message, "info"),
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
            <span>{t.type === "success" ? "✅" : t.type === "error" ? "⚠️" : "ℹ️"}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
