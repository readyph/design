import { useLayoutEffect, useState, type RefObject } from 'react';
import { niceTicks, type ChartFormat } from './WeekChart';

/**
 * The "overview" drawing of WeekChart (RDY-359): the geometry of the workshop's Home charts. Internal: reached with
 * `<WeekChart variant="overview" />`, not exported from the package.
 */
const MINUS = '−';
const LANE_ROWS = 1;
const ROW = 14;
const lane = (rows: number) => 8 + rows * ROW + (rows ? 4 : 0);

let canvas: HTMLCanvasElement | null = null;
/** Text width in the chart's own face; an estimate where there is no canvas (tests). */
export function textWidth(str: string, size: number, family: string, weight = 400): number {
  try {
    if (typeof navigator !== 'undefined' && !/jsdom/i.test(navigator.userAgent)) {
      canvas ??= document.createElement('canvas');
      const c = canvas.getContext('2d');
      if (c) {
        c.font = `${weight} ${size}px ${family}`;
        const w = c.measureText(str).width;
        if (w > 0) return w;
      }
    }
  } catch {
    /* fall through */
  }
  return String(str).length * size * 0.56;
}

/** Which x labels to draw: every k-th, with k chosen so they fit, landing on the last label when one gives enough. */
export function overviewPicks(labels: string[], span: number): number[] {
  const n = labels.length;
  if (n <= 1) return n ? [0] : [];
  const longest = Math.max(...labels.map((l) => String(l).length));
  const cap = Math.max(2, Math.min(8, Math.floor(span / (longest * 7 + 18))));
  if (n <= cap) return [...Array(n).keys()];
  let first: { k: number; count: number } | null = null;
  let land: { k: number; count: number } | null = null;
  for (let k = 1; k < n; k++) {
    const count = Math.floor((n - 1) / k) + 1;
    if (count > cap) continue;
    first ??= { k, count };
    if ((n - 1) % k === 0) {
      land = { k, count };
      break;
    }
  }
  const pick = land && land.count >= Math.max(3, Math.ceil(cap * 0.6)) ? land : first ?? { k: n - 1, count: 2 };
  const out: number[] = [];
  for (let i = 0; i < n; i += pick.k) out.push(i);
  return out;
}

export interface OverviewPlotProps {
  boxRef: RefObject<HTMLElement | null>;
  width: number;
  height: number;
  labels: string[];
  vals: (number | null)[];
  downs: (number | null)[];
  diverging: boolean;
  highlight: number;
  aboveLabel: string;
  belowLabel: string;
  fmt: ChartFormat;
  tfmt: ChartFormat;
  tickCount: number;
  summary: string;
  active: number | null;
  onPointer: (e: React.PointerEvent<SVGSVGElement>) => void;
  onLeave: () => void;
  onGeometry: (g: { padL: number; padT: number; plotH: number; slot: number; top: (i: number) => number }) => void;
}

