import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { ArrowRight, ArrowSquareOut, CheckCircle, Eye, Prohibit } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Badge, type BadgeTone } from './Badge';
import { Button } from './Button';
import { ErrorBlock } from './ErrorBlock';
import { Fact, FactsLine, type FactTone } from './FactsLine';
import { ListGroup, ListGroups } from './ListGroup';
import { ListRow } from './List';
import { PlatformLogo, type PlatformLogoProps } from './PlatformLogo';
import { Skeleton } from './Skeleton';

/** The identity of a platform, as `PlatformLogo` takes it. */
export type TodayPlatform = Pick<PlatformLogoProps, 'src' | 'index' | 'color' | 'hq' | 'initials'> & {
  /** Full name. It wraps, it is never cut. */
  name: string;
};

/** A link from a row to the other platform ("ALT-NCP150 0 on hand"). */
export interface TodayLink {
  platform: TodayPlatform;
  /** The other platform's reference, shown first: "ALT-NCP150". */
  ref?: string;
  /** What the other platform says: "0 on hand". */
  text: string;
  /** Opens the other platform's row. */
  onSelect?: () => void;
}

/** One row of a list. The same shape for every kind of platform. */
export interface TodayItem {
  id: string;
  /** Short reference ("JO-0412"). Muted, before the title. */
  ref?: string;
  title: ReactNode;
  /** One quiet line under the title. Wraps. */
  detail?: ReactNode;
  /** State pill text ("Waiting for part") and its tone. */
  state?: string;
  tone?: BadgeTone;
  /** A quantity, bold ("6 pcs"). */
  qty?: ReactNode;
  /** Time or date, muted ("9:40 AM"). */
  at?: ReactNode;
  /** Chip to the other platform. */
  link?: TodayLink;
  /** Opens the row (click and Enter on the cursor row). */
  onActivate?: () => void;
}

export interface TodayList {
  id: string;
  /** "Open jobs", "Stock movements". */
  title: string;
  /** All the rows there are. Shown as "View all N" when it is more than the rows shown. */
  total: number;
  /** The newest or most important rows; only the first `maxRows` (see `pickTodayRows`) are drawn. */
  items: TodayItem[];
  /** Words for the link, default "View all". */
  viewAllLabel?: string;
  onViewAll?: () => void;
}

export interface TodayFact {
  /** The bold part: "12", "4 / 9". */
  value: ReactNode;
  /** The muted part: "open jobs". */
  label: ReactNode;
  tone?: FactTone;
}

export interface TodayActivity {
  id: string;
  at: ReactNode;
  text: ReactNode;
}

/** Whether Leda can act on this platform, only read it, or cannot read it (offline). */
export type TodayLedaMode = 'acts' | 'reads' | 'offline';

export interface PlatformTodayProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  platform: TodayPlatform;
  /** What kind of platform this is, beside the name: "Auto repair", "Parts stockroom", "Team and plan". */
  kind?: string;
  /** Short facts: up to 3 are shown, as `value label`. */
  facts?: TodayFact[];
  /** Quiet words in place of facts when there are none ("Paused since 8:10 AM"). */
  note?: ReactNode;
  /** "Leda acts here" / "Leda reads only" / "Leda can't read while offline". Omit to say nothing. */
  leda?: TodayLedaMode;
  lists?: TodayList[];
  /** Shown as "Today" when `lists` is empty: latest first, up to `maxRows`. */
  activity?: TodayActivity[];
  /** Rows per list. Default 3; give 2 on a narrow sheet or with 4+ platforms. */
  maxRows?: number;
  /** Opens the platform. Draws an "Open" button in the header (its label folds away in a narrow block). */
  onOpen?: () => void;
  /** Extra content after the lists, e.g. the plan bar in the HQ block. */
  children?: ReactNode;
  /** Colour behind the sticky header; match where the block renders. `frame` (default): the place column. `surface`: the sheet. */
  surface?: 'frame' | 'surface';
  /** Show the final layout in `--skeleton` bars. */
  loading?: boolean;
  /** The platform failed to load: an inline error block in place of the lists; the header still shows. */
  error?: boolean;
  onRetry?: () => void;
  /** Button text on the error block. Default "Try again". */
  retryLabel?: string;
  /** "Last loaded 9:10 AM" on the error block. */
  lastLoaded?: string;
  /** Row anatomy. Default `narrow`; give `wide` on a sheet wider than 720px, `phone` on a phone. */
  rowLayout?: TodayRowLayout;
  /** Reference of one row to flash once (`n` changes to flash again), e.g. after its link chip was used. */
  flashRow?: { ref: string; n: number } | null;
  /** Heading level of the platform name. Default 3. */
  level?: 2 | 3 | 4;
  /**
   * j / k / Enter over this block's rows. Default false: a page keeps page shortcuts on ONE component (its main
   * list), and a Today block is a side panel. Turn on only when this block is the page's main list.
   */
  shortcuts?: boolean;
}

