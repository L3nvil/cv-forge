import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface StorageOptions {
  validate?: (val: unknown) => boolean;
}

/**
 * State persisted to localStorage, debounced on write to avoid thrashing
 * while the user types, with save status, error tracking, and safe recovery backup.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  options?: StorageOptions,
) {
  const [corruptedRaw, setCorruptedRaw] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (options?.validate && !options.validate(parsed)) {
        try {
          localStorage.setItem(`cvforge:corrupt:${Date.now()}`, raw);
        } catch {}
        return raw;
      }
      return null;
    } catch {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          localStorage.setItem(`cvforge:corrupt:${Date.now()}`, raw);
        } catch {}
        return raw;
      }
      return null;
    }
  });

  const [value, setValueState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      if (options?.validate && !options.validate(parsed)) {
        return initial;
      }
      return parsed as T;
    } catch {
      return initial;
    }
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const isInitialMount = useRef(true);

  const setValue = useCallback((updater: T | ((prev: T) => T)) => {
    setSaveStatus('saving');
    setValueState(updater);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setSaveStatus('saved');
        setErrorMessage(null);
      } catch (err) {
        setSaveStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Penyimpanan lokal penuh atau tidak diizinkan.'
        );
      }
    }, 400);

    return () => window.clearTimeout(timer.current);
  }, [key, value]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setValueState(initial);
    setSaveStatus('saved');
    setErrorMessage(null);
    setCorruptedRaw(null);
  }, [key, initial]);

  const clearCorrupted = useCallback(() => {
    setCorruptedRaw(null);
  }, []);

  return [value, setValue, { reset, saveStatus, errorMessage, corruptedRaw, clearCorrupted }] as const;
}
