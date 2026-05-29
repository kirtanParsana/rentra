import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDashboardAnalytics } from "../api/analytics";
import { getApiErrorMessage } from "../api/client";

export function useDashboardAnalytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const next = await fetchDashboardAnalytics();
      setData(next);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      refetch: load,
      clearError: () => setError(""),
    }),
    [data, error, isLoading, load]
  );
}

