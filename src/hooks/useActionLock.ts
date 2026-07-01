import { useCallback, useRef, useState } from "react";

/** Prevents duplicate submits while an async action is in flight. */
export function useActionLock() {
  const lockRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    setBusy(true);
    try {
      return await action();
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }, []);

  return { busy, run, isLocked: () => lockRef.current };
}

/** Per-key locks for lists (e.g. one order row at a time). */
export function useKeyedActionLock() {
  const keysRef = useRef<Set<string>>(new Set());
  const [, bump] = useState(0);

  const isBusy = useCallback((key: string) => keysRef.current.has(key), []);

  const run = useCallback(
    async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
      if (keysRef.current.has(key)) return undefined;
      keysRef.current.add(key);
      bump((n) => n + 1);
      try {
        return await action();
      } finally {
        keysRef.current.delete(key);
        bump((n) => n + 1);
      }
    },
    []
  );

  return { run, isBusy };
}
