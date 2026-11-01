import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Moon, Sun, Download, FileJson, Upload, Printer,
  RotateCcw, ZoomIn, ZoomOut, Sliders,
  Undo2, Redo2, Check, AlertCircle, Layers, ChevronDown, HelpCircle,
  Maximize2, Minimize2, Copy, Image, History, Sparkles, FilePlus, MoreHorizontal,
  Search,
} from 'lucide-react';
import type { AppState, Customization, CVData } from './types/cv';
import { defaultState, emptyCV, defaultCustomization } from './lib/defaults';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCVHistory } from './hooks/useCVHistory';
import { useCVVersions } from './hooks/useCVVersions';
import { useTheme } from './hooks/useTheme';
import { useCVSnapshots } from './hooks/useCVSnapshots';
import { FormBuilder } from './components/FormBuilder';
import { CVPreview, PAGE_DIMENSIONS } from './components/CVPreview';
import { Customizer } from './components/Customizer';
import {
  exportPdf, printCV, downloadJson, validateAndParseImport, generatePdfFileName,
  exportPng, copyPlainText, downloadMarkdown,
} from './lib/export';
import { Toast, type ToastData } from './components/Toast';
import { VersionManagerModal } from './components/VersionManagerModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { SnapshotHistoryModal } from './components/SnapshotHistoryModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { RecoveryModal } from './components/RecoveryModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const STORAGE_KEY = 'cvforge.state.v1';

function isValidAppState(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (!('cv' in obj) || !obj.cv || typeof obj.cv !== 'object') return false;
  const cv = obj.cv as Record<string, unknown>;
  if (!('personal' in cv) || !cv.personal || typeof cv.personal !== 'object') return false;
  return true;
}

