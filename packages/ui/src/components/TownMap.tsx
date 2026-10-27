import { forwardRef, type ReactNode, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import { ArrowClockwise, ArrowCounterClockwise, Minus, Plus, PlusSquare } from '@phosphor-icons/react';
import { identity } from '../tokens/colors';
import { cn, focusRing } from '../utils/cn';
import { PlatformLogo } from './PlatformLogo';
import { createTownScene, type TownLinkStatus, type TownMapType, type TownScene, type TownStatus } from './townmap/scene';
import { placeLabels } from './townmap/placeLabels';

export type { TownLinkStatus, TownMapType, TownStatus } from './townmap/scene';
export { placeLabels, type LabelBox, type PlacedLabel } from './townmap/placeLabels';

export interface TownMapPlatform {
  id: string;
  /** Full name (label, accessible name). */
  name: string;
  /** Short name shown on narrow maps and when 6+ platforms share the map. Falls back to `name`. */
  shortName?: string;
  /** Kind as the owner reads it, e.g. "Inventory". Second label line; the sign of a generic office when there is no building for the kind. */
  kind: string;
  /** Catalog `mapType`: which building to draw. Omit it (or `office`) for the generic office. */
  mapType?: TownMapType;
  status: TownStatus;
  /** Clock text for "since" on a slow platform, e.g. "10:12 AM". */
  statusSince?: string;
  /** Open decisions for this platform (count badge, "N need you"). */
  count?: number;
  /** Uploaded logo URL (falls back to the monogram). */
  logo?: string;
  /** Stored identity colour (palette hex or slot 1-8); tints the plot ring. */
  color?: string | number;
  /** 1-based platform order; picks the identity colour when `color` is absent. */
  index?: number;
  initials?: string;
  /** HQ plot (team and plan): office building, slate "HQ" tile. */
  hq?: boolean;
  /** This platform's data did not load: label says "no data", the building keeps its lights. */
  error?: boolean;
  /** Whole sub line of the label (replaces the generated one), e.g. "Repair shop · slow since 7:40". */
  sub?: string;
  /** Show the sub line without hover even for a running platform. */
  subAlways?: boolean;
}

/** A grid slot: a platform, or `null` for an empty lot. Order is the layout order (row by row). */
export type TownMapSlot = TownMapPlatform | null;

export interface TownMapLink {
  from: string;
  to: string;
  /** ok = solid cobalt road with vans; slow = long dashes, amber, slow vans; broken = short dashes, raspberry, no vans. */
  status: TownLinkStatus;
}

/** What the map shows beyond its data. `state()` returns it; `morph(from)` eases from it to the current one. */
export interface TownMapView {
  selected: string | null;
  focus: string | null;
  highlight: string[] | null;
}

export interface TownMapHandle {
  /** Quarter turn; -1 left, 1 right. */
  rotate(dir: -1 | 1): void;
  /** One zoom step; -1 out, 1 in. Returns the new zoom (1 to 2.4). */
  zoom(dir: -1 | 1): number;
  /** One van drives from one platform to another, once (a confirmed transfer). No-op under reduced motion. */
  runVan(from: string, to: string): boolean;
  /** Current selected / focus / highlight. */
  state(): TownMapView;
  /** Show `from` at once, then ease to the current view (subpage slide). Static under reduced motion. */
  morph(from: TownMapView, ms?: number): void;
  /** Re-run the label collision pass. Labels re-place themselves on resize and data change; call after a font load. */
  placeLabels(): void;
  /** Prototype compat, does nothing: the map follows `data-theme` and the system theme through the tokens. */
  setDark(dark: boolean): void;
}

export interface TownMapProps {
  platforms: readonly TownMapSlot[];
  links?: readonly TownMapLink[];
  /** Selected platform id: cobalt ring and pale tint (Home filter). Others dim unless `dimOthers` is false. */
  selected?: string | null;
  /** Hovered or focused ids: roads that do not join two of them dim. */
  highlight?: readonly string[] | null;
  /** One building and its own roads stay lit; everything else dims (Platforms rows). */
  focus?: string | null;
  /** Dim the other buildings while one is selected (default true). Platforms passes false: the ring only. */
  dimOthers?: boolean;
  /** Building or label picked, or `null` for empty ground / Escape. */
  onSelect?: (id: string | null) => void;
  /** Pointer over a building or label (map.js mouseenter; keyboard focus only shows the focus outline); `null` when it leaves. */
  onHover?: (id: string | null) => void;
  /** Labels without status, no controls, selection ignored. */
  loading?: boolean;
  /** The map's data did not load: dimmed, with a notice and Retry when `onRetry` is set. */
  error?: boolean;
  onRetry?: () => void;
  /** Plain text above the map, e.g. "2 platforms + HQ". */
  caption?: ReactNode;
  /** Dim the other labels by fading them (the workshop Platforms page, `.blabel.dim`) instead of the muted text. Fading lowers contrast, so use it where the dimming follows the pointer. */
  fadeOthers?: boolean;
  /** Show the "The map did not load" notice when `error` is set (default true). The workshop Platforms page dims the map and says "No data" in its caption instead. */
  errorNotice?: boolean;
  /** Adds the workshop's "Add platform" button to the map controls (label hidden at 960px and below, and on a narrow map). */
  onAddPlatform?: () => void;
  /** Accessible name of the whole map (a group of buttons, one per platform). */
  label?: string;
  /** Overrides the accessible name of a platform button. */
  platformLabel?: (p: TownMapPlatform) => string;
  /** Overrides the accessible name of the HQ button (default "HQ, your team and plan"). */
  hqLabel?: (p: TownMapPlatform) => string;
  /** A second line under the HQ label (shown when selected or hovered), like "HQ · 6 of 7 on". Without it the HQ label is one line. */
  hqSub?: (p: TownMapPlatform) => string;
  className?: string;
}

const statusWord: Record<TownStatus, string> = { ACTIVE: 'Running', DEGRADED: 'Slow', OFFLINE: 'Offline' };
const linkWord: Record<TownLinkStatus, string> = { ok: 'working', slow: 'slow', broken: 'broken' };

const slotHex = (p: TownMapPlatform): string => {
  if (p.hq) return '#4f6074';
  const c = p.color;
  if (typeof c === 'string') {
    const i = identity.findIndex((h) => h.toLowerCase() === c.trim().toLowerCase());
    if (i >= 0) return identity[i];
  }
  if (typeof c === 'number' && c >= 1 && c <= 8) return identity[c - 1];
  return identity[((((p.index ?? 1) - 1) % 8) + 8) % 8];
};

const defaultLabel = (p: TownMapPlatform): string => {
  const n = p.count ? `, ${p.count} need you` : '';
  if (p.hq) return `HQ, your team and plan${n}`;
  return `${p.name}, ${p.kind}, ${p.error ? 'no data' : statusWord[p.status].toLowerCase()}${n}`;
};

/** Shape-coded status mark (never colour alone): slow = filled dot, offline = ring, no data = dashed ring. */
function StatusMark({ status, error, filled, className }: { status: TownStatus; error?: boolean; filled?: boolean; className?: string }) {
  const shape = error
    ? 'border border-dashed border-faint'
    : status === 'OFFLINE' && filled
      ? 'bg-bad-dot'
      : status === 'OFFLINE'
      ? 'border-2 border-bad-dot'
      : status === 'ACTIVE'
        ? 'bg-ok-dot forced-colors:bg-[CanvasText]'
        : 'bg-warn-dot forced-colors:bg-[CanvasText]';
  return <span aria-hidden="true" className={cn('inline-block size-[7px] shrink-0 rounded-full', shape, className)} />;
}

const dataSig = (platforms: readonly TownMapSlot[], links: readonly TownMapLink[]) =>
  JSON.stringify([
    platforms.map((p) => (p ? [p.id, p.mapType ?? 'office', p.hq ? 'HQ' : p.kind, p.status, p.name] : null)),
    links.map((l) => [l.from, l.to, l.status]),
  ]);

/**
 * Platform map (C16): the owner's isometric town. One building per platform (warehouse = Inventory, service = repair shop,
 * store = POS, generic office for any other kind, HQ plot), empty lots, roads for data links coloured and dashed by link status,
 * and an HTML label button per building. It replaces the Lab TownScene (RDY-224).
 *
 * Accessibility: the drawing is `aria-hidden`; the map is a group named by `label` holding a list of buttons (one per platform,
 * in layout order, `aria-pressed` for the selected one) and a screen-reader list of the links with their status in words.
 * Rotate and zoom controls are real buttons: visible on hover, on `:focus-within`, and always on touch devices.
 *
 * Performance: the scene draws imperatively; React state is never set per frame. The loop stops when nothing moves, pauses when
 * the map is off-screen, and every observer, listener and frame is released on unmount.
 */
export const TownMap = forwardRef<TownMapHandle, TownMapProps>(function TownMap(
  {
    platforms,
    links = [],
    selected = null,
    highlight = null,
    focus = null,
    dimOthers = true,
    onSelect,
    onHover,
    loading = false,
    error = false,
    onRetry,
    caption,
    onAddPlatform,
    errorNotice = true,
    fadeOthers = false,
    label = 'Platform map',
    platformLabel = defaultLabel,
    hqLabel = defaultLabel,
    hqSub,
    className,
  },
  ref,
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const baseRef = useRef<SVGGElement>(null);
  const marksRef = useRef<SVGGElement>(null);
  const linksRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGGElement>(null);
  const objectsRef = useRef<SVGGElement>(null);
  const hostRef = useRef<HTMLUListElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TownScene | null>(null);
  const labelEls = useRef(new Map<string, HTMLButtonElement>());
  const reducedRef = useRef(false);

  // latest props for the scene's callbacks (the scene is created once)
  const live = useRef({ onSelect, onHover, loading, dimOthers, platforms });
  live.current = { onSelect, onHover, loading, dimOthers, platforms };

  const real = useMemo(() => platforms.filter((p): p is TownMapPlatform => !!p), [platforms]);
  const many = real.length >= 6;
  const sig = dataSig(platforms, links);
  const hlSig = highlight && highlight.length ? highlight.join('|') : '';

  const layout = useCallback(() => {
    const scene = sceneRef.current;
    const host = hostRef.current;
    if (!scene || !host) return;
    const rect = host.getBoundingClientRect();
    const anchors = scene.anchors(rect);
    const boxes = anchors.flatMap((a) => {
      const el = labelEls.current.get(a.id);
      if (!el) return [];
      const pri = (el.dataset.sel !== undefined ? 4 : 0) + (el.dataset.count !== undefined ? 2 : 0) + (el.dataset.hl !== undefined ? 1 : 0);
      return [{ id: a.id, ax: a.ax, ay: a.ay, w: el.offsetWidth, h: el.offsetHeight, priority: pri }];
    });
    if (rect.width > 0) {
      for (const p of placeLabels(boxes, rect.width, rect.height)) {
        const el = labelEls.current.get(p.id);
        if (!el) continue;
        el.style.setProperty('--lx', `${Math.round(p.x)}px`);
        el.style.setProperty('--ly', `${Math.round(p.y + p.h)}px`);
        el.style.setProperty('--stem', `${p.stem}px`);
        el.style.setProperty('--stem-x', `${p.stemX}px`);
      }
    }
    for (const el of labelEls.current.values()) el.setAttribute('data-placed', '');
  }, []);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  // labels are measured in the page font: place them again once it has loaded (the prototype does the same)
  useEffect(() => {
    let on = true;
    if (typeof document !== 'undefined' && document.fonts?.ready) void document.fonts.ready.then(() => on && layoutRef.current());
    return () => {
      on = false;
    };
  }, []);

  // scene lifetime: created on mount, destroyed on unmount; observers and listeners released with it
  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    reducedRef.current = !!mq?.matches;
    const scene = createTownScene({
      uid,
      dim: () => live.current.dimOthers,
      colorOf: (id) => {
        const p = live.current.platforms.find((x) => x && x.id === id);
        return p ? slotHex(p) : undefined;
      },
      onPick: (id) => {
        if (!live.current.loading) live.current.onSelect?.(id);
      },
      onHover: (id) => live.current.onHover?.(id),
      onView: () => layoutRef.current(),
      reduced: () => reducedRef.current,
    });
    sceneRef.current = scene;
    const detach = scene.attach({
      svg: svgRef.current!,
      base: baseRef.current!,
      marks: marksRef.current!,
      links: linksRef.current!,
      glow: glowRef.current!,
      objects: objectsRef.current!,
    });
    let visible = true;
    const onMq = () => {
      reducedRef.current = !!mq?.matches;
      scene.setPaused(!visible);
    };
    mq?.addEventListener?.('change', onMq);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => layoutRef.current()) : null;
    if (mountRef.current) ro?.observe(mountRef.current);
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => {
            visible = entries[entries.length - 1]?.isIntersecting ?? true;
            scene.setPaused(!visible);
          })
        : null;
    if (mountRef.current) io?.observe(mountRef.current);
    return () => {
      mq?.removeEventListener?.('change', onMq);
      ro?.disconnect();
      io?.disconnect();
      detach();
      scene.destroy();
      sceneRef.current = null;
    };
  }, [uid]);

  // data and view -> scene (imperative; no per-frame React state)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.render(
      platforms.map((p) =>
        p ? { id: p.id, type: p.hq ? 'office' : (p.mapType ?? 'office'), name: p.name, sign: p.hq ? 'HQ' : p.kind, status: p.status } : null,
      ),
      links.map((l) => ({ from: l.from, to: l.to, status: l.status })),
    );
    scene.setView({ sel: selected, focus, hl: hlSig ? hlSig.split('|') : null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  useEffect(() => {
    sceneRef.current?.setView({ sel: selected, focus, hl: hlSig ? hlSig.split('|') : null });
  }, [selected, focus, hlSig, dimOthers]);

  // labels changed (text, state): place them again before paint
  const labelSig = JSON.stringify([real.map((p) => [p.id, p.name, p.shortName, p.kind, p.status, p.statusSince, p.count, p.error]), selected, focus, hlSig, loading, many]);
  useLayoutEffect(() => {
    layout();
  }, [labelSig, layout]);
  // a label that changes size on its own (the page font arrives after first paint) is placed again
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => layoutRef.current());
    labelEls.current.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [labelSig]);

  useImperativeHandle(
    ref,
    () => ({
      rotate: (d) => sceneRef.current?.rotate(d),
      zoom: (d) => sceneRef.current?.zoom(d) ?? 1,
      runVan: (a, b) => sceneRef.current?.runVan(a, b) ?? false,
      state: () => {
        const s = sceneRef.current?.state();
        return { selected: s?.sel ?? null, focus: s?.focus ?? null, highlight: s?.hl ?? null };
      },
      morph: (from, ms = 360) => sceneRef.current?.morph({ sel: from.selected, focus: from.focus, hl: from.highlight }, ms),
      placeLabels: () => layoutRef.current(),
      setDark: () => {},
    }),
    [],
  );

  const ctl =
    'inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-chip px-1.5 text-small text-muted transition-colors duration-hover hover:bg-raised hover:text-text';

  return (
    <div
      role="group"
      aria-label={label}
      aria-busy={loading || undefined}
      className={cn(className, 'group/town mt-1 flex h-map-h min-w-0 flex-col max-[640px]:mt-0')}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && selected !== null && !loading) {
          e.stopPropagation();
          onSelect?.(null);
        }
      }}
    >
      {caption ? <p className="m-0 flex h-5 flex-none items-center px-3 text-small text-muted max-[640px]:hidden"><span>{caption}</span></p> : null}
      <div className="@container/town relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-card max-[640px]:rounded-none">
        <div ref={mountRef} className={'relative min-h-0 flex-1 overflow-hidden'}>
          <svg
            ref={svgRef}
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 100 50"
            preserveAspectRatio="xMidYMid meet"
            className={cn(
              'size-full cursor-grab touch-pan-y select-none [forced-color-adjust:none] data-[over]:cursor-pointer data-[dragging]:cursor-grabbing',
              error && 'opacity-[.35]', // dims the map only; the building labels stay at full contrast
            )}
          >
            <defs>
              <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`${uid}-blur8`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <radialGradient id={`${uid}-pool`}>
                <stop offset="0" stopColor="var(--map-window)" stopOpacity=".55" />
                <stop offset=".6" stopColor="var(--map-window)" stopOpacity=".2" />
                <stop offset="1" stopColor="var(--map-window)" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* no ground of its own: the panel shows through; this rect only catches clicks on empty ground */}
            <rect x="-20000" y="-20000" width="40000" height="40000" className="fill-transparent" />
            <g ref={baseRef} />
            <g ref={marksRef} />
            <g ref={linksRef} />
            <g ref={glowRef} />
            <g ref={objectsRef} />
          </svg>
          <ul ref={hostRef} aria-label="Platforms" className={cn('pointer-events-none absolute inset-0 m-0 list-none overflow-hidden p-0', loading && 'invisible')}>
            {real.map((p) => {
              const sel = selected === p.id;
              const hl = focus ? focus === p.id : !!highlight?.includes(p.id);
              const dimFocus = fadeOthers && !sel && !hl && ((!!focus && focus !== p.id) || (!focus && selected !== null && dimOthers));
              const dim = dimFocus || (!sel && !hl && ((!!focus && focus !== p.id) || (selected !== null && dimOthers)));
              const alert = !loading && (p.status !== 'ACTIVE' || !!p.error);
              const short = p.shortName ?? p.name;
              const n = loading ? 0 : (p.count ?? 0);
              const sub = p.sub ?? (p.error
                ? `${p.kind} · no data`
                : `${p.kind}${p.status === 'DEGRADED' && p.statusSince ? ` · since ${p.statusSince}` : p.status === 'OFFLINE' ? ' · offline' : ''}`);
              return (
                <li key={p.id} className="contents">
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) labelEls.current.set(p.id, el);
                      else labelEls.current.delete(p.id);
                    }}
                    data-pid={p.id}
                    data-sel={sel ? '' : undefined}
                    data-hl={hl ? '' : undefined}
                    data-count={n ? '' : undefined}
                    aria-label={p.hq ? hqLabel(p) : platformLabel(p)}
                    aria-pressed={sel}
                    aria-disabled={loading || undefined}
                    onClick={() => {
                      if (!loading) onSelect?.(p.id);
                    }}
                    onMouseEnter={() => onHover?.(p.id)}
                    onMouseLeave={() => onHover?.(null)}
                    className={cn(
                      'group/lbl pointer-events-auto absolute left-0 top-0 z-[1] flex max-w-[calc(100%-16px)] flex-col items-center gap-px whitespace-nowrap rounded-control border bg-surface py-0.5 pl-[5px] pr-1.5 text-left opacity-0 transition-colors duration-hover [transform:translate(var(--lx,0px),var(--ly,0px))_translateY(-100%)] will-change-transform data-[placed]:opacity-100',
                      'after:pointer-events-none after:absolute after:left-[var(--stem-x,50%)] after:top-full after:h-[var(--stem,10px)] after:w-px after:bg-control after:content-[""] forced-colors:after:hidden',
                      focusRing,
                      'focus-visible:z-[3] hover:z-[3]',
                      sel || hl ? 'border-accent after:bg-accent' : dimFocus ? 'border-border data-[placed]:opacity-55 data-[placed]:hover:opacity-100 hover:border-control' : dim ? 'border-rule' : 'border-border hover:border-control',
                      sel && 'z-[3] shadow-[inset_0_0_0_1px_var(--accent)] forced-colors:border-[Highlight] forced-colors:border-2',
                      hl && 'gap-1.5',
                      p.hq && 'border-dashed',
                      loading && 'cursor-default',
                      '@max-[400px]/town:px-1.5 @max-[400px]/town:py-[3px] max-[640px]:px-1.5 max-[640px]:py-[3px]',
                    )}
                  >
                    <span className="flex items-center gap-[5px]">
                      <PlatformLogo name={p.name} src={p.logo} index={p.index} color={p.color} initials={p.initials} hq={p.hq} decorative size={16} />
                      <span
                        className={cn(
                          'max-w-[190px] truncate text-ui font-medium leading-4',
                          dim && !dimFocus ? 'text-muted' : 'text-text',
                          many ? 'hidden' : '@max-[400px]/town:hidden',
                        )}
                      >
                        {p.name}
                      </span>
                      <span className={cn('max-w-[120px] truncate text-ui font-medium leading-4', dim && !dimFocus ? 'text-muted' : 'text-text', many ? 'inline' : 'hidden @max-[400px]/town:inline')}>
                        {p.hq ? (p.shortName ?? 'HQ') : short}
                      </span>
                      {alert && !sel ? <StatusMark status={p.status} error={p.error} filled={!!p.sub} className="hidden @max-[400px]/town:inline-block max-[640px]:inline-block" /> : null}
                      {n ? (
                        <span className="ml-0.5 h-4 min-w-4 rounded-[3px] bg-text px-1 text-center text-tiny font-medium tabular-nums text-surface forced-colors:border forced-colors:border-[CanvasText]">
                          {n}
                        </span>
                      ) : null}
                    </span>
                    {!p.hq || hqSub ? (
                      <span
                        className={cn(
                          'items-center gap-[5px] text-tiny leading-[14px]',
                          p.error ? 'text-muted' : p.status === 'DEGRADED' ? 'text-warn' : p.status === 'OFFLINE' ? 'text-bad' : 'text-muted',
                          sel
                            ? 'flex'
                            : alert || p.subAlways
                              ? 'flex @max-[400px]/town:hidden max-[640px]:hidden'
                              : 'hidden group-hover/lbl:flex group-focus-visible/lbl:flex @max-[400px]/town:hidden @max-[400px]/town:group-hover/lbl:hidden @max-[400px]/town:group-focus-visible/lbl:hidden max-[640px]:hidden max-[640px]:group-hover/lbl:hidden max-[640px]:group-focus-visible/lbl:hidden',
                        )}
                      >
                        {loading ? (
                          <span aria-hidden="true" className="my-0.5 block h-2.5 w-[76px] rounded-chip bg-skeleton" />
                        ) : (
                          <>
                            {p.hq ? null : alert ? <StatusMark status={p.status} error={p.error} filled={!!p.sub} /> : p.sub || sel ? <StatusMark status={p.status} /> : null}
                            {p.hq ? hqSub?.(p) : sub}
                          </>
                        )}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {error && errorNotice ? (
          <div
            role="alert"
            className="absolute inset-x-2 top-2 flex items-center justify-between gap-3 rounded-control border border-border bg-surface px-2 py-1 text-small text-muted"
          >
            <span className="min-w-0">The map did not load.</span>
            {onRetry ? (
              <button type="button" onClick={onRetry} className={cn('rounded-chip px-1.5 py-0.5 font-medium text-accent hover:bg-raised', focusRing)}>
                Retry
              </button>
            ) : null}
          </div>
        ) : null}
        {!loading ? (
          <div
            role="group"
            aria-label="Map controls"
            className="absolute bottom-2 left-2 flex items-center gap-0.5 rounded-control border border-border bg-surface p-0.5 opacity-0 transition-opacity duration-hover focus-within:opacity-100 group-hover/town:opacity-100 group-focus-within/town:opacity-100 max-[640px]:hidden [@media(hover:none)]:opacity-100"
          >
            <button type="button" aria-label="Rotate left" title="Rotate left" onClick={() => sceneRef.current?.rotate(-1)} className={cn(ctl, focusRing)}>
              <ArrowCounterClockwise size={16} aria-hidden />
            </button>
            <button type="button" aria-label="Rotate right" title="Rotate right" onClick={() => sceneRef.current?.rotate(1)} className={cn(ctl, focusRing)}>
              <ArrowClockwise size={16} aria-hidden />
            </button>
            <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" />
            <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => sceneRef.current?.zoom(-1)} className={cn(ctl, focusRing)}>
              <Minus size={16} aria-hidden />
            </button>
            <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => sceneRef.current?.zoom(1)} className={cn(ctl, focusRing)}>
              <Plus size={16} aria-hidden />
            </button>
            {onAddPlatform ? (
              <>
                <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" />
                <button type="button" aria-label="Add a platform" title="Add a platform" onClick={onAddPlatform} className={cn(ctl, focusRing)}>
                  <PlusSquare size={16} aria-hidden />
                  <span className="leading-5 max-[960px]:hidden @max-[400px]/town:hidden">Add platform</span>
                </button>
              </>
            ) : null}
          </div>
        ) : null}
        {links.length && !loading ? (
          <div
            aria-hidden="true"
            className="absolute bottom-2 right-2 flex gap-2.5 rounded-control border border-border bg-surface px-2 py-1.5 text-tiny text-muted opacity-0 transition-opacity duration-hover group-hover/town:opacity-100 group-focus-within/town:opacity-100 max-[960px]:hidden @max-[400px]/town:hidden"
          >
            {(['ok', 'slow', 'broken'] as const)
              .filter((k) => links.some((l) => l.status === k))
              .map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <i
                    aria-hidden="true"
                    className={cn(
                      'block w-3.5 flex-none',
                      k === 'ok' && 'h-1 rounded-sm bg-accent',
                      k === 'slow' && 'h-1 rounded-sm bg-warn-dot',
                      k === 'broken' && 'h-0 border-t-[3px] border-dashed border-bad-dot',
                    )}
                  />
                  {k === 'ok' ? 'Linked' : k === 'slow' ? 'Slow' : 'Broken'} <span className="tabular-nums">{links.filter((l) => l.status === k).length}</span>
                </span>
              ))}
          </div>
        ) : null}
      </div>
      {links.length ? (
        <ul aria-label="Links between platforms" className="sr-only">
          {links.map((l) => {
            const from = real.find((p) => p.id === l.from);
            const to = real.find((p) => p.id === l.to);
            return from && to ? (
              <li key={`${l.from}~${l.to}`}>
                {from.name} to {to.name}, {linkWord[l.status]}
              </li>
            ) : null;
          })}
        </ul>
      ) : null}
    </div>
  );
});
