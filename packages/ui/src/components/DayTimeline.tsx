import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Alarm,
  ArrowSquareOut,
  CaretRight,
  ChartLineDown,
  Clock,
  ClockCounterClockwise,
  Truck,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import { cn, focusForced } from "../utils/cn";

/*
 * RDY-385 I6 Day timeline. Transcribed from inventory-home round-1/final/home.html CSS 187-292 (lanes, marks, chips,
 * Now line) and 386-407 (vertical timeline); home.js stripHTML 302, laneDecide 176, laneOut 198, laneIn 237, laneExp 272,
 * layoutStrips 322-364 (chip rows), legendHTML, vtHTML 579.
 * The workshop's data-tip popover (shell.js) is not part of this ticket: `tip` renders as the native `title`.
 */

export type DayTimelineTone =
  | "bad"
  | "wait"
  | "done"
  | "draft"
  | "info"
  | "exp";

/** One chip: a real button that opens something. */
export interface DayTimelineChip {
  id: string;
  tone?: DayTimelineTone;
  /** Leading icon (13px, muted). Hidden on `bad` (a red dot replaces it) and `ok` green on `done`. */
  icon?: ReactNode;
  /** Chip content: compose with ChipTime, ChipId, ChipSub, ChipWord and plain spans. */
  children: ReactNode;
  onSelect?: () => void;
  /** Full reason for assistive tech, e.g. the icon-only PO-0221 chip. */
  "aria-label"?: string;
  /** Tooltip text; should end with the action, e.g. "Click to open ›". */
  tip?: string;
}

/** A tick at its time with a chip beside it. Provide `info` instead of `chip` for plain information text. */
export interface DayTimelineMark {
  id: string;
  /** Percent along the plot (0-100). */
  x: number;
  tone?: DayTimelineTone;
  chip?: Omit<DayTimelineChip, "id" | "tone">;
  /** Information only (no border, no caret, not focusable): "4 jobs today". */
  info?: ReactNode;
}

export interface DayTimelineLane {
  id: string;
  /** Phosphor icon at 18px. */
  icon: ReactNode;
  /** Plain word: "To do by", "Stock in", "Stock out", "Stock left". */
  title: string;
  /** One line under the title. Hidden below 900px. */
  sub?: ReactNode;
  /** Warning shown in the head ("slow since 8:50"). */
  warn?: ReactNode;
  /** Extra head content (the part switcher for the runway lane). */
  headExtra?: ReactNode;
  marks?: DayTimelineMark[];
  /** A plain note in the lane (empty, error, quiet). Starts just after Now unless `leftPct` is given. */
  note?: {
    text: ReactNode;
    icon?: ReactNode;
    tone?: "warn" | "bad" | "ok";
    leftPct?: number;
  };
  /** Past movements chip ("4 out ›"): right-anchored, ends 8px left of Now, drops `word` when the band is narrow. */
  pastOut?: Omit<DayTimelineChip, "tone"> & { count: ReactNode; word: string };
  /** Chips carried over from before Now (PO-0221 short): end 6px left of Now, or sit just after Now with no room. */
  carry?: DayTimelineChip[];
  /** Later days group, right-aligned; takes its own second row below 900px. */
  later?: { label: string; chips: DayTimelineChip[] };
  /** The runway lane body (a StockRunway); the lane is 128px tall. */
  runway?: ReactNode;
  /** Marks dimmed 45% (degraded). */
  dimmed?: boolean;
}

export interface DayTimelineProps {
  /** `loading` shows lane skeletons. */
  state?: "ready" | "loading";
  title?: string;
  /** Header line: "8:00-18:00 · as of 9:12". */
  subtitle?: string;
  /** Show the "Projected · Short" legend (not interactive). */
  legend?: boolean;
  /** Business hours, minutes since midnight. */
  hours: { open: number; close: number };
  /** Current time, minutes since midnight. */
  now: number;
  /** Text of the Now tag, e.g. "Now 9:12". */
  nowLabel: string;
  /** Percent of the plot where Now falls; defaults to the hours position (day view). The week view passes its own. */
  nowX?: number;
  /** Week view: day labels along the axis (replaces hour ticks). */
  axisLabels?: { x: number; label: string }[];
  /** Week view: day dividers (percent). */
  dayLines?: number[];
  /** Week view: a closed day (hatched band). */
  closedBand?: { x: number; w: number };
  lanes: DayTimelineLane[];
  className?: string;
}

