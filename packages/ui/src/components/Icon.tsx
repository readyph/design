import { forwardRef } from 'react';
import type { Icon as PhosphorIcon, IconProps, IconWeight } from '@phosphor-icons/react';
import { iconSize, type IconSize } from '../tokens';
import { cn } from '../utils/cn';

export interface IconComponentProps extends Omit<IconProps, 'size' | 'weight' | 'ref'> {
  /** A Phosphor icon component, e.g. `MagnifyingGlass`. */
  icon: PhosphorIcon;
  /** Token size (sm 16 / md 20 / lg 24) or an explicit pixel number. */
  size?: IconSize | number;
  /** Phosphor weight; `regular` by default, `bold`/`fill` for emphasis/active. */
  weight?: IconWeight;
}

/**
 * Consistent icon wrapper around Phosphor: fixes default size + weight from
 * tokens so icon usage is uniform and swappable. Inherits `currentColor`.
 */
export const Icon = forwardRef<SVGSVGElement, IconComponentProps>(function Icon(
  { icon: IconCmp, size = 'md', weight = 'regular', className, ...rest },
  ref,
) {
  const px = typeof size === 'number' ? size : iconSize[size];
  return (
    <IconCmp
      ref={ref}
      size={px}
      weight={weight}
      className={cn('shrink-0', className)}
      {...rest}
    />
  );
});
