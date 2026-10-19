import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../../utils/cn';
import { Icon } from '../../components/Icon';

/**
 * PROTOTYPE (RDY-120) - a real link (<a href>) styled like Button. The kit Button has no href/asChild, so leaving an
 * app as a Button breaks middle-click and copy-link. Flagged for Leonardo: Button (or a ButtonLink) should support href.
 */
type Variant = 'primary' | 'secondary';
type Size = 'sm' | 'md';

const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap border border-transparent rounded-base font-medium transition-colors duration-DEFAULT ease-standard';
const variants: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'border-border-strong bg-surface text-ink hover:bg-surface-subtle active:bg-surface-muted',
};
const sizes: Record<Size, string> = { sm: 'h-sm px-3 text-sm', md: 'h-md px-4 text-sm' };

export function LinkButton({
  href, variant = 'primary', size = 'md', fullWidth, leftIcon, rightIcon, children, className, ...rest
}: { href: string; variant?: Variant; size?: Size; fullWidth?: boolean; leftIcon?: PhosphorIcon; rightIcon?: PhosphorIcon; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <a href={href} className={cn(base, focusRing, variants[variant], sizes[size], fullWidth && 'w-full', className)} {...rest}>
      {leftIcon && <Icon icon={leftIcon} size="sm" />}
      {children}
      {rightIcon && <Icon icon={rightIcon} size="sm" />}
    </a>
  );
}