const CompactCtx = createContext(false);

/* ---- chip parts ---- */
export function ChipTime({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold tabular-nums group-data-[tone=bad]/chip:text-bad">
      {children}
    </span>
  );
}
export function ChipId({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[12px] tracking-[0]">{children}</span>;
}
export function ChipSub({ children }: { children: ReactNode }) {
  const compact = useContext(CompactCtx);
  return compact ? null : <span className="text-muted">{children}</span>;
}
export function ChipWord({ children }: { children: ReactNode }) {
  return (
    <span className="group-data-[tone=bad]/chip:font-semibold group-data-[tone=bad]/chip:text-bad">
      {children}
    </span>
  );
}

const chipBase =
  "group/chip inline-flex h-[26px] cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-control border border-control bg-surface pl-2 pr-[5px] text-[12px] leading-4 text-text " +
  "transition-[border-color,background-color] duration-[120ms] hover:z-[6] hover:border-text hover:bg-raised focus-visible:z-[6] focus-visible:border-text focus-visible:bg-raised " +
  "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent " +
  focusForced;
const chipTone: Record<string, string> = {
  draft: "border-dashed",
  wait: "border-dashed text-muted",
  done: "text-muted",
};

function Chip({
  chip,
  tone,
  pos,
  chipRef,
}: {
  chip: Omit<DayTimelineChip, "id" | "tone">;
  tone?: DayTimelineTone;
  pos: string;
  chipRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      type="button"
      ref={chipRef}
      data-tone={tone}
      title={chip.tip}
      aria-label={chip["aria-label"]}
      onClick={chip.onSelect}
      className={cn(chipBase, tone && chipTone[tone], pos)}
    >
      {tone === "bad" ? (
        <i
          aria-hidden="true"
          className="h-[7px] w-[7px] flex-none rounded-full bg-bad"
        />
      ) : chip.icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex flex-none text-[13px] text-muted",
            tone === "done" && "text-ok"
          )}
        >
          {chip.icon}
        </span>
      ) : null}
      {chip.children}
      <CaretRight
        size={12}
        aria-hidden="true"
        className="ml-px flex-none text-faint transition-[transform,color] duration-[120ms] group-hover/chip:translate-x-0.5 group-hover/chip:text-text group-focus-visible/chip:translate-x-0.5 group-focus-visible/chip:text-text"
      />
    </button>
  );
}

/* ---- marks ---- */
const rowTop = ["top-[9px]", "top-[41px]", "top-[73px]", "top-[105px]"];
const stemH = ["h-8", "h-16", "h-24", "h-32"];
const footTop = ["top-[21px]", "top-[53px]", "top-[85px]", "top-[117px]"];
const plotH = ["h-[44px]", "h-[76px]", "h-[108px]", "h-[140px]"];

function stemTone(tone?: DayTimelineTone) {
  if (tone === "bad") return "bg-bad";
  if (tone === "wait" || tone === "draft")
    return "w-0 border-l-2 border-dashed border-muted bg-transparent";
  if (tone === "done") return "bg-control";
  if (tone === "exp") return "bg-muted";
  return "bg-text";
}
function footTone(tone?: DayTimelineTone) {
  if (tone === "bad") return "bg-bad";
  if (tone === "done") return "bg-control";
  if (tone === "wait" || tone === "draft" || tone === "exp") return "bg-muted";
  return "bg-text";
}

