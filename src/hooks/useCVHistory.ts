import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_HISTORY = 30;

export interface HistoryControls<T> {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  commitSnapshot: (stateToCommit?: T) => void;
}

export function useCVHistory<T>(
  currentState: T,
  setActualState: (updater: (prev: T) => T) => void
): HistoryControls<T> {
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  // Ref to hold the latest state and committed snapshot
  const presentRef = useRef<T>(currentState);
  presentRef.current = currentState;

  const lastCommittedRef = useRef<T>(currentState);
  const debounceTimer = useRef<number | undefined>(undefined);

  // Explicitly commit current state to past history
  const commitSnapshot = useCallback((stateToCommit?: T) => {
    const snapshot = stateToCommit ?? presentRef.current;
    if (JSON.stringify(snapshot) === JSON.stringify(lastCommittedRef.current)) {
      return;
    }
    setPast((prev) => [...prev.slice(-MAX_HISTORY + 1), lastCommittedRef.current]);
    setFuture([]);
    lastCommittedRef.current = snapshot;
  }, []);

  // Debounced auto-commit for continuous typing/editing
  useEffect(() => {
    window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      if (JSON.stringify(currentState) !== JSON.stringify(lastCommittedRef.current)) {
        setPast((prev) => [...prev.slice(-MAX_HISTORY + 1), lastCommittedRef.current]);
        setFuture([]);
        lastCommittedRef.current = currentState;
      }
    }, 700);

    return () => window.clearTimeout(debounceTimer.current);
  }, [currentState]);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);

      setFuture((prevFuture) => [presentRef.current, ...prevFuture]);
      lastCommittedRef.current = previous;
      setActualState(() => previous);
      return newPast;
    });
  }, [setActualState]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPast((prevPast) => [...prevPast, presentRef.current]);
      lastCommittedRef.current = next;
      setActualState(() => next);
      return newFuture;
    });
  }, [setActualState]);

  // Global keyboard shortcuts for undo (Ctrl+Z / Cmd+Z) and redo (Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      // Check for Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y for Redo
      if ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y') {
        // Only trigger if not typing inside a native text field or if modifier is pressed
        e.preventDefault();
        redo();
        return;
      }

      // Check for Ctrl+Z or Cmd+Z for Undo
      if (!e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    commitSnapshot,
  };
}
