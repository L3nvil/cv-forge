import { AlertTriangle, Download, RotateCcw, Sparkles } from 'lucide-react';

export function RecoveryModal({
  corruptedRaw,
  onRestoreSnapshot,
  onStartBlank,
  onDismiss,
}: {
  corruptedRaw: string;
  onRestoreSnapshot: () => void;
  onStartBlank: () => void;
  onDismiss: () => void;
}) {
  const handleDownloadCorrupted = () => {
    try {
      const blob = new Blob([corruptedRaw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cvforge_corrupted_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengunduh file cadangan.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-card border border-[var(--border)] bg-[var(--surface)] p-6 shadow-none text-[var(--text)] animate-modal-enter">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-pill bg-[var(--status-warning-bg)] text-[var(--status-warning)]">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h2 id="recovery-modal-title" className="text-lg font-semibold tracking-[-0.374px]">
              Pemulihan Data Penyimpanan (Safe Recovery)
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
              Data CV di browser Anda terdeteksi rusak atau formatnya tidak sesuai skema. Data mentah Anda telah dicadangkan secara otomatis ke memori lokal. Silakan pilih opsi pemulihan di bawah ini:
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {/* Opsi 1: Pulihkan dari Snapshot */}
          <button
            type="button"
            onClick={onRestoreSnapshot}
            className="flex w-full items-center justify-between rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-3.5 text-left transition duration-fast hover:border-[var(--primary)] hover:bg-[var(--surface)] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-[var(--primary)]" />
              <div>
                <div className="text-sm font-semibold">Pulihkan dari Snapshot Terakhir</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Muat data otomatis dari riwayat snapshot yang tersimpan sebelum data rusak
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-[var(--primary)]">Pilih &rarr;</span>
          </button>

          {/* Opsi 2: Unduh Data Rusak */}
          <button
            type="button"
            onClick={handleDownloadCorrupted}
            className="flex w-full items-center justify-between rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-3.5 text-left transition duration-fast hover:border-[var(--primary)] hover:bg-[var(--surface)] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <Download size={18} className="text-[var(--status-success)]" />
              <div>
                <div className="text-sm font-semibold">Unduh Data Rusak (JSON)</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Simpan file data mentah ke komputer agar isi tulisan sebelumnya tidak hilang
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-[var(--status-success)]">Unduh &darr;</span>
          </button>

          {/* Opsi 3: Mulai Kosong */}
          <button
            type="button"
            onClick={onStartBlank}
            className="flex w-full items-center justify-between rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-3.5 text-left transition duration-fast hover:border-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <RotateCcw size={18} className="text-[var(--status-danger)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--status-danger)]">Mulai Kosong</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Atur ulang formulir ke status baru yang bersih
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-[var(--status-danger)]">Reset</span>
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-control px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition duration-fast"
          >
            Tutup Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
