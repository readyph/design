import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';
import { leda } from '../tokens';

/**
 * Leda identity (RDY-270, handover C10). The mark, night tile, wordmark and the three
 * animations. Leda's colours are its own (`--ld-*`) and never recolour the UI.
 * Colours come from the themed `--ld-*` variables; the tile always uses the dark values.
 */

const LIT = 'M78 89.28 L118 20 L138 236 L78 201.36 Z';
const DEEP = 'M118 20 L178 54.64 L178 166.72 L138 236 Z';
const LIT16 = 'M64 99.14 L112 16 L144 240 L64 193.81 Z';
const DEEP16 = 'M112 16 L192 62.19 L192 156.86 L144 240 Z';
const LITT = 'M74.67 95.23 L117.33 21.33 L138.67 234.67 L74.67 197.72 Z';
const DEEPT = 'M117.33 21.33 L181.33 58.28 L181.33 160.77 L138.67 234.67 Z';
const SCAN = [
  'M40 161.19 L216 262.81 L216 319.41 L40 217.79 Z',
  'M40 105.19 L216 206.81 L216 263.41 L40 161.79 Z',
  'M40 49.19 L216 150.81 L216 207.41 L40 105.79 Z',
  'M40 -6.81 L216 94.81 L216 151.41 L40 49.79 Z',
  'M40 -62.81 L216 38.81 L216 95.41 L40 -6.21 Z',
];

/** On the night tile the dark values apply in both themes. */
const tileVars = Object.entries(leda)
  .filter(([k]) => /^ld-(lit|deep|tlit|tdeep|al\d|ad\d|gl|gd|scl|scd)$/.test(k))
  .map(([k, v]) => `--${k}:${v[1]}`)
  .join(';');

const CSS = `
.ld-tile{${tileVars}}
.ld-lit{fill:var(--ld-lit)}.ld-deep{fill:var(--ld-deep)}.ld-ink{fill:var(--ld-ink)}.ld-bg{fill:var(--ld-night-bg)}
.ld-tl{fill:var(--ld-tlit)}.ld-td{fill:var(--ld-tdeep)}
.ld-sl{fill:var(--ld-scl)}.ld-sd{fill:var(--ld-scd)}
.ld-g0{stop-color:var(--ld-al0)}.ld-g1{stop-color:var(--ld-al1)}.ld-g2{stop-color:var(--ld-al2)}.ld-g3{stop-color:var(--ld-al3)}.ld-g4{stop-color:var(--ld-al4)}
.ld-h0{stop-color:var(--ld-ad0)}.ld-h1{stop-color:var(--ld-ad1)}.ld-h2{stop-color:var(--ld-ad2)}.ld-h3{stop-color:var(--ld-ad3)}.ld-h4{stop-color:var(--ld-ad4)}
.ld-gl{stop-color:var(--ld-gl)}.ld-gd{stop-color:var(--ld-gd)}
.ld-fx,.ld-still{opacity:0;transition:opacity var(--dur-aurora-settle) cubic-bezier(.2,0,0,1)}
.ld-fx *{animation-play-state:paused}
.ld-on .ld-fx{opacity:1;transition-duration:200ms}
.ld-on .ld-fx *,.ld-settling .ld-fx *{animation-play-state:running}
.ld-glint .ld-band{animation:ld-sweep var(--dur-glint) cubic-bezier(.45,0,.25,1) infinite}
.ld-glint .ld-tint{opacity:.15;animation:ld-tint var(--dur-glint) ease-in-out infinite}
.ld-once .ld-band,.ld-once .ld-tint{animation-iteration-count:1;animation-fill-mode:forwards}
.ld-scan .ld-s{opacity:0;animation:var(--dur-scan) steps(1,end) infinite}
.ld-scan .ld-s0{animation-name:ld-b0}.ld-scan .ld-s1{animation-name:ld-b1}.ld-scan .ld-s2{animation-name:ld-b2}.ld-scan .ld-s3{animation-name:ld-b3}.ld-scan .ld-s4{animation-name:ld-b4}
.ld-aurora .ld-flow{animation:ld-flow var(--dur-aurora) linear infinite}
@keyframes ld-sweep{0%{transform:translateY(-120px)}56%,100%{transform:translateY(330px)}}
@keyframes ld-tint{0%,100%{opacity:.12}60%{opacity:.5}}
@keyframes ld-b0{0%{opacity:0}6%{opacity:1}15%{opacity:.38}78%{opacity:1}84%{opacity:.6}88%,100%{opacity:0}}
@keyframes ld-b1{0%{opacity:0}17%{opacity:1}26%{opacity:.38}78%{opacity:1}84%{opacity:.6}88%,100%{opacity:0}}
@keyframes ld-b2{0%{opacity:0}28%{opacity:1}37%{opacity:.38}78%{opacity:1}84%{opacity:.6}88%,100%{opacity:0}}
@keyframes ld-b3{0%{opacity:0}39%{opacity:1}48%{opacity:.38}78%{opacity:1}84%{opacity:.6}88%,100%{opacity:0}}
@keyframes ld-b4{0%{opacity:0}50%{opacity:1}59%{opacity:.38}78%{opacity:1}84%{opacity:.6}88%,100%{opacity:0}}
@keyframes ld-flow{from{transform:translateY(0)}to{transform:translateY(-240px)}}
.ld-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ld-rmlabel{display:none}
@media (prefers-reduced-motion:reduce){
.ld-fx{display:none}.ld-aurora.ld-on .ld-still{opacity:1}
.ld-rmlabel{display:inline;visibility:hidden}.ld-on .ld-rmlabel{visibility:visible}
}
`;

