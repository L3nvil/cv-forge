// ---------------------------------------------------------------------------
// CV Forge — core data models
// ---------------------------------------------------------------------------

export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  /** Base64 data URL of the uploaded avatar. */
  avatar: string;
  avatarZoom: number; // 1.0 - 3.0, used by the circular crop preview
  avatarOffsetX: number; // -100..100 percent
  avatarOffsetY: number; // -100..100 percent
  showAvatar: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  visible: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  tech: string[];
  link: string;
  description: string;
  achievements: string[];
  visible: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  details: string;
  visible: boolean;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  visible: boolean;
}

export interface SkillGroup {
  id: string;
  category: string;
  skills: string[];
}

export interface HonorItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
  visible: boolean;
}

export interface SectionVisibility {
  summary: boolean;
  experience: boolean;
  projects: boolean;
  education: boolean;
  certifications: boolean;
  skills: boolean;
  honors: boolean;
}

export interface SectionLabels {
  summary?: string;
  experience?: string;
  projects?: string;
  education?: string;
  certifications?: string;
  skills?: string;
  honors?: string;
}

export type CustomSectionType = 'bullets' | 'text' | 'items';

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  type: CustomSectionType;
  visible?: boolean;
  pageBreakBefore?: boolean;
  bullets?: string[];
  text?: string;
  items?: CustomSectionItem[];
}

export interface CVData {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: SkillGroup[];
  honors: HonorItem[];
  sectionVisibility: SectionVisibility;
  sectionLabels?: SectionLabels;
  customSections?: CustomSection[];
  sectionOrder?: string[];
  pageBreakSections?: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Presentation / customization
// ---------------------------------------------------------------------------

export type TemplateId = 'modern' | 'tech' | 'creative' | 'classic';

export type FontId = 'inter' | 'georgia' | 'jetbrains';

export type Density = 'compact' | 'normal' | 'relaxed';

export interface Customization {
  template: TemplateId;
  accent: string; // hex color
  font: FontId;
  density: Density;
  fontSizeScale?: number; // 0.85 - 1.15, default 1
  marginScale?: number;   // 0.80 - 1.25, default 1
  paperSize?: 'a4' | 'letter'; // default 'a4'
  documentLanguage?: 'id' | 'en'; // default 'id'
}

export interface AppState {
  cv: CVData;
  customization: Customization;
}

export const TEMPLATES: { id: TemplateId; name: string; blurb: string }[] = [
  { id: 'modern', name: 'Modern Minimalist', blurb: 'Clean, airy, single accent' },
  { id: 'tech', name: 'Tech Single Column', blurb: 'Dense, mono headers, ATS-safe' },
  { id: 'creative', name: 'Creative Split', blurb: 'Sidebar + main, avatar-forward' },
  { id: 'classic', name: 'Classic ATS', blurb: 'Plain, serif, maximum parse-ability' },
];

export const FONTS: { id: FontId; name: string; stack: string }[] = [
  { id: 'inter', name: 'Inter (Sans)', stack: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: 'georgia', name: 'Georgia (Serif)', stack: 'Georgia, ui-serif, serif' },
  { id: 'jetbrains', name: 'JetBrains (Mono)', stack: '"JetBrains Mono", ui-monospace, monospace' },
];

export const ACCENT_PRESETS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#111827', // ink
];
