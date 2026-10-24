import { useEffect, useState } from 'react';

function read(query: string, fallback: boolean): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : fallback;
}

/**
 * Tracks a CSS media query in JS. Use it when a hidden component must not exist
 * at all (e.g. a Radix dialog that would otherwise trap focus). `fallback` is
 * returned where `matchMedia` is unavailable (SSR, some test runners).
 */
export function useMediaQuery(query: string, fallback = true): boolean {
  const [matches, setMatches] = useState(() => read(query, fallback));
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
