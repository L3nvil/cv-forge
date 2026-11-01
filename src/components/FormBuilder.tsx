import { useState } from 'react';
import {
  User, FileText, Briefcase, FolderGit2, GraduationCap, Wrench, Award,
  Sparkles, Trash2, Plus, Wand2, ChevronUp, ChevronDown, Copy, GripVertical,
} from 'lucide-react';
import type {
  CVData, ExperienceItem, ProjectItem, EducationItem, CertificationItem, SkillGroup, HonorItem,
  CustomSection, CustomSectionType, CustomSectionItem,
} from '../types/cv';
import { uid, emptyCV } from '../lib/defaults';
import { polishSummary, suggestBullet } from '../lib/polish';
import { AccordionSection, Field, TagInput, AddButton, DateInput, DEFAULT_SKILL_SUGGESTIONS } from './ui';
import { AvatarUploader } from './AvatarUploader';
import { CVScoreWidget } from './CVScoreWidget';
import { getEffectiveSectionOrder, DEFAULT_ORDER_MODERN } from './CVPreview';

function formatLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPhoneIndo(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('08')) {
    const rest = digits.slice(1);
    if (rest.length >= 9) {
      return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
    }
    return `+62 ${rest}`;
  }
  if (digits.startsWith('628')) {
    const rest = digits.slice(2);
    if (rest.length >= 9) {
      return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
    }
    return `+62 ${rest}`;
  }
  return trimmed;
}

function SectionResetButton({ onReset, label = 'Kosongkan section ini' }: { onReset: () => void; label?: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <span className="text-xs text-[var(--text-muted)]">Yakin ingin mengosongkan?</span>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onReset();
          }}
          className="rounded-control px-2 py-0.5 text-xs font-semibold text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
        >
          Ya, Kosongkan
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-control px-2 py-0.5 text-xs text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end pt-2 border-t border-[var(--border-subtle)]">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--status-danger)] transition duration-fast"
      >
        {label}
      </button>
    </div>
  );
}

type SetCV = (updater: (cv: CVData) => CVData) => void;

function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

function duplicateItem<T extends { id: string }>(list: T[], index: number): T[] {
  const item = list[index];
  const copy = { ...item, id: uid() };
  const next = [...list];
  next.splice(index + 1, 0, copy);
  return next;
}