/**
 * The first `max` rows, except that the first row of each tone (bad, warn, ok) is always kept, so the one row that
 * stands out (the single stock "In" among the "Out"s) is never hidden. Order is kept.
 */
export function pickTodayRows<T extends { tone?: string }>(items: readonly T[], max: number): T[] {
  const keep = new Set<number>();
  for (const t of ['bad', 'warn', 'ok']) {
    const k = items.findIndex((x) => x.tone === t);
    if (k >= 0 && keep.size < max) keep.add(k);
  }
  for (let k = 0; k < items.length && keep.size < max; k++) keep.add(k);
  return [...keep].sort((a, b) => a - b).map((k) => items[k]);
}

const SHOWN_FACTS = 3;

function LedaFact({ mode }: { mode: TodayLedaMode }) {
  const Icon = mode === 'acts' ? CheckCircle : mode === 'reads' ? Eye : Prohibit;
  const text = mode === 'acts' ? 'Leda acts here' : mode === 'reads' ? 'Leda reads only' : "Leda can't read while offline";
  return (
    <Fact className={cn(mode === 'acts' ? 'text-ok-ink' : 'text-muted')}>
      <span className="inline-flex items-baseline gap-1">
        <Icon aria-hidden size={14} className="shrink-0 translate-y-[2px]" />
        {text}
      </span>
    </Fact>
  );
}

/** How a row lays out. `wide`: reference | title and detail | state and time. `narrow`: one column. `phone`: title | state, chip underneath. */
export type TodayRowLayout = 'wide' | 'narrow' | 'phone';

const COLUMNS: Record<TodayRowLayout, string> = {
  wide: '84px minmax(0,1fr) auto',
  narrow: 'minmax(0,1fr)',
  phone: 'minmax(0,1fr) auto',
};

function Chip({ link, from, layout, flashId }: { link: TodayLink; from: string; layout: TodayRowLayout; flashId?: string }) {
  const body = (
    <>
      <PlatformLogo {...link.platform} decorative size={14} />
      {link.ref ? <span className="whitespace-nowrap font-mono text-small">{link.ref}</span> : null}
      <span>{link.text}</span>
      <span className="sr-only"> in {link.platform.name}</span>
    </>
  );
  const cls = cn(
    'inline-flex max-w-full items-center gap-[5px] rounded-chip bg-accent-tint py-px pl-1 pr-1.5 text-left text-small text-accent',
    layout === 'wide' ? 'col-[2/-1] mt-0.5 w-max [&>span:not(.sr-only)]:truncate' : 'col-[1/-1] mt-0.5 flex-wrap items-start [&>span:not(.sr-only)]:whitespace-normal',
    '[&>span:not(.sr-only)]:leading-[18px]',
    link.onSelect && 'hover:bg-accent-tint-2',
    focusRing,
  );
  return link.onSelect ? (
    <button type="button" onClick={link.onSelect} className={cls} data-from={from} data-flash-id={flashId}>
      {body}
    </button>
  ) : (
    <span className={cls}>{body}</span>
  );
}

