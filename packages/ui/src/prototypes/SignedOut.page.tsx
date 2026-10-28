import { useEffect, useRef } from 'react';
import { SignIn } from '@phosphor-icons/react';
import { ButtonLink } from '../components/ButtonLink';
import { PlatformLogo } from '../components/PlatformLogo';
import { logoAutoworks, logoCafe } from './Home.logos';

/** The two tenants of the workshop data (inventory-home/round-1/final/data.js 53 and 208): platform name and logo. */
export const signedOutTenants = {
  a: { platform: 'Parts Stockroom', logo: logoAutoworks },
  b: { platform: 'Café Inventory', logo: logoCafe },
} as const;

export interface SignedOutPageProps {
  /** `?tenant=` of the workshop page. */
  tenant?: keyof typeof signedOutTenants;
  /** `?as=` (viewer), only carried to the Sign in link. */
  as?: string;
  /** `?theme=`: sets `data-theme` on the document, like the workshop script. */
  theme?: 'light' | 'dark';
  /** Where Sign in goes (workshop: home.html). */
  homeHref?: string;
}

/**
 * RDY-410. Prototype only: not exported from the package. Exact copy of workshop/prototypes/inventory-home/round-1/final/signed-out.html
 * (lines 20-30 CSS, 39-52 markup and script; handover 2.8): platform logo and name, "You are signed out", one primary Sign in back to
 * Home keeping tenant, viewer and theme. Flat, left-aligned, one primary.
 */
export function SignedOutPage({ tenant, as, theme, homeHref = 'home.html' }: SignedOutPageProps) {
  const t = signedOutTenants[tenant ?? 'a'];
  const h1 = useRef<HTMLHeadingElement>(null);
  const keep = (
    [
      ['tenant', tenant],
      ['as', as],
      ['theme', theme],
    ] as const
  )
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join('&');

  useEffect(() => {
    const prev = document.title;
    document.title = `Signed out · ${t.platform}`;
    return () => {
      document.title = prev;
    };
  }, [t.platform]);

  // No dependency list: a host that rewrites `data-theme` while rendering (the Storybook toolbar) is overruled again on every render.
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', theme);
    return () => {
      if (prev) root.setAttribute('data-theme', prev);
      else root.removeAttribute('data-theme');
    };
  });

  useEffect(() => {
    h1.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text">
      <main className="mx-auto max-w-[520px] px-6 pb-12 pt-24 max-[640px]:px-4 max-[640px]:pb-8 max-[640px]:pt-16" id="so">
        <div className="flex items-center gap-2.5 text-[16px] font-semibold">
          <PlatformLogo name={t.platform} src={t.logo} size={28} decorative />
          {t.platform}
        </div>
        <h1 ref={h1} id="h1" tabIndex={-1} className="mt-8 text-[22px] font-semibold leading-7 tracking-[-0.01em] focus:outline-none">
          You are signed out
        </h1>
        <p className="mt-2 text-[15px] leading-[22px] text-muted">Your work is saved. Sign in to carry on.</p>
        <ButtonLink
          id="signin"
          href={`${homeHref}${keep ? `?${keep}` : ''}`}
          className="mt-6 h-11 px-6 text-[15px] font-semibold max-[640px]:h-[52px] max-[640px]:w-full"
        >
          <SignIn size={16} aria-hidden="true" />
          Sign in
        </ButtonLink>
        <p className="mt-3 text-[13px] leading-[19px] text-muted">Signing in here takes you back to Home. (Prototype: no password is asked.)</p>
      </main>
    </div>
  );
}
