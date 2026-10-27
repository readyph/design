import { useInsertionEffect, type CSSProperties } from 'react';
import { FALCON, FALCON_MONO, FALCON_TILE, LOCKUP_MARK_COLOR, LOCKUP_MARK_MONO, LOCKUP_WORDMARK } from './ReadyMark.geo';
import { cn } from '../utils/cn';
import { ready } from '../tokens';

/**
 * Ready brand (RDY-363, workshop/prototypes/ready-logo/decision.md). The falcon mark, pose A, and the horizontal lockup.
 * Inline SVG; the vermilion tones come from the themed `--rd-*` tokens, so the mark follows light and dark with the rest of the UI.
 * The brand name is exactly "Ready". Leda's mark is separate (see Leda.tsx).
 *
 * `animate` runs the designer's swoop-assemble (animation/README.md): the facets fly in along the dive one by one, head first, 70 ms
 * apart (1.32 s), then swap back to the static paths, so the rest frame is the static mark. SVG and CSS only. With
 * `prefers-reduced-motion` it is a 400 ms fade. The motion never moves the layout: the SVG clips to its own box.
 */

export type ReadyMarkTone = 'color' | 'black' | 'white' | 'tile';

export interface ReadyMarkProps {
  /** Rendered width and height in px. Default 32. */
  size?: number;
  /**
   * `color` (default) is theme-aware vermilion; `black` and `white` are the one-colour plates; `tile` is the app tile
   * (ink square, on-dark tones, in both themes).
   */
  tone?: ReadyMarkTone;
  /** `auto` (default) uses the small cut (no cheek facets, bigger eye) at 32px and below. */
  cut?: 'auto' | 'full' | 'small';
  /**
   * Plays swoop-assemble (colour tone only). `true` plays once on mount. A number replays whenever it changes (`0` is static),
   * so a parent can replay on hover or focus by counting up.
   */
  animate?: boolean | number;
  /** Use one theme's tones whatever the page theme is (a mark on a surface that does not follow the theme). Default: follow the page. */
  scheme?: 'light' | 'dark';
  /** Accessible name. Default "Ready". Ignored when `decorative`. */
  label?: string;
  /** Hide from assistive tech (another element carries the name). */
  decorative?: boolean;
  className?: string;
}

const schemeVars = (i: 0 | 1) => Object.entries(ready).map(([k, v]) => `--${k}:${v[i]}`).join(';');

const CSS = `
.rd-scheme-light{${schemeVars(0)}}.rd-scheme-dark{${schemeVars(1)}}
.rd-mark{display:block;flex:none;overflow:hidden}
.rd-mark .rd-d{fill:var(--rd-deep)}.rd-mark .rd-l{fill:var(--rd-lit)}.rd-mark .rd-m{fill:var(--rd-mid)}
.rd-mark .rd-facets{visibility:hidden}
.rd-mark .rd-facets path{transform-box:fill-box;transform-origin:50% 50%}
.rd-play .rd-static{animation:rd-off 1320ms}
.rd-play .rd-facets{animation:rd-on 1320ms}
.rd-play .rd-facets path{animation:rd-asm 900ms calc(var(--i) * 70ms) cubic-bezier(.3,.85,.35,1.12) backwards}
@keyframes rd-asm{0%{transform:translate(-35px,-60.6px) scale(.86);opacity:0}45%{opacity:1}100%{transform:translate(0,0) scale(1);opacity:1}}
@keyframes rd-off{from,to{opacity:0}}
@keyframes rd-on{from,to{visibility:visible}}
@keyframes rd-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
.rd-play .rd-facets{display:none}
.rd-play .rd-static{animation:rd-fade 400ms ease-out}
}
.rd-lockup .rd-ink{fill:var(--rd-ink)}
`;

