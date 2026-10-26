import { forwardRef, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn, focusRing } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { Badge, type BadgeTone } from './Badge';
import { ErrorBlock } from './ErrorBlock';
import { PlatformLogo, type PlatformLogoProps } from './PlatformLogo';
import { Skeleton } from './Skeleton';
import { StatusDot } from './StatusDot';
import { WeekChart, type WeekChartProps } from './WeekChart';

export type ShareTone = 'ok' | 'warn' | 'bad' | 'accent' | 'neutral';

export interface SharePart {
  label: string;
  value: number;
  /** Status parts keep their status colour; omit for the two neutral greys (alternating). */
  tone?: ShareTone;
}

export interface ShareBarProps {
  /** The list's own words: "Open jobs". */
  title: string;
  /** The list total, shown at the right. */
  total?: number | string;
  parts: SharePart[];
  /** Makes the title a button (opens the list). */
  onOpen?: () => void;
  className?: string;
}

const partFill: Record<ShareTone, string> = {
  ok: 'fill-ok-dot',
  warn: 'fill-warn-dot',
  bad: 'fill-bad-dot',
  accent: 'fill-accent',
  neutral: 'fill-share-1',
};
const partSwatch: Record<ShareTone, string> = {
  ok: 'bg-ok-dot',
  warn: 'bg-warn-dot',
  bad: 'bg-bad-dot',
  accent: 'bg-accent',
  neutral: 'bg-share-1',
};

/**
 * Share bar (C31): a 6px stacked bar from a list's summary, with a legend that writes every label and value, so
 * the colours never carry the meaning alone. Segments are separated by a 2px surface gap.
 */
