import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { cn, focusRing } from '../utils/cn';

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/** Inline text link (RDY-314): accent, underlined, focus ring. `target="_blank"` defaults `rel` to `noopener noreferrer`. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ target, rel, className, ...rest }, ref) {
  return (
    <a
      ref={ref}
      target={target}
      rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
      className={cn('rounded-[2px] text-accent underline underline-offset-2 transition-colors duration-hover hover:text-accent-hover motion-reduce:transition-none forced-colors:text-[LinkText]', focusRing, className)}
      {...rest}
    />
  );
});
