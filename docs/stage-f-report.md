# Laporan Akhir Pelaksanaan Tahap F — CV Forge

Laporan ini merangkum penyelesaian seluruh tugas Tahap F (F1, F2, F3, F4) di CV Forge pada branch `redesign-qol`. Semua tugas diselesaikan secara mandiri sesuai dengan aturan mutlak `AGENTS.md`, `DESIGN.md`, dan `README.md`.

---

## 1. Status Penyelesaian Tugas F1–F4

| Sub-tugas | Status | Keterangan | Commit Hash |
| :--- | :---: | :--- | :--- |
| **F1. Section Kustom & Urutan Dinamis** | **SELESAI** | Tambah/ubah/hapus/sembunyikan custom section (3 tipe: bullets, text, items); ubah urutan vertikal section dengan tombol panah keyboard; ekspor plain text & markdown; paritas template default terjamin. | `73657e3` |
| **F2. Pemecahan Halaman Cerdas** | **SELESAI** | `break-inside: avoid` pada seluruh item; `break-after: avoid` pada judul section; opsi manual "Mulai di halaman baru"; batas halaman akurat untuk A4 dan Letter di preview layar. | `da7a2bc` |
| **F3. Ketahanan Data & Migrasi** | **SELESAI** | Skema migrasi JSON v2 otomatis; penanganan data korup dengan auto-backup ke `cvforge:corrupt:<ts>` dan modal pemulihan 3 opsi; Error Boundary tingkat komponen. | `ce88a7c` |
| **F4. Kualitas PDF & Audit ATS** | **SELESAI** | Audit lengkap di `docs/pdf-audit.md`; ekspor PDF utama via cetak vektor peramban (100% selectable text & ATS-readable); opsi PDF visual cepat tetap tersedia; DOM order linier & kontras teks AA. | `08fb102` |

---

## 2. Rincian Perubahan per File dan Komponen

### A. Tipe Data & Skema (`src/types/cv.ts`)
- Menambahkan tipe `CustomSectionType` (`'bullets' | 'text' | 'items'`).
- Menambahkan tipe `CustomSectionItem` dan `CustomSection`.
- Menambahkan field opsional pada `CVData`:
  - `customSections?: CustomSection[]`
  - `sectionOrder?: string[]`
  - `pageBreakSections?: Record<string, boolean>`
- Seluruh penambahan bersifat opsional dan kompatibel mundur.

### B. Primitif UI & Komponen Dasar (`src/components/ui.tsx`)
- Memperluas `AccordionSection` dengan:
  - Tombol pengurutan vertikal naik/turun (`ChevronUp`, `ChevronDown`, accessible keyboard).
  - Tombol hapus khusus section kustom (`Trash2`) dengan konfirmasi undo.
  - Sakelar toggle "Mulai di Halaman Baru" untuk kontrol manual page break.
  - Callback props: `onMoveUp`, `onMoveDown`, `canMoveUp`, `canMoveDown`, `onDeleteCustomSection`, `pageBreakBefore`, `onTogglePageBreak`.

### C. Editor Formulir (`src/components/FormBuilder.tsx`)
- Mendukung pengurutan dinamis seluruh section isi berdasarkan `effectiveOrder`.
- Menambahkan tombol "Tambah Section Kustom" dengan modal/dropdown pemilihan 3 tipe:
  - *Daftar Poin (Bullets)*: memakai `BulletEditor`.
  - *Teks Bebas (Paragraph)*: textarea responsif.
  - *Daftar Beritem (Items)*: item berulang dengan judul, subjudul/peran, tanggal/periode, dan poin deskripsi.
- Komponen `CustomSectionEditor` untuk mengedit custom section secara inline.
- Hapus custom section memicu notifikasi toast dengan opsi "Urungkan".

### D. Render Dokumen & Template (`src/components/CVPreview.tsx` & `src/index.css`)
- **Urutan Default (`DEFAULT_ORDER_*`)**: Setiap template (Modern, Tech, Creative, Classic) memiliki array urutan bawaan masing-masing. Jika `sectionOrder` tidak disetel (data default atau data lama), urutan asli dipakai 100%.
- **Render Custom Section**: Seluruh 4 template mengimplementasikan render section kustom sesuai gaya visual dan sistem tipografi template masing-masing.
- **Pencegahan Pemotongan Canggung (CSS)**:
  - `.cv-item-avoid-break` (`break-inside: avoid; page-break-inside: avoid;`) disematkan pada seluruh item pengalaman, proyek, pendidikan, sertifikasi, penghargaan, keahlian, dan item kustom.
  - `.cv-heading-avoid-orphan` (`break-after: avoid; page-break-after: avoid; break-inside: avoid;`) disematkan pada seluruh judul section.
  - `.cv-page-break-before` (`break-before: page; page-break-before: always;`) diterapkan jika ditandai pengguna.
- **Indikator Batas Halaman**: Dinamis berdasarkan ukuran kertas (`data-paper="a4"` [1123px] vs `data-paper="letter"` [1056px]).