function Row({ item, platform, label, layout, flash }: { item: TodayItem; platform: string; label: string; layout: TodayRowLayout; flash?: boolean }) {
  const wide = layout === 'wide';
  const title = <span className="font-medium">{item.title}</span>;
  const hasMeta = Boolean(item.state || item.qty || item.at);
  return (
    <ListRow rowId={`${platform}:${item.id}`} label={label} onActivate={item.onActivate} flash={flash} className="!py-[7px] gap-x-2.5 gap-y-0.5 text-ui" data-ref={item.ref}>
      {wide ? <span className="overflow-hidden text-ellipsis whitespace-nowrap pt-px font-mono text-small text-muted">{item.ref}</span> : null}
      <div className="flex min-w-0 flex-col">
        <div>
          {!wide && item.ref ? <span className="mr-1.5 whitespace-nowrap font-mono text-small text-muted">{item.ref}</span> : null}
          {item.onActivate ? (
            <button
              type="button"
              onClick={item.onActivate}
              className={cn('m-0 cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit] text-[length:inherit] text-text hover:underline', focusRing)}
            >
              {title}
            </button>
          ) : (
            title
          )}
        </div>
        {item.detail ? <div className="text-small text-muted">{item.detail}</div> : null}
      </div>
      {hasMeta ? (
        <div className={cn('flex items-center gap-2 whitespace-nowrap', layout === 'narrow' && 'flex-wrap justify-start gap-y-0.5')}>
          {item.qty ? <b className="text-ui font-medium tabular-nums">{item.qty}</b> : null}
          {item.state ? <Badge tone={item.tone ?? 'neutral'}>{item.state}</Badge> : null}
          {item.at ? <span className={cn('text-small tabular-nums text-muted', layout === 'wide' && 'min-w-[38px] text-right')}>{item.at}</span> : null}
        </div>
      ) : wide || layout === 'phone' ? <span /> : null}
      {item.link ? <Chip link={item.link} from={platform} layout={layout} /> : null}
    </ListRow>
  );
}

function SkeletonBlock() {
  return (
    <div aria-hidden className="mt-3 flex flex-col gap-4">
      <Skeleton variant="text" width="70%" />
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2 border-t border-rule pt-3">
          <Skeleton variant="text" width="45%" />
          <Skeleton variant="text" lines={2} />
        </div>
      ))}
    </div>
  );
}

/**
 * Platform Today block (C24): one block per platform, the same for every kind. A sticky header on a stronger rule
 * (24px logo, the full name, which wraps and is never cut, the kind beside or under it, an Open button), a facts line
 * (`FactsLine`: up to 3 facts, then "Leda acts here" / "Leda reads only"), then each list as a `ListGroup`
 * (title, "View all N", up to `maxRows` ruled rows that wrap, link chips to the other platform). A platform with no
 * lists shows its latest activity. The HQ block is the same shape (`platform.hq`), with `children` for the plan bar.
 *
 * Data is generic across kinds: `lists[]` with `items[]` of `{ id, ref, title, detail, state, tone, qty, at, link }`.
 * Where it goes: the place column (`surface="frame"`, default) or the sheet (`surface="surface"`); the header needs the
 * colour of what is behind it, and the nearest scrolling ancestor is what it sticks to. Its width is the column's,
 * from 320px up; nothing relies on the viewport. `className` is merged on the outer element (margins, width).
 */
