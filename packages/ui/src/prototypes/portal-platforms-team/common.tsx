/**
 * PROTOTYPE helpers (RDY-178): mounts a page inside the merged RDY-175 shell and lets page-level
 * Leda shortcuts open the shell's Leda panel. Never export anything from this folder in `src/index.ts`.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Toaster } from '../../components/toast/Toaster';
import { Shell, type LedaState, type ShellRole, type ShellTheme } from '../portal-shell/Shell';

/** For Leonardo: what these pages preview with overrides because the kit does not ship it yet. */
export const MISSING_IN_KIT = [
  'Table `groupBy` / section rows: Platforms groups rows by kind (Inventory, SMS) as two tables with matching column widths; a grouped Table would keep one header.',
  'Table `rowClassName` or `density` from context: the Team density toggle swaps `dense`; a shared density setting (Appearance) would drive every table.',
  'Table responsive "stacked" mode: under 600px of content both pages swap the table for a divided list (Card padding none + ul). A built-in stacked mode would remove the duplicate markup.',
  'Container-aware columns: content width depends on the sidebar fold and the docked Leda panel, so viewport breakpoints hide the wrong columns. The prototype measures the content (ResizeObserver); the kit could use Tailwind container queries (@tailwindcss/container-queries) or a Table `minWidth` per column.',
  'Table `layout="fixed"`: Platforms uses `[&_table]:table-fixed` so the two kind groups line up column for column.',
  'SegmentedControl size sm is 36px tall (p-1 around 28px items); at the 32px control density it should be 32px to line up with SearchBar sm and Button.',
  'Shell `onAskLeda(context)` API: pages open the docked Leda panel with page context (e.g. "Makati branch"); the prototype re-drives the shell `leda` prop instead.',
  'PlatformTile: 24px rounded-sm icon tile (kind icon on surface-muted) used in tables, lists, graph and catalog; previewed with a span.',
  'Connections graph component: SVG node-link map (consumers left, providers right) with keyboard-focusable nodes; previewed in this folder.',
  'Tabs pill style uses rounded-full; the small-radius direction wants rounded-control tabs (SegmentedControl is used here instead).',
];

/**
 * Prototype-only container query: the content width changes with the sidebar fold and the docked
 * Leda panel, not only the viewport, so table columns follow the measured width.
 */
export function useContentWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(1200);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/** Prototype-only: re-drives the shell's `leda` prop so a page button can open the panel. */
export function useLedaTrigger(initial: LedaState = 'closed') {
  const [leda, setLeda] = useState<LedaState>(initial);
  useEffect(() => setLeda(initial), [initial]);
  const ask = () => {
    setLeda('closed');
    window.setTimeout(() => setLeda('conversation'), 0);
  };
  return { leda, ask };
}

export interface FrameProps {
  theme?: ShellTheme;
  role?: ShellRole;
  page: 'platforms' | 'team';
  leda: LedaState;
  children: ReactNode;
}

/** The real RDY-175 shell with the page as its content. */
export function PortalFrame({ theme = 'light', role = 'admin', page, leda, children }: FrameProps) {
  return (
    <>
      <Shell theme={theme} role={role} initialPage={page} leda={leda}>
        {children}
      </Shell>
      <Toaster />
    </>
  );
}

/** 24px kind tile (proposed PlatformTile). */
export function tileClass(size: 'sm' | 'md' = 'sm') {
  return size === 'sm'
    ? 'grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-surface-muted text-ink-muted'
    : 'grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-surface-muted text-ink-muted';
}