function ItemHeader({
  title,
  index,
  total,
  section,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  title: string;
  index: number;
  total: number;
  section: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2 mb-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-[-0.12px] text-[var(--text)]">
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ section, index }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          title="Seret untuk mengatur urutan"
          aria-label="Seret untuk mengatur urutan"
          className="grid h-6 w-5 place-items-center cursor-grab rounded-control text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:cursor-grabbing"
        >
          <GripVertical size={13} />
        </span>
        <span>{title} #{index + 1}</span>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={index === 0}
          onClick={onMoveUp}
          title="Pindahkan ke atas"
          aria-label="Pindahkan ke atas"
          className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] disabled:opacity-20 disabled:pointer-events-none active:scale-[0.95]"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={onMoveDown}
          title="Pindahkan ke bawah"
          aria-label="Pindahkan ke bawah"
          className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] disabled:opacity-20 disabled:pointer-events-none active:scale-[0.95]"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          title="Duplikat item ini"
          aria-label="Duplikat item"
          className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Hapus item ini"
          aria-label="Hapus item"
          className="grid h-7 w-7 place-items-center rounded-control text-[var(--status-danger)] transition duration-fast ease-standard hover:bg-[var(--status-danger-bg)] active:scale-[0.95]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function FormBuilder({
  cv,
  setCV,
  accent,
  onDeleteToast,
  onActiveSectionChange,
}: {
  cv: CVData;
  setCV: SetCV;
  accent: string;
  onDeleteToast?: (msg: string) => void;
  onActiveSectionChange?: (section: string) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('cvforge.accordion.v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { personal: true, summary: true, experience: true, projects: true, education: true, skills: true, honors: true };
  });

  const toggle = (k: string) => {
    setOpen((o) => {
      const next = { ...o, [k]: !o[k] };
      try {
        localStorage.setItem('cvforge.accordion.v1', JSON.stringify(next));
      } catch {}
      return next;
    });
    onActiveSectionChange?.(k);
  };

  const effectiveOrder = getEffectiveSectionOrder(cv, DEFAULT_ORDER_MODERN);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...effectiveOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setCV((c) => ({ ...c, sectionOrder: newOrder }));
  };

  const handlePageBreakChange = (secId: string, val: boolean) => {
    setCV((c) => ({
      ...c,
      pageBreakSections: { ...(c.pageBreakSections || {}), [secId]: val },
    }));
  };

  const addCustomSection = (type: CustomSectionType) => {
    const defaultTitles: Record<CustomSectionType, string> = {
      bullets: 'Aktivitas & Keterlibatan',
      text: 'Catatan Tambahan',
      items: 'Pengalaman Organisasi',
    };
    const newId = `sec_${uid()}`;
    const newSec: CustomSection = {
      id: newId,
      title: defaultTitles[type],
      type,
      visible: true,
      bullets: type === 'bullets' ? [''] : undefined,
      text: type === 'text' ? '' : undefined,
      items: type === 'items' ? [{ id: uid(), title: '', subtitle: '', date: '', description: '' }] : undefined,
    };
    setCV((c) => ({
      ...c,
      customSections: [...(c.customSections || []), newSec],
      sectionOrder: [...effectiveOrder, newId],
    }));
    setOpen((o) => ({ ...o, [newId]: true }));
    onActiveSectionChange?.(newId);
  };

  const deleteCustomSection = (id: string, title: string) => {
    setCV((c) => ({
      ...c,
      customSections: (c.customSections || []).filter((s) => s.id !== id),
      sectionOrder: (c.sectionOrder || effectiveOrder).filter((sId) => sId !== id),
    }));
    onDeleteToast?.(`Section "${title || 'Kustom'}" dihapus`);
  };

  const updateCustomSection = (id: string, patch: Partial<CustomSection>) => {
    setCV((c) => ({
      ...c,
      customSections: (c.customSections || []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = { personal: true, score: true };
    effectiveOrder.forEach((id) => { next[id] = true; });
    setOpen(next);
    try { localStorage.setItem('cvforge.accordion.v1', JSON.stringify(next)); } catch {}
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = { personal: false, score: false };
    effectiveOrder.forEach((id) => { next[id] = false; });
    setOpen(next);
    try { localStorage.setItem('cvforge.accordion.v1', JSON.stringify(next)); } catch {}
  };

  const vis = cv.sectionVisibility;
  const setVis = (k: keyof typeof vis, v: boolean) =>
    setCV((c) => ({ ...c, sectionVisibility: { ...c.sectionVisibility, [k]: v } }));

  return (
    <div className="space-y-6">
      {/* Top Accordion Controls */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-normal text-[var(--text-muted)]">Formulir Riwayat Hidup</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] active:scale-[0.95]"
          >
            Buka Semua
          </button>
          <span className="text-xs text-[var(--border)]">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] active:scale-[0.95]"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* CV Completeness & ATS Heuristics Meter */}
      <CVScoreWidget
        cv={cv}
        open={open.score ?? false}
        onToggle={() => toggle('score')}
        onFocusSection={(sec) => {
          if (!open[sec]) toggle(sec);
          onActiveSectionChange?.(sec);
        }}
      />

      {/* 1. Personal + avatar (Header of resume) -------------------------------- */}
      <AccordionSection title="Personal Info & Avatar" icon={<User size={18} />} open={!!open.personal} onToggle={() => toggle('personal')}>
        <div className="space-y-4" onFocus={() => onActiveSectionChange?.('personal')}>
          <AvatarUploader
            personal={cv.personal}
            onChange={(patch) => setCV((c) => ({ ...c, personal: { ...c.personal, ...patch } }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full name"><input className="app-input" value={cv.personal.fullName} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, fullName: e.target.value } }))} placeholder="Jane Doe" /></Field>
            <Field label="Headline / title" hint="A punchy role, e.g. 'Senior Backend Engineer · Payments'"><input className="app-input" value={cv.personal.title} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, title: e.target.value } }))} placeholder="Senior Software Engineer" /></Field>
            <Field
              label="Email"
              hint={cv.personal.email?.trim() && !EMAIL_REGEX.test(cv.personal.email.trim()) ? 'Format email tidak valid (contoh: user@domain.com)' : undefined}
            >
              <input
                className={`app-input ${cv.personal.email?.trim() && !EMAIL_REGEX.test(cv.personal.email.trim()) ? '!border-amber-500' : ''}`}
                type="email"
                value={cv.personal.email}
                onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, email: e.target.value } }))}
                placeholder="jane@example.com"
              />
            </Field>
            <Field label="Phone" hint="Konversi otomatis format +62">
              <input
                className="app-input"
                type="tel"
                value={cv.personal.phone}
                onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, phone: e.target.value } }))}
                onBlur={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, phone: formatPhoneIndo(e.target.value) } }))}
                placeholder="+62 812-3456-7890"
              />
            </Field>
            <Field label="Location"><input className="app-input" value={cv.personal.location} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, location: e.target.value } }))} placeholder="City, Country" /></Field>
            <Field label="Website"><input className="app-input" value={cv.personal.website} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, website: e.target.value } }))} onBlur={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, website: formatLink(e.target.value) } }))} placeholder="yoursite.dev" /></Field>
            <Field label="LinkedIn"><input className="app-input" value={cv.personal.linkedin} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, linkedin: e.target.value } }))} onBlur={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, linkedin: formatLink(e.target.value) } }))} placeholder="linkedin.com/in/you" /></Field>
            <Field label="GitHub"><input className="app-input" value={cv.personal.github} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, github: e.target.value } }))} onBlur={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, github: formatLink(e.target.value) } }))} placeholder="github.com/you" /></Field>
          </div>
          <SectionResetButton
            label="Kosongkan informasi pribadi"
            onReset={() => {
              setCV((c) => ({
                ...c,
                personal: { ...emptyCV.personal },
              }));
              onDeleteToast?.('Informasi pribadi dikosongkan');
            }}
          />
        </div>
      </AccordionSection>

      {/* Dynamic Content Sections in effectiveOrder */}
      {effectiveOrder.map((secId, idx) => {
        const canMoveUp = idx > 0;
        const canMoveDown = idx < effectiveOrder.length - 1;
        const onMoveUp = () => moveSection(idx, 'up');
        const onMoveDown = () => moveSection(idx, 'down');
        const pageBreakBefore = !!cv.pageBreakSections?.[secId];
        const onPageBreakBeforeChange = (val: boolean) => handlePageBreakChange(secId, val);

        if (secId === 'summary') {
          return (
            <AccordionSection
              key="summary"
              title="Professional Summary"
              customTitle={cv.sectionLabels?.summary}
              onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, summary: v } }))}
              onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, summary: undefined } }))}
              icon={<FileText size={18} />}
              open={!!open.summary}
              onToggle={() => toggle('summary')}
              visible={vis.summary}
              onVisibleChange={(v) => setVis('summary', v)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              pageBreakBefore={pageBreakBefore}
              onPageBreakBeforeChange={onPageBreakBeforeChange}
            >
              <div className="space-y-3" onFocus={() => onActiveSectionChange?.('summary')}>
                <Field label="Professional summary" hint="3-4 sentences highlighting impact, domain expertise, and career trajectory">
                  <textarea
                    className="app-textarea min-h-[96px]"
                    spellCheck={true}
                    value={cv.summary}
                    placeholder="Backend engineer with 6+ years designing distributed systems…"
                    onChange={(e) => setCV((c) => ({ ...c, summary: e.target.value }))}
                  />
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[var(--text-muted)]">
                  <span>
                    {cv.summary.trim() ? cv.summary.trim().split(/\s+/).length : 0} kata · {cv.summary.length} karakter{' '}
                    <span className={(cv.summary.trim() ? cv.summary.trim().split(/\s+/).length : 0) >= 40 && (cv.summary.trim() ? cv.summary.trim().split(/\s+/).length : 0) <= 80 ? 'font-semibold text-[var(--status-success)]' : ''}>
                      (Saran ATS: 40–80 kata)
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline rounded-pill px-4 py-1.5 text-xs text-[var(--primary)] hover:border-[var(--primary)] active:scale-[0.95]"
                    onClick={() => setCV((c) => ({ ...c, summary: polishSummary(c.summary) }))}
                  >
                    <Sparkles size={14} /> <span>Polish writing</span>
                  </button>
                </div>
                {cv.summary && (
                  <SectionResetButton
                    label="Kosongkan ringkasan"
                    onReset={() => {
                      setCV((c) => ({ ...c, summary: '' }));
                      onDeleteToast?.('Ringkasan dikosongkan');
                    }}
                  />
                )}
              </div>
            </AccordionSection>
          );
        }

        if (secId === 'experience') {
          return (
            <AccordionSection
              key="experience"
              title="Work & Leadership Experience"
              customTitle={cv.sectionLabels?.experience}
              onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, experience: v } }))}
              onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, experience: undefined } }))}
              icon={<Briefcase size={18} />}
              open={!!open.experience}
              onToggle={() => toggle('experience')}
              visible={vis.experience}
              onVisibleChange={(v) => setVis('experience', v)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              pageBreakBefore={pageBreakBefore}
              onPageBreakBeforeChange={onPageBreakBeforeChange}
            >
              <div className="space-y-4" onFocus={() => onActiveSectionChange?.('experience')}>
                {cv.experience.map((item, i) => (
                  <ExperienceEditor
                    key={item.id}
                    item={item}
                    index={i}
                    total={cv.experience.length}
                    onChange={(patch) => setCV((c) => ({ ...c, experience: c.experience.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
                    onMoveUp={() => setCV((c) => ({ ...c, experience: reorderList(c.experience, i, i - 1) }))}
                    onMoveDown={() => setCV((c) => ({ ...c, experience: reorderList(c.experience, i, i + 1) }))}
                    onDuplicate={() => setCV((c) => ({ ...c, experience: duplicateItem(c.experience, i) }))}
                    onRemove={() => {
                      setCV((c) => ({ ...c, experience: c.experience.filter((x) => x.id !== item.id) }));
                      onDeleteToast?.('Pengalaman kerja dihapus');
                    }}
                    onReorder={(fromIdx, toIdx) => setCV((c) => ({ ...c, experience: reorderList(c.experience, fromIdx, toIdx) }))}
                  />
                ))}
                <AddButton label="Add experience" onClick={() => setCV((c) => ({ ...c, experience: [...c.experience, newExperience()] }))} />
                {cv.experience.length > 0 && (
                  <SectionResetButton
                    label="Kosongkan daftar pengalaman"
                    onReset={() => {
                      setCV((c) => ({ ...c, experience: [] }));
                      onDeleteToast?.('Daftar pengalaman dikosongkan');
                    }}
                  />
                )}
              </div>
            </AccordionSection>
          );
        }

        if (secId === 'projects') {
          return (
            <AccordionSection
              key="projects"
              title="Selected Projects"
              customTitle={cv.sectionLabels?.projects}
              onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, projects: v } }))}
              onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, projects: undefined } }))}
              icon={<FolderGit2 size={18} />}
              open={!!open.projects}
              onToggle={() => toggle('projects')}
              visible={vis.projects}
              onVisibleChange={(v) => setVis('projects', v)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              pageBreakBefore={pageBreakBefore}
              onPageBreakBeforeChange={onPageBreakBeforeChange}
            >
              <div className="space-y-4" onFocus={() => onActiveSectionChange?.('projects')}>
                {cv.projects.map((item, i) => (
                  <ProjectEditor
                    key={item.id}
                    item={item}
                    index={i}
                    total={cv.projects.length}
                    accent={accent}
                    onChange={(patch) => setCV((c) => ({ ...c, projects: c.projects.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
                    onMoveUp={() => setCV((c) => ({ ...c, projects: reorderList(c.projects, i, i - 1) }))}
                    onMoveDown={() => setCV((c) => ({ ...c, projects: reorderList(c.projects, i, i + 1) }))}
                    onDuplicate={() => setCV((c) => ({ ...c, projects: duplicateItem(c.projects, i) }))}
                    onRemove={() => {
                      setCV((c) => ({ ...c, projects: c.projects.filter((x) => x.id !== item.id) }));
                      onDeleteToast?.('Proyek dihapus');
                    }}
                    onReorder={(fromIdx, toIdx) => setCV((c) => ({ ...c, projects: reorderList(c.projects, fromIdx, toIdx) }))}
                  />
                ))}
                <AddButton label="Add project" onClick={() => setCV((c) => ({ ...c, projects: [...c.projects, newProject()] }))} />
                {cv.projects.length > 0 && (
                  <SectionResetButton
                    label="Kosongkan daftar proyek"
                    onReset={() => {
                      setCV((c) => ({ ...c, projects: [] }));
                      onDeleteToast?.('Daftar proyek dikosongkan');
                    }}
                  />
                )}
              </div>
            </AccordionSection>
          );
        }

        if (secId === 'education') {
          return (
            <AccordionSection
              key="education"
              title="Education"
              customTitle={cv.sectionLabels?.education}
              onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, education: v } }))}
              onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, education: undefined } }))}
              icon={<GraduationCap size={18} />}
              open={!!open.education}
              onToggle={() => toggle('education')}
              visible={vis.education}
              onVisibleChange={(v) => setVis('education', v)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              pageBreakBefore={pageBreakBefore}
              onPageBreakBeforeChange={onPageBreakBeforeChange}
            >
              <div className="space-y-4" onFocus={() => onActiveSectionChange?.('education')}>
                {cv.education.map((item, i) => (
                  <EducationEditor
                    key={item.id}
                    item={item}
                    index={i}
                    total={cv.education.length}
                    onChange={(patch) => setCV((c) => ({ ...c, education: c.education.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
                    onMoveUp={() => setCV((c) => ({ ...c, education: reorderList(c.education, i, i - 1) }))}
                    onMoveDown={() => setCV((c) => ({ ...c, education: reorderList(c.education, i, i + 1) }))}
                    onDuplicate={() => setCV((c) => ({ ...c, education: duplicateItem(c.education, i) }))}
                    onRemove={() => {
                      setCV((c) => ({ ...c, education: c.education.filter((x) => x.id !== item.id) }));
                      onDeleteToast?.('Pendidikan dihapus');
                    }}
                    onReorder={(fromIdx, toIdx) => setCV((c) => ({ ...c, education: reorderList(c.education, fromIdx, toIdx) }))}
                  />
                ))}
                <AddButton label="Add education" onClick={() => setCV((c) => ({ ...c, education: [...c.education, newEducation()] }))} />
                {cv.education.length > 0 && (
                  <SectionResetButton
                    label="Kosongkan daftar pendidikan"
                    onReset={() => {
                      setCV((c) => ({ ...c, education: [] }));
                      onDeleteToast?.('Daftar pendidikan dikosongkan');
                    }}
                  />
                )}
              </div>
            </AccordionSection>
          );
        }

        if (secId === 'certifications') {
          return (
            <AccordionSection
              key="certifications"
              title="Certifications"
              customTitle={cv.sectionLabels?.certifications}
              onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, certifications: v } }))}
              onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, certifications: undefined } }))}
              icon={<Award size={18} />}
              open={!!open.certifications}
              onToggle={() => toggle('certifications')}
              visible={vis.certifications}
              onVisibleChange={(v) => setVis('certifications', v)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              pageBreakBefore={pageBreakBefore}
              onPageBreakBeforeChange={onPageBreakBeforeChange}
            >
              <div className="space-y-4" onFocus={() => onActiveSectionChange?.('certifications')}>
                <div className="space-y-3">
                  {cv.certifications.map((item, i) => (
                    <div
                      key={item.id}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        try {
                          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                          if (data.section === 'cert' && typeof data.index === 'number' && data.index !== i) {
                            setCV((c) => ({ ...c, certifications: reorderList(c.certifications, data.index, i) }));
                          }
                        } catch {}
                      }}
                      className="animate-item-enter rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
                    >
                      <ItemHeader
                        title="Cert"
                        index={i}
                        total={cv.certifications.length}
                        section="cert"
                        onMoveUp={() => setCV((c) => ({ ...c, certifications: reorderList(c.certifications, i, i - 1) }))}
                        onMoveDown={() => setCV((c) => ({ ...c, certifications: reorderList(c.certifications, i, i + 1) }))}
                        onDuplicate={() => setCV((c) => ({ ...c, certifications: duplicateItem(c.certifications, i) }))}
                        onRemove={() => {
                          setCV((c) => ({ ...c, certifications: c.certifications.filter((x) => x.id !== item.id) }));
                          onDeleteToast?.('Sertifikasi dihapus');
                        }}
                      />
                      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_1fr_130px]">
                        <input className="app-input" placeholder="Certificate" value={item.name} onChange={(e) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)) }))} />
                        <input className="app-input" placeholder="Issuer" value={item.issuer} onChange={(e) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, issuer: e.target.value } : x)) }))} />
                        <DateInput placeholder="Year" value={item.date} onChange={(val) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, date: val } : x)) }))} />
                      </div>
                    </div>
                  ))}
                  <AddButton label="Add certification" onClick={() => setCV((c) => ({ ...c, certifications: [...c.certifications, newCert()] }))} />
                </div>
                {cv.certifications.length > 0 && (
                  <SectionResetButton
                    label="Kosongkan daftar sertifikasi"
                    onReset={() => {
                      setCV((c) => ({ ...c, certifications: [] }));
                      onDeleteToast?.('Daftar sertifikasi dikosongkan');
                    }}
                  />
                )}
              </div>
            </AccordionSection>
          );
        }

        if (secId === 'skills') {
          return (
            <AccordionSection
              key="skills"
              title="Technical & Soft Skills"
              customTitle={cv.sectionLabels?.skills}
              onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, skills: v } }))}
              onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, skills: undefined } }))}
              icon={<Wrench size={18} />}
              open={!!open.skills}
              onToggle={() => toggle('skills')}
              visible={vis.skills}
              onVisibleChange={(v) => setVis('skills', v)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              pageBreakBefore={pageBreakBefore}
              onPageBreakBeforeChange={onPageBreakBeforeChange}
            >
              <div className="space-y-4" onFocus={() => onActiveSectionChange?.('skills')}>
                {cv.skills.map((grp, i) => (
                  <div
                    key={grp.id}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        if (data.section === 'skill' && typeof data.index === 'number' && data.index !== i) {
                          setCV((c) => ({ ...c, skills: reorderList(c.skills, data.index, i) }));
                        }
                      } catch {}
                    }}
                    className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
                  >
                    <ItemHeader
                      title="Skill Group"
                      index={i}
                      total={cv.skills.length}
                      section="skill"
                      onMoveUp={() => setCV((c) => ({ ...c, skills: reorderList(c.skills, i, i - 1) }))}
                      onMoveDown={() => setCV((c) => ({ ...c, skills: reorderList(c.skills, i, i + 1) }))}
                      onDuplicate={() => setCV((c) => ({ ...c, skills: duplicateItem(c.skills, i) }))}
                      onRemove={() => {
                        setCV((c) => ({ ...c, skills: c.skills.filter((x) => x.id !== grp.id) }));
                        onDeleteToast?.('Grup keahlian dihapus');
                      }}
                    />
                    <input className="app-input w-full" placeholder="Category (e.g. Languages, Frontend)" value={grp.category} onChange={(e) => setCV((c) => ({ ...c, skills: c.skills.map((x) => (x.id === grp.id ? { ...x, category: e.target.value } : x)) }))} />
                    <TagInput
                      values={grp.skills}
                      accent={accent}
                      suggestions={DEFAULT_SKILL_SUGGESTIONS}
                      placeholder="Add skill + Enter (contoh: React, Python)"
                      onChange={(skills) => setCV((c) => ({ ...c, skills: c.skills.map((x) => (x.id === grp.id ? { ...x, skills } : x)) }))}
                    />
                  </div>
                ))}
                <AddButton label="Add skill group" onClick={() => setCV((c) => ({ ...c, skills: [...c.skills, newSkillGroup()] }))} />
                {cv.skills.length > 0 && (
                  <SectionResetButton
                    label="Kosongkan daftar keahlian"
                    onReset={() => {
                      setCV((c) => ({ ...c, skills: [] }));
                      onDeleteToast?.('Daftar keahlian dikosongkan');
                    }}
                  />
                )}
              </div>
            </AccordionSection>
          );
        }

        if (secId === 'honors') {
          return (
            <AccordionSection
              key="honors"
              title="Honors & Achievements"
              customTitle={cv.sectionLabels?.honors}
              onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, honors: v } }))}
              onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, honors: undefined } }))}
              icon={<Award size={18} />}
              open={!!open.honors}
              onToggle={() => toggle('honors')}
              visible={vis.honors}
              onVisibleChange={(v) => setVis('honors', v)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              pageBreakBefore={pageBreakBefore}
              onPageBreakBeforeChange={onPageBreakBeforeChange}
            >
              <div className="space-y-4" onFocus={() => onActiveSectionChange?.('honors')}>
                {cv.honors.map((item, i) => (
                  <div
                    key={item.id}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        if (data.section === 'honor' && typeof data.index === 'number' && data.index !== i) {
                          setCV((c) => ({ ...c, honors: reorderList(c.honors, data.index, i) }));
                        }
                      } catch {}
                    }}
                    className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
                  >
                    <ItemHeader
                      title="Honor"
                      index={i}
                      total={cv.honors.length}
                      section="honor"
                      onMoveUp={() => setCV((c) => ({ ...c, honors: reorderList(c.honors, i, i - 1) }))}
                      onMoveDown={() => setCV((c) => ({ ...c, honors: reorderList(c.honors, i, i + 1) }))}
                      onDuplicate={() => setCV((c) => ({ ...c, honors: duplicateItem(c.honors, i) }))}
                      onRemove={() => {
                        setCV((c) => ({ ...c, honors: c.honors.filter((x) => x.id !== item.id) }));
                        onDeleteToast?.('Penghargaan dihapus');
                      }}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_130px]">
                      <input className="app-input" placeholder="Honor / award" value={item.title} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)) }))} />
                      <input className="app-input" placeholder="Issuer" value={item.issuer} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, issuer: e.target.value } : x)) }))} />
                      <DateInput placeholder="Year" value={item.date} onChange={(val) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, date: val } : x)) }))} />
                    </div>
                    <input className="app-input" placeholder="One-line description (optional)" value={item.description} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, description: e.target.value } : x)) }))} />
                  </div>
                ))}
                <AddButton label="Add honor" onClick={() => setCV((c) => ({ ...c, honors: [...c.honors, newHonor()] }))} />
                {cv.honors.length > 0 && (
                  <SectionResetButton
                    label="Kosongkan daftar penghargaan"
                    onReset={() => {
                      setCV((c) => ({ ...c, honors: [] }));
                      onDeleteToast?.('Daftar penghargaan dikosongkan');
                    }}
                  />
                )}
              </div>
            </AccordionSection>
          );
        }

        const customSec = cv.customSections?.find((s) => s.id === secId);
        if (customSec) {
          return (
            <AccordionSection
              key={customSec.id}
              title={customSec.title || 'Section Kustom'}
              icon={<FileText size={18} />}
              open={!!open[customSec.id]}
              onToggle={() => toggle(customSec.id)}
              visible={customSec.visible ?? true}
              onVisibleChange={(v) => updateCustomSection(customSec.id, { visible: v })}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              pageBreakBefore={pageBreakBefore || !!customSec.pageBreakBefore}
              onPageBreakBeforeChange={onPageBreakBeforeChange}
              onDelete={() => deleteCustomSection(customSec.id, customSec.title)}
            >
              <CustomSectionEditor
                section={customSec}
                onChange={(patch) => updateCustomSection(customSec.id, patch)}
                onActive={() => onActiveSectionChange?.(customSec.id)}
              />
            </AccordionSection>
          );
        }

        return null;
      })}

      {/* Add Custom Section Controls */}
      <div className="rounded-card border border-dashed border-[var(--border)] p-4 text-center bg-[var(--surface)]">
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Ingin menambahkan bagian lain? (misal: Publikasi, Pengalaman Organisasi, Relawan, Bahasa)
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => addCustomSection('bullets')}
            className="btn btn-outline rounded-pill text-xs py-1.5 px-3.5 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Plus size={13} />
            <span>+ Section Poin (Bullets)</span>
          </button>
          <button
            type="button"
            onClick={() => addCustomSection('text')}
            className="btn btn-outline rounded-pill text-xs py-1.5 px-3.5 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Plus size={13} />
            <span>+ Section Teks Bebas</span>
          </button>
          <button
            type="button"
            onClick={() => addCustomSection('items')}
            className="btn btn-outline rounded-pill text-xs py-1.5 px-3.5 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Plus size={13} />
            <span>+ Section Item Terstruktur</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomSectionEditor({
  section,
  onChange,
  onActive,
}: {
  section: CustomSection;
  onChange: (patch: Partial<CustomSection>) => void;
  onActive?: () => void;
}) {
  return (
    <div className="space-y-4" onFocus={onActive}>
      {/* Title & Type selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Judul Section">
          <input
            className="app-input"
            value={section.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Contoh: Publikasi / Organisasi"
          />
        </Field>
        <Field label="Tipe Konten">
          <select
            className="app-input cursor-pointer"
            value={section.type}
            onChange={(e) => {
              const nextType = e.target.value as CustomSectionType;
              const patch: Partial<CustomSection> = { type: nextType };
              if (nextType === 'bullets' && (!section.bullets || !section.bullets.length)) {
                patch.bullets = [''];
              } else if (nextType === 'text' && section.text === undefined) {
                patch.text = '';
              } else if (nextType === 'items' && (!section.items || !section.items.length)) {
                patch.items = [{ id: uid(), title: '', subtitle: '', date: '', description: '' }];
              }
              onChange(patch);
            }}
          >
            <option value="bullets">Daftar Poin (Bullet List)</option>
            <option value="text">Teks Bebas (Free Text)</option>
            <option value="items">Daftar Item Terstruktur</option>
          </select>
        </Field>
      </div>

      {/* Bullets mode */}
      {section.type === 'bullets' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text)]">Poin-poin Bullet</span>
            <span className="text-xs text-[var(--text-muted)]">Tekan Enter untuk baris baru</span>
          </div>
          {(section.bullets || ['']).map((bullet, bIdx) => (
            <div key={bIdx} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] select-none">•</span>
              <input
                className="app-input flex-1"
                value={bullet}
                placeholder={`Poin #${bIdx + 1}`}
                onChange={(e) => {
                  const next = [...(section.bullets || [''])];
                  next[bIdx] = e.target.value;
                  onChange({ bullets: next });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const next = [...(section.bullets || [''])];
                    next.splice(bIdx + 1, 0, '');
                    onChange({ bullets: next });
                  }
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  if (text.includes('\n') || text.includes('•') || text.includes('- ')) {
                    const lines = text
                      .split(/\r?\n/)
                      .map((l) => l.replace(/^[\s•\-*]+/, '').trim())
                      .filter(Boolean);
                    if (lines.length > 1) {
                      e.preventDefault();
                      const next = [...(section.bullets || [''])];
                      next.splice(bIdx, 1, ...lines);
                      onChange({ bullets: next });
                    }
                  }
                }}
              />
              <button
                type="button"
                disabled={(section.bullets || []).length <= 1}
                onClick={() => {
                  const next = (section.bullets || []).filter((_, i) => i !== bIdx);
                  onChange({ bullets: next.length ? next : [''] });
                }}
                className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] disabled:opacity-20 transition duration-fast active:scale-[0.95]"
                title="Hapus poin"
                aria-label="Hapus poin"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ bullets: [...(section.bullets || ['']), ''] })}
            className="btn btn-outline rounded-control text-xs mt-1"
          >
            <Plus size={14} />
            <span>Tambah Poin</span>
          </button>
        </div>
      )}

      {/* Text mode */}
      {section.type === 'text' && (
        <Field label="Isi Teks Bebas">
          <textarea
            className="app-textarea min-h-[100px]"
            value={section.text || ''}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Tuliskan teks paragraf atau deskripsi di sini..."
          />
        </Field>
      )}

      {/* Items mode */}
      {section.type === 'items' && (
        <div className="space-y-3">
          {(section.items || []).map((item, itemIdx) => (
            <div
              key={item.id}
              className="space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-3.5"
            >
              <ItemHeader
                title="Item"
                index={itemIdx}
                total={(section.items || []).length}
                section={section.id}
                onMoveUp={() => {
                  if (itemIdx > 0) {
                    onChange({ items: reorderList(section.items || [], itemIdx, itemIdx - 1) });
                  }
                }}
                onMoveDown={() => {
                  if (itemIdx < (section.items || []).length - 1) {
                    onChange({ items: reorderList(section.items || [], itemIdx, itemIdx + 1) });
                  }
                }}
                onDuplicate={() => {
                  onChange({ items: duplicateItem(section.items || [], itemIdx) });
                }}
                onRemove={() => {
                  onChange({ items: (section.items || []).filter((_, i) => i !== itemIdx) });
                }}
              />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <input
                  className="app-input"
                  placeholder="Judul / Posisi (misal: Ketua Himpunan)"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...(section.items || [])];
                    next[itemIdx] = { ...item, title: e.target.value };
                    onChange({ items: next });
                  }}
                />
                <input
                  className="app-input"
                  placeholder="Subjudul / Organisasi (misal: BEM FTUI)"
                  value={item.subtitle || ''}
                  onChange={(e) => {
                    const next = [...(section.items || [])];
                    next[itemIdx] = { ...item, subtitle: e.target.value };
                    onChange({ items: next });
                  }}
                />
                <input
                  className="app-input"
                  placeholder="Tanggal / Periode (misal: 2021 – 2022)"
                  value={item.date || ''}
                  onChange={(e) => {
                    const next = [...(section.items || [])];
                    next[itemIdx] = { ...item, date: e.target.value };
                    onChange({ items: next });
                  }}
                />
                <input
                  className="app-input"
                  placeholder="Deskripsi singkat"
                  value={item.description || ''}
                  onChange={(e) => {
                    const next = [...(section.items || [])];
                    next[itemIdx] = { ...item, description: e.target.value };
                    onChange({ items: next });
                  }}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newItem: CustomSectionItem = {
                id: uid(),
                title: '',
                subtitle: '',
                date: '',
                description: '',
              };
              onChange({ items: [...(section.items || []), newItem] });
            }}
            className="btn btn-outline rounded-control text-xs"
          >
            <Plus size={13} />
            <span>Tambah Item</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-item editors
