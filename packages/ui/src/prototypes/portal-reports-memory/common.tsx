/**
 * PROTOTYPE helpers (RDY-179): page wrapper on the merged RDY-175 shell, plus the in-page
 * "Ask Leda" path that opens the shell's docked panel / sheet.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { Shell, type LedaState, type ShellTheme } from '../portal-shell/Shell';

export type ViewState = 'ready' | 'loading' | 'error' | 'empty' | 'no-results';

/** For Leonardo: previewed here with overrides or composition because the kit lacks them. */
export const MISSING_IN_KIT = [
  'Table `selectedKey` (row selected state: surface-muted fill + aria-selected). Memory previews it with a primary title colour.',
  'Table column `truncate` option (cell gets `w-full max-w-0` so long text ellipsises instead of widening the table). Previewed with column className.',
  'TrendChart / BarChart: responsive, token-coloured, small-radius bars with value labels and an accessible table fallback. Previewed with a scaled `Sparkline` (area).',
  'StatStrip: hairline-divided KPI row that wraps (flex-wrap, shared borders) with a compact `Stat` value size (text-xl). Previewed by composition.',
  'Toolbar: one row of search + filters left, count + actions right, wrapping at 390. Previewed with flex-wrap.',
  'Master-detail split (list | 28rem pane) for >= 1280 with single-view + back below. Previewed in Memory.',
  'Shell `onAskLeda(prompt)`: page-level hook to open the Leda panel with a seeded prompt (Portal `useLeda().openDock`). Previewed by re-driving the shell `leda` prop.',
];

/** Prototype-only breakpoint check (the split view must not render a hidden second copy). */
export function useMediaQuery(query: string) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : true);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** Opens the shell's Leda panel from inside the page (stand-in for `useLeda().openDock`). */
export function useAskLeda(initial: LedaState = 'closed') {
  const [leda, setLeda] = useState<LedaState>(initial);
  const ask = () => {
    setLeda('closed');
    window.requestAnimationFrame(() => setLeda('conversation'));
  };
  return { leda, ask };
}

/** Inline load error with retry (layout rule: Notice tone error + retry). */
export function RetryNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Notice tone="error" title={title}>
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span>{children}</span>
        <Button size="sm" variant="secondary">
          Retry
        </Button>
      </span>
    </Notice>
  );
}

export function PageShell({
  theme,
  page,
  leda,
  children,
}: {
  theme: ShellTheme;
  page: 'reports' | 'memory';
  leda: LedaState;
  children: ReactNode;
}) {
  return (
    <Shell theme={theme} initialPage={page} leda={leda}>
      {children}
    </Shell>
  );
}
