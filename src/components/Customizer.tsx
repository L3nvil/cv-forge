import { Pipette, Sparkles, RotateCcw } from 'lucide-react';
import { TEMPLATES, FONTS, ACCENT_PRESETS } from '../types/cv';
import type { Customization, Density, FontId, TemplateId } from '../types/cv';

interface DesignPreset {
  id: string;
  name: string;
  description: string;
  template: TemplateId;
  font: FontId;
  accent: string;
  density: Density;
  fontSizeScale: number;
  marginScale: number;
}

const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: 'modern-clean',
    name: 'Modern Clean',
    description: 'Inter · Sky Blue · Standar',
    template: 'modern',
    font: 'inter',
    accent: '#0ea5e9',
    density: 'normal',
    fontSizeScale: 1,
    marginScale: 1,
  },
  {
    id: 'tech-minimal',
    name: 'Tech Minimalist',
    description: 'Mono · Emerald ATS · Kompak',
    template: 'tech',
    font: 'jetbrains',
    accent: '#10b981',
    density: 'compact',
    fontSizeScale: 0.95,
    marginScale: 0.9,
  },
  {
    id: 'creative-studio',
    name: 'Creative Studio',
    description: 'Split Layout · Violet · Elegan',
    template: 'creative',
    font: 'inter',
    accent: '#8b5cf6',
    density: 'normal',
    fontSizeScale: 1,
    marginScale: 1,
  },
  {
    id: 'executive-classic',
    name: 'Executive ATS',
    description: 'Georgia Serif · Dark Ink · Renggang',
    template: 'classic',
    font: 'georgia',
    accent: '#111827',
    density: 'relaxed',
    fontSizeScale: 1.05,
    marginScale: 1.1,
  },
];