interface Layout {
  rows: Record<string, { r: number; left: boolean }>;
  maxr: number;
  carryLeft: boolean;
  narrow: boolean;
  low: boolean;
}
const emptyLayout: Layout = {
  rows: {},
  maxr: 0,
  carryLeft: false,
  narrow: false,
  low: false,
};

function Lane({
  lane,
  W,
  nowPct,
  children,
}: {
  lane: DayTimelineLane;
  W: number;
  nowPct: number;
  children: ReactNode;
}) {
  const chipEls = useRef<Record<string, HTMLElement | null>>({});
  const carryEl = useRef<HTMLDivElement | null>(null);
  const pastEl = useRef<HTMLDivElement | null>(null);
  const pastWord = useRef<HTMLSpanElement | null>(null);
  const laterEl = useRef<HTMLDivElement | null>(null);
  const known = useRef({ pastW: 0, wordW: 0 });
  const [lay, setLay] = useState<Layout>(emptyLayout);

  useLayoutEffect(() => {
    if (!W) return;
    const nx = (nowPct / 100) * W;
    const marks = (lane.marks ?? [])
      .filter((m) => m.chip)
      .slice()
      .sort((a, b) => a.x - b.x);
    const rows: [number, number][][] = [[], [], [], []];
    const block: { a: number; b: number }[] = [];
    const low = W < 900;
    // carried-over chips end 6px left of Now; with no room they start just after Now
    let carryLeft = false;
    if (carryEl.current) {
      const cw = carryEl.current.offsetWidth;
      carryLeft = nx - 6 - cw < 0;
      block.push(
        carryLeft
          ? { a: nx + 6, b: nx + 6 + cw }
          : { a: nx - 6 - cw, b: nx - 6 }
      );
    }
    // what already went out ends 8px before Now and drops its word when the past is narrow
    let narrow = false;
    if (pastEl.current) {
      if (!lay.narrow) {
        known.current.pastW = pastEl.current.offsetWidth;
        known.current.wordW = pastWord.current
          ? pastWord.current.offsetWidth + 5
          : 0;
      }
      narrow = nx - 8 - known.current.pastW < 4;
      const w = narrow
        ? known.current.pastW - known.current.wordW
        : known.current.pastW;
      block.push({ a: nx - 8 - w, b: nx - 8 });
    }
    let maxr = 0;
    if (laterEl.current) {
      const lw = laterEl.current.offsetWidth;
      if (low) {
        rows[1].push([W - lw, W]);
        maxr = 1;
      } else block.push({ a: W - lw, b: W });
    }
    const xs = marks.map((m) => (m.x / 100) * W);
    const xr: Record<number, number> = {};
    const out: Layout["rows"] = {};
    marks.forEach((m, mi) => {
      const el = chipEls.current[m.id];
      if (!el) return;
      const w = el.offsetWidth;
      const x = xs[mi];
      const free = (a: number, b: number, r: number) =>
        a >= 0 &&
        b <= W &&
        !rows[r].some(([p, q]) => a < q + 6 && b > p - 6) &&
        (r !== 0 || !block.some((k) => a < k.b + 6 && b > k.a - 6));
      // a chip goes left of its stem only when no other stem standing under it reaches that row
      const clearL = (A: number, B: number, r: number) =>
        !xs.some(
          (ox, k) =>
            ox !== x &&
            ox > A - 4 &&
            ox < B + 4 &&
            (k in xr ? xr[k] >= r : r === 0)
        );
      let pick: { r: number; side: string; a: number; b: number } | null = null;
      for (const [r, side] of [
        [0, "R"],
        [0, "L"],
        [1, "R"],
        [1, "L"],
        [2, "R"],
        [2, "L"],
        [3, "R"],
        [3, "L"],
      ] as const) {
        const A = side === "R" ? x + 2 : x - 7 - w;
        const B = side === "R" ? x + 7 + w : x - 2;
        if (free(A, B, r) && (side === "R" || clearL(A, B, r))) {
          pick = { r, side, a: A, b: B };
          break;
        }
      }
      if (!pick)
        pick =
          x + w + 7 > W
            ? { r: 3, side: "L", a: x - w - 7, b: x }
            : { r: 3, side: "R", a: x, b: x + w + 7 };
      rows[pick.r].push([pick.a, pick.b]);
      xr[mi] = pick.r;
      out[m.id] = { r: pick.r, left: pick.side === "L" };
      maxr = Math.max(maxr, pick.r);
    });
    const next: Layout = { rows: out, maxr, carryLeft, narrow, low };
    if (JSON.stringify(next) !== JSON.stringify(lay)) setLay(next);
  });

  const nowPx = `${nowPct}%`;
  const noteLeft =
    lane.note?.leftPct != null
      ? `${lane.note.leftPct}%`
      : `calc(${nowPx} + 8px)`;
  const chipPos = "static";
  return (
    <>
      <div
        className={cn(
          "flex min-w-0 items-center gap-2.5 border-t border-rule py-2 pr-3",
          lane.runway && "items-start pt-3.5"
        )}
      >
        <span
          aria-hidden="true"
          className="flex flex-none text-[18px] text-muted @max-[900px]/dt:hidden"
        >
          {lane.icon}
        </span>
        <span className="flex w-full min-w-0 flex-col text-[12px] leading-4 text-muted">
          <b className="text-[13px] font-semibold leading-[18px] text-text">
            {lane.title}
          </b>
          {lane.warn ? (
            <span className="inline-flex items-center gap-1 text-warn @max-[900px]/dt:hidden">
              {lane.warn}
            </span>
          ) : lane.sub ? (
            <span className="min-w-0 max-w-full @max-[900px]/dt:hidden">
              {lane.sub}
            </span>
          ) : null}
          {lane.headExtra}
        </span>
      </div>
      <div
        data-lane={lane.id}
        className={cn(
          "relative min-w-0 border-t border-rule",
          lane.runway ? "h-[128px]" : plotH[lay.maxr]
        )}
      >
        {children}
        {(lane.marks ?? []).map((m) => {
          const p = lay.rows[m.id] ?? { r: 0, left: false };
          return (
            <div
              key={m.id}
              data-mark={m.id}
              style={{ left: `${m.x}%` }}
              className={cn(
                "absolute top-0 h-full w-0",
                lane.dimmed && "opacity-45"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -left-px top-1.5 w-0.5 rounded-[1px]",
                  stemH[p.r],
                  stemTone(m.tone)
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "absolute h-0.5 w-[5px]",
                  p.left ? "-left-[5px]" : "left-0",
                  footTop[p.r],
                  footTone(m.tone)
                )}
              />
              {m.chip && (
                <Chip
                  chip={m.chip}
                  tone={m.tone}
                  chipRef={(el) => {
                    chipEls.current[m.id] = el;
                  }}
                  pos={cn(
                    "absolute z-[3]",
                    rowTop[p.r],
                    p.left ? "right-[5px]" : "left-[5px]"
                  )}
                />
              )}
              {m.info && (
                <span className="absolute left-1.5 top-[13px] inline-flex cursor-help gap-[5px] whitespace-nowrap text-[12px] leading-4 text-muted [&_b]:font-semibold [&_b]:text-text">
                  {m.info}
                </span>
              )}
            </div>
          );
        })}
        {lane.note && (
          <p
            style={{ left: noteLeft }}
            className={cn(
              "absolute top-1/2 z-[3] inline-flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap text-[12px] text-muted",
              lane.note.tone === "warn" && "text-warn",
              lane.note.tone === "bad" && "[&_svg]:text-bad",
              lane.note.tone === "ok" && "[&_svg]:text-ok"
            )}
          >
            {lane.note.icon && (
              <span aria-hidden="true" className="flex text-[14px]">
                {lane.note.icon}
              </span>
            )}
            {lane.note.text}
          </p>
        )}
        {lane.pastOut && (
          <div
            ref={pastEl}
            style={{ right: `calc(${100 - nowPct}% + 8px)` }}
            className="absolute top-[9px] z-[3] flex w-max gap-1.5"
          >
            <Chip
              tone="done"
              pos="static"
              chip={{
                tip: lane.pastOut.tip,
                onSelect: lane.pastOut.onSelect,
                "aria-label": lane.pastOut["aria-label"],
                children: (
                  <>
                    <span className="font-semibold tabular-nums">
                      {lane.pastOut.count}
                    </span>
                    <span ref={pastWord} className={cn(lay.narrow && "hidden")}>
                      {lane.pastOut.word}
                    </span>
                  </>
                ),
              }}
            />
          </div>
        )}
        {lane.carry && lane.carry.length > 0 && (
          <div
            ref={carryEl}
            style={
              lay.carryLeft
                ? { left: `calc(${nowPx} + 6px)` }
                : { right: `calc(${100 - nowPct}% + 6px)` }
            }
            className="absolute top-[9px] z-[3] flex w-max gap-1.5"
          >
            {lane.carry.map((c) => (
              <Chip key={c.id} chip={c} tone={c.tone} pos={chipPos} />
            ))}
          </div>
        )}
        {lane.later && (
          <div
            ref={laterEl}
            className={cn(
              "absolute right-0 z-[3] flex items-center gap-1.5",
              lay.low ? "top-[41px]" : "top-[9px]"
            )}
          >
            <span className="text-[12px] text-muted">{lane.later.label}</span>
            {lane.later.chips.map((c) => (
              <Chip key={c.id} chip={c} tone={c.tone} pos={chipPos} />
            ))}
          </div>
        )}
        {lane.runway && <div className="absolute inset-0">{lane.runway}</div>}
      </div>
    </>
  );
}