export function OverviewPlot(p: OverviewPlotProps) {
  const { width, height: h, labels, vals, downs, diverging, aboveLabel, belowLabel, fmt, tfmt, tickCount, summary, active, onPointer, onLeave, onGeometry } = p;
  const [family, setFamily] = useState('sans-serif');
  useLayoutEffect(() => {
    const el = p.boxRef.current;
    if (el) setFamily(getComputedStyle(el).fontFamily || 'sans-serif');
    // fonts arrive after the first paint: draw once more
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      let live = true;
      void document.fonts.ready.then(() => { if (live && el) setFamily((f) => (getComputedStyle(el).fontFamily || f) + ' '); });
      return () => { live = false; };
    }
  }, [p.boxRef]);

  const w = Math.max(240, width || 600);
  const n = labels.length;
  const up = vals.map((v) => v ?? 0);
  const dn = downs.map((v) => v ?? 0);
  const hiUp = Math.max(0, ...up);
  const hiDown = Math.max(0, ...dn);
  const tick = diverging ? (v: number) => (v > 0 ? '+' : v < 0 ? MINUS : '') + tfmt(Math.abs(v)) : (v: number) => tfmt(v);
  const yt = diverging ? niceTicks(-hiDown, hiUp || 1, tickCount) : niceTicks(0, Math.max(...up, 0), tickCount);
  if (diverging && hiDown > 0 && yt[0]! >= -hiDown) yt.unshift(+(yt[0]! - (yt[1]! - yt[0]!)).toFixed(10));
  const padL = 12 + Math.max(...yt.map((v) => textWidth(tick(v), 12, family)));
  const padB = 26;
  const band = (w - padL) / n;
  const bw = Math.max(2, band * 0.62);
  const x = (i: number) => padL + band * i + band / 2;
  const padT = diverging ? lane(LANE_ROWS) : lane(0);
  const lo = yt[0]!;
  const hi = yt[yt.length - 1]!;
  const y = (v: number) => padT + (h - padT - padB) * (1 - (v - lo) / (hi - lo));
  const plotH = h - padT - padB;
  const belowW = textWidth(belowLabel, 11, family) + 9;

  useLayoutEffect(() => {
    onGeometry({ padL, padT, plotH, slot: band, top: (i) => (diverging ? y(Math.max(up[i] ?? 0, 0)) : vals[i] == null ? y(0) : y(Math.max(0, vals[i] as number))) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [padL, padT, plotH, band, diverging, width]);

  const picks = overviewPicks(labels, w - padL);
  const xLabels = picks.flatMap((i) => {
    const lab = String(labels[i]);
    const tw = textWidth(lab, 12, family);
    const left = Math.max(0, Math.min(w - tw, x(i) - tw / 2));
    if (diverging && left < padL + belowW + 8 && left + tw > padL - 8) return [];
    return [{ i, lab, left }];
  });

  return (
    <svg role="img" aria-label={summary} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block max-w-full overflow-visible tabular-nums" onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={onLeave}>
      {yt.map((v) => (
        <g key={v}>
          <line x1={padL} x2={w} y1={y(v)} y2={y(v)} strokeWidth={1} shapeRendering="crispEdges" className="stroke-chart-grid forced-colors:stroke-[CanvasText]" />
          <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize={12} className="fill-chart-axis forced-colors:fill-[CanvasText]">{tick(v)}</text>
        </g>
      ))}
      {active !== null && <rect x={padL + band * active} y={padT} width={band} height={plotH} className="fill-raised forced-colors:fill-[Canvas]" opacity={0.6} />}
      {xLabels.map(({ i, lab, left }) => (
        <text key={`x-${i}`} x={left} y={h - padB + 18} fontSize={12} className="fill-chart-axis forced-colors:fill-[CanvasText]">{lab}</text>
      ))}
      {diverging ? (
        <>
          <path d={`M${padL} ${h - padB + 11}l3 6l3 -6z`} className="fill-chart-axis forced-colors:fill-[CanvasText]" />
          <text x={padL + 9} y={h - padB + 18} fontSize={11} className="fill-chart-axis forced-colors:fill-[CanvasText]">{belowLabel}</text>
          {labels.map((l, i) => (
            <g key={`${l}-${i}`}>
              {up[i]! > 0 && (
                <rect x={x(i) - bw / 2} y={y(up[i]!)} width={bw} height={Math.max(0, y(0) - y(up[i]!) - 1)} shapeRendering="crispEdges" className="fill-chart-1 forced-colors:fill-[Highlight]"><title>{`${l}: ${aboveLabel} ${fmt(up[i]!)}`}</title></rect>
              )}
              {dn[i]! > 0 && (
                <rect x={x(i) - bw / 2} y={y(0) + 1} width={bw} height={Math.max(0, y(-dn[i]!) - y(0) - 1)} shapeRendering="crispEdges" className="fill-chart-muted forced-colors:fill-[CanvasText]"><title>{`${l}: ${belowLabel} ${fmt(dn[i]!)}`}</title></rect>
              )}
            </g>
          ))}
          <line x1={padL} x2={w} y1={y(0)} y2={y(0)} strokeWidth={1} opacity={0.8} shapeRendering="crispEdges" className="stroke-chart-axis forced-colors:stroke-[CanvasText]" />
          <path d={`M${padL} ${padT - 9 - 1}l3 -6l3 6z`} className="fill-chart-axis forced-colors:fill-[CanvasText]" />
          <text x={padL + 9} y={padT - 9} fontSize={11} className="fill-chart-axis forced-colors:fill-[CanvasText]">{aboveLabel}</text>
        </>
      ) : (
        labels.map((l, i) => {
          const v = vals[i];
          if (v == null) return null;
          return (
            <rect key={`${l}-${i}`} x={x(i) - bw / 2} y={y(v)} width={bw} height={Math.max(0, y(0) - y(v))} shapeRendering="crispEdges" className={i === p.highlight ? 'fill-chart-1 forced-colors:fill-[Highlight]' : 'fill-chart-muted forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]'}><title>{`${l}: ${fmt(v)}`}</title></rect>
          );
        })
      )}
    </svg>
  );
}
