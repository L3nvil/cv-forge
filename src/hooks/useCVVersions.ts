import { useState, useCallback, useEffect } from 'react';
import type { AppState } from '../types/cv';
import { uid } from '../lib/defaults';

export interface CVVersion {
  id: string;
  name: string;
  updatedAt: number;
  state: AppState;
}

export interface VersionsState {
  activeId: string;
  versions: CVVersion[];
}

const VERSIONS_KEY = 'cvforge.versions.v1';

export function useCVVersions(
  currentState: AppState,
  setCurrentState: (state: AppState) => void
) {
  const [versionsState, setVersionsState] = useState<VersionsState>(() => {
    try {
      const raw = localStorage.getItem(VERSIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as VersionsState;
        if (parsed.versions && parsed.versions.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    const initialVersion: CVVersion = {
      id: uid(),
      name: 'Versi Utama',
      updatedAt: Date.now(),
      state: currentState,
    };

    return {
      activeId: initialVersion.id,
      versions: [initialVersion],
    };
  });

  // Sync active version's state to localStorage whenever versionsState changes
  useEffect(() => {
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(versionsState));
    } catch {
      // ignore
    }
  }, [versionsState]);

  // Keep active version state in sync with external edits to currentState
  useEffect(() => {
    setVersionsState((prev) => {
      const idx = prev.versions.findIndex((v) => v.id === prev.activeId);
      if (idx === -1) return prev;
      const currentVer = prev.versions[idx];
      // Only update if state is actually different
      if (JSON.stringify(currentVer.state) === JSON.stringify(currentState)) {
        return prev;
      }
      const updated: CVVersion = {
        ...currentVer,
        updatedAt: Date.now(),
        state: currentState,
      };
      const newVersions = [...prev.versions];
      newVersions[idx] = updated;
      return { ...prev, versions: newVersions };
    });
  }, [currentState]);

  const activeVersion =
    versionsState.versions.find((v) => v.id === versionsState.activeId) ||
    versionsState.versions[0];

  const switchVersion = useCallback(
    (versionId: string) => {
      const target = versionsState.versions.find((v) => v.id === versionId);
      if (!target) return;
      setVersionsState((prev) => ({ ...prev, activeId: versionId }));
      setCurrentState(target.state);
    },
    [versionsState.versions, setCurrentState]
  );

  const createVersion = useCallback(
    (name: string, fromState?: AppState) => {
      const newVer: CVVersion = {
        id: uid(),
        name: name.trim() || `Versi ${versionsState.versions.length + 1}`,
        updatedAt: Date.now(),
        state: fromState ?? currentState,
      };
      setVersionsState((prev) => ({
        activeId: newVer.id,
        versions: [...prev.versions, newVer],
      }));
      setCurrentState(newVer.state);
    },
    [currentState, setCurrentState, versionsState.versions.length]
  );

  const duplicateVersion = useCallback(
    (versionId?: string) => {
      const sourceId = versionId || versionsState.activeId;
      const source = versionsState.versions.find((v) => v.id === sourceId);
      if (!source) return;

      const newVer: CVVersion = {
        id: uid(),
        name: `${source.name} (Salinan)`,
        updatedAt: Date.now(),
        state: JSON.parse(JSON.stringify(source.state)),
      };
      setVersionsState((prev) => ({
        activeId: newVer.id,
        versions: [...prev.versions, newVer],
      }));
      setCurrentState(newVer.state);
    },
    [versionsState, setCurrentState]
  );

  const renameVersion = useCallback((versionId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setVersionsState((prev) => ({
      ...prev,
      versions: prev.versions.map((v) =>
        v.id === versionId ? { ...v, name: trimmed, updatedAt: Date.now() } : v
      ),
    }));
  }, []);

  const deleteVersion = useCallback(
    (versionId: string) => {
      if (versionsState.versions.length <= 1) {
        alert('Minimal harus ada 1 versi CV tersisa.');
        return;
      }
      setVersionsState((prev) => {
        const remaining = prev.versions.filter((v) => v.id !== versionId);
        const nextActiveId =
          prev.activeId === versionId ? remaining[0].id : prev.activeId;
        const nextActive = remaining.find((v) => v.id === nextActiveId)!;
        setCurrentState(nextActive.state);
        return {
          activeId: nextActiveId,
          versions: remaining,
        };
      });
    },
    [versionsState.versions.length, setCurrentState]
  );

  return {
    versions: versionsState.versions,
    activeVersion,
    switchVersion,
    createVersion,
    duplicateVersion,
    renameVersion,
    deleteVersion,
  };
}
