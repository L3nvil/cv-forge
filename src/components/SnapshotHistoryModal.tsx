import { History, X, Trash2, RotateCcw, Camera } from 'lucide-react';
import type { CVSnapshot } from '../hooks/useCVSnapshots';
import type { AppState } from '../types/cv';

export function SnapshotHistoryModal({
  isOpen,
  onClose,
  snapshots,
  onRestore,
  onTakeSnapshot,
  onDeleteSnapshot,
}: {
  isOpen: boolean;
  onClose: () => void;
  snapshots: CVSnapshot[];
  onRestore: (state: AppState) => void;
  onTakeSnapshot: () => void;
  onDeleteSnapshot: (id: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Riwayat Snapshot Otomatis"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-slow ease-standard"
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-modal-enter relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-[var(--border)] app-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-control bg-[var(--primary)] text-white">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.224px] text-[var(--text)]">
                Riwayat Snapshot (10 Terakhir)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Snapshot tersimpan otomatis saat Anda bekerja
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
            aria-label="Tutup riwayat snapshot"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-pearl)] px-6 py-2.5">
          <span className="text-xs text-[var(--text-muted)]">
            {snapshots.length} dari 10 slot riwayat terisi
          </span>
          <button
            type="button"
            onClick={onTakeSnapshot}
            className="flex items-center gap-1.5 rounded-pill border border-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 active:scale-[0.95]"
          >
            <Camera size={14} />
            <span>Ambil Snapshot Sekarang</span>
          </button>
        </div>

        {/* Content list */}
        <div className="scroll-slim flex-1 overflow-y-auto p-6 space-y-3">
          {snapshots.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              Belum ada snapshot tersimpan. Snapshot akan dicatat otomatis secara berkala.
            </div>
          ) : (
            snapshots.map((snap) => {
              const time = new Date(snap.timestamp).toLocaleString();
              return (
                <div
                  key={snap.id}
                  className="flex items-center justify-between gap-3 rounded-control border border-[var(--border)] bg-[var(--surface)] p-3.5 transition duration-fast hover:border-[var(--primary)]/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold text-[var(--text)]">
                        {snap.title}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{time}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onRestore(snap.state);
                        onClose();
                      }}
                      className="flex items-center gap-1 rounded-control bg-[var(--primary)] px-2.5 py-1 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.95]"
                      title="Pulihkan state CV ke snapshot ini"
                    >
                      <RotateCcw size={14} />
                      <span>Pulihkan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="grid h-7 w-7 place-items-center rounded-control text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] active:scale-[0.95]"
                      title="Hapus snapshot ini"
                      aria-label="Hapus snapshot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