export function ShareBar({ title, total, parts, onOpen, className }: ShareBarProps) {
  const id = useId();
  // a part that is not a finite number is missing: no segment, no share of the total, "—" in the legend
  const ok = (v: number) => Number.isFinite(v);
  const sum = parts.reduce((t, p) => t + (ok(p.value) ? Math.max(0, p.value) : 0), 0);
  let grey = 0;
  const resolved = parts.map((p) => {
    const tone: ShareTone = p.tone ?? 'neutral';
    const alt = !p.tone ? grey++ % 2 : 0;
    return { ...p, tone, alt };
  });
  let at = 0;
  return (
    <div role="group" aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        {onOpen ? (
          <button id={id} type="button" onClick={onOpen} className={cn('min-w-0 truncate rounded-chip text-ui font-medium text-text hover:underline', focusRing)}>{title}</button>
        ) : (
          <span id={id} className="min-w-0 truncate text-ui font-medium text-text">{title}</span>
        )}
        {total !== undefined && <b className="shrink-0 text-ui font-semibold tabular-nums text-text">{typeof total === 'number' && !ok(total) ? '\u2014' : total}</b>}
      </div>
      {sum > 0 && (
        <svg aria-hidden width="100%" height={6} className="block overflow-hidden rounded-full bg-raised forced-colors:bg-[Canvas]">
          {resolved.map((p, i) => {
            if (!ok(p.value) || p.value <= 0) return null;
            const x = (at / sum) * 100;
            const w = (p.value / sum) * 100;
            at += p.value;
            return (
              <rect key={`${p.label}-${i}`} x={`${x}%`} y={0} width={`${w}%`} height={6} strokeWidth={2} className={cn('stroke-surface forced-colors:fill-[CanvasText] forced-colors:stroke-[Canvas]', p.tone === 'neutral' ? (p.alt ? 'fill-share-2' : 'fill-share-1') : partFill[p.tone])} />
            );
          })}
        </svg>
      )}
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-0.5 p-0 text-small text-muted">
        {resolved.map((p, i) => (
          <li key={`${p.label}-${i}`} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-full', p.tone === 'neutral' ? (p.alt ? 'bg-share-2' : 'bg-share-1') : partSwatch[p.tone])} />
            {p.label} <b className="font-semibold tabular-nums text-text">{ok(p.value) ? p.value : '\u2014'}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface OverviewPlatformStatus {
  /** `ok` is the quiet "Running" dot with a slow pulse; any other tone is a pill. */
  tone: BadgeTone;
  label: string;
  /** "since 9:40 AM". */
  since?: string;
}

export interface OverviewPlatform {
  id: string;
  name: string;
  /** "Auto repair". */
  kind?: string;
  /** Identity of the logo tile (the name is passed for you). */
  logo?: Pick<PlatformLogoProps, 'src' | 'index' | 'color' | 'hq' | 'initials'>;
  status?: OverviewPlatformStatus;
  /** One figure and its label: "₱128,400" "revenue, last 7 days". */
  figure?: { value: string; label: string };
  /** The line under the figure: "best day Wed 21". */
  sub?: string;
  /** The chart. `null` = no history yet. Omit `kind` for bars. */
  chart?: (Omit<WeekChartProps, 'compact'> & { note?: string }) | null;
  /** Today's lists as share bars. */
  shares?: ShareBarProps[];
  /** Heading above the shares. Default "Today so far". */
  sharesTitle?: string;
  /** KPI facts line (pass a `FactsLine`). */
  facts?: ReactNode;
  /** `error`: "Couldn't load ... Retry" in the chart's place. `loading`: skeletons in the final layout. */
  state?: 'ready' | 'loading' | 'error';
  /** What failed, after "Couldn't load your": default "{name} numbers". */
  errorThing?: string;
  retrying?: boolean;
  onRetry?: () => void;
  /** Makes the name a button (opens the platform). */
  onOpen?: () => void;
}

export interface OverviewChartsProps {
  platforms: OverviewPlatform[];
  /** Accessible name of the region. Default "Last 7 days". */
  'aria-label'?: string;
  /** Locale for the default number formats of the charts. */
  locale?: string;
  /** Own width below which the platforms stack. Default 760. */
  stackBelow?: number;
  /** Merged on the wrapper only. */
  className?: string;
}

const colsClass = ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3'];

function StatusPart({ status }: { status: OverviewPlatformStatus }) {
  if (status.tone === 'ok') return <StatusDot status="ok" pulse label={status.label} />;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge tone={status.tone} dot>{status.label}</Badge>
      {status.since && <span className="text-small tabular-nums text-muted">{status.since}</span>}
    </span>
  );
}

interface BlockProps {
  p: OverviewPlatform;
  layout: 'col' | 'row' | 'stack-row';
  locale?: string;
}

function PlatformBlock({ p, layout, locale }: BlockProps) {
  const nameId = useId();
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const retried = useRef(false);
  const state = p.state ?? 'ready';
  const row = layout === 'row';
  const compactChart = row;
  const logoSize = row || layout === 'stack-row' ? 16 : 24;

  // After Retry the pressed button is gone: send focus to the heading only if focus was really lost (shared util).
  useLayoutEffect(() => {
    if (state !== 'error' && retried.current) {
      retried.current = false;
      focusIfLost(sectionRef.current, headRef.current);
    }
  }, [state]);

  const retry = p.onRetry
    ? () => {
        retried.current = true;
        p.onRetry?.();
      }
    : undefined;

  const name = (
    <h3 ref={headRef} tabIndex={-1} id={nameId} title={p.name} className="m-0 min-w-0 truncate text-ui font-semibold text-text outline-0">
      {p.onOpen ? <button type="button" title={p.name} onClick={p.onOpen} className={cn('max-w-full truncate rounded-chip hover:underline', focusRing)}>{p.name}</button> : p.name}
    </h3>
  );
  const identity = (
    <div className="flex min-w-0 items-center gap-2">
      <PlatformLogo name={p.name} {...p.logo} size={logoSize as 16 | 24} decorative />
      <div className="min-w-0">
        {name}
        {(p.kind || (layout !== 'col' && p.status)) && (
          <p className="m-0 flex flex-wrap items-center gap-x-2 text-small text-muted">{p.kind}{layout !== 'col' && p.status && state !== 'error' && <StatusPart status={p.status} />}</p>
        )}
      </div>
    </div>
  );

  const figure =
    state === 'loading' ? (
      <div className="flex flex-col gap-1.5" aria-hidden><Skeleton className="h-7 w-28" /><Skeleton variant="text" className="w-40" /></div>
    ) : state === 'error' || !p.figure ? null : (
      <div className="min-w-0">
        <p className="m-0 flex flex-wrap items-baseline gap-x-2"><span className="text-overview-figure font-medium tabular-nums text-text">{p.figure.value}</span><span className="text-ui text-muted">{p.figure.label}</span></p>
        {p.sub && <p className="m-0 text-small tabular-nums text-muted">{p.sub}</p>}
        {layout !== 'col' && p.chart?.note && <p className="m-0 text-small text-muted">{p.chart.note}</p>}
      </div>
    );

  const chart =
    state === 'loading' ? (
      <Skeleton className={cn('w-full', compactChart ? 'h-16' : 'h-[168px]')} />
    ) : state === 'error' ? (
      <ErrorBlock thing={p.errorThing ?? `${p.name} numbers`} onRetry={retry} retrying={p.retrying} retryLabel="Retry" />
    ) : p.chart === null || p.chart === undefined ? (
      <p className="m-0 text-ui text-muted">No 7-day history yet</p>
    ) : (
      <div className="min-w-0">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h4 title={p.chart.title} className="m-0 min-w-0 truncate text-ui font-medium text-text">{p.chart.title}</h4>
          {layout === 'col' && p.chart.note && <span className="min-w-0 shrink-0 truncate text-small text-muted" title={p.chart.note}>{p.chart.note}</span>}
        </div>
        <WeekChart {...p.chart} locale={p.chart.locale ?? locale} compact={compactChart} tickCount={p.chart.tickCount ?? (compactChart ? 2 : 4)} />
      </div>
    );

  if (row || layout === 'stack-row') {
    return (
      <section ref={sectionRef} aria-labelledby={nameId} aria-busy={state === 'loading' || undefined} className={cn('grid min-w-0 gap-x-6 gap-y-3 border-t border-rule py-row-y-tight first:border-t-0', layout === 'row' ? 'grid-cols-[minmax(0,15rem)_minmax(0,11rem)_minmax(0,1fr)] items-center' : 'grid-cols-1')}>
        {identity}
        {figure}
        <div className="min-w-0">{chart}</div>
      </section>
    );
  }
  return (
    <section ref={sectionRef} aria-labelledby={nameId} aria-busy={state === 'loading' || undefined} className="flex min-w-0 flex-col gap-3">
      <header className="flex min-w-0 items-center justify-between gap-3">
        {identity}
        {p.status && state !== 'error' && <StatusPart status={p.status} />}
      </header>
      {figure}
      {chart}
      {state === 'ready' && p.shares && p.shares.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-rule pt-3">
          <h4 className="m-0 text-small font-medium text-muted">{p.sharesTitle ?? 'Today so far'}</h4>
          {p.shares.map((s) => <ShareBar key={s.title} {...s} />)}
        </div>
      )}
      {state === 'ready' && p.facts}
    </section>
  );
}

/**
 * Overview charts (C31): each platform's last 7 days. Up to 3 platforms get a column each; 4 or more get one compact
 * row each (identity, figure, a short chart with 2-3 ticks). Below 760px of the component's own width (measured, not
 * the viewport) columns stack and rows fold the chart under the figure. A failed platform shows "Couldn't load ...
 * Retry" in the chart's place while the rest still render. All colours are tokens.
 */
export const OverviewCharts = forwardRef<HTMLDivElement, OverviewChartsProps>(function OverviewCharts(
  { platforms, 'aria-label': ariaLabel = 'Last 7 days', locale, stackBelow = 760, className },
  ref,
) {
  const box = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [rem, setRem] = useState(16);
  const probe = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    // text zoom: the row columns are in rem, so the fold point scales with the root font size
    const read = () => {
      setWidth(Math.floor(el.clientWidth));
      setRem(probe.current?.getBoundingClientRect().width || 16);
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    if (probe.current) ro.observe(probe.current); // 1rem wide: it resizes when the text is zoomed
    return () => ro.disconnect();
  }, []);
  const setRefs = (node: HTMLDivElement | null) => {
    box.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const stacked = width > 0 && width < (stackBelow * Math.max(16, rem)) / 16;
  const many = platforms.length >= 4;
  return (
    <div ref={setRefs} role="region" aria-label={ariaLabel} className={cn('relative block w-full min-w-0 max-w-full', className)}>
      <span ref={probe} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 h-0 w-4" />
      {many ? (
        <div className="flex flex-col">
          {platforms.map((p) => <PlatformBlock key={p.id} p={p} layout={stacked ? 'stack-row' : 'row'} locale={locale} />)}
        </div>
      ) : (
        <div className={cn('grid gap-x-6 gap-y-8', stacked ? 'grid-cols-1' : colsClass[Math.min(3, platforms.length)])}>
          {platforms.map((p) => <PlatformBlock key={p.id} p={p} layout="col" locale={locale} />)}
        </div>
      )}
    </div>
  );
});
