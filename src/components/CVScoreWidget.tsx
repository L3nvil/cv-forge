import { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, ChevronDown, ShieldCheck } from 'lucide-react';
import type { CVData } from '../types/cv';

interface SuggestionItem {
  id: string;
  section: string;
  group: 'Kelengkapan' | 'ATS';
  label: string;
  tip: string;
  passed: boolean;
  weight: number;
}

const ACTION_VERBS = [
  // English
  'led', 'developed', 'built', 'designed', 'increased', 'managed', 'created', 'implemented',
  'architected', 'automated', 'engineered', 'spearheaded', 'reduced', 'improved', 'optimized',
  'scaled', 'launched', 'delivered', 'analyzed', 'orchestrated', 'streamlined', 'generated',
  // Indonesian
  'memimpin', 'mengembangkan', 'membangun', 'mendesain', 'meningkatkan', 'mengelola', 'membuat',
  'mengimplementasikan', 'mengarsiteki', 'mengotomatisasi', 'mengoptimalkan', 'meluncurkan',
  'merancang', 'menganalisis', 'menghasilkan', 'mengurangi', 'mempercepat',
];

export function CVScoreWidget({
  cv,
  onFocusSection,
  open: controlledOpen,
  onToggle: controlledToggle,
}: {
  cv: CVData;
  onFocusSection?: (section: string) => void;
  open?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleToggle = controlledToggle || (() => setInternalOpen((v) => !v));

  const analysis = useMemo(() => {
    const suggestions: SuggestionItem[] = [];

    // --- Kelengkapan Profil & Kontak ---
    const hasName = !!cv.personal.fullName.trim();
    suggestions.push({
      id: 'name',
      section: 'personal',
      group: 'Kelengkapan',
      label: 'Nama Lengkap',
      tip: 'Cantumkan nama lengkap profesional Anda.',
      passed: hasName,
      weight: 10,
    });

    const hasTitle = !!cv.personal.title.trim();
    suggestions.push({
      id: 'title',
      section: 'personal',
      group: 'Kelengkapan',
      label: 'Judul Profesi / Headline',
      tip: 'Beri judul spesifik, misal: "Senior Backend Engineer · Go & AWS".',
      passed: hasTitle,
      weight: 10,
    });

    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cv.personal.email.trim());
    suggestions.push({
      id: 'email',
      section: 'personal',
      group: 'Kelengkapan',
      label: 'Email Valid',
      tip: 'Gunakan alamat email profesional yang valid.',
      passed: hasEmail,
      weight: 10,
    });

    const hasPhone = cv.personal.phone.trim().length >= 8;
    suggestions.push({
      id: 'phone',
      section: 'personal',
      group: 'Kelengkapan',
      label: 'Nomor Telepon',
      tip: 'Cantumkan nomor telepon aktif yang mudah dihubungi.',
      passed: hasPhone,
      weight: 5,
    });

    const hasLocation = !!cv.personal.location.trim();
    suggestions.push({
      id: 'location',
      section: 'personal',
      group: 'Kelengkapan',
      label: 'Lokasi / Kota',
      tip: 'Sertakan kota dan negara domisili (misal: Jakarta, Indonesia).',
      passed: hasLocation,
      weight: 5,
    });

    // --- Kelengkapan Riwayat Pendidikan & Pengalaman ---
    const hasEdu = cv.education.some((e) => e.institution.trim() && (e.degree.trim() || e.field.trim()));
    suggestions.push({
      id: 'education',
      section: 'education',
      group: 'Kelengkapan',
      label: 'Riwayat Pendidikan',
      tip: 'Cantumkan nama institusi dan gelar/jurusan pendidikan.',
      passed: hasEdu,
      weight: 10,
    });

    const hasExp = cv.experience.length > 0;
    const hasExpDetails = cv.experience.some(
      (e) => e.role.trim() && e.company.trim() && e.bullets.filter((b) => b.trim()).length >= 2
    );
    suggestions.push({
      id: 'experience',
      section: 'experience',
      group: 'Kelengkapan',
      label: 'Pengalaman Kerja & Pencapaian',
      tip: 'Tambahkan minimal 1 pengalaman kerja dengan 2+ poin bullet pencapaian.',
      passed: hasExp && hasExpDetails,
      weight: 20,
    });

    // --- Kriteria Optimasi ATS ---
    const summaryWords = cv.summary.trim() ? cv.summary.trim().split(/\s+/).length : 0;
    const summaryOptimal = summaryWords >= 35 && summaryWords <= 90;
    suggestions.push({
      id: 'summary',
      section: 'summary',
      group: 'ATS',
      label: 'Ringkasan Profesional ATS',
      tip: `Panjang ringkasan ideal 40–80 kata (saat ini: ${summaryWords} kata).`,
      passed: summaryOptimal,
      weight: 15,
    });

    const allBullets = cv.experience.flatMap((e) => e.bullets).map((b) => b.trim().toLowerCase());
    const hasActionVerbs = allBullets.some((b) =>
      ACTION_VERBS.some((verb) => b.startsWith(verb) || b.includes(` ${verb} `))
    );
    suggestions.push({
      id: 'action_verbs',
      section: 'experience',
      group: 'ATS',
      label: 'Kata Kerja Aksi (Action Verbs)',
      tip: 'Gunakan kata kerja aksi di awal bullet (contoh: Mengembangkan, Meningkatkan, Led, Designed).',
      passed: hasActionVerbs,
      weight: 5,
    });

    const totalSkills = cv.skills.reduce((acc, g) => acc + g.skills.length, 0);
    const hasEnoughSkills = totalSkills >= 5;
    suggestions.push({
      id: 'skills',
      section: 'skills',
      group: 'ATS',
      label: 'Keahlian Teknis (5+ Skill)',
      tip: `Sertakan minimal 5 keahlian relevan yang dicari mesin ATS (saat ini: ${totalSkills}).`,
      passed: hasEnoughSkills,
      weight: 10,
    });

    // --- Custom Sections (Kelengkapan) ---
    if (cv.customSections && cv.customSections.length > 0) {
      cv.customSections.forEach((cs) => {
        const hasContent =
          (cs.type === 'bullets' && (cs.bullets || []).filter(Boolean).length > 0) ||
          (cs.type === 'text' && !!cs.text?.trim()) ||
          (cs.type === 'items' && (cs.items || []).some((it) => it.title.trim()));

        suggestions.push({
          id: `custom_${cs.id}`,
          section: cs.id,
          group: 'Kelengkapan',
          label: cs.title || 'Section Kustom',
          tip: `Lengkapi isi untuk section "${cs.title || 'Kustom'}" agar dokumen lebih informatif.`,
          passed: hasContent,
          weight: 5,
        });
      });
    }

    const earnedWeight = suggestions.filter((s) => s.passed).reduce((acc, s) => acc + s.weight, 0);
    const totalWeight = suggestions.reduce((acc, s) => acc + s.weight, 0);
    const percentage = Math.round((earnedWeight / totalWeight) * 100);

    const kelengkapanList = suggestions.filter((s) => s.group === 'Kelengkapan');
    const atsList = suggestions.filter((s) => s.group === 'ATS');

    return {
      percentage,
      suggestions,
      kelengkapanList,
      atsList,
      passedCount: suggestions.filter((s) => s.passed).length,
      totalCount: suggestions.length,
    };
  }, [cv]);

  const isPassed = analysis.percentage >= 80;
  const statusText = isPassed ? 'Baik (ATS Ready)' : 'Perlu Perbaikan';

  return (
    <div className="overflow-hidden rounded-card border border-[var(--border)] bg-[var(--surface)]">
      {/* Header bar: identical structure and tokens as AccordionSection */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="text-[var(--text-muted)] shrink-0">
            <ShieldCheck size={18} />
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className="text-left transition duration-fast ease-standard active:scale-[0.98] min-w-0"
          >
            <span className="text-lg font-semibold tracking-[-0.374px] text-[var(--text)] truncate block">
              Skor Kelengkapan & ATS
            </span>
          </button>
          {/* Status Chip */}
          <span className="chip hidden sm:inline-flex items-center gap-1.5 text-xs shrink-0">
            {isPassed ? (
              <CheckCircle2 size={14} className="text-[var(--primary)]" />
            ) : (
              <AlertCircle size={14} className="text-[var(--text-muted)]" />
            )}
            <span>{analysis.percentage}% · {statusText}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile status indicator */}
          <span className="sm:hidden text-xs font-semibold text-[var(--text)]">
            {analysis.percentage}%
          </span>
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isOpen ? 'Tutup detail skor' : 'Buka detail skor'}
            className="grid h-10 w-10 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] active:scale-[0.95]"
          >
            <ChevronDown
              size={18}
              className="transition-transform duration-base ease-standard"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* Simple Progress Bar with Primary Color */}
      <div className="h-1.5 w-full bg-[var(--surface-pearl)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-base ease-standard"
          style={{ width: `${analysis.percentage}%` }}
        />
      </div>

      {/* Expandable Suggestions Body */}
      {isOpen && (
        <div className="animate-dropdown-enter border-t border-[var(--border)] p-4 sm:p-6 space-y-6">
          {/* Status summary banner */}
          <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              {isPassed ? (
                <CheckCircle2 size={16} className="text-[var(--primary)] shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-[var(--text-muted)] shrink-0" />
              )}
              <span>
                {analysis.passedCount} dari {analysis.totalCount} kriteria terpenuhi · {statusText}
              </span>
            </div>
            <span className="text-xs hidden sm:inline text-[var(--text-muted)]">
              Saran bersifat rekomendasi non-blokir
            </span>
          </div>

          {/* Group 1: Kelengkapan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-semibold tracking-[-0.12px] text-[var(--text)]">
                Kelengkapan Profil & Riwayat
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {analysis.kelengkapanList.filter((s) => s.passed).length}/{analysis.kelengkapanList.length} selesai
              </span>
            </div>
            <div className="space-y-1">
              {analysis.kelengkapanList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onFocusSection?.(item.section)}
                  title={`Klik untuk melompat ke bagian ${item.label}`}
                  className="flex w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">
                      {item.passed ? (
                        <CheckCircle2 size={16} className="text-[var(--primary)]" aria-label="Terpenuhi" />
                      ) : (
                        <AlertCircle size={16} className="text-[var(--text-muted)]" aria-label="Perlu dilengkapi" />
                      )}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                      <span className={`text-xs font-semibold truncate ${item.passed ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] truncate hidden md:inline">
                        — {item.tip}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-normal text-[var(--text-muted)] shrink-0">
                    {item.passed ? 'Terpenuhi' : `+${item.weight}%`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: ATS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-semibold tracking-[-0.12px] text-[var(--text)]">
                Optimasi Format ATS
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {analysis.atsList.filter((s) => s.passed).length}/{analysis.atsList.length} selesai
              </span>
            </div>
            <div className="space-y-1">
              {analysis.atsList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onFocusSection?.(item.section)}
                  title={`Klik untuk melompat ke bagian ${item.label}`}
                  className="flex w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left transition duration-fast ease-standard hover:bg-[var(--surface-pearl)] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">
                      {item.passed ? (
                        <CheckCircle2 size={16} className="text-[var(--primary)]" aria-label="Terpenuhi" />
                      ) : (
                        <AlertCircle size={16} className="text-[var(--text-muted)]" aria-label="Perlu dilengkapi" />
                      )}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                      <span className={`text-xs font-semibold truncate ${item.passed ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] truncate hidden md:inline">
                        — {item.tip}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-normal text-[var(--text-muted)] shrink-0">
                    {item.passed ? 'Terpenuhi' : `+${item.weight}%`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
