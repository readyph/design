import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { UploadSimple } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { Button } from './Button';
import { PlatformLogo } from './PlatformLogo';

export const LOGO_SIZE = 128;
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;
/** Default size limit for the chosen file (before the crop). */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export interface LogoUploadProps {
  /** Platform name: the alt text and the source of the monogram, which follows it live. */
  name: string;
  /** Current logo (URL or data URL); `null` shows the monogram. Leave it out to let the component keep the cropped image itself. */
  value?: string | null;
  /** Called with the 128x128 cropped PNG (and its data URL), or `null` for "Use the default". Not called on an error. */
  onChange: (file: File | null, dataUrl: string | null) => void;
  /** Position of the platform in platform order, for the monogram colour (see `PlatformLogo`). */
  index?: number;
  /** Stored identity colour (see `PlatformLogo`). */
  color?: string | number;
  /** Largest file accepted, in bytes (default 2 MB). */
  maxBytes?: number;
  /** Label above the control (default "Logo"). */
  label?: string;
  disabled?: boolean;
  className?: string;
}

const mb = (n: number) => `${Math.round((n / 1024 / 1024) * 10) / 10} MB`;

function dataUrlToFile(dataUrl: string, name: string): File {
  const [head, body = ''] = dataUrl.split(',');
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: /data:([^;]+)/.exec(head)?.[1] ?? 'image/png' });
}

/** Centre-crop `file` to a square and scale it to 128x128 (PNG). Rejects when the image cannot be decoded. */
function cropToLogo(file: File): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width || LOGO_SIZE;
          const h = img.naturalHeight || img.height || LOGO_SIZE;
          const s = Math.min(w, h) || 1;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = LOGO_SIZE;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas');
          ctx.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, LOGO_SIZE, LOGO_SIZE);
          const dataUrl = canvas.toDataURL('image/png');
          resolve({ dataUrl, file: dataUrlToFile(dataUrl, `${file.name.replace(/\.[^.]+$/, '') || 'logo'}.png`) });
        } catch (e) {
          reject(e);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Logo field for a platform's General info: shows the logo (or the generated monogram), an Upload button that
 * crops the chosen PNG, JPG or SVG to 128x128, and "Use the default" to go back to the monogram.
 * Errors (wrong type, too large, unreadable) show under the control and never call `onChange`.
 */
export const LogoUpload = forwardRef<HTMLDivElement, LogoUploadProps>(function LogoUpload(
  { name, value, onChange, index, color, maxBytes = LOGO_MAX_BYTES, label = 'Logo', disabled, className },
  ref,
) {
  const uid = useId();
  const input = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const [own, setOwn] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [returnFocus, setReturnFocus] = useState(0);
  const src = value !== undefined ? value : own;

  // "Use the default" removes the button that was pressed: put focus on Upload if it was lost.
  useEffect(() => {
    if (returnFocus) focusIfLost(root.current, upload.current);
  }, [returnFocus]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!(LOGO_TYPES as readonly string[]).includes(file.type)) {
      setStatus('');
      setError('Use a PNG, JPG or SVG image.');
      return;
    }
    if (file.size > maxBytes) {
      setStatus('');
      setError(`That file is over ${mb(maxBytes)}. Choose a smaller one.`);
      return;
    }
    try {
      const out = await cropToLogo(file);
      setError('');
      setOwn(out.dataUrl);
      setStatus('Logo updated.');
      onChange(out.file, out.dataUrl);
    } catch {
      setStatus('');
      setError("We couldn't read that image. Try another file.");
    }
  };

  const useDefault = () => {
    setError('');
    setOwn(null);
    setStatus('Using the default logo.');
    onChange(null, null);
    setReturnFocus((n) => n + 1);
  };

  const labelId = `${uid}-label`;
  const errorId = `${uid}-error`;
  return (
    <div
      ref={(el) => {
        root.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      className={cn('min-w-0', className)}
    >
      <span id={labelId} className="mb-1 block text-ui font-medium text-text">{label}</span>
      <div role="group" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined} className="flex flex-wrap items-center gap-3">
        <PlatformLogo name={name} src={src ?? undefined} index={index} color={color} size={32} decorative />
        <input
          ref={input}
          type="file"
          accept={LOGO_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <Button ref={upload} type="button" variant="secondary" leftIcon={UploadSimple} disabled={disabled} aria-describedby={error ? errorId : undefined} onClick={() => input.current?.click()}>
          Upload
        </Button>
        {src ? (
          <Button type="button" variant="text" disabled={disabled} onClick={useDefault}>Use the default</Button>
        ) : (
          <span className="text-small text-muted">Default: initials on a colour. PNG, JPG or SVG.</span>
        )}
      </div>
      {error ? <p id={errorId} role="alert" className="m-0 mt-1 text-small text-bad-ink">{error}</p> : null}
      <span role="status" className="sr-only">{status}</span>
    </div>
  );
});
