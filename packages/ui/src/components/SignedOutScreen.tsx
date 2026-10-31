import { useEffect, useRef, type ReactNode } from 'react';
import { SignIn } from '@phosphor-icons/react';
import { logoAutoworks, logoCafe } from '../prototypes/Home.logos';
import { ButtonLink } from './ButtonLink';
import { PlatformLogo } from './PlatformLogo';

/** The two tenants of the workshop data (inventory-home/round-1/final/data.js 53 and 208): platform name and logo. */
export const signedOutTenants = {
  a: { platform: 'Parts Stockroom', logo: logoAutoworks },
  b: { platform: 'Café Inventory', logo: logoCafe },
} as const;

export type SignedOutTenant = keyof typeof signedOutTenants;

export interface SignedOutScreenProps {
  /** Platform name next to the logo. */
  platform: string;
  /** Platform logo URL; the monogram shows when absent. */
  logo?: string;
  /** Where Sign in goes. */
  signInHref: string;
  title?: string;
  lead?: string;
  /** The small note under Sign in. */
  note?: ReactNode;
  /** Focus the heading on mount (default true). */
  autoFocus?: boolean;
}

/**
 * Signed out (workshop signed-out.html 20-52): platform logo and name, a title, one primary Sign in. Flat, left-aligned, unframed,
 * on the page surface; follows the document theme. The Sign in button keeps the Button geometry.
 */
export function SignedOutScreen({
  platform,
  logo,
  signInHref,
  title = 'You are signed out',
  lead = 'Your work is saved. Sign in to carry on.',
  note,
  autoFocus = true,
}: SignedOutScreenProps) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (autoFocus) h1.current?.focus();
  }, [autoFocus]);
  return (
    <div className="min-h-screen bg-surface text-text">
      <main className="mx-auto max-w-[520px] px-6 pb-12 pt-24 max-[640px]:px-4 max-[640px]:pb-8 max-[640px]:pt-16">
        <div className="flex items-center gap-2.5 text-[16px] font-semibold">
          <PlatformLogo name={platform} src={logo} size={28} decorative />
          {platform}
        </div>
        <h1 ref={h1} tabIndex={-1} className="mt-8 text-[22px] font-semibold leading-7 tracking-[-0.01em] focus:outline-none">
          {title}
        </h1>
        <p className="mt-2 text-[15px] leading-[22px] text-muted">{lead}</p>
        <div className="mt-6 max-[640px]:grid">
          <ButtonLink href={signInHref} leftIcon={SignIn} fullWidth={false}>
            Sign in
          </ButtonLink>
        </div>
        {note ? <p className="mt-3 text-[13px] leading-[19px] text-muted">{note}</p> : null}
      </main>
    </div>
  );
}
