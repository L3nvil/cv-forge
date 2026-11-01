import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppState } from '../types/cv';
import { uid } from '../lib/defaults';

export interface CVSnapshot {
  id: string;
  timestamp: number;
  title: string;
  state: AppState;
}

const STORAGE_KEY = 'cvforge.snapshots.v1';
const MAX_SNAPSHOTS = 10;

export function useCVSnapshots(currentState: AppState) {
  const [snapshots, setSnapshots] = useState<CVSnapshot[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const lastSnapshotRef = useRef<string>(JSON.stringify(currentState));

  // Persist snapshots to localStorage
  const saveSnapshots = useCallback((list: CVSnapshot[]) => {
    setSnapshots(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, []);

  const addSnapshot = useCallback(
    (stateToSave: AppState, customTitle?: string) => {
      const serialized = JSON.stringify(stateToSave);
      if (serialized === lastSnapshotRef.current && snapshots.length > 0) return;
      lastSnapshotRef.current = serialized;

      const date = new Date();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const name = stateToSave.cv.personal.fullName || 'Tanpa Nama';
      const defaultTitle = `${name} (${timeStr})`;

      const newSnapshot: CVSnapshot = {
        id: uid(),
        timestamp: Date.now(),
        title: customTitle || defaultTitle,
        state: JSON.parse(serialized),
      };

      const updated = [newSnapshot, ...snapshots.filter((s) => s.id !== newSnapshot.id)].slice(
        0,
        MAX_SNAPSHOTS
      );
      saveSnapshots(updated);
    },
    [snapshots, saveSnapshots]
  );

  // Auto-record snapshot periodically (every 45s if changed)
  useEffect(() => {
    const timer = setTimeout(() => {
      addSnapshot(currentState, `Auto-save ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 45000);
    return () => clearTimeout(timer);
  }, [currentState, addSnapshot]);

  const deleteSnapshot = useCallback(
    (id: string) => {
      const next = snapshots.filter((s) => s.id !== id);
      saveSnapshots(next);
    },
    [snapshots, saveSnapshots]
  );

  const clearSnapshots = useCallback(() => {
    saveSnapshots([]);
  }, [saveSnapshots]);

  return {
    snapshots,
    addSnapshot,
    deleteSnapshot,
    clearSnapshots,
  };
}