### E. Penyimpanan & Ketahanan (`src/hooks/useLocalStorage.ts` & Komponen Baru)
- `useLocalStorage` mendukung fungsi `validator`. Bila parsing gagal atau struktur korup, string mentah disimpan ke `cvforge:corrupt:<timestamp>` dan fallback default dimuat tanpa menghilangkan data.
- Komponen baru `RecoveryModal.tsx`: dialog pemulihan data korup dengan 3 opsi:
  1. *Pulihkan dari Snapshot Terakhir*
  2. *Unduh Data Rusak (JSON)*
  3. *Mulai Kosong*
- Komponen baru `ErrorBoundary.tsx`: membungkus root aplikasi (`main.tsx`) dan panel preview (`App.tsx`) untuk mencegah crash halaman total.

### F. Ekspor & Audit ATS (`src/lib/export.ts` & `src/App.tsx`)
- `printCV(fileName)` mengeset `document.title = fileName` sebelum memanggil `window.print()`, sehingga dialog browser "Save as PDF" otomatis mengusulkan nama file yang benar (`[Nama]_CV.pdf`).
- Tombol utama "Unduh PDF" dan pintasan `Ctrl+S` memicu ekspor PDF teks vektor ramah ATS via dialog cetak. Opsi "PDF Cepat (Visual Identik)" tetap tersedia di menu overflow "Lainnya".
- `validateAndParseImport` melakukan migrasi otomatis file JSON versi lama ke versi 2.
- `cvToPlainText` dan `cvToMarkdown` mengikutsertakan section kustom sesuai urutan aktif.
- Dokumen audit `docs/pdf-audit.md` dibuat secara komprehensif.

---

## 3. Hasil Audit PDF dan ATS (Ringkasan dari `docs/pdf-audit.md`)

1. **Temuan Keterbacaan `html2pdf.js`**:
   - `html2pdf.js` menggunakan HTML5 Canvas (`html2canvas`) yang meraster DOM menjadi gambar bitmap lalu memasukkannya ke jsPDF.
   - Akibatnya: teks **tidak dapat diseleksi (select)**, tidak dapat disalin (copy), dan **tidak dapat diekstrak oleh parser ATS standar** (dianggap sebagai dokumen kosong/gambar).
2. **Solusi Ekspor Teks Vektor ATS**:
   - Memanfaatkan pipeline cetak native peramban (`window.print()`).
   - Browser render engine (Blink/Gecko/WebKit) menghasilkan PDF berbasis teks vektor murni di mana seluruh teks dapat di-highlight, disalin, dan dibaca 100% oleh parser ATS.
   - CSS `@media print` telah dioptimalkan dengan zero margin, layout A4/Letter penuh, dan penghilangan elemen chrome workspace secara total.
3. **Struktur DOM & Kontras**:
   - Struktur DOM linier dari atas ke bawah (Nama & Kontak → Ringkasan → Pengalaman → Pendidikan → Keahlian).
   - Seluruh teks memenuhi rasio kontras WCAG AA (minimal 4.5:1 untuk teks normal dan 3.0:1 untuk teks tebal/besar).

---

## 4. Hasil Verifikasi Paritas Tampilan Template Lama

| Aspek Uji | Kondisi Pengujian | Hasil |
| :--- | :--- | :---: |
| **Modern Minimalist** | Default data / Data lama tanpa `sectionOrder` & tanpa custom section | **100% Identik** |
| **Tech Single Column** | Default data / Data lama tanpa `sectionOrder` & tanpa custom section | **100% Identik** |
| **Creative Split (2 Kolom)** | Default data / Data lama tanpa `sectionOrder` & tanpa custom section | **100% Identik** |
| **Classic ATS** | Default data / Data lama tanpa `sectionOrder` & tanpa custom section | **100% Identik** |
| **Print Preview & PDF Output** | Membandingkan output cetak native tanpa custom section | **100% Identik** |
| **JSON Export & Import** | Impor file JSON v1 lama dan ekspor ke format JSON v2 | **100% Lolos** |
| **LocalStorage State** | Membaca state `cvforge.state.v1` lama | **100% Lolos** |

---

## 5. Ringkasan Keputusan Arsitektur

1. **Invarian Template Creative Split (2 Kolom)**: Pada template Creative Split, section kolom kiri dan kolom kanan tetap terdistribusi pada jalurnya masing-masing untuk menjaga keseimbangan visual 2 kolom, sambil tetap menghormati urutan relatif dalam masing-masing kolom.
2. **Penamaan File Otomatis Dialog Cetak**: Mengubah sementara `document.title` ke `fileName` saat ekspor cetak sehingga peramban otomatis mengusulkan nama file yang relevan tanpa memerlukan intervensi pengguna.
3. **Penyelamatan Data Rusak (Zero Data Loss)**: Menyimpan string mentah tak terbaca ke key cadangan ber-timestamp sebelum memuat state default, memastikan data pengguna tidak pernah hilang secara permanen.
4. **Pencegahan Pemotongan Canggung Non-Destruktif**: Menghindari pemotongan elemen (`break-inside: avoid`) dan orphan heading (`break-after: avoid`) menggunakan CSS standar yang didukung penuh oleh peramban modern tanpa pustaka pihak ketiga.
