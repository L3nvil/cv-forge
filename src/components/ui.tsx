import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Info, X, Plus, Trash2 } from 'lucide-react';

// --------------------------------------------------------------------------
// Field with optional guidance tooltip
// --------------------------------------------------------------------------
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">
        <span>{label}</span>
        {hint && (
          <span className="group relative inline-flex items-center">
            <Info size={14} className="cursor-help text-[var(--text-muted)] transition-colors duration-base ease-standard hover:text-[var(--primary)]" />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-control border border-[var(--border)] bg-[var(--surface)] p-3 text-xs font-normal leading-normal text-[var(--text)] opacity-0 transition-opacity duration-base ease-standard group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {hint}
            </span>
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export const DEFAULT_SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Java', 'Next.js',
  'Tailwind CSS', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'GraphQL', 'REST API',
  'Git', 'CI/CD', 'Linux', 'Figma', 'UI/UX Design', 'Agile / Scrum', 'System Design',
  'Microservices', 'Redis', 'MongoDB', 'MySQL', 'C++', 'Vue.js', 'Angular', 'Express.js',
  'Unit Testing', 'Jest', 'Cypress', 'Communication', 'Leadership', 'Problem Solving',
];

// --------------------------------------------------------------------------
// Tag / pill creator with autocomplete suggestions
// --------------------------------------------------------------------------
export function TagInput({
  values,
  onChange,
  placeholder = 'Type and press Enter',
  accent,
  suggestions,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  accent?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const add = (valToAdd?: string) => {
    const v = (valToAdd ?? draft).trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
    setShowSuggestions(false);
  };

  const matchingSuggestions = (suggestions || [])
    .filter((s) => s.toLowerCase().includes(draft.toLowerCase().trim()) && !values.includes(s))
    .slice(0, 6);

  return (
    <div className="relative">
      <div
        className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-control border border-[var(--border)] bg-[var(--surface)] p-2 transition-colors duration-base ease-standard focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-focus)]"
      >
        {values.map((v) => (
          <span
            key={v}
            className="chip"
            style={{
              background: accent ? `${accent}18` : 'var(--border-subtle)',
              color: accent ?? 'var(--text)',
              border: `1px solid ${accent ? `${accent}40` : 'var(--border)'}`,
            }}
          >
            <span>{v}</span>
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
              className="grid h-4 w-4 place-items-center rounded-pill opacity-70 transition duration-fast ease-standard hover:opacity-100 active:scale-[0.95]"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <div className="flex min-w-[140px] flex-1 items-center px-1">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding so clicks on suggestions register
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (matchingSuggestions.length > 0 && draft.trim()) {
                  add(matchingSuggestions[0]);
                } else {
                  add();
                }
              } else if (e.key === 'Tab' && matchingSuggestions.length > 0 && draft.trim()) {
                e.preventDefault();
                add(matchingSuggestions[0]);
              } else if (e.key === 'Backspace' && !draft && values.length) {
                onChange(values.slice(0, -1));
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-base leading-normal outline-none text-[var(--text)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {showSuggestions && draft.trim() && matchingSuggestions.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-control border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-none">
          <div className="px-2 py-1 text-xs font-normal text-[var(--text-muted)]">Saran Skill:</div>
          {matchingSuggestions.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(item);
              }}
              className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs text-[var(--text)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--primary)]"
            >
              <span>{item}</span>
              <Plus size={14} className="opacity-60" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Quick Date Picker / Selector
// --------------------------------------------------------------------------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

export function DateInput({
  value,
  onChange,
  placeholder = 'Bulan Thn',
  disabled = false,
  showPresent = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showPresent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const pick = (month: string, year: string) => {
    if (month && year) {
      onChange(`${month} ${year}`);
      setOpen(false);
    } else if (year) {
      onChange(year);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          className="app-input pr-8"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            title="Pilih Bulan & Tahun"
            aria-label="Pilih Bulan & Tahun"
            className="absolute right-2 grid h-6 w-6 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:text-[var(--primary)] active:scale-[0.95]"
          >
            <span className="text-xs">📅</span>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 rounded-card border border-[var(--border)] bg-[var(--surface)] p-3 shadow-none">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--border)] pb-1.5">
            <span className="text-xs font-semibold text-[var(--text)]">Pilih Bulan & Tahun</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Tutup
            </button>
          </div>

          {showPresent && (
            <div className="mb-2.5">
              <button
                type="button"
                onClick={() => {
                  onChange('Sekarang');
                  setOpen(false);
                }}
                className="w-full rounded-control border border-[var(--primary)] bg-[var(--primary)]/10 py-1 text-center text-xs font-normal text-[var(--primary)] transition duration-fast hover:bg-[var(--primary)]/20 active:scale-[0.98]"
              >
                ⚡ Sekarang / Present
              </button>
            </div>
          )}

          <div className="mb-2">
            <div className="mb-1 text-xs font-normal text-[var(--text-muted)]">Bulan:</div>
            <div className="grid grid-cols-4 gap-1">
              {MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(m);
                    if (selectedYear) pick(m, selectedYear);
                  }}
                  className={`rounded-control py-1 text-center text-xs transition duration-fast ${
                    selectedMonth === m
                      ? 'bg-[var(--primary)] font-semibold text-white'
                      : 'bg-[var(--surface-pearl)] text-[var(--text)] hover:bg-[var(--border-subtle)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-normal text-[var(--text-muted)]">Tahun:</div>
            <div className="grid grid-cols-4 gap-1">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setSelectedYear(String(y));
                    if (selectedMonth) pick(selectedMonth, String(y));
                    else onChange(String(y));
                  }}
                  className={`rounded-control py-1 text-center text-xs transition duration-fast ${
                    selectedYear === String(y)
                      ? 'bg-[var(--primary)] font-semibold text-white'
                      : 'bg-[var(--surface-pearl)] text-[var(--text)] hover:bg-[var(--border-subtle)]'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Accordion section (Store Utility Card: radius-card 12px, padding 16-24px)
// --------------------------------------------------------------------------
export function AccordionSection({
  title,
  icon,
  open,
  onToggle,
  visible,
  onVisibleChange,
  customTitle,
  onCustomTitleChange,
  onResetCustomTitle,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  onDelete,
  pageBreakBefore,
  onPageBreakBeforeChange,
  children,
}: {
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  visible?: boolean;
  onVisibleChange?: (v: boolean) => void;
  customTitle?: string;
  onCustomTitleChange?: (v: string) => void;
  onResetCustomTitle?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onDelete?: () => void;
  pageBreakBefore?: boolean;
  onPageBreakBeforeChange?: (v: boolean) => void;
  children: ReactNode;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const displayTitle = customTitle || title;

  return (
    <div className="overflow-hidden rounded-card border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <span className="text-[var(--text-muted)]">{icon}</span>
          {editingTitle ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                className="app-input h-8 px-2 py-0.5 text-sm font-semibold"
                value={titleDraft}
                autoFocus
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (onCustomTitleChange) onCustomTitleChange(titleDraft.trim());
                    setEditingTitle(false);
                  } else if (e.key === 'Escape') {
                    setEditingTitle(false);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (onCustomTitleChange) onCustomTitleChange(titleDraft.trim());
                  setEditingTitle(false);
                }}
                title="Simpan nama judul"
                className="rounded-control bg-[var(--primary)] px-2.5 py-1 text-xs font-semibold text-white"
              >
                Simpan
              </button>
              {customTitle && onResetCustomTitle && (
                <button
                  type="button"
                  onClick={() => {
                    onResetCustomTitle();
                    setEditingTitle(false);
                  }}
                  title="Kembalikan ke default"
                  className="rounded-control border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Reset
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggle}
                className="text-left transition duration-fast ease-standard active:scale-[0.98]"
              >
                <span className="text-lg font-semibold tracking-[-0.374px] text-[var(--text)]">
                  {displayTitle}
                </span>
              </button>
              {onCustomTitleChange && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTitleDraft(displayTitle);
                    setEditingTitle(true);
                  }}
                  title="Ubah judul section"
                  aria-label="Ubah judul section"
                  className="grid h-6 w-6 place-items-center rounded-control text-[var(--text-muted)] opacity-60 transition duration-fast ease-standard hover:opacity-100 hover:text-[var(--primary)]"
                >
                  <span className="text-xs">✏️</span>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Section Reorder Buttons */}
          {onMoveUp && onMoveDown && (
            <div className="flex items-center rounded-control border border-[var(--border)] bg-[var(--surface)] p-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={onMoveUp}
                title={`Pindahkan ${title} ke atas`}
                aria-label={`Pindahkan ${title} ke atas`}
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] disabled:opacity-25 disabled:pointer-events-none active:scale-[0.95]"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={onMoveDown}
                title={`Pindahkan ${title} ke bawah`}
                aria-label={`Pindahkan ${title} ke bawah`}
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] hover:text-[var(--text)] disabled:opacity-25 disabled:pointer-events-none active:scale-[0.95]"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          {/* Delete Button (for custom sections) */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title={`Hapus section ${title}`}
              aria-label={`Hapus section ${title}`}
              className="grid h-8 w-8 place-items-center rounded-control text-[var(--status-danger)] transition duration-fast ease-standard hover:bg-[var(--status-danger-bg)] active:scale-[0.95]"
            >
              <Trash2 size={14} />
            </button>
          )}

          {onVisibleChange && (
            <Toggle
              checked={visible ?? true}
              onChange={onVisibleChange}
              srLabel={`Toggle ${title} section`}
            />
          )}

          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] active:scale-[0.95]"
          >
            <ChevronDown
              size={18}
              className="transition-transform duration-base ease-standard"
              style={{ transform: open ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        </div>
      </div>
      {open && (
        <div className="animate-dropdown-enter border-t border-[var(--border)] p-4 sm:p-6">
          {/* F2: Page Break Before Option */}
          {onPageBreakBeforeChange && (
            <div className="mb-4 flex items-center justify-between rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] px-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--text)]">
                <span className="text-sm">📄</span>
                <div>
                  <span className="font-semibold">Mulai di halaman baru</span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Sisipkan pemisah halaman otomatis sebelum section ini (Page Break)
                  </p>
                </div>
              </div>
              <Toggle
                checked={!!pageBreakBefore}
                onChange={onPageBreakBeforeChange}
                srLabel={`Mulai section ${title} di halaman baru`}
              />
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Toggle switch (radius-pill / kontrol 44px hit-box)
// --------------------------------------------------------------------------
export function Toggle({
  checked,
  onChange,
  srLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  srLabel: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[44px] min-w-[44px]">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={srLabel}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill p-0.5 transition-colors duration-base ease-standard active:scale-[0.95]"
        style={{
          background: checked ? 'var(--primary)' : 'var(--border)',
        }}
      >
        <span
          className="h-5 w-5 rounded-pill bg-white transition-transform duration-base ease-standard"
          style={{
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// "Add item" button (Pill / aksi sekunder)
// --------------------------------------------------------------------------
export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-outline min-h-[40px] w-full rounded-pill border border-dashed border-[var(--border)] text-sm text-[var(--primary)] transition duration-fast ease-standard hover:border-[var(--primary)] hover:bg-[var(--surface-pearl)] active:scale-[0.95]"
    >
      <Plus size={16} />
      <span>{label}</span>
    </button>
  );
}
