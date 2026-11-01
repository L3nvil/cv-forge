import { useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const KEY = 'cvforge.theme.mode';
const LEGACY_KEY = 'cvforge.theme';

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(KEY) as ThemeMode | null;
  if (stored === 'system' || stored === 'light' || stored === 'dark') return stored;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === 'light' || legacy === 'dark') return legacy;
  return 'system';
}

function getSystemDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialMode);
  const [systemDark, setSystemDark] = useState<boolean>(getSystemDark);

  // Listen to OS color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = themeMode === 'system' ? systemDark : themeMode === 'dark';

  // Apply dark class to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(KEY, themeMode);
      localStorage.setItem(LEGACY_KEY, isDark ? 'dark' : 'light');
    } catch {}
  }, [isDark, themeMode]);

  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  const toggle = () => {
    setThemeMode((prev) => {
      if (prev === 'dark') return 'light';
      return 'dark';
    });
  };

  return {
    themeMode,
    setThemeMode,
    cycleTheme,
    toggle,
    theme: isDark ? 'dark' : 'light',
    isDark,
  };
}