export function Customizer({
  custom,
  onChange,
}: {
  custom: Customization;
  onChange: (patch: Partial<Customization>) => void;
}) {
  const currentFontScale = custom.fontSizeScale ?? 1;
  const currentMarginScale = custom.marginScale ?? 1;

  return (
    <div className="space-y-6">
      {/* 1. Quick Presets */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">
            <Sparkles size={14} className="text-[var(--primary)]" />
            <span>Preset Desain Instan</span>
          </p>
          <span className="text-xs text-[var(--text-muted)]">1-klik terapkan</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DESIGN_PRESETS.map((p) => {
            const isActive =
              custom.template === p.template &&
              custom.font === p.font &&
              custom.accent === p.accent &&
              custom.density === p.density;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  onChange({
                    template: p.template,
                    font: p.font,
                    accent: p.accent,
                    density: p.density,
                    fontSizeScale: p.fontSizeScale,
                    marginScale: p.marginScale,
                  })
                }
                className={`rounded-control p-2.5 text-left transition duration-base ease-standard active:scale-[0.96] ${
                  isActive
                    ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text)]">{p.name}</span>
                  <span
                    className="h-2 w-2 rounded-pill"
                    style={{ background: p.accent }}
                  />
                </div>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)] leading-tight">
                  {p.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Template */}
      <div>
        <p className="mb-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Template</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const active = custom.template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ template: t.id as TemplateId })}
                className={`relative flex flex-col items-start rounded-control p-4 text-left transition duration-base ease-standard active:scale-[0.95] ${
                  active
                    ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">{t.name}</span>
                  {active && (
                    <span className="h-2 w-2 rounded-pill bg-[var(--primary)]" />
                  )}
                </div>
                <span className="mt-1 text-xs leading-normal text-[var(--text-muted)]">{t.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Accent */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Accent color</p>
          <span className="text-xs font-mono text-[var(--text-muted)]">{custom.accent}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((c) => {
            const isSelected = custom.accent.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                aria-label={`Select accent color ${c}`}
                onClick={() => onChange({ accent: c })}
                className={`relative h-7 w-7 rounded-pill transition duration-base ease-standard active:scale-[0.95] ${
                  isSelected
                    ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]'
                    : 'ring-1 ring-black/10 dark:ring-white/10'
                }`}
                style={{
                  background: c,
                }}
              />
            );
          })}
          <label
            title="Custom color"
            className="group relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-pill border border-[var(--border)] bg-[var(--surface-pearl)] transition duration-base ease-standard hover:border-[var(--primary)] active:scale-[0.95]"
          >
            <Pipette size={14} className="text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
            <input
              type="color"
              aria-label="Custom color picker"
              value={custom.accent}
              onChange={(e) => onChange({ accent: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      {/* 4. Font */}
      <div>
        <p className="mb-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Typography</p>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((f) => {
            const isSelected = custom.font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ font: f.id as FontId })}
                className={`rounded-pill px-3 py-2 text-center text-xs transition duration-base ease-standard active:scale-[0.95] ${
                  isSelected
                    ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)] font-semibold text-[var(--text)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                style={{ fontFamily: f.stack }}
              >
                {f.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Density */}
      <div>
        <p className="mb-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Spacing density</p>
        <div className="grid grid-cols-3 gap-2">
          {(['compact', 'normal', 'relaxed'] as Density[]).map((den) => {
            const isSelected = custom.density === den;
            return (
              <button
                key={den}
                type="button"
                onClick={() => onChange({ density: den })}
                className={`rounded-pill px-3 py-2 text-center text-xs capitalize transition duration-base ease-standard active:scale-[0.95] ${
                  isSelected
                    ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)] font-semibold text-[var(--text)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {den}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Paper Size & Document Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Ukuran Kertas</p>
          <div className="grid grid-cols-2 gap-2">
            {(['a4', 'letter'] as const).map((size) => {
              const isSelected = (custom.paperSize || 'a4') === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChange({ paperSize: size })}
                  className={`rounded-pill px-3 py-1.5 text-center text-xs font-normal transition duration-fast active:scale-[0.95] ${
                    isSelected
                      ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)] font-semibold text-[var(--text)]'
                      : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {size === 'a4' ? 'A4' : 'Letter'}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Bahasa Dokumen</p>
          <div className="grid grid-cols-2 gap-2">
            {(['id', 'en'] as const).map((lang) => {
              const isSelected = (custom.documentLanguage || 'id') === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onChange({ documentLanguage: lang })}
                  className={`rounded-pill px-3 py-1.5 text-center text-xs font-normal transition duration-fast active:scale-[0.95] ${
                    isSelected
                      ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)] font-semibold text-[var(--text)]'
                      : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {lang === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Global Font & Margin Sliders */}
      <div className="space-y-4 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-3.5">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)]">Skala Teks & Line Height</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[var(--text-muted)]">
                {Math.round(currentFontScale * 100)}%
              </span>
              {currentFontScale !== 1 && (
                <button
                  type="button"
                  onClick={() => onChange({ fontSizeScale: 1 })}
                  title="Reset ke 100%"
                  className="text-[var(--text-muted)] hover:text-[var(--primary)]"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0.85"
            max="1.15"
            step="0.05"
            value={currentFontScale}
            onChange={(e) => onChange({ fontSizeScale: parseFloat(e.target.value) })}
            className="mt-1.5 h-1.5 w-full cursor-pointer accent-[var(--primary)]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)]">Skala Margin & Jarak Section</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[var(--text-muted)]">
                {Math.round(currentMarginScale * 100)}%
              </span>
              {currentMarginScale !== 1 && (
                <button
                  type="button"
                  onClick={() => onChange({ marginScale: 1 })}
                  title="Reset ke 100%"
                  className="text-[var(--text-muted)] hover:text-[var(--primary)]"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0.80"
            max="1.25"
            step="0.05"
            value={currentMarginScale}
            onChange={(e) => onChange({ marginScale: parseFloat(e.target.value) })}
            className="mt-1.5 h-1.5 w-full cursor-pointer accent-[var(--primary)]"
          />
        </div>
      </div>
    </div>
  );
}