/** Inject the stylesheet once per document (before paint), not once per instance. */
let injected = false;
function useLedaStyles() {
  useInsertionEffect(() => {
    if (injected || typeof document === 'undefined') return;
    if (!document.getElementById('ld-css')) {
      const el = document.createElement('style');
      el.id = 'ld-css';
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    injected = true;
  }, []);
}

export type LedaEffect = 'aurora' | 'glint' | 'scan';

export interface LedaMarkProps {
  /** Pixel size (square). Default 32. */
  size?: number;
  /** Night tile (avatar, favicon, app icon). Always dark values, in both themes. */
  tile?: boolean;
  /** `auto` uses the 16 px cut at 24 px and below. */
  cut?: 'auto' | 'full' | '16';
  /** Animation. Aurora is the thinking state; Glint and Scan are the variations. */
  effect?: LedaEffect;
  /** Plays the effect (add the `thinking` state). Removing it settles over 300 ms. */
  active?: boolean;
  /**
   * Play the effect once (splash glint) instead of looping. Glint and Scan are meant to
   * run one pass per moment: pass `once` and change the element's `key` to replay it.
   * Under reduced motion Glint and Scan stay completely still.
   */
  once?: boolean;
  /** Accessible name. Ignored when `decorative`. */
  label?: string;
  /** Hide from assistive tech (`aria-hidden`, no role). Use wherever the text already says "Leda". */
  decorative?: boolean;
  className?: string;
}

function Defs({ uid, lit, deep }: { uid: string; lit: string; deep: string }) {
  return (
    <defs>
      <clipPath id={`${uid}l`}><path d={lit} /></clipPath>
      <clipPath id={`${uid}d`}><path d={deep} /></clipPath>
      {(['l', 'd'] as const).map((p) => (
        <linearGradient key={p} id={`${uid}a${p}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="240" spreadMethod="repeat">
          {[0, 1, 2, 3, 4].map((i) => (
            <stop key={i} offset={i / 4} className={`${p === 'l' ? 'ld-g' : 'ld-h'}${i}`} />
          ))}
        </linearGradient>
      ))}
      {(['l', 'd'] as const).map((p) => (
        <linearGradient key={p} id={`${uid}g${p}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={p === 'l' ? 'ld-gl' : 'ld-gd'} stopOpacity="0" />
          <stop offset=".5" className={p === 'l' ? 'ld-gl' : 'ld-gd'} stopOpacity={p === 'l' ? '.95' : '.9'} />
          <stop offset="1" className={p === 'l' ? 'ld-gl' : 'ld-gd'} stopOpacity="0" />
        </linearGradient>
      ))}
    </defs>
  );
}

function Fx({ effect, uid }: { effect: LedaEffect; uid: string }) {
  if (effect === 'aurora') {
    return (
      <g className="ld-fx">
        {(['d', 'l'] as const).map((p) => (
          <g key={p} clipPath={`url(#${uid}${p})`}>
            <g transform="rotate(-20 128 128)">
              <g className="ld-flow">
                <rect x="-140" y="-200" width="536" height="900" fill={`url(#${uid}a${p})`} />
              </g>
            </g>
          </g>
        ))}
      </g>
    );
  }
  if (effect === 'glint') {
    return (
      <g className="ld-fx">
        <g clipPath={`url(#${uid}d)`}>
          <rect className="ld-tint ld-td" width="256" height="256" />
          <g className="ld-band"><rect x="-90" y="-44" width="436" height="88" transform="rotate(30 128 0)" fill={`url(#${uid}gd)`} /></g>
        </g>
        <g clipPath={`url(#${uid}l)`}>
          <g className="ld-band"><rect x="-90" y="-44" width="436" height="88" transform="rotate(30 128 0)" fill={`url(#${uid}gl)`} /></g>
        </g>
      </g>
    );
  }
  return (
    <g className="ld-fx">
      {(['d', 'l'] as const).map((p) => (
        <g key={p} clipPath={`url(#${uid}${p})`}>
          {SCAN.map((d, i) => <path key={i} className={`ld-s ld-s${i} ${p === 'd' ? 'ld-sd' : 'ld-sl'}`} d={d} />)}
        </g>
      ))}
    </g>
  );
}

/**
 * The Leda shard. Static by default; give it an `effect` and toggle `active` for the
 * thinking state. Reduced motion: no movement; Aurora (thinking) shows a still teal shift, Glint and Scan show nothing.
 */
export function LedaMark({ size = 32, tile = false, cut = 'auto', effect, active = false, once = false, label = 'Leda', decorative = false, className }: LedaMarkProps) {
  useLedaStyles();
  const uid = 'ld' + useId().replace(/:/g, '');
  const small = cut === '16' || (cut === 'auto' && size <= 24);
  const [settling, setSettling] = useState(false);
  const was = useRef(active);
  useEffect(() => {
    if (was.current && !active) {
      setSettling(true);
      const t = setTimeout(() => setSettling(false), 300);
      was.current = active;
      return () => clearTimeout(t);
    }
    was.current = active;
  }, [active]);

  const lit = tile && !small ? LITT : small ? LIT16 : LIT;
  const deep = tile && !small ? DEEPT : small ? DEEP16 : DEEP;
  const cls = [
    tile && 'ld-tile',
    effect && `ld-${effect}`,
    once && 'ld-once',
    active && 'ld-on',
    settling && 'ld-settling',
    className,
  ].filter(Boolean).join(' ');

  return (
    <svg viewBox="0 0 256 256" {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })} className={cls} width={size} height={size}>
      {effect && <Defs uid={uid} lit={lit} deep={deep} />}
      {tile && <rect width="256" height="256" rx="56" className="ld-bg" />}
      <path d={lit} className="ld-lit" />
      <path d={deep} className="ld-deep" />
      {effect && <Fx effect={effect} uid={uid} />}
      {effect === 'aurora' && (
        <g className="ld-still">
          <path d={deep} className="ld-td" opacity=".55" />
          <path d={lit} className="ld-tl" opacity=".5" />
        </g>
      )}
    </svg>
  );
}