let injected = false;
function useReadyStyles() {
  useInsertionEffect(() => {
    if (injected || typeof document === 'undefined') return;
    if (!document.getElementById('rd-css')) {
      const el = document.createElement('style');
      el.id = 'rd-css';
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    injected = true;
  }, []);
}

/** Exposed for tests: the mark's stylesheet. */
export const READY_MARK_CSS = CSS;
/** Length of the assemble, in ms. */
export const READY_ASSEMBLE_MS = 1320;

const CLS = { deep: 'rd-d', lit: 'rd-l', mid: 'rd-m' } as const;
const MONO = { black: '#000000', white: '#FFFFFF' } as const;

function a11y(decorative: boolean | undefined, label: string) {
  return decorative ? { 'aria-hidden': true as const, focusable: 'false' as const } : { role: 'img' as const, 'aria-label': label };
}

export function ReadyMark({ size = 32, tone = 'color', cut = 'auto', animate = false, scheme, label = 'Ready', decorative, className }: ReadyMarkProps) {
  useReadyStyles();
  const small = cut === 'small' || (cut === 'auto' && size <= 32);
  const geo = small ? FALCON.small : FALCON.full;
  const playKey = typeof animate === 'number' ? animate : animate ? 1 : 0;
  const play = tone === 'color' && playKey > 0;
  let body;
  if (tone === 'color') {
    body = (
      <>
        <g className="rd-static">{geo.order.map((t) => <path key={t} className={CLS[t]} fillRule="evenodd" d={geo[t]} />)}</g>
        {play ? (
          <g className="rd-facets" aria-hidden="true">
            {geo.facets.map((f) => <path key={f.i} className={CLS[f.tone]} fillRule="evenodd" style={{ '--i': f.i } as CSSProperties} d={f.d} />)}
          </g>
        ) : null}
      </>
    );
  } else if (tone === 'tile') {
    body = (
      <>
        <rect width="256" height="256" rx="56" fill="#16110F" />
        {FALCON_TILE.map(([fill, d]) => <path key={d} fill={fill} fillRule="evenodd" d={d} />)}
      </>
    );
  } else {
    body = <path fill={MONO[tone]} fillRule="evenodd" d={small ? FALCON_MONO.small : FALCON_MONO.full} />;
  }
  return (
    <svg
      key={playKey}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      {...a11y(decorative, label)}
      className={cn('rd-mark', scheme && `rd-scheme-${scheme}`, play && 'rd-play', className)}
    >
      {body}
    </svg>
  );
}

export interface ReadyLogoProps {
  /** Height of the mark in px; the wordmark scales with it. Default 32. */
  size?: number;
  tone?: Exclude<ReadyMarkTone, 'tile'>;
  /** Adds the tagline "Are you ready?" under the wordmark. Off by default: the mark and wordmark work without it. */
  tagline?: boolean;
  /** As `ReadyMark`: force one theme's tones. */
  scheme?: 'light' | 'dark';
  label?: string;
  decorative?: boolean;
  className?: string;
}

/**
 * The horizontal lockup: falcon mark and the "Ready" wordmark. With `tagline` the line "Are you ready?" sits to the right on a vermilion
 * divider, as in the designer's lockup (mark-sketch-dive.html: 72px lockup, 24px / 500 tagline, 26px gap to a 2px divider). Static.
 */
export function ReadyLogo({ size = 32, tone = 'color', tagline = false, scheme, label = 'Ready', decorative, className }: ReadyLogoProps) {
  useReadyStyles();
  const k = size / 72;
  const width = (904.72 * size) / 266;
  const fill = tone === 'color' ? undefined : MONO[tone];
  const svg = (
    <svg
      width={Math.round(width * 100) / 100}
      height={size}
      viewBox="-227.86 -10 904.72 266"
      {...a11y(decorative, label)}
      className={cn('rd-mark rd-lockup', !tagline && scheme && `rd-scheme-${scheme}`, !tagline && className)}
    >
      {tone === 'color'
        ? LOCKUP_MARK_COLOR.map((d, i) => <path key={d} className={['rd-d', 'rd-l', 'rd-m'][i]} fillRule="evenodd" d={d} />)
        : LOCKUP_MARK_MONO.map((d) => <path key={d} fill={fill} fillRule="evenodd" d={d} />)}
      {LOCKUP_WORDMARK.map((d) => <path key={d} className={tone === 'color' ? 'rd-ink' : undefined} fill={fill} d={d} />)}
    </svg>
  );
  if (!tagline) return svg;
  return (
    <span className={cn('rd-lockup-tag inline-flex items-center', scheme && `rd-scheme-${scheme}`, className)} style={{ gap: 28 * k }}>
      {svg}
      <span
        aria-hidden={decorative ? true : undefined}
        style={{
          fontSize: 24 * k,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          paddingLeft: 26 * k,
          borderLeft: `${Math.max(1, 2 * k)}px solid ${fill ?? 'var(--rd-mid)'}`,
          color: fill ?? 'var(--rd-ink)',
          whiteSpace: 'nowrap',
        }}
      >
        Are you ready?
      </span>
    </span>
  );
}
