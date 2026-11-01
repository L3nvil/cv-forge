# Audit Kualitas PDF untuk ATS (Applicant Tracking Systems) — CV Forge

**Tanggal Audit:** 10 Oktober 2026  
**Objek Audit:** Ekspor PDF CV Forge (`html2pdf.js` vs. Native Print `window.print()`)  
**Lingkungan:** Browser Chromium / WebKit / Gecko, PDF Viewer bawaan & Adobe Acrobat  

---

## 1. Analisis Metode Ekspor

### A. Ekspor Cepat (`html2pdf.js`)
* **Mekanisme:** Menggunakan `html2canvas` untuk merender DOM ke elemen `<canvas>` HTML5 beresolusi 2x (raster bitmap), lalu mengonversinya menjadi gambar JPEG/PNG (`quality: 0.98`), dan menempelkan gambar tersebut ke dokumen `jsPDF` (`pdf.addImage`).
* **Karakteristik Teks:**
  * **Seleksi Mouse:** **TIDAK BISA**. Teks tidak dapat diblok, disorot, atau disalin dengan kursor mouse karena merupakan piksel gambar raster.
  * **Pencarian (Ctrl+F):** **TIDAK BISA**. Teks tidak terindeks sebagai string teks PDF.
  * **Kompatibilitas ATS (Parser):** **BURUK / GAGAL**. Mesin ATS (Workday, Taleo, Greenhouse, Lever, dsb.) yang tidak memiliki modul OCR berbayar akan membaca dokumen sebagai halaman kosong atau gambar tanpa isi teks.
  * **Kelebihan:** Memberikan hasil tampilan visual yang 100% identik dalam sekali klik tanpa membuka dialog cetak browser.
* **Peran di CV Forge:** Dipertahankan sebagai opsi sekunder: **"PDF Cepat (Visual Identik)"**.

### B. Ekspor Native Print (`window.print()` &rarr; "Save as PDF")
* **Mekanisme:** Memanfaatkan print engine native browser modern (Blink/Gecko/WebKit) yang merender DOM CSS `@media print` langsung ke stream instruksi PostScript/PDF vektor.
* **Karakteristik Teks:**
  * **Seleksi Mouse:** **100% BISA**. Seluruh huruf, angka, simbol, dan spasi dapat disorot, disalin, dan dibaca per karakter.
  * **Pencarian (Ctrl+F):** **100% BISA**. Pencarian kata kunci dan indexing bekerja sempurna.
  * **Kompatibilitas ATS (Parser):** **SANGAT TINGGI (ATS-FRIENDLY)**. Parser ATS dapat mengekstrak teks, nama, jabatan, email, nomor telepon, dan bullet points secara akurat tanpa distorsi.
  * **Ketajaman:** Vektor murni (resolusi tak terbatas/tak pecah saat diperbesar), ukuran file lebih efisien.
* **Peran di CV Forge:** Dijadikan jalur utama: **"Unduh PDF / PDF Ramah ATS (Teks Asli)"**.

---

## 2. Tindakan dan Solusi yang Diterapkan

1. **Jalur Utama Ekspor PDF:**
   - Tombol utama pill biru di header ("Unduh PDF") diarahkan ke jalur cetak native vektor ramah ATS.
   - Dilengkapi pesan toast panduan: *"Pilih tujuan 'Save as PDF' di dialog cetak untuk PDF teks asli ramah ATS."*
   - Penamaan otomatis dokumen disematkan ke `document.title` saat proses cetak berjalan sehingga dialog browser otomatis mengisi nama file yang sesuai (misal: `Nama_Jabatan_CV.pdf`).

2. **Jalur Sekunder:**
   - Di menu "Lainnya" (dropdown header), disediakan opsi sekunder: **"Unduh PDF Cepat (Visual Identik)"** bagi pengguna yang membutuhkan file cepat dalam situasi tertentu.

3. **Optimasi Print Stylesheet (`@media print` di `src/index.css`):**
   - `@page { size: 210mm 297mm; margin: 0; }` memastikan lembar A4 presisi tanpa margin ganda browser dan tanpa kebocoran header/footer browser (URL dan tanggal).
   - `.cv-heading-avoid-orphan` (`break-after: avoid`, `break-inside: avoid`) mencegah judul section tertinggal sendirian di bagian bawah halaman.
   - `.cv-item-avoid-break` (`break-inside: avoid`) memastikan setiap item pengalaman, proyek, dan pendidikan tidak terbelah di tengah halaman.
   - `.cv-page-break-before` (`break-before: page`) memungkinkan pengguna memasukkan pemisah halaman manual yang dieksekusi sempurna oleh print engine.

---

## 3. Kesimpulan

Dengan memetakan jalur cetak native berukuran A4 presisi sebagai jalur utama dan menyertakan panduan pengguna serta penamaan file otomatis, CV Forge kini menghasilkan dokumen PDF yang 100% ramah mesin ATS dan screen reader, sambil tetap mempertahankan opsi ekspor cepat berbasis html2pdf.