const loadingLanes = [
  { t: "To do by", i: <Alarm size={18} /> },
  { t: "Stock in", i: <Truck size={18} /> },
  { t: "Stock out", i: <ArrowSquareOut size={18} /> },
  { t: "Stock left", i: <ChartLineDown size={18} /> },
];

/**
 * Day timeline (I6), desktop: a header (icon, name, hours, legend) over a grid of lane heads and plots on a time axis.
 * One accent Now line and tag; the past is a quiet band. A mark is a tick plus a chip; only chips open something and
 * they lay out in up to four rows without colliding. Below 900px the lane heads narrow, chip sub-labels hide and the
 * Later group takes its own row. The week view passes its own axis labels, day lines and closed band. For the phone
 * list use `DayTimelinePhone`. All colours are tokens.
 */
export function DayTimeline({
  state = "ready",
  title = "Today's timeline",
  subtitle,
  legend = false,
  hours,
  now,
  nowLabel,
  nowX,
  axisLabels,
  dayLines,
  closedBand,
  lanes,
  className,
}: DayTimelineProps) {
  const axisEl = useRef<HTMLDivElement | null>(null);
  const [W, setW] = useState(0);
  useLayoutEffect(() => {
    const el = axisEl.current;
    if (!el) return;
    const read = () => setW(el.clientWidth);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state]);

  const span = hours.close - hours.open;
  const xt = (t: number) =>
    Math.max(0, Math.min(100, ((t - hours.open) / span) * 100));
  const nowPct = nowX ?? xt(now);
  const compact = W > 0 && W < 900;

  const ticks: { x: number; h: number; cls: string }[] = [];
  if (!axisLabels && W) {
    const hrs = span / 60;
    const step = W / hrs >= 64 ? 1 : 2;
    const nxPx = (nowPct / 100) * W;
    for (let h = hours.open / 60; h <= hours.close / 60; h += step) {
      const x = xt(h * 60);
      if (Math.abs((x / 100) * W - nxPx) < 50 && h * 60 !== hours.open)
        continue;
      ticks.push({
        x,
        h,
        cls:
          h * 60 === hours.open
            ? ""
            : h * 60 >= hours.close
            ? "-translate-x-full"
            : "-translate-x-1/2",
      });
    }
  }

  const past = (
    <span
      aria-hidden="true"
      style={{ width: `${nowPct}%` }}
      className="pointer-events-none absolute bottom-0 left-0 top-0 bg-raised"
    />
  );
  const nowLine = (
    <span
      aria-hidden="true"
      style={{ left: `${nowPct}%` }}
      className="pointer-events-none absolute bottom-0 top-0 z-[4] w-0 border-l-2 border-accent"
    />
  );
  const hatch =
    "[background:repeating-linear-gradient(135deg,var(--rule)_0_1px,transparent_1px_6px)]";

  return (
    <section
      aria-label={title}
      className={cn("@container/dt flex min-w-0 flex-col", className)}
      data-compact={compact}
    >
      <div className="flex min-h-8 items-baseline gap-2.5 pb-1">
        <span
          aria-hidden="true"
          className="flex self-center text-[18px] text-muted"
        >
          <Clock size={18} />
        </span>
        <h2 className="whitespace-nowrap text-[16px] font-semibold leading-[22px]">
          {title}
        </h2>
        {subtitle && (
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-muted">
            {subtitle}
          </span>
        )}
        {legend && (
          <span className="ml-auto flex items-center gap-4 self-center whitespace-nowrap text-[12px] text-muted">
            <span
              aria-hidden="true"
              className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted"
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <i className="inline-block h-0 w-[18px] flex-none border-t-2 border-dashed border-accent" />
                Projected
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap @max-[1100px]/dt:hidden">
                <i className="inline-block h-2.5 w-3.5 flex-none border-b-[1.5px] border-bad bg-bad-bg" />
                Short
              </span>
            </span>
          </span>
        )}
      </div>
      <CompactCtx.Provider value={compact}>
        <div
          aria-busy={state === "loading" || undefined}
          className="grid grid-cols-[168px_minmax(0,1fr)] border-b border-rule @max-[900px]/dt:grid-cols-[120px_minmax(0,1fr)]"
        >
          <div />
          <div ref={axisEl} className="relative h-[30px] min-w-0">
            {past}
            {ticks.map((t) => (
              <span
                key={t.h}
                style={{ left: `${t.x}%` }}
                className={cn(
                  "absolute top-2 whitespace-nowrap text-[12px] tabular-nums text-muted",
                  t.cls
                )}
              >
                {t.h}:00
              </span>
            ))}
            {axisLabels?.map((a) => (
              <span
                key={a.label}
                style={{ left: `${a.x}%` }}
                className="absolute top-2 whitespace-nowrap text-[12px] tabular-nums text-muted"
              >
                {a.label}
              </span>
            ))}
            <span
              style={{ left: `${nowPct}%` }}
              className="absolute top-[5px] z-[5] h-5 -translate-x-1/2 whitespace-nowrap rounded-chip bg-accent px-[7px] text-[12px] font-semibold leading-5 tabular-nums text-accent-ink"
            >
              {nowLabel}
            </span>
          </div>
          {state === "loading"
            ? loadingLanes.map((l, i) => (
                <LoadingLane key={l.t} title={l.t} icon={l.i} index={i} />
              ))
            : lanes.map((lane) => (
                <Lane key={lane.id} lane={lane} W={W} nowPct={nowPct}>
                  {past}
                  {closedBand && (
                    <span
                      aria-hidden="true"
                      style={{
                        left: `${closedBand.x}%`,
                        width: `${closedBand.w}%`,
                      }}
                      className={cn(
                        "pointer-events-none absolute bottom-0 top-0",
                        hatch
                      )}
                    />
                  )}
                  {dayLines?.map((x) => (
                    <span
                      key={x}
                      aria-hidden="true"
                      style={{ left: `${x}%` }}
                      className="pointer-events-none absolute bottom-0 top-0 w-0 border-l border-rule"
                    />
                  ))}
                  {nowLine}
                </Lane>
              ))}
        </div>
      </CompactCtx.Provider>
    </section>
  );
}

