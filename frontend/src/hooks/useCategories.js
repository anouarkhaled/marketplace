import { useEffect, useState } from "react";
import api from "../services/api";
import { fetchAllPages } from "../services/collections";
import { extractErrorMessage } from "../services/errors";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchAllPages(api, "/categories/", controller.signal)
      .then((items) => { if (!controller.signal.aborted) setCategories(items); })
      .catch((failure) => { if (!controller.signal.aborted) setError(extractErrorMessage(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);
  return { categories, error, loading, retry: () => setVersion((value) => value + 1) };
}
