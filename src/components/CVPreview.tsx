import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink,
} from 'lucide-react';
import type { CVData, Customization, CustomSection } from '../types/cv';
import { FONTS } from '../types/cv';
import { densityTokens } from '../lib/defaults';

// A4 at 96dpi ≈ 794 × 1123px. Letter at 96dpi ≈ 816 × 1056px.
export const A4_W = 794;
export const A4_H = 1123;
export const LETTER_W = 816;
export const LETTER_H = 1056;

export const PAGE_DIMENSIONS = {
  a4: { w: 794, h: 1123, label: 'A4' },
  letter: { w: 816, h: 1056, label: 'Letter' },
};

// Helper to test if a hex color has high brightness
function isLightColor(hex?: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.replace('#', '');
  if (c.length !== 3 && c.length !== 6) return false;
  const r = parseInt(c.length === 3 ? c[0] + c[0] : c.slice(0, 2), 16);
  const g = parseInt(c.length === 3 ? c[1] + c[1] : c.slice(2, 4), 16);
  const b = parseInt(c.length === 3 ? c[2] + c[2] : c.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export function CVPreview({
  cv,
  custom,
  forPrint = false,
  pageCount: externalPageCount,
  onPageCountChange,
}: {
  cv: CVData;
  custom: Customization;
  forPrint?: boolean;
  pageCount?: number;
  onPageCountChange?: (count: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const font = FONTS.find((f) => f.id === custom.font)?.stack ?? FONTS[0].stack;
  const d = densityTokens[custom.density];
  const paper = PAGE_DIMENSIONS[custom.paperSize || 'a4'] || PAGE_DIMENSIONS.a4;
  const paperW = paper.w;
  const paperH = paper.h;

  useEffect(() => {
    if (forPrint) return;
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const contentEl = el.firstElementChild as HTMLElement | null;
      const h = contentEl ? contentEl.offsetHeight : el.scrollHeight;
      const count = Math.max(1, Math.ceil((h - 5) / paperH));
      setPageCount(count);
      onPageCountChange?.(count);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [forPrint, cv, custom, onPageCountChange, paperH]);

  const fontScale = custom.fontSizeScale ?? 1;
  const marginScale = custom.marginScale ?? 1;

  const isCreative = custom.template === 'creative';
  const effectivePageCount = Math.max(1, externalPageCount ?? pageCount);
  const minContainerHeight = paperH * effectivePageCount;

  // For Creative Split: 2-color hard-edge linear-gradient on page container
  // 34% width matches sidebar exactly, 66% matches main content pane
  const containerBackground = isCreative
    ? `linear-gradient(to right, ${custom.accent} 0%, ${custom.accent} 34%, #ffffff 34%, #ffffff 100%)`
    : '#ffffff';

  const style: CSSProperties = {
    width: paperW,
    minHeight: minContainerHeight,
    fontFamily: font,
    background: containerBackground,
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact',
    // custom props consumed by template CSS via inline style vars
    ['--accent' as string]: custom.accent,
    ['--line' as string]: String(Number((d.line * fontScale).toFixed(2))),
    ['--gap' as string]: `${(d.gap * marginScale).toFixed(3)}rem`,
    ['--sec' as string]: `${(d.section * marginScale).toFixed(3)}rem`,
  };

  const Template = TEMPLATE_MAP[custom.template];

  return (
    <div
      ref={forPrint ? undefined : containerRef}
      id={forPrint ? 'print-root' : undefined}
      data-paper={custom.paperSize || 'a4'}
      data-template={custom.template}
      lang={custom.documentLanguage || 'id'}
      className={`${forPrint ? 'cv-paper' : 'relative cv-paper shadow-paper'} ${isCreative ? '' : 'bg-white'} text-slate-900 flex flex-col`}
      style={style}
    >
      <Template cv={cv} accent={custom.accent} forPrint={forPrint} />

      {/* Page Break guidelines (Screen preview only, NEVER in print/PDF) */}
      {!forPrint && effectivePageCount > 1 && (
        <>
          {Array.from({ length: effectivePageCount - 1 }).map((_, idx) => {
            const pageBreakTop = (idx + 1) * paperH;
            return (
              <div
                key={idx}
                className="pointer-events-none absolute left-0 right-0 z-30 flex items-center justify-between border-b-2 border-dashed border-red-500/70 px-4 py-1 select-none"
                style={{ top: `${pageBreakTop}px` }}
              >
                <span className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                  Akhir Halaman {idx + 1} (Batas {paper.label})
                </span>
                <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 shadow-sm dark:bg-red-950 dark:text-red-300">
                  Halaman {idx + 2} dimulai
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function Contact({ cv, mono }: { cv: CVData; mono?: boolean }) {
  const p = cv.personal;
  const items = [
    p.email && { icon: Mail, text: p.email },
    p.phone && { icon: Phone, text: p.phone },
    p.location && { icon: MapPin, text: p.location },
    p.website && { icon: Globe, text: p.website },
    p.linkedin && { icon: Linkedin, text: p.linkedin },
    p.github && { icon: Github, text: p.github },
  ].filter(Boolean) as { icon: typeof Mail; text: string }[];

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[11px] ${mono ? 'font-mono' : ''}`}>
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-slate-600">
          <it.icon size={11} /> {it.text}
        </span>
      ))}
    </div>
  );
}

function Avatar({ cv, size = 88 }: { cv: CVData; size?: number }) {
  const p = cv.personal;
  if (!p.showAvatar || !p.avatar) return null;
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, border: '3px solid var(--accent)' }}
    >
      <img
        src={p.avatar}
        alt=""
        className="h-full w-full object-cover"
        style={{ transform: `scale(${p.avatarZoom}) translate(${p.avatarOffsetX}%, ${p.avatarOffsetY}%)` }}
      />
    </div>
  );
}

function SectionTitle({ children, mono }: { children: string; mono?: boolean }) {
  return (
    <h2
      className={`mb-1.5 text-[12px] font-bold uppercase tracking-wider ${mono ? 'font-mono' : ''}`}
      style={{
        color: 'var(--accent)',
        breakAfter: 'avoid',
        pageBreakAfter: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {children}
    </h2>
  );
}

const dateRange = (a: string, b: string, current: boolean) =>
  [a, current ? 'Present' : b].filter(Boolean).join(' – ');

function Experience({ cv, mono, pageBreakBefore }: { cv: CVData; mono?: boolean; pageBreakBefore?: boolean }) {
  const items = cv.experience.filter((e) => e.visible);
  if (!cv.sectionVisibility.experience || !items.length) return null;
  return (
    <section
      id="cv-section-experience"
      style={{
        marginBottom: 'var(--sec)',
        ...(pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}),
      }}
    >
      <SectionTitle mono={mono}>{cv.sectionLabels?.experience || 'Experience'}</SectionTitle>
      <div className="space-y-[var(--gap)]">
        {items.map((e) => (
          <div key={e.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold">{e.role || 'Role'}{e.company && <span className="font-normal text-slate-600"> · {e.company}</span>}</span>
              <span className="text-[10px] text-slate-500">{dateRange(e.startDate, e.endDate, e.current)}</span>
            </div>
            {e.location && <div className="text-[10px] text-slate-500">{e.location}</div>}
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11.5px] leading-[var(--line)] text-slate-700">
              {e.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Projects({ cv, mono, pageBreakBefore }: { cv: CVData; mono?: boolean; pageBreakBefore?: boolean }) {
  const items = cv.projects.filter((p) => p.visible);
  if (!cv.sectionVisibility.projects || !items.length) return null;
  return (
    <section
      id="cv-section-projects"
      style={{
        marginBottom: 'var(--sec)',
        ...(pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}),
      }}
    >
      <SectionTitle mono={mono}>{cv.sectionLabels?.projects || 'Projects'}</SectionTitle>
      <div className="space-y-[var(--gap)]">
        {items.map((p) => (
          <div key={p.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold">{p.title || 'Project'}</span>
              {p.link && <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--accent)' }}><ExternalLink size={9} />{p.link}</span>}
            </div>
            {p.description && <p className="text-[11.5px] leading-[var(--line)] text-slate-700">{p.description}</p>}
            {!!p.tech.length && <p className="mt-0.5 text-[10px] text-slate-500">{p.tech.join(' · ')}</p>}
            {!!p.achievements.length && (
              <ul className="mt-0.5 list-disc pl-4 text-[11px] text-slate-700">
                {p.achievements.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Education({ cv, mono, pageBreakBefore }: { cv: CVData; mono?: boolean; pageBreakBefore?: boolean }) {
  const items = cv.education.filter((e) => e.visible);
  if (!cv.sectionVisibility.education || !items.length) return null;
  return (
    <section
      id="cv-section-education"
      style={{
        marginBottom: 'var(--sec)',
        ...(pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}),
      }}
    >
      <SectionTitle mono={mono}>{cv.sectionLabels?.education || 'Education'}</SectionTitle>
      <div className="space-y-[var(--gap)]">
        {items.map((e) => (
          <div key={e.id} className="flex items-baseline justify-between" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div>
              <div className="text-[12.5px] font-semibold">{e.degree} {e.field && `· ${e.field}`}</div>
              <div className="text-[11px] text-slate-600">{e.institution}{e.details && ` — ${e.details}`}</div>
            </div>
            <span className="text-[10px] text-slate-500">{dateRange(e.startDate, e.endDate, false)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Certifications({ cv, mono, pageBreakBefore }: { cv: CVData; mono?: boolean; pageBreakBefore?: boolean }) {
  const items = cv.certifications.filter((c) => c.visible);
  if (!cv.sectionVisibility.certifications || !items.length) return null;
  return (
    <section
      id="cv-section-certifications"
      style={{
        marginBottom: 'var(--sec)',
        ...(pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}),
      }}
    >
      <SectionTitle mono={mono}>{cv.sectionLabels?.certifications || 'Certifications'}</SectionTitle>
      <ul className="space-y-0.5 text-[11.5px] text-slate-700">
        {items.map((c) => (
          <li key={c.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            {c.name}{c.issuer && ` — ${c.issuer}`}{c.date && ` (${c.date})`}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Honors({ cv, mono, pageBreakBefore }: { cv: CVData; mono?: boolean; pageBreakBefore?: boolean }) {
  const items = cv.honors.filter((h) => h.visible);
  if (!cv.sectionVisibility.honors || !items.length) return null;
  return (
    <section
      id="cv-section-honors"
      style={{
        marginBottom: 'var(--sec)',
        ...(pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}),
      }}
    >
      <SectionTitle mono={mono}>{cv.sectionLabels?.honors || 'Honors & Achievements'}</SectionTitle>
      <ul className="space-y-0.5 text-[11.5px] text-slate-700">
        {items.map((h) => (
          <li key={h.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <span className="font-medium">{h.title}</span>{h.issuer && ` — ${h.issuer}`}{h.date && ` (${h.date})`}{h.description && <span className="text-slate-600"> · {h.description}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Skills({ cv, mono, pageBreakBefore }: { cv: CVData; mono?: boolean; pageBreakBefore?: boolean }) {
  if (!cv.sectionVisibility.skills || !cv.skills.length) return null;
  return (
    <section
      id="cv-section-skills"
      style={{
        marginBottom: 'var(--sec)',
        ...(pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}),
      }}
    >
      <SectionTitle mono={mono}>{cv.sectionLabels?.skills || 'Skills'}</SectionTitle>
      <div className="space-y-1">
        {cv.skills.map((g) => (
          <div key={g.id} className="text-[11.5px]" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            {g.category && <span className="font-semibold">{g.category}: </span>}
            <span className="text-slate-700">{g.skills.join(', ')}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Summary({ cv, mono, pageBreakBefore }: { cv: CVData; mono?: boolean; pageBreakBefore?: boolean }) {
  if (!cv.sectionVisibility.summary || !cv.summary.trim()) return null;
  return (
    <section
      id="cv-section-summary"
      style={{
        marginBottom: 'var(--sec)',
        ...(pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}),
      }}
    >
      <SectionTitle mono={mono}>{cv.sectionLabels?.summary || 'Summary'}</SectionTitle>
      <p className="text-[11.5px] leading-[var(--line)] text-slate-700" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        {cv.summary}
      </p>
    </section>
  );
}

function RenderCustomSection({
  section,
  mono,
  pageBreakBefore,
}: {
  section: CustomSection;
  mono?: boolean;
  serif?: boolean;
  pageBreakBefore?: boolean;
}) {
  if (section.visible === false) return null;
  const hasContent =
    (section.type === 'bullets' && section.bullets && section.bullets.filter(Boolean).length > 0) ||
    (section.type === 'text' && section.text && section.text.trim().length > 0) ||
    (section.type === 'items' && section.items && section.items.length > 0);

  if (!hasContent) return null;

  return (
    <section
      id={`cv-section-${section.id}`}
      style={{
        marginBottom: 'var(--sec)',
        ...(pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}),
      }}
    >
      <SectionTitle mono={mono}>{section.title || 'Custom Section'}</SectionTitle>
      {section.type === 'bullets' && (
        <ul className="list-disc space-y-0.5 pl-4 text-[11.5px] leading-[var(--line)] text-slate-700">
          {section.bullets?.filter(Boolean).map((b, i) => (
            <li key={i} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              {b}
            </li>
          ))}
        </ul>
      )}
      {section.type === 'text' && (
        <p
          className="text-[11.5px] leading-[var(--line)] text-slate-700 whitespace-pre-line"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          {section.text}
        </p>
      )}
      {section.type === 'items' && (
        <div className="space-y-[var(--gap)]">
          {section.items?.map((it) => (
            <div key={it.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <div className="flex items-baseline justify-between">
                <span className="text-[12.5px] font-semibold">
                  {it.title || 'Item'}
                  {it.subtitle && <span className="font-normal text-slate-600"> · {it.subtitle}</span>}
                </span>
                {it.date && <span className="text-[10px] text-slate-500">{it.date}</span>}
              </div>
              {it.description && (
                <p className="mt-0.5 text-[11.5px] leading-[var(--line)] text-slate-700">
                  {it.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Default orders matching pre-Tahap F behavior exactly
export const DEFAULT_ORDER_MODERN = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'honors'];
export const DEFAULT_ORDER_TECH = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'honors'];
export const DEFAULT_ORDER_CREATIVE = ['summary', 'experience', 'projects', 'education', 'certifications', 'honors'];
export const DEFAULT_ORDER_CLASSIC = ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'honors'];

export function getEffectiveSectionOrder(cv: CVData, defaultOrder: string[]): string[] {
  const customIds = (cv.customSections || []).map((s) => s.id);
  const baseOrder = cv.sectionOrder && cv.sectionOrder.length > 0 ? cv.sectionOrder : defaultOrder;

  const order: string[] = [];
  for (const id of baseOrder) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }
  for (const cid of customIds) {
    if (!order.includes(cid)) {
      order.push(cid);
    }
  }
  for (const defId of defaultOrder) {
    if (!order.includes(defId)) {
      order.push(defId);
    }
  }
  return order;
}

function renderSectionById(id: string, cv: CVData, mono?: boolean, serif?: boolean, forPrint?: boolean) {
  const customSec = cv.customSections?.find((s) => s.id === id);
  const isPageBreak = !!cv.pageBreakSections?.[id] || !!customSec?.pageBreakBefore;

  let node: React.ReactNode = null;

  if (customSec) {
    node = (
      <RenderCustomSection
        key={customSec.id}
        section={customSec}
        mono={mono}
        serif={serif}
        pageBreakBefore={isPageBreak}
      />
    );
  } else {
    switch (id) {
      case 'summary':
        node = <Summary key="summary" cv={cv} mono={mono} pageBreakBefore={isPageBreak} />;
        break;
      case 'experience':
        node = <Experience key="experience" cv={cv} mono={mono} pageBreakBefore={isPageBreak} />;
        break;
      case 'projects':
        node = <Projects key="projects" cv={cv} mono={mono} pageBreakBefore={isPageBreak} />;
        break;
      case 'skills':
        node = <Skills key="skills" cv={cv} mono={mono} pageBreakBefore={isPageBreak} />;
        break;
      case 'education':
        node = <Education key="education" cv={cv} mono={mono} pageBreakBefore={isPageBreak} />;
        break;
      case 'certifications':
        node = <Certifications key="certifications" cv={cv} mono={mono} pageBreakBefore={isPageBreak} />;
        break;
      case 'honors':
        node = <Honors key="honors" cv={cv} mono={mono} pageBreakBefore={isPageBreak} />;
        break;
      default:
        return null;
    }
  }

  if (!node) return null;

  return (
    <div key={id} className={isPageBreak ? 'cv-page-break-before' : undefined}>
      {isPageBreak && !forPrint && (
        <div className="mb-2 flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50/80 px-2 py-0.5 text-[10.5px] font-medium text-blue-700 select-none print:hidden">
          <span>📄 Pemisah Halaman Manual — Dimulai di halaman baru saat dicetak/PDF</span>
        </div>
      )}
      {node}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
type TplProps = { cv: CVData; accent: string; forPrint?: boolean };

function ModernTemplate({ cv, forPrint }: TplProps) {
  const p = cv.personal;
  const orderedIds = getEffectiveSectionOrder(cv, DEFAULT_ORDER_MODERN);

  return (
    <div className="p-10">
      <header id="cv-section-personal" className="mb-5 flex items-center gap-5 border-b pb-4" style={{ borderColor: 'var(--accent)', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <Avatar cv={cv} />
        <div>
          <h1 className="text-[26px] font-extrabold leading-tight">{p.fullName || 'Your Name'}</h1>
          <p className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>{p.title || 'Your professional title'}</p>
          <div className="mt-2"><Contact cv={cv} /></div>
        </div>
      </header>
      {orderedIds.map((id) => renderSectionById(id, cv, false, false, forPrint))}
    </div>
  );
}

function TechTemplate({ cv, forPrint }: TplProps) {
  const p = cv.personal;
  const orderedIds = getEffectiveSectionOrder(cv, DEFAULT_ORDER_TECH);

  return (
    <div className="p-10 font-mono">
      <header id="cv-section-personal" className="mb-4" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <h1 className="text-[24px] font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="text-[12px]" style={{ color: 'var(--accent)' }}>{p.title || 'Your professional title'}</p>
        <div className="mt-2"><Contact cv={cv} mono /></div>
        <div className="mt-3 h-px w-full" style={{ background: 'var(--accent)' }} />
      </header>
      {orderedIds.map((id) => renderSectionById(id, cv, true, false, forPrint))}
    </div>
  );
}

function CreativeTemplate({ cv, accent, forPrint }: TplProps) {
  const p = cv.personal;
  // In Creative, sidebar holds personal + skills.
  // Main pane renders ordered content sections (excluding skills).
  const orderedIds = getEffectiveSectionOrder(cv, DEFAULT_ORDER_CREATIVE).filter((id) => id !== 'skills');
  const light = isLightColor(accent);

  return (
    <div className="flex w-full">
      {/* Sidebar - background drawn by page container linear-gradient */}
      <aside
        id="cv-section-personal"
        className="w-[34%] p-6 text-white bg-transparent"
        style={{
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          textShadow: light ? '0 1px 2px rgba(0, 0, 0, 0.75), 0 0 1px rgba(0, 0, 0, 0.85)' : undefined,
        }}
      >
        <div
          className="flex flex-col items-center text-center cv-item-avoid-break"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          {p.showAvatar && p.avatar && (
            <div className="mb-3 h-28 w-28 overflow-hidden rounded-full border-4 border-white/40 shadow-sm">
              <img
                src={p.avatar}
                alt=""
                className="h-full w-full object-cover"
                style={{ transform: `scale(${p.avatarZoom}) translate(${p.avatarOffsetX}%, ${p.avatarOffsetY}%)` }}
              />
            </div>
          )}
          <h1 className="text-[20px] font-extrabold leading-tight">{p.fullName || 'Your Name'}</h1>
          <p className="text-[11px] opacity-90">{p.title || 'Your title'}</p>
        </div>
        <div
          className="mt-5 space-y-2 text-[10.5px] cv-item-avoid-break"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          {p.email && <div className="flex items-center gap-1.5"><Mail size={11} /> {p.email}</div>}
          {p.phone && <div className="flex items-center gap-1.5"><Phone size={11} /> {p.phone}</div>}
          {p.location && <div className="flex items-center gap-1.5"><MapPin size={11} /> {p.location}</div>}
          {p.website && <div className="flex items-center gap-1.5"><Globe size={11} /> {p.website}</div>}
          {p.linkedin && <div className="flex items-center gap-1.5"><Linkedin size={11} /> {p.linkedin}</div>}
          {p.github && <div className="flex items-center gap-1.5"><Github size={11} /> {p.github}</div>}
        </div>
        {cv.sectionVisibility.skills && !!cv.skills.length && (
          <div className="mt-5" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2
              className="mb-1.5 text-[11px] font-bold uppercase tracking-wider cv-heading-avoid-orphan"
              style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
            >
              {cv.sectionLabels?.skills || 'Skills'}
            </h2>
            {cv.skills.map((g) => (
              <div
                key={g.id}
                className="mb-1.5 text-[10.5px] cv-item-avoid-break"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                <div className="font-semibold">{g.category}</div>
                <div className="opacity-90">{g.skills.join(', ')}</div>
              </div>
            ))}
          </div>
        )}
      </aside>
      {/* Main */}
      <div className="flex-1 p-7 bg-transparent">
        {orderedIds.map((id) => renderSectionById(id, cv, false, false, forPrint))}
      </div>
    </div>
  );
}

function ClassicTemplate({ cv, forPrint }: TplProps) {
  const p = cv.personal;
  const orderedIds = getEffectiveSectionOrder(cv, DEFAULT_ORDER_CLASSIC);

  return (
    <div className="p-12" style={{ fontFamily: 'Georgia, serif' }}>
      <header id="cv-section-personal" className="mb-5 text-center" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <h1 className="text-[26px] font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="text-[13px] italic text-slate-700">{p.title || 'Your professional title'}</p>
        <div className="mt-2 flex justify-center"><Contact cv={cv} /></div>
      </header>
      {orderedIds.map((id) => renderSectionById(id, cv, false, true, forPrint))}
    </div>
  );
}

const TEMPLATE_MAP = {
  modern: ModernTemplate,
  tech: TechTemplate,
  creative: CreativeTemplate,
  classic: ClassicTemplate,
} as const;