export interface LedaThinkingProps extends Omit<LedaMarkProps, 'effect' | 'active' | 'once'> {
  /** True while Leda is processing. */
  thinking: boolean;
  /** Default aurora. */
  effect?: LedaEffect;
  /** Aurora only: reserved visible "Thinking…" slot under reduced motion. Screen readers always get it announced. */
  showLabel?: boolean;
}

/** Mark plus the reduced-motion "Thinking…" slot (always reserved, so nothing shifts). */
export function LedaThinking({ thinking, effect = 'aurora', showLabel = true, decorative = true, ...rest }: LedaThinkingProps) {
  useLedaStyles();
  return (
    <span className={`inline-flex items-center gap-2${thinking ? ' ld-on' : ''}`}>
      <LedaMark {...rest} decorative={decorative} effect={effect} active={thinking} />
      <span className="ld-sr" role="status" aria-live="polite">{thinking ? 'Thinking…' : ''}</span>
      {showLabel && effect === 'aurora' && <span className="ld-rmlabel text-small text-muted" aria-hidden="true">Thinking…</span>}
    </span>
  );
}

export interface LedaWordmarkProps {
  /** Rendered height in px. Default 24. */
  height?: number;
  /** Mono ink in `currentColor` (e.g. on a coloured ground). */
  mono?: boolean;
  /** Hide from assistive tech where the surrounding text already says "Leda". */
  decorative?: boolean;
  className?: string;
}

/** "Leda" wordmark: the shard is the stem of the L. Title case only. */
export function LedaWordmark({ height = 24, mono = false, decorative = false, className }: LedaWordmarkProps) {
  useLedaStyles();
  const l1 = mono ? undefined : 'ld-lit';
  const l2 = mono ? undefined : 'ld-deep';
  const ink = mono ? undefined : 'ld-ink';
  const f = mono ? 'currentColor' : undefined;
  return (
    <svg viewBox="0 0 514 256" {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Leda' })} className={className} height={height} width={(height * 514) / 256}>
      <path className={l1} fill={f} fillRule="evenodd" d="M8 72.11 L30 34 L42 208 L8 188.37 Z" />
      <path className={l2} fill={f} fillRule="evenodd" d="M30 34 L64 53.63 L64 169.89 L42 208 Z" />
      <path className={l2} fill={f} fillRule="evenodd" d="M64 169.89 L64 186 L112 186 L99.3 208 L42 208 Z" />
      <path className={ink} fill={f} fillRule="evenodd" d="M236.75 164 A58 58 0 0 0 228.25 119.81 L183.75 94.12 A58 58 0 1 0 226.64 186.48 L207.39 175.37 A36 36 0 0 1 146.06 164 Z M214.58 142 A36 36 0 0 0 145.42 142 Z" />
      <path className={ink} fill={f} fillRule="evenodd" d="M348 40 L370 52.7 L370 208 L348 208 L348 197.48 A58 58 0 1 1 315.75 94.12 L348 112.74 Z M347.99 152 A36 36 0 1 0 276 152 A36 36 0 1 0 347.99 152 Z" />
      <path className={ink} fill={f} fillRule="evenodd" d="M484 94 L506 106.7 L506 208 L484 208 L484 197.48 A58 58 0 1 1 451.75 94.12 L484 112.74 Z M483.99 152 A36 36 0 1 0 412 152 A36 36 0 1 0 483.99 152 Z" />
    </svg>
  );
}