export const PlatformToday = forwardRef<HTMLElement, PlatformTodayProps>(function PlatformToday(
  {
    platform,
    kind,
    facts = [],
    note,
    leda,
    lists = [],
    activity = [],
    maxRows = 3,
    onOpen,
    children,
    surface = 'frame',
    loading = false,
    error = false,
    onRetry,
    retryLabel,
    lastLoaded,
    level = 3,
    rowLayout = 'narrow',
    flashRow = null,
    shortcuts = false,
    className,
    ...rest
  },
  ref,
) {
  const uid = useId();
  const nameId = `${uid}-n`;
  const Heading = `h${level}` as 'h3';
  const shown = facts.slice(0, SHOWN_FACTS);
  const hasFacts = shown.length > 0 || note != null || leda != null;
  const sub = (level + 1) as 3 | 4 | 5;
  const listLevel = Math.min(sub, 4) as 3 | 4;

  const body = loading ? (
    <SkeletonBlock />
  ) : error ? (
    <ErrorBlock thing={platform.name} lastLoaded={lastLoaded} onRetry={onRetry} retryLabel={retryLabel} className="mt-4" />
  ) : lists.length > 0 ? (
    <ListGroups shortcuts={shortcuts} aria-label={`${platform.name} today`} columns={COLUMNS[rowLayout]} stackBelow={0}>
      {lists.map((l) => {
        const rows = pickTodayRows(l.items, maxRows);
        const more = l.total > rows.length;
        return (
          <div key={l.id}>
            <ListGroup
              title={l.title}
              count={l.total}
              level={listLevel}
              className="[&>div:first-child]:gap-x-1 [&>div:first-child]:pb-1 [&>div:first-child]:pt-3.5 [&>div:first-child>*]:leading-5 [&>div:first-child>span]:text-ui"
            >
              {rows.map((it) => (
                <Row key={flashRow && it.ref === flashRow.ref ? `${it.id}:${flashRow.n}` : it.id} item={it} platform={platform.name} layout={rowLayout} flash={!!flashRow && it.ref === flashRow.ref} label={`${l.title}: ${typeof it.title === 'string' ? it.title : it.ref ?? ''}`} />
              ))}
            </ListGroup>
            {more ? (
              <Button
                variant="text"
                rightIcon={ArrowRight}
                onClick={l.onViewAll}
                aria-label={`${l.viewAllLabel ?? 'View all'} ${l.total} in ${l.title}`}
                className="-ml-1.5 mt-1.5 !h-7 !gap-1.5 !px-1.5 !text-ui !font-medium text-accent hover:bg-raised"
              >
                {l.viewAllLabel ?? 'View all'} <span className="tabular-nums">{l.total}</span>
              </Button>
            ) : null}
          </div>
        );
      })}
    </ListGroups>
  ) : activity.length > 0 ? (
    <div className="mt-4">
      <Heading className="m-0 text-ui font-semibold text-text">Today</Heading>
      <ol className="m-0 mt-1 list-none p-0">
        {activity.slice(0, maxRows).map((a) => (
          <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 border-t border-rule py-2 text-ui">
            <span className="min-w-[4.5ch] text-small tabular-nums leading-5 text-muted">{a.at}</span>
            <span className="min-w-0 [overflow-wrap:anywhere]">{a.text}</span>
          </li>
        ))}
      </ol>
    </div>
  ) : (
    <p className="m-0 mt-4 border-t border-rule py-2 text-ui text-muted">Nothing yet today.</p>
  );

  return (
    <section
      ref={ref}
      aria-labelledby={nameId}
      aria-busy={loading || undefined}
      data-surface={surface}
      className={cn('@container/today relative min-w-0', className)}
      {...rest}
    >
      <header className={cn('sticky top-0 z-10 flex items-center gap-2.5 border-b border-control bg-[var(--scope-bg)] pb-2.5 pt-0.5')}>
        <PlatformLogo {...platform} name={platform.name} decorative size={24} className="mt-px" />
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5">
          <Heading id={nameId} className="m-0 min-w-0 text-left text-dialog text-text [overflow-wrap:anywhere]">
            {platform.name}
          </Heading>
          {kind ? <span className="text-small text-muted">{kind}</span> : null}
        </div>
        {onOpen ? (
          <Button
            variant="text"
            onClick={onOpen}
            rightIcon={ArrowSquareOut}
            aria-label={`Open ${platform.name}`}
            className="-mr-2 !h-7 shrink-0 text-muted hover:text-text"
          >
            <span className="@max-[330px]/today:sr-only">Open</span>
          </Button>
        ) : null}
      </header>
      {hasFacts && !loading ? (
        <FactsLine aria-label={`${platform.name} facts`} className="mt-1.5">
          {shown.map((f, i) => (
            <Fact key={i} value={f.value} tone={f.tone} valueFirst>
              {f.label}
            </Fact>
          ))}
          {shown.length === 0 && note != null ? <Fact>{note}</Fact> : null}
          {leda ? <LedaFact mode={leda} /> : null}
        </FactsLine>
      ) : null}
      {body}
      {!loading && !error ? children : null}
    </section>
  );
});
