import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Download, Printer, FileText, Image, Copy, Upload,
  FileJson, Sliders, Maximize2, History, Sparkles, FilePlus,
  Layers, User, Briefcase, FolderGit2, GraduationCap, Wrench, Award,
  Moon, Laptop, ArrowRight,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'Aksi Dokumen' | 'Navigasi Formulir' | 'Tampilan & Desain' | 'Data & Riwayat';
  title: string;
  subtitle?: string;
  icon: JSX.Element;
  shortcut?: string;
  perform: () => void;
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: CommandItem[];
  onExportPdf?: () => void;
  onExportPng?: () => void;
  onExportJson?: () => void;
  onImportJson?: () => void;
  onExportMarkdown?: () => void;
  onCopyText?: () => void;
  onPrint?: () => void;
  onToggleTheme?: () => void;
  onToggleFocusMode?: () => void;
  onOpenCustomizer?: () => void;
  onOpenVersions?: () => void;
  onOpenSnapshots?: () => void;
  onOpenShortcuts?: () => void;
  onLoadSample?: () => void;
  onClearBlank?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onFocusSection?: (section: string) => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  commands: customCommands,
  onExportPdf,
  onExportPng,
  onExportJson,
  onImportJson,
  onExportMarkdown,
  onCopyText,
  onPrint,
  onToggleTheme,
  onToggleFocusMode,
  onOpenCustomizer,
  onOpenVersions,
  onOpenSnapshots,
  onOpenShortcuts,
  onLoadSample,
  onClearBlank,
  onFocusSection,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    if (onExportPdf) {
      list.push({
        id: 'export-pdf',
        category: 'Aksi Dokumen',
        title: 'Unduh Dokumen PDF',
        subtitle: 'Ekspor CV tajam siap cetak atau lamaran kerja',
        icon: <Download size={15} />,
        shortcut: 'Ctrl+S',
        perform: onExportPdf,
      });
    }

    if (onPrint) {
      list.push({
        id: 'print',
        category: 'Aksi Dokumen',
        title: 'Cetak Dokumen (Print)',
        subtitle: 'Cetak langsung ke printer atau simpan PDF peramban',
        icon: <Printer size={15} />,
        shortcut: 'Ctrl+P',
        perform: onPrint,
      });
    }

    if (onExportPng) {
      list.push({
        id: 'export-png',
        category: 'Aksi Dokumen',
        title: 'Unduh Gambar PNG',
        subtitle: 'Simpan halaman CV sebagai gambar raster',
        icon: <Image size={15} />,
        perform: onExportPng,
      });
    }

    if (onExportMarkdown) {
      list.push({
        id: 'export-md',
        category: 'Aksi Dokumen',
        title: 'Unduh Format Markdown (.md)',
        subtitle: 'Format teks terstruktur untuk portofolio atau GitHub',
        icon: <FileText size={15} />,
        perform: onExportMarkdown,
      });
    }

    if (onCopyText) {
      list.push({
        id: 'copy-text',
        category: 'Aksi Dokumen',
        title: 'Salin Teks Polos (ATS)',
        subtitle: 'Salin ke papan klip untuk form lamaran kerja online',
        icon: <Copy size={15} />,
        perform: onCopyText,
      });
    }

    if (onExportJson) {
      list.push({
        id: 'export-json',
        category: 'Data & Riwayat',
        title: 'Unduh Cadangan JSON',
        subtitle: 'Simpan file cadangan data lengkap CV Forge',
        icon: <FileJson size={15} />,
        perform: onExportJson,
      });
    }

    if (onImportJson) {
      list.push({
        id: 'import-json',
        category: 'Data & Riwayat',
        title: 'Impor Cadangan JSON',
        subtitle: 'Muat file cadangan JSON dari komputer',
        icon: <Upload size={15} />,
        perform: onImportJson,
      });
    }

    if (onOpenCustomizer) {
      list.push({
        id: 'open-design',
        category: 'Tampilan & Desain',
        title: 'Kustomisasi Desain & Template',
        subtitle: 'Atur template, font, warna aksen, ukuran kertas, dan jarak',
        icon: <Sliders size={15} />,
        perform: onOpenCustomizer,
      });
    }

    if (onToggleFocusMode) {
      list.push({
        id: 'toggle-focus',
        category: 'Tampilan & Desain',
        title: 'Beralih Mode Fokus (Formulir)',
        subtitle: 'Fokus menulis tanpa panel pratinjau samping',
        icon: <Maximize2 size={15} />,
        shortcut: 'F10',
        perform: onToggleFocusMode,
      });
    }

    if (onToggleTheme) {
      list.push({
        id: 'toggle-theme',
        category: 'Tampilan & Desain',
        title: 'Ganti Tema Warna (Terang / Gelap / Sistem)',
        subtitle: 'Ubah tema visual workspace',
        icon: <Moon size={15} />,
        perform: onToggleTheme,
      });
    }

    if (onOpenVersions) {
      list.push({
        id: 'open-versions',
        category: 'Data & Riwayat',
        title: 'Kelola Versi CV',
        subtitle: 'Beralih atau buat variasi CV untuk posisi berbeda',
        icon: <Layers size={15} />,
        perform: onOpenVersions,
      });
    }

    if (onOpenSnapshots) {
      list.push({
        id: 'open-snapshots',
        category: 'Data & Riwayat',
        title: 'Riwayat Snapshot Otomatis',
        subtitle: 'Pulihkan riwayat perubahan snapshot sebelumnya',
        icon: <History size={15} />,
        perform: onOpenSnapshots,
      });
    }

    if (onLoadSample) {
      list.push({
        id: 'load-sample',
        category: 'Data & Riwayat',
        title: 'Muat Contoh Data',
        subtitle: 'Isi formulir dengan contoh data profesional',
        icon: <Sparkles size={15} />,
        perform: onLoadSample,
      });
    }

    if (onClearBlank) {
      list.push({
        id: 'clear-blank',
        category: 'Data & Riwayat',
        title: 'Mulai Kosong',
        subtitle: 'Kosongkan semua isian formulir CV',
        icon: <FilePlus size={15} />,
        perform: onClearBlank,
      });
    }

    if (onOpenShortcuts) {
      list.push({
        id: 'open-shortcuts',
        category: 'Tampilan & Desain',
        title: 'Daftar Pintasan Keyboard',
        subtitle: 'Lihat seluruh pintasan tombol aplikasi',
        icon: <Laptop size={15} />,
        shortcut: 'Ctrl+/',
        perform: onOpenShortcuts,
      });
    }

    if (onFocusSection) {
      list.push(
        {
          id: 'goto-personal',
          category: 'Navigasi Formulir',
          title: 'Navigasi: Informasi Pribadi & Foto',
          subtitle: 'Nama, jabatan, kontak, dan tautan sosial',
          icon: <User size={15} />,
          perform: () => onFocusSection('personal'),
        },
        {
          id: 'goto-summary',
          category: 'Navigasi Formulir',
          title: 'Navigasi: Ringkasan Profesional',
          subtitle: '3-4 kalimat ringkasan keahlian dan profil karier',
          icon: <FileText size={15} />,
          perform: () => onFocusSection('summary'),
        },
        {
          id: 'goto-experience',
          category: 'Navigasi Formulir',
          title: 'Navigasi: Pengalaman Kerja',
          subtitle: 'Riwayat perusahaan, peran, dan pencapaian',
          icon: <Briefcase size={15} />,
          perform: () => onFocusSection('experience'),
        },
        {
          id: 'goto-projects',
          category: 'Navigasi Formulir',
          title: 'Navigasi: Proyek Pilihan',
          subtitle: 'Proyek unggulan, teknologi, dan portofolio',
          icon: <FolderGit2 size={15} />,
          perform: () => onFocusSection('projects'),
        },
        {
          id: 'goto-education',
          category: 'Navigasi Formulir',
          title: 'Navigasi: Pendidikan & Sertifikasi',
          subtitle: 'Gelar akademis dan sertifikat keahlian',
          icon: <GraduationCap size={15} />,
          perform: () => onFocusSection('education'),
        },
        {
          id: 'goto-skills',
          category: 'Navigasi Formulir',
          title: 'Navigasi: Keahlian (Skills)',
          subtitle: 'Pengelompokan keahlian teknis dan non-teknis',
          icon: <Wrench size={15} />,
          perform: () => onFocusSection('skills'),
        },
        {
          id: 'goto-honors',
          category: 'Navigasi Formulir',
          title: 'Navigasi: Penghargaan & Prestasi',
          subtitle: 'Daftar penghargaan dan apresiasi industri',
          icon: <Award size={15} />,
          perform: () => onFocusSection('honors'),
        }
      );
    }

    return list;
  }, [
    onExportPdf,
    onPrint,
    onExportPng,
    onExportMarkdown,
    onCopyText,
    onExportJson,
    onImportJson,
    onOpenCustomizer,
    onToggleFocusMode,
    onToggleTheme,
    onOpenVersions,
    onOpenSnapshots,
    onLoadSample,
    onClearBlank,
    onOpenShortcuts,
    onFocusSection,
  ]);

  const activeCommands = customCommands || defaultCommands;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return activeCommands;
    return activeCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [activeCommands, query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].perform();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 backdrop-blur-sm transition-opacity duration-fast ease-standard"
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-modal-enter relative flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-card border border-[var(--border)] app-surface shadow-none"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5">
          <Search size={18} className="text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik perintah atau cari bagian (contoh: PDF, Inter, Pengalaman)..."
            className="flex-1 bg-transparent text-sm leading-normal text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="hidden sm:inline-block rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="scroll-slim flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              Tidak ada perintah yang cocok dengan "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.perform();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-control px-3 py-2.5 text-left transition duration-fast ${
                    isSelected
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text)] hover:bg-[var(--surface-pearl)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-control shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--surface-pearl)] text-[var(--primary)]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold">{item.title}</span>
                        <span
                          className={`text-xs ${
                            isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          · {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p
                          className={`truncate text-xs ${
                            isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd
                        className={`rounded-control px-1.5 py-0.5 text-xs font-semibold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'border border-[var(--border)] bg-[var(--surface-pearl)] text-[var(--text-muted)]'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      size={14}
                      className={`opacity-0 transition-opacity ${
                        isSelected ? 'opacity-100' : ''
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-pearl)] px-4 py-2 text-xs text-[var(--text-muted)]">
          <span>Gunakan ↑ ↓ untuk navigasi, Enter untuk memilih</span>
          <span>{filtered.length} opsi tersedia</span>
        </div>
      </div>
    </div>
  );
}
