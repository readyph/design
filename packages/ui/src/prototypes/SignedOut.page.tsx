import { useEffect } from 'react';
import { SignedOutScreen, signedOutTenants } from '../components/SignedOutScreen';

export { signedOutTenants };

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

  return (
    <SignedOutScreen
      platform={t.platform}
      logo={t.logo}
      signInHref={`${homeHref}${keep ? `?${keep}` : ''}`}
      note="Signing in here takes you back to Home. (Prototype: no password is asked.)"
    />
  );
}
