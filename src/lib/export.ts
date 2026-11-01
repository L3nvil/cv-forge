import type { AppState, CVData, PersonalInfo, Customization } from '../types/cv';

/** Generates clean, automated PDF filename from name and title. */
export function generatePdfFileName(personal?: Partial<PersonalInfo>): string {
  const name = personal?.fullName?.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  const title = personal?.title?.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  if (name && title) return `${name}_${title}_CV`;
  if (name) return `${name}_CV`;
  return `CV_${new Date().toISOString().slice(0, 10)}`;
}

/** Export the live A4 or Letter node to a high-quality PDF via html2pdf.js (lazy-loaded). */
export async function exportPdf(fileName: string, paperSize: 'a4' | 'letter' = 'a4') {
  const el = document.getElementById('print-root');
  const mount = document.getElementById('print-mount');
  if (!el || !mount) return;

  // The print copy is display:none on screen; html2canvas cannot capture a
  // zero-size node, so reveal it off-screen for the duration of the capture.
  const prev = mount.style.cssText;
  mount.style.cssText =
    'display:block;position:fixed;left:-10000px;top:0;z-index:-1;background:#ffffff;';

  const isLetter = paperSize === 'letter';
  const width = isLetter ? 816 : 794;
  const height = isLetter ? 1056 : 1123;

  // Lazy import keeps the main bundle lean.
  const html2pdf = (await import('html2pdf.js')).default;
  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: `${fileName || 'CV'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: width },
        jsPDF: { unit: 'px', format: [width, height], orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(el)
      .save();
  } finally {
    mount.style.cssText = prev;
  }
}

/**
 * Browser-native print (vector-sharp, uses the @media print rules).
 * Temporarily sets document.title to fileName so browser PDF export defaults to the correct name.
 */
export function printCV(fileName?: string) {
  const originalTitle = document.title;
  if (fileName) {
    document.title = fileName;
  }
  window.print();
  window.setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

/** Exports state to JSON including a format version field. */
export function downloadJson(state: AppState, fileName: string) {
  const payload = {
    version: 2,
    ...state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName || 'CV'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportValidationResult {
  ok: boolean;
  data?: Partial<AppState>;
  error?: string;
}

/**
 * Validate and parse an imported JSON file with clear, descriptive error messages.
 * Accepts versioned format (version: 1 or 2), full AppState, or legacy bare CVData.
 */
export function validateAndParseImport(text: string): ImportValidationResult {
  if (!text || !text.trim()) {
    return { ok: false, error: 'File kosong atau tidak dapat dibaca.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return {
      ok: false,
      error: `Format JSON rusak: ${err instanceof Error ? err.message : 'Kesalahan sintaks JSON'}. Periksa tanda kurung atau koma.`,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      error: 'Struktur data tidak valid: Root dokumen harus berupa objek JSON { ... }.',
    };
  }

  const obj = parsed as Record<string, unknown>;

  // Case 1: Standard AppState with 'cv' property
  if ('cv' in obj && typeof obj.cv === 'object' && obj.cv !== null) {
    const cvObj = obj.cv as Record<string, unknown>;
    if (!('personal' in cvObj)) {
      return {
        ok: false,
        error: 'Objek "cv" ditemukan tetapi tidak memiliki field "personal" yang valid.',
      };
    }
    const cvData = obj.cv as CVData;
    // Migration: ensure customSections default to [] if not defined
    if (!cvData.customSections) {
      cvData.customSections = [];
    }
    return {
      ok: true,
      data: {
        cv: cvData,
        customization: (obj.customization as Customization) || undefined,
      },
    };
  }

  // Case 2: Legacy flat CVData with 'personal' property at root
  if ('personal' in obj && typeof obj.personal === 'object' && obj.personal !== null) {
    const cvData = obj as unknown as CVData;
    if (!cvData.customSections) {
      cvData.customSections = [];
    }
    return {
      ok: true,
      data: { cv: cvData },
    };
  }

  return {
    ok: false,
    error: 'File JSON ini bukan cadangan CV Forge yang valid (tidak ditemukan field "cv" atau "personal").',
  };
}

/** Parse an imported JSON file. Accepts versioned format, full AppState, or legacy bare CVData. */
export function parseImport(text: string): Partial<AppState> | null {
  const res = validateAndParseImport(text);
  return res.ok && res.data ? res.data : null;
}

/** Export live CV to PNG image using html2canvas canvas extraction. */
export async function exportPng(fileName: string, paperSize: 'a4' | 'letter' = 'a4'): Promise<void> {
  const el = document.getElementById('print-root');
  const mount = document.getElementById('print-mount');
  if (!el || !mount) return;

  const prev = mount.style.cssText;
  mount.style.cssText =
    'display:block;position:fixed;left:-10000px;top:0;z-index:-1;background:#ffffff;';

  const isLetter = paperSize === 'letter';
  const width = isLetter ? 816 : 794;

  try {
    // @ts-ignore - html2canvas is bundled as dependency of html2pdf.js
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const canvas: HTMLCanvasElement = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: width,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${fileName || 'CV'}.png`;
    a.click();
  } finally {
    mount.style.cssText = prev;
  }
}

