# Feature Inventory & Parity Checklist — CV Forge

Dokumen ini mencatat seluruh fitur, alur logika, perilaku interaksi, dan detail tersembunyi yang ada pada basis kode CV Forge sebelum proses redesign UI/UX (Tahap 1 Audit).

### Status Implementasi:
- [x] **Tahap 1 — Audit**: Inventaris fitur & analisis UX selesai.
- [x] **Tahap 2 — Token**: Pemetaan token warna, radius, tipografi, breakpoint, dan variabel CSS light/dark selesai (`npm run build` lulus).
- [x] **Tahap 3 — Komponen Dasar (`ui.tsx`)**: Menyelaraskan Field, TagInput, AccordionSection, Toggle, AddButton ke sistem DESIGN.md (`npm run build` lulus).
- [x] **Tahap 4 — Panel dan Layout**: Customizer, AvatarUploader, FormBuilder, App selesai (`npm run build` lulus).
- [x] **Tahap 5 — Verifikasi Akhir**: Build lulus, 0 error TypeScript/lint, semua data model dan template CV terlindungi utuh.

---

## 1. Checklist Paritas Fitur Inti (AGENTS.md)

| Fitur | Status Kode Saat Ini | Lokasi Kode | Catatan Perilaku & Interaksi |
|---|---|---|---|
| **Editor Split-Screen** | Terverifikasi | `src/App.tsx` | Split pane: Form di kiri (lebar `w-full lg:w-[46%] lg:max-w-[640px]`), preview A4 live di kanan (`min-h-0 flex-1`). |
| **4 Template CV** | Terverifikasi | `src/components/CVPreview.tsx` | - Modern Minimalist (`modern`)<br>- Tech Single Column (`tech`)<br>- Creative Split (`creative`)<br>- Classic ATS (`classic`)<br>*Aturan: Tampilan template tidak boleh diubah.* |
| **Kustomisasi Desain** | Terverifikasi | `src/components/Customizer.tsx` | - **Warna Aksen:** 8 preset hex (`#6366f1`, `#0ea5e9`, `#10b981`, `#f59e0b`, `#ef4444`, `#ec4899`, `#8b5cf6`, `#111827`) + native color picker (`<input type="color">`).<br>- **Font:** Inter (Sans), Georgia (Serif), JetBrains Mono.<br>- **Spacing Density:** compact, normal, relaxed (mengontrol variable CSS `--line`, `--gap`, `--sec`). |
| **Section: Personal Info & Avatar** | Terverifikasi | `src/components/FormBuilder.tsx`, `src/components/AvatarUploader.tsx` | - Data: `fullName`, `title`, `email`, `phone`, `location`, `website`, `linkedin`, `github`.<br>- Avatar: Upload gambar (validasi max 4MB, base64 data URL), zoom slider (1.0–3.0), offset X (-50..50%), offset Y (-50..50%), tombol ganti/hapus, toggle tampilkan avatar (`showAvatar`).<br>- Tooltip info pada field headline/title. |
| **Section: Professional Summary** | Terverifikasi | `src/components/FormBuilder.tsx`, `src/lib/polish.ts` | - Input textarea.<br>- Tombol "Polish writing" (heuristic lokal di `polishSummary`: hapus kata orang pertama, ganti kata kerja lemah dengan kata aksi, kapitalisasi, titik akhir).<br>- Tooltip info panduan penulisan.<br>- Toggle visibilitas section (`sectionVisibility.summary`). |
| **Section: Work Experience** | Terverifikasi | `src/components/FormBuilder.tsx` | - Input berulang: `role`, `company`, `location`, `startDate`, `endDate`, `current` (checkbox: nonaktifkan & kosongkan `endDate`).<br>- Bullet points berulang: textarea per bullet, tombol "Suggest XYZ rewrite" (`suggestBullet`: heuristic formula XYZ + kata kerja kuat + saran metrik), tombol hapus bullet, tombol tambah bullet.<br>- Tambah item & hapus item.<br>- Toggle visibilitas section (`sectionVisibility.experience`). |
| **Section: Projects** | Terverifikasi | `src/components/FormBuilder.tsx` | - Input berulang: `title`, `link`, `description`, `tech` (TagInput), `achievements` (TagInput).<br>- Tambah & hapus item.<br>- Toggle visibilitas section (`sectionVisibility.projects`). |
| **Section: Education & Certifications** | Terverifikasi | `src/components/FormBuilder.tsx` | - Berada di dalam satu accordion bersama.<br>- Education: `institution`, `degree`, `field`, `startDate`, `endDate`, `details`. Tambah & hapus item.<br>- Certifications: `name`, `issuer`, `date`. Tambah & hapus item.<br>- Toggle visibilitas section (`sectionVisibility.education` & `sectionVisibility.certifications`). |
| **Section: Skills** | Terverifikasi | `src/components/FormBuilder.tsx`, `src/components/ui.tsx` | - Grup skill berulang: `category` + `skills` (TagInput dengan input teks, Enter untuk tambah, Backspace untuk hapus tag terakhir, tombol silang 'x').<br>- Tambah grup skill & hapus grup skill.<br>- Toggle visibilitas section (`sectionVisibility.skills`). |
| **Section: Honors & Achievements** | Terverifikasi | `src/components/FormBuilder.tsx` | - Input berulang: `title`, `issuer`, `date`, `description`.<br>- Tambah item & hapus item.<br>- Toggle visibilitas section (`sectionVisibility.honors`). |
| **Toggle Tampil/Sembunyi Section** | Terverifikasi | `src/components/ui.tsx` (`Toggle`, `AccordionSection`) | Mengontrol visibilitas tanpa menghapus data di `cv.sectionVisibility`. Komponen `CVPreview` menyembunyikan section yang `false`. |
| **Export PDF** | Terverifikasi | `src/lib/export.ts` | `exportPdf(fileName)` menggunakan `html2pdf.js` (lazy dynamic import). Merender node `#print-root` dari portal `#print-mount` secara off-screen (`left: -10000px`), resolusi scale 2, ukuran [794, 1123]. Nama file dari nama lengkap user atau fallback `cv.pdf`. State loading `exporting` menonaktifkan tombol dan menampilkan teks "Exporting…". |
| **Print Native** | Terverifikasi | `src/lib/export.ts`, `src/index.css` | `printCV()` memanggil `window.print()`. Menggunakan `@media print` CSS: menyembunyikan `#root`, menampilkan `#print-mount #print-root` tanpa skala/zoom, A4 page size asli, warna akurat (`print-color-adjust: exact`). |
| **Export & Import JSON** | Terverifikasi | `src/lib/export.ts`, `src/App.tsx` | - `downloadJson(state, fileName)` mendownload state lengkap sebagai `${fileName}.json`.<br>- `handleImport(file)` membaca via `FileReader`, memvalidasi via `parseImport(text)`. Menerima format `AppState` lengkap atau `CVData` langsung. Menampilkan alert jika file tidak valid. |
| **Auto-Save LocalStorage** | Terverifikasi | `src/hooks/useLocalStorage.ts` | - Key: `cvforge.state.v1`.<br>- Debounce 400ms saat ada perubahan state.<br>- In-memory fallback jika storage error/penuh. |
| **Tema Terang/Gelap Workspace** | Terverifikasi | `src/hooks/useTheme.ts`, `src/index.css` | - Key: `cvforge.theme`.<br>- Deteksi sistem `prefers-color-scheme`.<br>- Mengubah class `dark` pada `document.documentElement`. |
| **Kontrol Zoom Preview** | Terverifikasi | `src/App.tsx` | - Fit-to-width otomatis via `ResizeObserver` pada `canvasWrapRef` (`zoom = clamp(0.4, avail / A4_W, 1)`).<br>- Tombol manual: Zoom out (-8%), indikator persentase, Zoom in (+8%), rentang [0.4, 1.2]. |
| **Layout Responsif** | Terverifikasi | `src/App.tsx` | - Mobile (< 1024px): tombol toggle editor (`PanelLeftClose`/`PanelLeft`) untuk beralih tampilan antara Form saja atau Preview saja.<br>- Desktop (>= 1024px): kedua pane tampil berdampingan secara bersamaan. |

