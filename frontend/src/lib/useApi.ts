import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';

/**
 * Loads data from the API and re-runs when `deps` change.
 * Returns { data, loading, error, reload }.
 */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload };
}

/**
 * Wraps a mutating API call with busy state and success / error messages.
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /** Resolves to { ok: true, value } on success, or { ok: false } after showing the error. */
  const run = useCallback(async <R,>(
    action: () => Promise<R>,
    success?: string | ((r: R) => string),
  ): Promise<{ ok: true; value: R } | { ok: false }> => {
    setBusy(true);
    setMessage(null);
    try {
      const value = await action();
      if (success) setMessage({ type: 'success', text: typeof success === 'function' ? success(value) : success });
      return { ok: true, value };
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, message, setMessage, run };
}
