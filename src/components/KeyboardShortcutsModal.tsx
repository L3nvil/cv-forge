import { Keyboard, X } from 'lucide-react';

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Z', desc: 'Urungkan perubahan (Undo)' },
    { key: 'Ctrl + Shift + Z / Ctrl + Y', desc: 'Ulangi perubahan (Redo)' },
    { key: 'Ctrl + P', desc: 'Cetak CV (Native Print A4)' },
    { key: 'Ctrl + S', desc: 'Ekspor dokumen ke PDF' },
    { key: 'F10', desc: 'Beralih Mode Fokus (bebas gangguan)' },
    { key: 'Ctrl + /', desc: 'Buka panduan pintasan keyboard ini' },
    { key: 'Esc', desc: 'Tutup modal atau keluar Mode Fokus' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pintasan Keyboard"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-slow ease-standard"
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-modal-enter relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-card border border-[var(--border)] app-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-control bg-[var(--primary)] text-white">
              <Keyboard size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.224px] text-[var(--text)]">Pintasan Keyboard</h2>
              <p className="text-xs text-[var(--text-muted)]">Akses cepat fitur dengan kombinasi tombol</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
            aria-label="Tutup panduan pintasan"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content list */}
        <div className="scroll-slim flex-1 overflow-y-auto p-6 space-y-3">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-3"
            >
              <span className="text-xs text-[var(--text)]">{sc.desc}</span>
              <kbd className="shrink-0 rounded-control border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-xs font-mono font-semibold text-[var(--text)]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[var(--border)] bg-[var(--surface-pearl)] px-6 py-3">
          <button
            type="button"
            className="btn btn-primary rounded-pill px-6 py-1.5 text-sm font-semibold active:scale-[0.95]"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