export default function App() {
  const [state, setState, { saveStatus, errorMessage, corruptedRaw, clearCorrupted }] =
    useLocalStorage<AppState>(STORAGE_KEY, defaultState, { validate: isValidAppState });
  const { undo, redo, canUndo, canRedo, commitSnapshot } = useCVHistory(state, setState);
  const {
    versions,
    activeVersion,
    switchVersion,
    createVersion,
    duplicateVersion,
    renameVersion,
    deleteVersion,
  } = useCVVersions(state, setState);

  const { theme, themeMode, cycleTheme } = useTheme();
  const [focusMode, setFocusMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [zoom, setZoom] = useState(0.72);
  const [pageCount, setPageCount] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(() => {
    try {
      const dismissed = localStorage.getItem('cvforge.backup_reminder_dismissed');
      if (dismissed && Date.now() < Number(dismissed)) return false;
      const lastBackup = localStorage.getItem('cvforge.last_backup_time');
      if (!lastBackup) {
        const firstSeen = localStorage.getItem('cvforge.first_installed');
        if (!firstSeen) {
          localStorage.setItem('cvforge.first_installed', String(Date.now()));
          return false;
        }
        return Date.now() - Number(firstSeen) > 7 * 24 * 60 * 60 * 1000;
      }
      return Date.now() - Number(lastBackup) > 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  const dismissBackupReminder = () => {
    setShowBackupReminder(false);
    try {
      localStorage.setItem('cvforge.backup_reminder_dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch {}
  };
  const { snapshots, addSnapshot, deleteSnapshot } = useCVSnapshots(state);
  const importRef = useRef<HTMLInputElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu]);

  // Focus Mode toggle via F10 or Escape
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        setFocusMode((v) => !v);
      } else if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [focusMode]);

  const setCV = useCallback(
    (updater: (cv: CVData) => CVData) => setState((s) => ({ ...s, cv: updater(s.cv) })),
    [setState],
  );
  const setCustom = useCallback(
    (patch: Partial<Customization>) => setState((s) => ({ ...s, customization: { ...s.customization, ...patch } })),
    [setState],
  );

  const paper = PAGE_DIMENSIONS[state.customization.paperSize || 'a4'] || PAGE_DIMENSIONS.a4;

  const fitWidth = useCallback(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const avail = el.clientWidth - 48;
    setZoom(Math.min(1.2, Math.max(0.35, avail / paper.w)));
  }, [paper.w]);

  const fitPage = useCallback(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const availH = el.clientHeight - 80;
    setZoom(Math.min(1.2, Math.max(0.35, availH / paper.h)));
  }, [paper.h]);

  // Fit-to-width zoom on initial resize of the canvas column.
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - 48;
      setZoom(Math.min(1, Math.max(0.4, avail / paper.w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [paper.w]);

  const handleActiveSectionChange = useCallback((sectionKey: string) => {
    const el = canvasWrapRef.current?.querySelector(`#cv-section-${sectionKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const handleImport = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = validateAndParseImport(String(reader.result));
      if (!result.ok || !result.data) {
        alert(result.error || 'File JSON tidak valid.');
        return;
      }
      commitSnapshot();
      setState((s) => ({
        cv: result.data!.cv ?? s.cv,
        customization: result.data!.customization ?? s.customization,
      }));
      setToast({
        id: String(Date.now()),
        message: 'CV berhasil diimpor',
        onUndo: undo,
      });
    };
    reader.readAsText(file);
  };

  const fileName = generatePdfFileName(state.cv.personal).replace(/\.pdf$/i, '');

  const handlePrintAtsPdf = useCallback(() => {
    setToast({
      id: String(Date.now()),
      message: "Pilih tujuan 'Save as PDF' di dialog cetak untuk hasil PDF teks vektor ramah ATS.",
    });
    setTimeout(() => {
      printCV(fileName);
    }, 150);
  }, [fileName]);

  const handleExportPdf = handlePrintAtsPdf;

  const handleExportFastPdf = useCallback(async () => {
    setExporting(true);
    try {
      await exportPdf(fileName, state.customization.paperSize);
      setToast({
        id: String(Date.now()),
        message: 'PDF cepat (visual identik) berhasil diunduh',
      });
    } catch {
      alert('Gagal mengekspor PDF.');
    } finally {
      setExporting(false);
    }
  }, [fileName, state.customization.paperSize]);

  const handleExportJson = useCallback(() => {
    downloadJson(state, fileName);
    try {
      localStorage.setItem('cvforge.last_backup_time', String(Date.now()));
    } catch {}
    setShowBackupReminder(false);
    setToast({ id: String(Date.now()), message: 'Cadangan data JSON berhasil diunduh' });
  }, [state, fileName]);

  const handleCopyText = async () => {
    const ok = await copyPlainText(state.cv);
    if (ok) {
      setToast({ id: String(Date.now()), message: 'CV disalin sebagai teks polos (ATS)' });
    } else {
      alert('Gagal menyalin teks ke papan klip.');
    }
  };

  const handleExportMarkdown = () => {
    downloadMarkdown(state.cv, fileName);
    setToast({ id: String(Date.now()), message: 'CV diekspor sebagai Markdown (.md)' });
  };

  const handleExportPng = async () => {
    setExporting(true);
    try {
      await exportPng(fileName, state.customization.paperSize);
      setToast({ id: String(Date.now()), message: 'Gambar PNG berhasil diunduh' });
    } catch {
      alert('Gagal mengekspor gambar PNG.');
    } finally {
      setExporting(false);
    }
  };

  const handleLoadSample = () => {
    commitSnapshot();
    setState(defaultState);
    setToast({ id: String(Date.now()), message: 'Contoh data berhasil dimuat', onUndo: undo });
  };

  const handleClearBlank = () => {
    commitSnapshot();
    setState((s) => ({ ...s, cv: emptyCV }));
    setToast({ id: String(Date.now()), message: 'Formulir dikosongkan (Mulai kosong)', onUndo: undo });
  };

  const handleRestoreFromRecoverySnapshot = () => {
    if (snapshots.length > 0) {
      commitSnapshot();
      setState(snapshots[0].state);
      setToast({
        id: String(Date.now()),
        message: 'Data berhasil dipulihkan dari snapshot terakhir',
        onUndo: undo,
      });
    } else {
      commitSnapshot();
      setState(defaultState);
      setToast({
        id: String(Date.now()),
        message: 'Data dipulihkan ke data contoh standar',
      });
    }
    clearCorrupted();
  };

  const handleStartBlankFromRecovery = () => {
    commitSnapshot();
    setState({ cv: emptyCV, customization: defaultCustomization });
    clearCorrupted();
    setToast({
      id: String(Date.now()),
      message: 'Formulir dimulai dari kosong',
      onUndo: undo,
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsModal((v) => !v);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleExportPdf();
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowShortcutsModal(false);
        setShowVersionsModal(false);
        setShowCustomizer(false);
        setShowSnapshotModal(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleExportPdf]);

  const activeDocName = state.cv.personal.fullName?.trim() || 'CV Tanpa Nama';

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Accessibility Skip Link */}
      <a
        href="#main-form-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-none"
      >
        Lewati ke Formulir Utama
      </a>

      {/* ---------------- 1. Top Frosted Bar (Apple sub-nav-frosted style) ---------------- */}
      <header
        className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6 backdrop-blur-md app-surface rounded-none"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
        }}
      >
        {/* Kiri: Brand / Logo, Nama Dokumen Aktif & Indikator Tersimpan */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-[var(--primary)] text-white shadow-none transition duration-fast ease-standard active:scale-[0.95]"
            title="CV Forge — Real-time CV Builder"
            aria-label="CV Forge Logo"
          >
            <FileText size={17} />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold tracking-[-0.224px] text-[var(--text)] shrink-0 leading-none">
              CV Forge
            </h1>

            {/* Subtle Divider */}
            <span className="hidden sm:inline text-xs text-[var(--border)] select-none">/</span>

            {/* Active Document Name */}
            <span
              className="hidden sm:inline max-w-[110px] md:max-w-[160px] truncate text-xs font-normal text-[var(--text-muted)] leading-none"
              title={`Dokumen aktif: ${activeDocName}`}
            >
              {activeDocName}
            </span>

            {/* Auto-save Status Pill */}
            <div className="flex items-center shrink-0" aria-live="polite">
              {saveStatus === 'saving' && (
                <span
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-normal"
                  title="Menyimpan perubahan ke penyimpanan lokal…"
                >
                  <span className="h-1.5 w-1.5 rounded-pill bg-[var(--status-warning)] animate-pulse" />
                  <span className="hidden md:inline">Menyimpan…</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span
                  className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-normal"
                  title="Semua perubahan tersimpan otomatis di browser"
                >
                  <Check size={14} className="text-[var(--status-success)]" />
                  <span className="hidden md:inline">Tersimpan</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span
                  className="flex items-center gap-1 text-xs text-[var(--status-danger)] font-normal"
                  title={errorMessage || 'Gagal menyimpan ke penyimpanan lokal'}
                >
                  <AlertCircle size={14} />
                  <span className="hidden md:inline">Gagal simpan</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tengah / Kiri-Tengah: Kontrol Dokumen (Undo/Redo & Versi CV di Desktop) ATAU Tab Switcher di Mobile (<640px) */}
        <div className="flex items-center justify-center">
          {/* Mobile View Switcher (< 640px) */}
          {!focusMode && (
            <div className="flex sm:hidden items-center rounded-pill bg-[var(--surface-pearl)] p-0.5 border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMobileTab('form')}
                aria-label="Tampilkan formulir editor"
                className={`flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold transition duration-fast ease-standard ${
                  mobileTab === 'form'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>📝 Form</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                aria-label={`Tampilkan pratinjau dokumen (${pageCount} halaman)`}
                className={`flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold transition duration-fast ease-standard ${
                  mobileTab === 'preview'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>👁️ Pratinjau</span>
              </button>
            </div>
          )}

          {/* Desktop/Tablet Document Controls (>= 640px) */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Undo / Redo group */}
            <div className="flex items-center rounded-control border border-[var(--border)] bg-[var(--surface)] p-0.5">
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] disabled:opacity-30 disabled:pointer-events-none active:scale-[0.95]"
                onClick={undo}
                disabled={!canUndo}
                title="Urungkan perubahan (Ctrl+Z)"
                aria-label="Urungkan (Ctrl+Z)"
              >
                <Undo2 size={15} />
              </button>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] disabled:opacity-30 disabled:pointer-events-none active:scale-[0.95]"
                onClick={redo}
                disabled={!canRedo}
                title="Ulangi perubahan (Ctrl+Shift+Z)"
                aria-label="Ulangi (Ctrl+Shift+Z)"
              >
                <Redo2 size={15} />
              </button>
            </div>

            {/* CV Version Selector */}
            <button
              type="button"
              onClick={() => setShowVersionsModal(true)}
              title="Kelola & beralih versi CV"
              aria-label="Kelola & beralih versi CV"
              className="flex h-9 items-center gap-1.5 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition duration-fast ease-standard hover:border-[var(--primary)] hover:text-[var(--primary)] active:scale-[0.95]"
            >
              <Layers size={14} className="text-[var(--primary)] shrink-0" />
              <span className="max-w-[96px] truncate">{activeVersion.name}</span>
              <ChevronDown size={12} className="text-[var(--text-muted)] shrink-0" />
            </button>
          </div>
        </div>

        {/* Kanan: Terkelompok dengan Jarak 8px dalam Grup dan 16-24px Antar Grup */}
        <div className="flex items-center gap-3 sm:gap-4 desktop:gap-5 shrink-0">
          {/* Grup 1: [Zoom Controls] (Desktop >= 1068px) */}
          <div className="hidden desktop:flex items-center rounded-control border border-[var(--border)] bg-[var(--surface)] p-0.5">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] active:scale-[0.95]"
              onClick={() => setZoom((z) => Math.max(0.35, z - 0.08))}
              title="Perkecil pratinjau"
              aria-label="Perkecil pratinjau"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.0)}
              title="Reset zoom ke 100%"
              aria-label="Reset zoom ke 100%"
              className="h-8 px-2 text-center text-xs font-normal text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-pearl)] rounded-control cursor-pointer transition duration-fast ease-standard"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] active:scale-[0.95]"
              onClick={() => setZoom((z) => Math.min(1.25, z + 0.08))}
              title="Perbesar pratinjau"
              aria-label="Perbesar pratinjau"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] active:scale-[0.95]"
              onClick={fitWidth}
              title="Pas lebar layar (Fit Width)"
              aria-label="Pas lebar layar (Fit Width)"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Grup 2: [Tema & Bantuan Pintasan] (Desktop >= 1068px) */}
          <div className="hidden desktop:flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-control border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] active:scale-[0.95]"
              onClick={cycleTheme}
              title={`Tema: ${themeMode === 'system' ? 'Sistem OS' : themeMode === 'dark' ? 'Gelap' : 'Terang'} (Klik untuk beralih)`}
              aria-label="Ganti tema warna"
            >
              {themeMode === 'system' ? (
                <span className="text-xs">💻</span>
              ) : theme === 'dark' ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
              <span className="capitalize font-normal">
                {themeMode === 'system' ? 'Sistem' : themeMode === 'dark' ? 'Gelap' : 'Terang'}
              </span>
            </button>

            {/* Command Palette Trigger */}
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-control border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] active:scale-[0.95]"
              onClick={() => setShowCommandPalette(true)}
              title="Menu Cepat / Command Palette (Ctrl+K)"
              aria-label="Command Palette (Ctrl+K)"
            >
              <Search size={16} />
            </button>

            {/* Shortcuts Help Button */}
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-control border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] active:scale-[0.95]"
              onClick={() => setShowShortcutsModal(true)}
              title="Pintasan keyboard (Ctrl+/)"
              aria-label="Pintasan keyboard"
            >
              <HelpCircle size={15} />
            </button>
          </div>

          {/* Grup 3: [Import, Export JSON, Print] (Desktop >= 1068px) */}
          <div className="hidden desktop:flex items-center gap-2">
            {/* Design Modal Trigger */}
            <button
              type="button"
              className={`flex h-9 items-center gap-1.5 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold transition duration-fast ease-standard active:scale-[0.95] ${
                showCustomizer
                  ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10'
                  : 'text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:border-[var(--text-muted)]'
              }`}
              onClick={() => setShowCustomizer((v) => !v)}
              title="Kustomisasi Template & Desain"
              aria-label="Kustomisasi Template & Desain"
              aria-expanded={showCustomizer}
            >
              <Sliders size={15} />
              <span>Desain</span>
            </button>

            {/* Hidden Input for JSON Import */}
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                handleImport(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            {/* Import JSON */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:border-[var(--text-muted)] active:scale-[0.95]"
              onClick={() => importRef.current?.click()}
              title="Impor dari file JSON"
              aria-label="Impor JSON"
            >
              <Upload size={15} />
              <span>Impor</span>
            </button>

            {/* Export JSON */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:border-[var(--text-muted)] active:scale-[0.95]"
              onClick={handleExportJson}
              title="Ekspor ke file JSON"
              aria-label="Ekspor JSON"
            >
              <FileJson size={15} />
              <span>JSON</span>
            </button>

            {/* Native Print */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:border-[var(--text-muted)] active:scale-[0.95]"
              onClick={handlePrintAtsPdf}
              title="Cetak Dokumen (Ctrl+P)"
              aria-label="Cetak Dokumen"
            >
              <Printer size={15} />
              <span>Cetak</span>
            </button>
          </div>

          {/* Grup 4: Menu Overflow "Lainnya" & SATU Tombol Utama "Unduh PDF" */}
          <div className="flex items-center gap-2">
            {/* Overflow "Lainnya" Dropdown */}
            <div ref={moreMenuRef} className="relative">
              <button
                type="button"
                className={`grid h-9 w-9 place-items-center rounded-control border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] active:scale-[0.95] ${
                  showMoreMenu ? 'border-[var(--primary)] text-[var(--primary)]' : ''
                }`}
                onClick={() => setShowMoreMenu((v) => !v)}
                title="Opsi & ekspor lainnya"
                aria-label="Opsi lainnya"
                aria-expanded={showMoreMenu}
              >
                <MoreHorizontal size={16} />
              </button>

              {showMoreMenu && (
                <div
                  role="menu"
                  aria-label="Menu Opsi Lainnya"
                  className="absolute right-0 z-30 mt-2 w-60 rounded-card border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-none animate-dropdown-enter"
                >
                  {/* Collapsed Secondary Actions for Tablet & Mobile (< 1068px) */}
                  <div className="desktop:hidden">
                    <div className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)] border-b border-[var(--border)] mb-1">
                      Menu Utama
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowCustomizer(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                    >
                      <Sliders size={16} />
                      <span>Kustomisasi Desain</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowMoreMenu(false);
                        importRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                    >
                      <Upload size={16} />
                      <span>Impor JSON</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleExportJson();
                      }}
                      className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                    >
                      <FileJson size={16} />
                      <span>Ekspor JSON</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowMoreMenu(false);
                        printCV();
                      }}
                      className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                    >
                      <Printer size={16} />
                      <span>Cetak Dokumen (Ctrl+P)</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowCommandPalette(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                    >
                      <Search size={16} />
                      <span>Command Palette (Ctrl+K)</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowShortcutsModal(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                    >
                      <HelpCircle size={16} />
                      <span>Pintasan Keyboard (Ctrl+/)</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        cycleTheme();
                      }}
                      className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)]"
                    >
                      <span className="flex items-center gap-2">
                        {themeMode === 'system' ? <span>💻</span> : theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        <span>Ganti Tema</span>
                      </span>
                      <span className="text-xs text-[var(--text-muted)] capitalize">
                        {themeMode === 'system' ? 'Sistem' : themeMode === 'dark' ? 'Gelap' : 'Terang'}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setFocusMode((v) => !v);
                      }}
                      className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                    >
                      {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      <span>{focusMode ? 'Keluar Mode Fokus' : 'Mode Fokus (F10)'}</span>
                    </button>

                    {/* Mobile-only Document actions (< 640px) */}
                    <div className="sm:hidden">
                      <div className="my-1 border-t border-[var(--border)]" />
                      <div className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">
                        Dokumen & Versi
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={!canUndo}
                        onClick={() => {
                          undo();
                        }}
                        className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] disabled:opacity-30"
                      >
                        <Undo2 size={16} />
                        <span>Urungkan (Undo)</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={!canRedo}
                        onClick={() => {
                          redo();
                        }}
                        className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] disabled:opacity-30"
                      >
                        <Redo2 size={16} />
                        <span>Ulangi (Redo)</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowVersionsModal(true);
                        }}
                        className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                      >
                        <span className="flex items-center gap-2">
                          <Layers size={16} className="text-[var(--primary)]" />
                          <span>Versi CV</span>
                        </span>
                        <span className="max-w-[80px] truncate text-xs text-[var(--text-muted)]">
                          {activeVersion.name}
                        </span>
                      </button>
                    </div>

                    <div className="my-1 border-t border-[var(--border)]" />
                  </div>

                  {/* Format Ekspor Lainnya */}
                  <div className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)] border-b border-[var(--border)] mb-1">
                    Format Ekspor Lainnya
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handlePrintAtsPdf();
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                  >
                    <Printer size={16} />
                    <span>PDF Ramah ATS (Teks Asli)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleExportFastPdf();
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                  >
                    <Download size={16} />
                    <span>PDF Cepat (Visual Identik)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleExportPng();
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                  >
                    <Image size={16} />
                    <span>Unduh Gambar PNG</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleExportMarkdown();
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                  >
                    <FileText size={16} />
                    <span>Unduh Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleCopyText();
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                  >
                    <Copy size={16} />
                    <span>Salin Teks Polos (ATS)</span>
                  </button>

                  {/* Data & Riwayat */}
                  <div className="my-1 border-t border-[var(--border)]" />
                  <div className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">
                    Data & Riwayat
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowSnapshotModal(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                  >
                    <History size={16} />
                    <span>Riwayat Snapshot ({snapshots.length})</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleLoadSample();
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
                  >
                    <Sparkles size={16} />
                    <span>Muat Contoh Data</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleClearBlank();
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-xs text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
                  >
                    <FilePlus size={16} />
                    <span>Mulai Kosong</span>
                  </button>
                </div>
              )}
            </div>

            {/* SATU Tombol Utama (Pill Biru) "Unduh PDF" */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 sm:gap-2 rounded-pill bg-[var(--primary)] px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-none transition duration-fast ease-standard hover:bg-[var(--primary-hover)] active:scale-[0.95] disabled:opacity-50 shrink-0"
              onClick={handlePrintAtsPdf}
              disabled={exporting}
              title="Unduh CV sebagai dokumen PDF Ramah ATS (Teks Vektor via Cetak)"
              aria-label="Unduh PDF"
            >
              <Download size={16} />
              <span className="sm:hidden">{exporting ? '…' : 'PDF'}</span>
              <span className="hidden sm:inline">{exporting ? 'Mengekspor…' : 'Unduh PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Backup Reminder Banner (if >7 days since last JSON download) */}
      {showBackupReminder && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--status-warning)]/30 bg-[var(--status-warning-bg)] px-4 py-2 text-xs text-[var(--text)]">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[var(--status-warning)] shrink-0" />
            <span>
              Sudah lebih dari 7 hari sejak cadangan JSON terakhir. Unduh cadangan untuk mengamankan data riwayat hidup Anda.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJson}
              className="rounded-control bg-[var(--status-warning)] px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 active:scale-[0.95]"
            >
              Unduh JSON
            </button>
            <button
              type="button"
              onClick={dismissBackupReminder}
              className="rounded-control px-2 py-1 text-xs hover:bg-[var(--status-warning-bg)] text-[var(--text-muted)]"
            >
              Nanti
            </button>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Segmented Tab: Form vs Preview (Tablet 640px - 1023px) */}
      {!focusMode && (
        <div className="hidden sm:flex lg:hidden items-center border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 shrink-0">
          <div className="flex w-full rounded-pill bg-[var(--surface-pearl)] p-0.5 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setMobileTab('form')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill py-1.5 text-xs font-semibold transition duration-fast ${
                mobileTab === 'form'
                  ? 'bg-[var(--primary)] text-white shadow-none'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>📝 Formulir</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill py-1.5 text-xs font-semibold transition duration-fast ${
                mobileTab === 'preview'
                  ? 'bg-[var(--primary)] text-white shadow-none'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>👁️ Pratinjau ({pageCount} Hal)</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 2. Split Workspace Body ---------------- */}
      {focusMode ? (
        <div
          id="main-form-content"
          role="region"
          aria-label="Editor Formulir CV Mode Fokus"
          className="scroll-slim flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-8"
          style={{ background: 'var(--bg)' }}
        >
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="flex items-center justify-between rounded-control border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-2.5 text-xs font-normal text-[var(--primary)]">
              <span className="flex items-center gap-2">
                <Maximize2 size={14} />
                <span>Mode Fokus Aktif · Menulis tanpa gangguan</span>
              </span>
              <button
                type="button"
                onClick={() => setFocusMode(false)}
                className="rounded-pill bg-[var(--primary)] px-3 py-1 font-semibold text-white shadow-none transition hover:opacity-90 active:scale-[0.95]"
              >
                Keluar Fokus (Esc)
              </button>
            </div>
            <FormBuilder
              cv={state.cv}
              setCV={setCV}
              accent={state.customization.accent}
              onActiveSectionChange={handleActiveSectionChange}
              onDeleteToast={(msg) => {
                commitSnapshot();
                setToast({
                  id: String(Date.now()),
                  message: msg,
                  onUndo: undo,
                });
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left pane: Form Builder */}
          <div
            id="main-form-content"
            role="region"
            aria-label="Editor Formulir CV"
            className={`scroll-slim w-full overflow-y-auto border-r p-4 sm:p-6 lg:w-[46%] lg:max-w-[640px] ${
              mobileTab === 'form' ? 'block' : 'hidden lg:block'
            }`}
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <FormBuilder
              cv={state.cv}
              setCV={setCV}
              accent={state.customization.accent}
              onActiveSectionChange={handleActiveSectionChange}
              onDeleteToast={(msg) => {
                commitSnapshot();
                setToast({
                  id: String(Date.now()),
                  message: msg,
                  onUndo: undo,
                });
              }}
            />
          </div>

          {/* Right pane: Preview Canvas (Parchment staging) */}
          <div
            ref={canvasWrapRef}
            role="region"
            aria-label="Pratinjau Dokumen CV"
            className={`scroll-slim relative min-h-0 flex-1 overflow-auto ${
              mobileTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
            style={{ background: 'var(--surface-2)' }}
          >
          {/* Floating Zoom & Page Indicator Capsule */}
          <div className="sticky top-3 z-10 flex items-center justify-between px-6 pointer-events-none">
            {/* Page Count indicator badge */}
            <div className="pointer-events-auto">
              {pageCount > 1 ? (
                <div
                  className="flex items-center gap-1.5 rounded-pill border border-[var(--status-warning)]/40 bg-[var(--status-warning-bg)] px-3 py-1 text-xs font-semibold text-[var(--status-warning)] backdrop-blur-md animate-modal-enter shadow-none"
                  title={`Dokumen melebihi 1 halaman ${state.customization.paperSize === 'letter' ? 'Letter' : 'A4'}. Periksa garis batas halaman di preview untuk memastikan teks tidak terpotong saat diekspor.`}
                >
                  <AlertCircle size={14} />
                  <span>{pageCount} Halaman {state.customization.paperSize === 'letter' ? 'Letter' : 'A4'}</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 rounded-pill border border-[var(--border)] px-3 py-1 text-xs font-normal text-[var(--text-muted)] backdrop-blur-md"
                  style={{ background: 'color-mix(in srgb, var(--surface) 90%, transparent)' }}
                  title={`Dokumen pas dalam 1 halaman ${state.customization.paperSize === 'letter' ? 'Letter' : 'A4'}`}
                >
                  <span>1 Halaman {state.customization.paperSize === 'letter' ? 'Letter' : 'A4'}</span>
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div
              className="pointer-events-auto flex items-center gap-1 rounded-pill border px-2 py-1 shadow-none backdrop-blur-md app-surface"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
              }}
            >
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={() => setZoom((z) => Math.max(0.35, z - 0.08))}
                aria-label="Zoom out"
                title="Perkecil"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                title="Klik untuk reset ke 100%"
                className="w-11 text-center text-xs font-normal tracking-[-0.12px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={() => setZoom((z) => Math.min(1.25, z + 0.08))}
                aria-label="Zoom in"
                title="Perbesar"
              >
                <ZoomIn size={14} />
              </button>
              <span className="h-3 w-px bg-[var(--border)] mx-0.5" />
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={fitWidth}
                aria-label="Pas lebar layar"
                title="Pas lebar layar (Fit Width)"
              >
                <Maximize2 size={13} />
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={fitPage}
                aria-label="Pas 1 halaman"
                title="Pas 1 halaman penuh (Fit Page)"
              >
                <Minimize2 size={13} />
              </button>
            </div>
          </div>

          {/* Staging A4 canvas with Apple single product drop-shadow */}
          <div className="flex justify-center px-4 pb-16 pt-4 sm:px-6 print-canvas">
            <div className="cv-scale" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <ErrorBoundary fallbackTitle="Terjadi Kendala pada Pratinjau Dokumen">
                <CVPreview cv={state.cv} custom={state.customization} onPageCountChange={setPageCount} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ---------------- 3. Design & Customizer Modal Sheet ---------------- */}
      {showCustomizer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Design & Template customizer"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-slow ease-standard"
          style={{ background: 'rgba(0, 0, 0, 0.4)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCustomizer(false);
          }}
        >
          <div
            className="animate-modal-enter relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-[var(--border)] app-surface"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.374px] text-[var(--text)]">Design & Template</h2>
                <p className="text-xs text-[var(--text-muted)]">Customize the visual presentation of your CV</p>
              </div>
              <button
                type="button"
                className="btn btn-outline rounded-pill px-3 py-1.5 text-xs active:scale-[0.95]"
                onClick={() => {
                  if (confirm('Reset all content and design to the sample CV?')) {
                    commitSnapshot();
                    setState({ cv: defaultState.cv, customization: defaultCustomization });
                    setShowCustomizer(false);
                    setToast({
                      id: String(Date.now()),
                      message: 'CV direset ke data contoh',
                      onUndo: undo,
                    });
                  }
                }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="scroll-slim flex-1 overflow-y-auto p-6">
              <Customizer custom={state.customization} onChange={setCustom} />

              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  className="btn btn-ghost w-full rounded-pill text-sm text-[var(--status-danger)] transition duration-fast ease-standard hover:bg-[var(--status-danger-bg)] active:scale-[0.95]"
                  onClick={() => {
                    if (confirm('Clear all fields and start from blank?')) {
                      commitSnapshot();
                      setCV(() => emptyCV);
                      setShowCustomizer(false);
                      setToast({
                        id: String(Date.now()),
                        message: 'CV dikosongkan',
                        onUndo: undo,
                      });
                    }
                  }}
                >
                  Start from blank
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-[var(--border)] bg-[var(--surface-pearl)] px-6 py-3">
              <button
                type="button"
                className="btn btn-primary rounded-pill px-6 py-2 text-sm font-semibold active:scale-[0.95]"
                onClick={() => setShowCustomizer(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Snapshot History Modal (Rolling 10 auto-snapshots) */}
      <SnapshotHistoryModal
        isOpen={showSnapshotModal}
        onClose={() => setShowSnapshotModal(false)}
        snapshots={snapshots}
        onRestore={(restoredState) => {
          commitSnapshot();
          setState(restoredState);
          setToast({
            id: String(Date.now()),
            message: 'Snapshot berhasil dipulihkan',
            onUndo: undo,
          });
        }}
        onTakeSnapshot={() => {
          addSnapshot(state, `Snapshot: ${state.cv.personal.fullName || 'CV'}`);
          setToast({ id: String(Date.now()), message: 'Snapshot baru disimpan' });
        }}
        onDeleteSnapshot={deleteSnapshot}
      />

      {/* CV Version Manager Modal */}
      <VersionManagerModal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        versions={versions}
        activeVersion={activeVersion}
        onSwitch={switchVersion}
        onCreate={createVersion}
        onDuplicate={duplicateVersion}
        onRename={renameVersion}
        onDelete={deleteVersion}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onExportPdf={handleExportPdf}
        onExportPng={handleExportPng}
        onExportJson={handleExportJson}
        onImportJson={() => importRef.current?.click()}
        onExportMarkdown={handleExportMarkdown}
        onCopyText={handleCopyText}
        onPrint={printCV}
        onToggleTheme={cycleTheme}
        onToggleFocusMode={() => setFocusMode((v) => !v)}
        onOpenCustomizer={() => setShowCustomizer(true)}
        onOpenVersions={() => setShowVersionsModal(true)}
        onOpenSnapshots={() => setShowSnapshotModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onLoadSample={handleLoadSample}
        onClearBlank={handleClearBlank}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onFocusSection={(sec: string) => handleActiveSectionChange(sec)}
      />

      {/* Safe Recovery Modal if corrupted storage data was detected */}
      {corruptedRaw && (
        <RecoveryModal
          corruptedRaw={corruptedRaw}
          onRestoreSnapshot={handleRestoreFromRecoverySnapshot}
          onStartBlank={handleStartBlankFromRecovery}
          onDismiss={clearCorrupted}
        />
      )}

      {/* ---------------- 4. Hidden print/export copy ---------------- */}
      {typeof document !== 'undefined' &&
        document.getElementById('print-mount') &&
        createPortal(
          <CVPreview cv={state.cv} custom={state.customization} forPrint pageCount={pageCount} />,
          document.getElementById('print-mount')!,
        )}
    </div>
  );
}