---

## 2. Fitur & Perilaku Tersembunyi (Discovered Behaviors)

1. **Reset ke Sampel:**
   - Tombol "Reset" di panel Customizer mengembalikan seluruh data CV dan Customization ke `defaultState` (`sampleCV` Alex Rivera + `defaultCustomization`).
   - Memunculkan dialog browser: `confirm('Reset all content and design to the sample CV?')`.
2. **Start from Blank:**
   - Tombol "Start from blank" di panel Customizer mengosongkan semua isian CV menjadi `emptyCV`.
   - Memunculkan dialog browser: `confirm('Clear all fields and start from blank?')`.
3. **Current Employment Toggle:**
   - Checkbox "I currently work here" pada Experience otomatis mengosongkan `endDate` dan menonaktifkan input tanggal selesai.
4. **Item-Level Visibility Data vs UI:**
   - Model data (`ExperienceItem`, `ProjectItem`, `EducationItem`, `CertificationItem`, `HonorItem`) memiliki properti `visible: boolean`, dan `CVPreview.tsx` memfilter item dengan `.filter(x => x.visible)`.
   - Namun di antarmuka FormBuilder saat ini, **tidak ada tombol/toggle untuk visibilitas per-item** (hanya ada tombol hapus sampah).
5. **Item Sorting (Urutan Item):**
   - Saat ini item berulang (Experience, Project, Education, Cert, Skill, Honor) hanya bisa ditambah (masuk ke akhir array) dan dihapus. Belum ada tombol naik/turun atau drag-and-drop untuk mengubah urutan.
