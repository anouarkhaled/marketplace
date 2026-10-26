import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { extractErrorMessage } from "../services/errors";

export default function useApiResource(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError(null);
    api.get(path, { signal: controller.signal }).then((response) => {
      if (!controller.signal.aborted) setData(response.data);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError({ status: failure.response?.status, message: extractErrorMessage(failure) });
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, version]);
  return { data, setData, error, loading, retry };
}