// ---------------------------------------------------------------------------
function ExperienceEditor({
  item,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  index,
  total,
  onReorder,
}: {
  item: ExperienceItem;
  onChange: (p: Partial<ExperienceItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
  total: number;
  onReorder: (from: number, to: number) => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.section === 'exp' && typeof data.index === 'number' && data.index !== index) {
            onReorder(data.index, index);
          }
        } catch {}
      }}
      className="animate-item-enter space-y-4 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
    >
      <ItemHeader
        title="Experience"
        index={index}
        total={total}
        section="exp"
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Role / title" value={item.role} onChange={(e) => onChange({ role: e.target.value })} />
        <input className="app-input" placeholder="Company" value={item.company} onChange={(e) => onChange({ company: e.target.value })} />
        <input className="app-input" placeholder="Location" value={item.location} onChange={(e) => onChange({ location: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <DateInput placeholder="Start date" value={item.startDate} onChange={(val) => onChange({ startDate: val })} />
          <DateInput placeholder="End date" value={item.endDate} disabled={item.current} showPresent={true} onChange={(val) => onChange({ endDate: val })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
        <input type="checkbox" checked={item.current} onChange={(e) => onChange({ current: e.target.checked, endDate: e.target.checked ? '' : item.endDate })} className="h-4 w-4 rounded-control accent-[var(--primary)] cursor-pointer" />
        <span>Masih bekerja di sini</span>
      </label>
      <BulletEditor bullets={item.bullets} onChange={(bullets) => onChange({ bullets })} />
    </div>
  );
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text)]">Bullet points</span>
        <span className="text-xs text-[var(--text-muted)]">Tekan Enter untuk baris baru · Tempel multi-baris otomatis terpisah</span>
      </div>
      {bullets.map((b, i) => (
        <div key={i} className="animate-item-enter flex items-start gap-2">
          <textarea
            className="app-textarea min-h-[56px] flex-1 resize-y py-2"
            spellCheck={true}
            value={b}
            placeholder="Increased signup conversion by 23% by redesigning onboarding…"
            onChange={(e) => onChange(bullets.map((x, j) => (j === i ? e.target.value : x)))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const next = [...bullets];
                next.splice(i + 1, 0, '');
                onChange(next);
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text.includes('\n') || text.includes('•') || text.includes('- ') || text.includes('* ')) {
                const lines = text
                  .split(/\r?\n/)
                  .map((l) => l.replace(/^[\s•\-\*]+/, '').trim())
                  .filter(Boolean);
                if (lines.length > 1) {
                  e.preventDefault();
                  const next = [...bullets];
                  next.splice(i, 1, ...lines);
                  onChange(next);
                }
              }
            }}
          />
          <div className="flex flex-col gap-2 pt-0.5">
            <button
              type="button"
              title="Suggest XYZ rewrite"
              aria-label="Suggest XYZ rewrite"
              className="btn btn-outline grid h-9 w-9 place-items-center rounded-control text-[var(--primary)] hover:border-[var(--primary)] transition duration-fast ease-standard active:scale-[0.95]"
              onClick={() => onChange(bullets.map((x, j) => (j === i ? suggestBullet(x) : x)))}
            >
              <Wand2 size={14} />
            </button>
            <button
              type="button"
              title="Remove bullet"
              aria-label="Remove bullet"
              className="btn grid h-9 w-9 place-items-center rounded-control text-[var(--status-danger)] transition duration-fast ease-standard hover:bg-[var(--status-danger-bg)] active:scale-[0.95]"
              onClick={() => onChange(bullets.filter((_, j) => j !== i))}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn rounded-pill px-3 py-1.5 text-xs text-[var(--primary)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] active:scale-[0.95]"
        onClick={() => onChange([...bullets, ''])}
      >
        <Plus size={14} /> <span>Add bullet</span>
      </button>
    </div>
  );
}

