import { useState } from 'react';
import { Layers, Plus, Copy, Edit2, Trash2, Check, X } from 'lucide-react';
import type { CVVersion } from '../hooks/useCVVersions';

export function VersionManagerModal({
  isOpen,
  onClose,
  versions,
  activeVersion,
  onSwitch,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  versions: CVVersion[];
  activeVersion: CVVersion;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newVersionName, setNewVersionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleStartRename = (v: CVVersion) => {
    setEditingId(v.id);
    setEditName(v.name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleCreate = () => {
    if (newVersionName.trim()) {
      onCreate(newVersionName.trim());
      setNewVersionName('');
      setIsCreating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kelola Versi CV"
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
              <Layers size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.224px] text-[var(--text)]">Versi CV</h2>
              <p className="text-xs text-[var(--text-muted)]">Kelola variasi CV untuk target lowongan berbeda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
            aria-label="Tutup modal versi"
          >
            <X size={16} />
          </button>
        </div>

        {/* Versions List */}
        <div className="scroll-slim flex-1 overflow-y-auto p-6 space-y-3">
          {versions.map((v) => {
            const isActive = v.id === activeVersion.id;
            const isEditing = editingId === v.id;

            return (
              <div
                key={v.id}
                className={`flex items-center justify-between gap-3 rounded-control border p-3 transition duration-fast ease-standard ${
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--surface-pearl)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="app-input flex-1 py-1 text-sm"
                        value={editName}
                        autoFocus
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(v.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary rounded-control px-2.5 py-1 text-xs"
                        onClick={() => handleSaveRename(v.id)}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSwitch(v.id)}
                        className="truncate text-left text-sm font-semibold tracking-[-0.12px] text-[var(--text)] hover:text-[var(--primary)]"
                      >
                        {v.name}
                      </button>
                      {isActive && (
                        <span className="rounded-pill bg-[var(--primary)] px-2 py-0.5 text-xs font-semibold text-white">
                          Aktif
                        </span>
                      )}
                    </div>
                  )}
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Diperbarui {new Date(v.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => onSwitch(v.id)}
                      className="btn btn-outline rounded-pill px-3 py-1 text-xs active:scale-[0.95]"
                      title="Gunakan versi ini"
                    >
                      Buka
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStartRename(v)}
                    className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                    title="Ganti nama versi"
                    aria-label="Ganti nama versi"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(v.id)}
                    className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                    title="Duplikat versi ini"
                    aria-label="Duplikat versi ini"
                  >
                    <Copy size={14} />
                  </button>
                  {versions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus versi "${v.name}"?`)) {
                          onDelete(v.id);
                        }
                      }}
                      className="grid h-7 w-7 place-items-center rounded-control text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] active:scale-[0.95]"
                      title="Hapus versi ini"
                      aria-label="Hapus versi ini"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Create New Form */}
          {isCreating ? (
            <div className="rounded-control border border-[var(--primary)] p-3">
              <p className="mb-2 text-xs font-semibold text-[var(--text)]">Buat Versi Baru</p>
              <div className="flex items-center gap-2">
                <input
                  className="app-input flex-1 py-1.5 text-sm"
                  placeholder="Contoh: Frontend Engineer, Tech Lead"
                  value={newVersionName}
                  autoFocus
                  onChange={(e) => setNewVersionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 py-1.5 text-xs font-semibold"
                  onClick={handleCreate}
                >
                  Simpan
                </button>
                <button
                  type="button"
                  className="btn btn-ghost rounded-pill px-3 py-1.5 text-xs"
                  onClick={() => setIsCreating(false)}
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="btn btn-outline flex w-full items-center justify-center gap-1.5 rounded-pill border-dashed py-2 text-xs font-semibold text-[var(--primary)] hover:border-[var(--primary)] active:scale-[0.95]"
            >
              <Plus size={14} />
              <span>Tambah Versi Baru</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[var(--border)] bg-[var(--surface-pearl)] px-6 py-3">
          <button
            type="button"
            className="btn btn-primary rounded-pill px-6 py-1.5 text-sm font-semibold active:scale-[0.95]"
            onClick={onClose}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
