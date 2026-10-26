import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { extractErrorMessage } from "../services/errors";

export default function useApiPage(path, params = {}) {
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ items: [], loading: true, error: null, totalPages: 1 });
  const serializedParams = JSON.stringify(params);
  const retry = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));
    api.get(path, { params: { ...JSON.parse(serializedParams), page }, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const items = data.results || data;
        const totalPages = Math.max(1, Math.ceil((data.count ?? items.length) / 9));
        setState({ items, totalPages, loading: false, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error.response?.status === 404 && page > 1) { setPage(page - 1); return; }
        setState((current) => ({ ...current, loading: false, error: extractErrorMessage(error) }));
      });
    return () => controller.abort();
  }, [path, serializedParams, page, version]);

  return { ...state, page, setPage, retry };
}