function ProjectEditor({
  item,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  index,
  total,
  accent,
  onReorder,
}: {
  item: ProjectItem;
  onChange: (p: Partial<ProjectItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
  total: number;
  accent: string;
  onReorder: (from: number, to: number) => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.section === 'proj' && typeof data.index === 'number' && data.index !== index) {
            onReorder(data.index, index);
          }
        } catch {}
      }}
      className="animate-item-enter space-y-4 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
    >
      <ItemHeader
        title="Project"
        index={index}
        total={total}
        section="proj"
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Project title" value={item.title} onChange={(e) => onChange({ title: e.target.value })} />
        <input
          className="app-input"
          placeholder="Demo / repo link"
          value={item.link}
          onChange={(e) => onChange({ link: e.target.value })}
          onBlur={(e) => onChange({ link: formatLink(e.target.value) })}
        />
      </div>
      <input className="app-input" placeholder="One-line description" value={item.description} onChange={(e) => onChange({ description: e.target.value })} />
      <Field label="Tech stack"><TagInput values={item.tech} accent={accent} suggestions={DEFAULT_SKILL_SUGGESTIONS} placeholder="React + Enter" onChange={(tech) => onChange({ tech })} /></Field>
      <Field label="Key achievements"><TagInput values={item.achievements} placeholder="3k stars + Enter" onChange={(achievements) => onChange({ achievements })} /></Field>
    </div>
  );
}