function LoadingLane({
  title,
  icon,
  index,
}: {
  title: string;
  icon: ReactNode;
  index: number;
}) {
  const last = index === 3;
  return (
    <>
      <div className="flex min-w-0 items-center gap-2.5 border-t border-rule py-2 pr-3">
        <span
          aria-hidden="true"
          className="flex flex-none text-[18px] text-muted @max-[900px]/dt:hidden"
        >
          {icon}
        </span>
        <span className="flex w-full min-w-0 flex-col text-[12px] leading-4 text-muted">
          <b className="text-[13px] font-semibold leading-[18px] text-text">
            {title}
          </b>
        </span>
      </div>
      <div
        className={cn(
          "relative min-w-0 border-t border-rule",
          last ? "h-[128px]" : "h-[44px]"
        )}
      >
        <span
          aria-hidden="true"
          style={{
            left: `${12 + index * 9}%`,
            top: last ? "calc(50% - 7px)" : "15px",
            width: `${18 + index * 6}%`,
          }}
          className="absolute block h-[14px] rounded-[3px] bg-skeleton motion-safe:animate-pulse"
        />
      </div>
    </>
  );
}

/* ================= phone: the vertical timeline ================= */

export interface DayTimelineRow {
  id: string;
  /** "9:30", "Yday". */
  time: string;
  /** In/Out icon (18px). */
  icon: ReactNode;
  /** Title line: ids and names. */
  title: ReactNode;
  /** Second line: "Out: 2 OF-114 · short, none left". */
  sub?: ReactNode;
  /** Red time and icon. */
  short?: boolean;
  /** Present = the row is a button with a caret. */
  onSelect?: () => void;
}

