"use client";

import { useCallback, useEffect, useState } from "react";
import { demoStore } from "@/lib/demo/store";

/**
 * Reactive admin data hook.
 * In demo mode it subscribes to the in-memory store so CRUD updates
 * reflect instantly across all admin views.
 */

export function useAdminData() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = demoStore.subscribe(() => setVersion((v) => v + 1));
    return unsubscribe;
  }, []);

  return { version, refresh: useCallback(() => setVersion((v) => v + 1), []) };
}

export function useAdminCollection<T>(fetcher: () => Promise<T[]>): {
  data: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const { version } = useAdminData();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "errors.generic");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version, tick, fetcher]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, reload };
}