function EducationEditor({
  item,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  index,
  total,
  onReorder,
}: {
  item: EducationItem;
  onChange: (p: Partial<EducationItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
  total: number;
  onReorder: (from: number, to: number) => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.section === 'edu' && typeof data.index === 'number' && data.index !== index) {
            onReorder(data.index, index);
          }
        } catch {}
      }}
      className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
    >
      <ItemHeader
        title="Education"
        index={index}
        total={total}
        section="edu"
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Institution" value={item.institution} onChange={(e) => onChange({ institution: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="app-input" placeholder="Degree" value={item.degree} onChange={(e) => onChange({ degree: e.target.value })} />
          <input className="app-input" placeholder="Field" value={item.field} onChange={(e) => onChange({ field: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DateInput placeholder="Start year" value={item.startDate} onChange={(val) => onChange({ startDate: val })} />
          <DateInput placeholder="End year" value={item.endDate} disabled={item.current} showPresent={true} onChange={(val) => onChange({ endDate: val })} />
        </div>
        <input className="app-input" placeholder="Details (GPA, honors)" value={item.details} onChange={(e) => onChange({ details: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
        <input
          type="checkbox"
          checked={!!item.current}
          onChange={(e) => onChange({ current: e.target.checked, endDate: e.target.checked ? '' : item.endDate })}
          className="h-4 w-4 rounded-control accent-[var(--primary)] cursor-pointer"
        />
        <span>Masih studi di sini</span>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
const newExperience = (): ExperienceItem => ({ id: uid(), company: '', role: '', location: '', startDate: '', endDate: '', current: false, bullets: [''], visible: true });
const newProject = (): ProjectItem => ({ id: uid(), title: '', tech: [], link: '', description: '', achievements: [], visible: true });
const newEducation = (): EducationItem => ({ id: uid(), institution: '', degree: '', field: '', startDate: '', endDate: '', current: false, details: '', visible: true });
const newCert = (): CertificationItem => ({ id: uid(), name: '', issuer: '', date: '', visible: true });
const newSkillGroup = (): SkillGroup => ({ id: uid(), category: '', skills: [] });
const newHonor = (): HonorItem => ({ id: uid(), title: '', issuer: '', date: '', description: '', visible: true });
