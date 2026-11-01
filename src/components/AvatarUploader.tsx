import { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import type { PersonalInfo } from '../types/cv';
import { Field, Toggle } from './ui';

export function AvatarUploader({
  personal,
  onChange,
}: {
  personal: PersonalInfo;
  onChange: (patch: Partial<PersonalInfo>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress and resize avatar to maximum 480px to save storage space
        const maxDim = 480;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          onChange({
            avatar: compressed,
            avatarZoom: 1,
            avatarOffsetX: 0,
            avatarOffsetY: 0,
          });
        } else {
          onChange({
            avatar: String(e.target?.result),
            avatarZoom: 1,
            avatarOffsetX: 0,
            avatarOffsetY: 0,
          });
        }
      };
      img.src = String(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Show avatar on CV</span>
        <Toggle
          checked={personal.showAvatar}
          onChange={(v) => onChange({ showAvatar: v })}
          srLabel="Show avatar on CV"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Circular crop preview */}
        <div
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-pill border border-[var(--border)] bg-[var(--surface-pearl)]"
        >
          {personal.avatar ? (
            <img
              src={personal.avatar}
              alt="avatar preview"
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${personal.avatarZoom}) translate(${personal.avatarOffsetX}%, ${personal.avatarOffsetY}%)`,
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[var(--text-muted)]">No image</div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className="btn btn-outline min-h-[40px] flex-1 rounded-pill text-sm hover:border-[var(--primary)] active:scale-[0.95]"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} />
            <span>{personal.avatar ? 'Replace image' : 'Upload image'}</span>
          </button>
          {personal.avatar && (
            <button
              type="button"
              className="btn min-h-[40px] rounded-pill text-sm text-[var(--status-danger)] transition duration-fast ease-standard hover:bg-[var(--status-danger-bg)] active:scale-[0.95]"
              onClick={() => onChange({ avatar: '' })}
            >
              <Trash2 size={16} />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {personal.avatar && (
        <div className="animate-item-enter grid grid-cols-1 gap-3 rounded-control border border-[var(--border-subtle)] bg-[var(--surface-pearl)] p-4 sm:grid-cols-3">
          <Field label="Zoom">
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={personal.avatarZoom}
              onChange={(e) => onChange({ avatarZoom: Number(e.target.value) })}
              className="w-full accent-[var(--primary)] cursor-pointer"
            />
          </Field>
          <Field label="Offset X">
            <input
              type="range"
              min={-50}
              max={50}
              value={personal.avatarOffsetX}
              onChange={(e) => onChange({ avatarOffsetX: Number(e.target.value) })}
              className="w-full accent-[var(--primary)] cursor-pointer"
            />
          </Field>
          <Field label="Offset Y">
            <input
              type="range"
              min={-50}
              max={50}
              value={personal.avatarOffsetY}
              onChange={(e) => onChange({ avatarOffsetY: Number(e.target.value) })}
              className="w-full accent-[var(--primary)] cursor-pointer"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