function getOrderedExportSectionIds(cv: CVData): string[] {
  const defaultOrder = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'honors'];
  const customIds = (cv.customSections || []).map((s) => s.id);
  const baseOrder = cv.sectionOrder && cv.sectionOrder.length > 0 ? cv.sectionOrder : defaultOrder;

  const order: string[] = [];
  for (const id of baseOrder) {
    if (!order.includes(id)) order.push(id);
  }
  for (const cid of customIds) {
    if (!order.includes(cid)) order.push(cid);
  }
  for (const defId of defaultOrder) {
    if (!order.includes(defId)) order.push(defId);
  }
  return order;
}

/** Formats CV data into clean, readable plain text for pasting into job applications. */
export function cvToPlainText(cv: CVData): string {
  const lines: string[] = [];
  const p = cv.personal;

  if (p.fullName) lines.push(p.fullName.toUpperCase());
  if (p.title) lines.push(p.title);

  const contactParts = [p.email, p.phone, p.location].filter(Boolean);
  if (contactParts.length) lines.push(contactParts.join(' | '));

  const linkParts = [p.website, p.linkedin, p.github].filter(Boolean);
  if (linkParts.length) lines.push(linkParts.join(' | '));
  lines.push('');

  const orderedIds = getOrderedExportSectionIds(cv);

  for (const id of orderedIds) {
    if (id === 'summary' && cv.summary && cv.sectionVisibility.summary) {
      const title = cv.sectionLabels?.summary || 'RINGKASAN PROFESIONAL';
      lines.push(`=== ${title.toUpperCase()} ===`);
      lines.push(cv.summary.trim());
      lines.push('');
    } else if (id === 'experience' && cv.experience.length && cv.sectionVisibility.experience) {
      const title = cv.sectionLabels?.experience || 'PENGALAMAN KERJA';
      lines.push(`=== ${title.toUpperCase()} ===`);
      cv.experience.forEach((e) => {
        lines.push(`${e.role || 'Role'} - ${e.company || 'Perusahaan'}`);
        const dateLoc = [
          e.current ? `${e.startDate} - Sekarang` : `${e.startDate} - ${e.endDate}`,
          e.location,
        ].filter(Boolean).join(' | ');
        if (dateLoc) lines.push(dateLoc);
        e.bullets.filter(Boolean).forEach((b) => lines.push(`• ${b}`));
        lines.push('');
      });
    } else if (id === 'projects' && cv.projects.length && cv.sectionVisibility.projects) {
      const title = cv.sectionLabels?.projects || 'PROYEK PILIHAN';
      lines.push(`=== ${title.toUpperCase()} ===`);
      cv.projects.forEach((proj) => {
        lines.push(`${proj.title}${proj.link ? ` (${proj.link})` : ''}`);
        if (proj.tech.length) lines.push(`Teknologi: ${proj.tech.join(', ')}`);
        if (proj.description) lines.push(proj.description);
        proj.achievements.filter(Boolean).forEach((a) => lines.push(`• ${a}`));
        lines.push('');
      });
    } else if (id === 'education' && cv.education.length && cv.sectionVisibility.education) {
      const title = cv.sectionLabels?.education || 'PENDIDIKAN';
      lines.push(`=== ${title.toUpperCase()} ===`);
      cv.education.forEach((edu) => {
        const degreeField = [edu.degree, edu.field].filter(Boolean).join(' ');
        lines.push(`${degreeField ? `${degreeField} - ` : ''}${edu.institution}`);
        const dateStr = edu.current ? `${edu.startDate} - Sekarang` : `${edu.startDate} - ${edu.endDate}`;
        if (dateStr.trim()) lines.push(dateStr);
        if (edu.details) lines.push(edu.details);
        lines.push('');
      });
    } else if (id === 'skills' && cv.skills.length && cv.sectionVisibility.skills) {
      const title = cv.sectionLabels?.skills || 'KEAHLIAN';
      lines.push(`=== ${title.toUpperCase()} ===`);
      cv.skills.forEach((g) => {
        lines.push(`${g.category}: ${g.skills.join(', ')}`);
      });
      lines.push('');
    } else if (id === 'certifications' && cv.certifications.length && cv.sectionVisibility.certifications) {
      const title = cv.sectionLabels?.certifications || 'SERTIFIKASI';
      lines.push(`=== ${title.toUpperCase()} ===`);
      cv.certifications.forEach((c) => {
        lines.push(`${c.name}${c.issuer ? ` - ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`);
      });
      lines.push('');
    } else if (id === 'honors' && cv.honors.length && cv.sectionVisibility.honors) {
      const title = cv.sectionLabels?.honors || 'PENGHARGAAN';
      lines.push(`=== ${title.toUpperCase()} ===`);
      cv.honors.forEach((h) => {
        lines.push(`${h.title}${h.issuer ? ` - ${h.issuer}` : ''}${h.date ? ` (${h.date})` : ''}`);
        if (h.description) lines.push(`  ${h.description}`);
      });
      lines.push('');
    } else {
      const cs = cv.customSections?.find((s) => s.id === id);
      if (cs && cs.visible !== false) {
        const title = cs.title || 'SECTION KUSTOM';
        if (cs.type === 'bullets' && cs.bullets && cs.bullets.filter(Boolean).length) {
          lines.push(`=== ${title.toUpperCase()} ===`);
          cs.bullets.filter(Boolean).forEach((b) => lines.push(`• ${b}`));
          lines.push('');
        } else if (cs.type === 'text' && cs.text && cs.text.trim()) {
          lines.push(`=== ${title.toUpperCase()} ===`);
          lines.push(cs.text.trim());
          lines.push('');
        } else if (cs.type === 'items' && cs.items && cs.items.length) {
          lines.push(`=== ${title.toUpperCase()} ===`);
          cs.items.forEach((it) => {
            lines.push(`${it.title}${it.subtitle ? ` - ${it.subtitle}` : ''}${it.date ? ` (${it.date})` : ''}`);
            if (it.description) lines.push(`  ${it.description}`);
          });
          lines.push('');
        }
      }
    }
  }

  return lines.join('\n').trim();
}

/** Formats CV data into standard GitHub-flavored Markdown. */
export function cvToMarkdown(cv: CVData): string {
  const lines: string[] = [];
  const p = cv.personal;

  if (p.fullName) lines.push(`# ${p.fullName}`);
  if (p.title) lines.push(`### ${p.title}`);

  const contactParts = [p.email, p.phone, p.location].filter(Boolean);
  if (contactParts.length) lines.push(`**Kontak:** ${contactParts.join(' · ')}  `);

  const links = [
    p.website ? `[Website](${p.website})` : '',
    p.linkedin ? `[LinkedIn](${p.linkedin})` : '',
    p.github ? `[GitHub](${p.github})` : '',
  ].filter(Boolean);
  if (links.length) lines.push(links.join(' · '));
  lines.push('');

  const orderedIds = getOrderedExportSectionIds(cv);

  for (const id of orderedIds) {
    if (id === 'summary' && cv.summary && cv.sectionVisibility.summary) {
      const title = cv.sectionLabels?.summary || 'Ringkasan Profesional';
      lines.push(`## ${title}`);
      lines.push(cv.summary.trim());
      lines.push('');
    } else if (id === 'experience' && cv.experience.length && cv.sectionVisibility.experience) {
      const title = cv.sectionLabels?.experience || 'Pengalaman Kerja';
      lines.push(`## ${title}`);
      cv.experience.forEach((e) => {
        lines.push(`### ${e.role || 'Role'} — ${e.company || 'Perusahaan'}`);
        const dateLoc = [
          e.current ? `${e.startDate} – Sekarang` : `${e.startDate} – ${e.endDate}`,
          e.location,
        ].filter(Boolean).join(' | ');
        if (dateLoc) lines.push(`*${dateLoc}*`);
        lines.push('');
        e.bullets.filter(Boolean).forEach((b) => lines.push(`- ${b}`));
        lines.push('');
      });
    } else if (id === 'projects' && cv.projects.length && cv.sectionVisibility.projects) {
      const title = cv.sectionLabels?.projects || 'Proyek Pilihan';
      lines.push(`## ${title}`);
      cv.projects.forEach((proj) => {
        lines.push(`### ${proj.title}`);
        if (proj.link) lines.push(`*[${proj.link}](${proj.link})*`);
        if (proj.tech.length) lines.push(`**Teknologi:** ${proj.tech.join(', ')}  `);
        if (proj.description) lines.push(proj.description);
        proj.achievements.filter(Boolean).forEach((a) => lines.push(`- ${a}`));
        lines.push('');
      });
    } else if (id === 'education' && cv.education.length && cv.sectionVisibility.education) {
      const title = cv.sectionLabels?.education || 'Pendidikan';
      lines.push(`## ${title}`);
      cv.education.forEach((edu) => {
        const degreeField = [edu.degree, edu.field].filter(Boolean).join(' in ');
        lines.push(`### ${degreeField ? `${degreeField} — ` : ''}${edu.institution}`);
        const dateStr = edu.current ? `${edu.startDate} – Sekarang` : `${edu.startDate} – ${edu.endDate}`;
        if (dateStr.trim()) lines.push(`*${dateStr}*`);
        if (edu.details) lines.push(`\n${edu.details}`);
        lines.push('');
      });
    } else if (id === 'skills' && cv.skills.length && cv.sectionVisibility.skills) {
      const title = cv.sectionLabels?.skills || 'Keahlian';
      lines.push(`## ${title}`);
      cv.skills.forEach((g) => {
        lines.push(`- **${g.category}:** ${g.skills.join(', ')}`);
      });
      lines.push('');
    } else if (id === 'certifications' && cv.certifications.length && cv.sectionVisibility.certifications) {
      const title = cv.sectionLabels?.certifications || 'Sertifikasi';
      lines.push(`## ${title}`);
      cv.certifications.forEach((c) => {
        lines.push(`- **${c.name}**${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`);
      });
      lines.push('');
    } else if (id === 'honors' && cv.honors.length && cv.sectionVisibility.honors) {
      const title = cv.sectionLabels?.honors || 'Penghargaan & Prestasi';
      lines.push(`## ${title}`);
      cv.honors.forEach((h) => {
        lines.push(`- **${h.title}**${h.issuer ? ` — ${h.issuer}` : ''}${h.date ? ` (${h.date})` : ''}${h.description ? ` · ${h.description}` : ''}`);
      });
      lines.push('');
    } else {
      const cs = cv.customSections?.find((s) => s.id === id);
      if (cs && cs.visible !== false) {
        const title = cs.title || 'Section Kustom';
        if (cs.type === 'bullets' && cs.bullets && cs.bullets.filter(Boolean).length) {
          lines.push(`## ${title}`);
          cs.bullets.filter(Boolean).forEach((b) => lines.push(`- ${b}`));
          lines.push('');
        } else if (cs.type === 'text' && cs.text && cs.text.trim()) {
          lines.push(`## ${title}`);
          lines.push(cs.text.trim());
          lines.push('');
        } else if (cs.type === 'items' && cs.items && cs.items.length) {
          lines.push(`## ${title}`);
          cs.items.forEach((it) => {
            lines.push(`### ${it.title}${it.subtitle ? ` — ${it.subtitle}` : ''}`);
            if (it.date) lines.push(`*${it.date}*`);
            if (it.description) lines.push(it.description);
            lines.push('');
          });
        }
      }
    }
  }

  return lines.join('\n').trim();
}

/** Downloads CV formatted as Markdown file (.md). */
export function downloadMarkdown(cv: CVData, fileName: string) {
  const content = cvToMarkdown(cv);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName || 'CV'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Copies plain text version of the CV directly to the clipboard. */
export async function copyPlainText(cv: CVData): Promise<boolean> {
  const text = cvToPlainText(cv);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}