export interface DayTimelinePhoneProps {
  state?: "ready" | "loading";
  title?: string;
  rows: DayTimelineRow[];
  /** Rows carried over from before Now (a short delivery waiting to be settled). */
  carryRows?: DayTimelineRow[];
  /** "Earlier today · N moved" fold. */
  earlier?: {
    count: number;
    rows: DayTimelineRow[];
    open: boolean;
    onToggle: () => void;
  };
  nowLabel: string;
  /** Rows shown before "Show N more today". Default 4. */
  limit?: number;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  /** Row text when nothing is left, "Nothing else booked today." */
  emptyLabel?: string;
  /** Icon for the empty row. */
  emptyIcon?: ReactNode;
  className?: string;
}

function RowItem({ r, first }: { r: DayTimelineRow; first?: boolean }) {
  const grid =
    "grid min-h-[58px] w-full grid-cols-[44px_22px_minmax(0,1fr)_14px] items-center gap-x-2 py-2.5 text-left text-text";
  const body = (
    <>
      <span
        className={cn(
          "text-[13px] font-medium leading-5 tabular-nums text-muted",
          r.short && "font-semibold text-bad"
        )}
      >
        {r.time}
      </span>
      <span
        aria-hidden="true"
        className={cn("flex text-[18px] text-muted", r.short && "text-bad")}
      >
        {r.icon}
      </span>
      <span className="min-w-0 text-[14px] leading-5">
        {r.title}
        {r.sub && (
          <span className="mt-0.5 block text-[12px] leading-4 text-muted">
            {r.sub}
          </span>
        )}
      </span>
      {r.onSelect ? (
        <CaretRight size={14} aria-hidden="true" className="text-faint" />
      ) : (
        <span />
      )}
    </>
  );
  return (
    <li
      className={cn(
        "m-0 block border-t border-rule",
        first && "border-t-transparent"
      )}
    >
      {r.onSelect ? (
        <button
          type="button"
          onClick={r.onSelect}
          className={cn(
            grid,
            "cursor-pointer outline-none hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
            focusForced
          )}
        >
          {body}
        </button>
      ) : (
        <div className={grid}>{body}</div>
      )}
    </li>
  );
}

