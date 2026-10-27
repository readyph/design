import { useEffect, useState, type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import { initialsOf } from './AccountMenu';

export type AvatarSize = 24 | 32 | 40;

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Full name. Gives the initials and the accessible name. */
  name: string;
  /** Override the initials (default: first and last name initial). */
  initials?: string;
  /** Optional photo. Replaces the initials; falls back to them if it fails to load. */
  src?: string;
  /** 24, 32 or 40 px. Default 32. */
  size?: AvatarSize;
  /** Hide from assistive tech, for when the name is already written beside it. */
  decorative?: boolean;
  /** `pending` is a dashed outline for someone invited but not yet joined. */
  tone?: 'default' | 'pending';
}

const sizeCls: Record<AvatarSize, string> = {
  24: 'size-6 text-[10px]',
  32: 'size-8 text-small',
  40: 'size-10 text-ui',
};

/** A round person avatar: initials, or a photo that falls back to initials. Tokens only, so it follows light, dark and forced colours. */
export function Avatar({ name, initials, src, size = 32, decorative = false, tone = 'default', className, ...rest }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const showImage = !!src && !failed;
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name };
  return (
    <span
      {...a11y}
      className={cn(
        'grid shrink-0 select-none place-items-center overflow-hidden rounded-full font-medium forced-colors:border forced-colors:border-[CanvasText]',
        sizeCls[size],
        tone === 'pending' ? 'border border-dashed border-control bg-surface text-muted' : 'bg-accent-tint text-accent',
        className,
      )}
      {...rest}
    >
      {showImage ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden>{initials ?? initialsOf(name)}</span>
      )}
    </span>
  );
}
