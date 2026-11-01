import { useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  onUndo?: () => void;
  undoLabel?: string;
  durationMs?: number;
}

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.durationMs ?? 5000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-card border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] shadow-none backdrop-blur-md animate-modal-enter"
      style={{
        background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
      }}
    >
      <span>{toast.message}</span>
      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="btn btn-outline flex items-center gap-1.5 rounded-pill border-[var(--primary)] px-3 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--surface-pearl)] active:scale-[0.95]"
        >
          <RotateCcw size={14} />
          <span>{toast.undoLabel || 'Urungkan'}</span>
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
      >
        <X size={14} />
      </button>
    </div>
  );
}