/**
 * Day timeline (I6), phone: a vertical list with In/Out icons. Every row that opens something is a button with a
 * caret. The Now divider sits between what is behind and what is next; the next 4 show, then "Show N more today";
 * "Earlier today" folds what already moved.
 */
export function DayTimelinePhone({
  state = "ready",
  title = "Today's timeline",
  rows,
  carryRows = [],
  earlier,
  nowLabel,
  limit = 4,
  expanded = false,
  onToggleExpanded,
  emptyLabel = "Nothing else booked today.",
  emptyIcon,
  className,
}: DayTimelinePhoneProps) {
  const shown = expanded ? rows : rows.slice(0, limit);
  const more = rows.length - shown.length;
  return (
    <section
      aria-label={title}
      className={cn("flex min-w-0 flex-col", className)}
    >
      <div className="flex min-h-8 items-baseline gap-2.5 border-b border-border pb-2.5">
        <span
          aria-hidden="true"
          className="flex self-center text-[18px] text-muted"
        >
          <Clock size={18} />
        </span>
        <h2 className="whitespace-nowrap text-[16px] font-semibold leading-[22px]">
          {title}
        </h2>
      </div>
      {state === "loading" ? (
        <div aria-busy="true" className="p-0">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="mx-0 my-4 block h-[18px] w-[80%] rounded-[3px] bg-skeleton motion-safe:animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div aria-label="Today, by time" className="p-0">
          {earlier && (
            <>
              <button
                type="button"
                aria-expanded={earlier.open}
                onClick={earlier.onToggle}
                className={cn(
                  "m-0 flex min-h-12 w-full cursor-pointer items-center gap-2 border-b border-rule p-0 text-left text-[13px] text-muted outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                  focusForced
                )}
              >
                <ClockCounterClockwise size={16} aria-hidden="true" />
                <span>
                  Earlier today ·{" "}
                  <b className="font-semibold tabular-nums text-text">
                    {earlier.count}
                  </b>{" "}
                  moved
                </span>
                <CaretRight
                  size={12}
                  aria-hidden="true"
                  className={cn(
                    "ml-auto transition-transform duration-[120ms]",
                    earlier.open && "rotate-90"
                  )}
                />
              </button>
              {earlier.open && (
                <ol className="relative">
                  {earlier.rows.map((r, i) => (
                    <RowItem key={r.id} r={r} first={i === 0} />
                  ))}
                </ol>
              )}
            </>
          )}
          {carryRows.length > 0 && (
            <ol className="relative">
              {carryRows.map((r, i) => (
                <RowItem key={r.id} r={r} first={i === 0} />
              ))}
            </ol>
          )}
          <div className="mb-1 mt-2.5 flex items-center gap-2 after:h-0.5 after:flex-1 after:bg-accent after:content-['']">
            <span className="h-5 whitespace-nowrap rounded-chip bg-accent px-[7px] text-[12px] font-semibold leading-5 tabular-nums text-accent-ink">
              {nowLabel}
            </span>
          </div>
          <ol className="relative">
            {shown.length ? (
              shown.map((r, i) => <RowItem key={r.id} r={r} first={i === 0} />)
            ) : (
              <RowItem
                r={{
                  id: "empty",
                  time: "",
                  icon: emptyIcon,
                  title: <span className="text-muted">{emptyLabel}</span>,
                }}
                first
              />
            )}
          </ol>
        </div>
      )}
      {(more > 0 || expanded) && onToggleExpanded && (
        <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-3">
          <button
            type="button"
            onClick={onToggleExpanded}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-control px-2.5 text-[12px] font-semibold text-accent outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
              focusForced
            )}
          >
            {expanded ? "Show less" : `Show ${more} more today`}
            {expanded ? (
              <CaretUp size={12} aria-hidden="true" />
            ) : (
              <CaretDown size={12} aria-hidden="true" />
            )}
          </button>
        </div>
      )}
    </section>
  );
}