6. **Validasi File Avatar:**
   - Batas file avatar adalah 4MB (`file.size > 4_000_000`). Jika melebihi, memunculkan `alert('Please choose an image under 4MB.')`.
   - Menggunakan slider untuk zoom (1.0–3.0) dan offset X/Y (-50% s/d +50%).
7. **Offline Heuristic Polish (Tanpa AI/API Eksternal):**
   - `polishSummary` membersihkan kalimat pembuka orang pertama (`i am`, `i've`, dll.), mengganti daftar 6 frasa lemah (`responsible for`, dll.) menjadi `drove`, merapikan spasi, dan memastikan tanda titik di akhir.
   - `suggestBullet` mengecek jika kata pertama adalah verba lemah (`was`, `did`, `made`, `helped`, `worked`), lalu menggantinya dengan verba kuat acak. Jika belum ada angka di kalimat, menambahkan saran: `" — add a metric (e.g. by 30%, to 10k users)."`.
8. **TagInput Keyboard Shortcuts:**
   - Tombol `Enter`: menambahkan tag baru (mencegah duplikasi).
   - Tombol `Backspace` saat input kosong: menghapus tag terakhir.
9. **Penanganan Nama File:**
   - Nama file untuk PDF dan JSON diambil dari nama lengkap: `state.cv.personal.fullName?.trim().replace(/\s+/g, '_') || 'cv'`.
10. **Portal Isolasi Print/Export:**
    - Ada DOM container `#print-mount` di luar `#root` yang me-render salinan `CVPreview` dengan prop `forPrint={true}`.
    - Saat ekspor PDF, `#print-mount` dipindahkan sementara ke koordinat off-screen `left: -10000px` dan `display: block` agar `html2canvas` dapat merender node berukuran penuh (794x1123) tanpa terganggu oleh CSS zoom layar.

---

## 3. Ringkasan Masalah UX Saat Ini

1. **Pencampuran Identitas Visual Workspace vs Dokumen (Pelanggaran Wilayah Desain):**
   - Warna aksen CV yang dipilih pengguna (misal oranye, hijau, ungu) saat ini bocor ke UI chrome aplikasi: ikon logo CV Forge di header, tombol "Export PDF", dan border/background di panel Customizer. Ini melanggar prinsip `DESIGN.md` dan `AGENTS.md`: workspace harus memiliki warna interaktif tunggal `primary` (#0066cc Action Blue), sedangkan aksen pengguna hanya boleh berlaku pada dokumen CV.
2. **Kepadatan & Hirarki Header yang Sesak:**
   - Header aplikasi memuat 8 tombol sekaligus dengan gaya yang tidak seragam (outline, ghost, filled, icon-only) dan breakpoint yang tidak konsisten (`hidden md:inline`, `hidden sm:inline`).
   - Tidak ada hirarki visual yang jelas antara aksi utama (Export PDF) dengan utilitas sekunder (Import, JSON, Print, Theme, Editor Toggle).
3. **Penempatan Panel Customizer yang Mengganggu Alur Form:**
   - Tombol "Design" membuka panel Customizer yang disisipkan di bagian paling atas form kiri (di atas section personal info). Hal ini mendorong seluruh konten formulir ke bawah, memutus konsentrasi pengguna, dan memperpanjang scroll form.
4. **Kekurangan pada Komponen Formulir & Input:**
   - Input formulir menggunakan kotak standar abu-abu dengan radius kecil (`rounded-lg`) dan outline fokus tebal, belum menerapkan keanggunan gaya Apple (pill search input 44px untuk single line, 18px radius untuk card, tipografi caption 14px).
   - Target sentuh pada beberapa kontrol aksi kecil (tombol hapus sampah, tombol suggest XYZ, tombol panah accordion) berada di bawah standar aksesibilitas 44x44px.
   - Tooltip panduan field (Info icon) mengandalkan hover murni yang rawan terpotong/hilang pada layar sentuh atau viewport sempit.
5. **Staging Kanvas Preview:**
   - Kanvas preview di sisi kanan menggunakan warna abu-abu generik (`var(--surface-2)` / `#f1f5f9`), bukan latar belakang `canvas-parchment` (#f5f5f7) yang elegan.
   - Dokumen A4 belum memanfaatkan drop shadow tunggal khas sistem Apple (`rgba(0,0,0,0.22) 3px 5px 30px`) yang memberikan efek produk fisik melayang di atas permukaan galeri.
6. **Dialog Browser Primitif:**
   - Fitur Reset, Start from blank, dan Validasi Impor/Ukuran Avatar masih menggunakan `window.alert()` dan `window.confirm()` bawaan browser yang memblokir layar dan merusak estetika antarmuka.
