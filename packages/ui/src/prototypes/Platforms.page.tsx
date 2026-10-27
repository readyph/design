import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowCounterClockwise, ArrowRight, ArrowSquareOut, CircleNotch, DotsThree, Graph, House, LinkBreak, PencilSimple, Plant, Plugs, Plus, PlusSquare, Prohibit, SquaresFour, Table, Warning, WarningCircle } from '@phosphor-icons/react';
import { AskLedaBar } from '../components/AskLedaBar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { Chat, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, usePersistedChat, type ChatBlock, type ChatChip, type ChatMessageData } from '../components/Chat';
import { CommandPalette, type CommandPaletteGroup } from '../components/CommandPalette';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconButton } from '../components/IconButton';
import { LedaMark } from '../components/Leda';
import { LedaNote } from '../components/LedaNote';
import { List, ListCell, ListHeader, ListHeaderCell, ListRow } from '../components/List';
import { Marketplace } from '../components/Marketplace';
import { sampleCatalog } from '../components/Marketplace.sample';
import { Menu } from '../components/Menu';
import { Modal } from '../components/Modal';
import { PlatformLogo } from '../components/PlatformLogo';
import { SheetBar } from '../components/SheetBar';
import { Skeleton } from '../components/Skeleton';
import { StatusBar, type StatusBarPlatform } from '../components/StatusBar';
import { TownMap, type TownMapLink, type TownMapSlot } from '../components/TownMap';
import { Toaster } from '../components/toast/Toaster';
import { toast } from '../components/toast/toastStore';
import { cn } from '../utils/cn';
import { PortalFrame } from './PortalFrame';
import { go, goToStory } from './protoNav';
import { focusIfLost } from '../utils/focusIfLost';
import { useMatchMedia } from '../utils/useMatchMedia';
import {
  addableKinds,
  dataKinds,
  andList,
  byId,
  caption as mapCaption,
  catalogItem,
  headline,
  health,
  healthLine,
  hasApp,
  idleList,
  kindName,
  kname,
  kshares,
  LAST_LOADED,
  lower,
  missing,
  NOW,
  noFigures,
  ordered,
  plural,
  setupNeeded,
  sets,
  sharesOf,
  shareable,
  sourcesOf,
  USAGE,
  type DataKind,
  type DataLink,
  type Health,
  type PlatformData,
  type PlatformSet,
  type PlatformSetKey,
} from './Platforms.data';

export type PlatformsState = 'live' | 'loading' | 'error';
export type PlatformsSetKey = PlatformSetKey;

export interface PlatformsPageProps {
  set?: PlatformsSetKey;
  state?: PlatformsState;
  /** Marketplace open on first render (`?add=1`, or Leda's "Add a POS for the parts counter"). */
  add?: { pick?: string; fromLeda?: boolean } | null;
  /** Open on a state that normally takes a click (stories): the palette, Leda's panel after asking, or the Disconnect dialog for one platform. */
  start?: { palette?: boolean; ask?: string; disconnect?: string } | null;
}

const PHONE = '(max-width: 640px)';
/** The catalog as the prototype words it: "Shares stock and catalog", "Shares ledger (soon)", "Reads stock". */
const catalog = sampleCatalog.map((i) => ({
  ...i,
  shares: i.shares?.map((k) => `${lower(kname(k as DataKind))}${dataKinds[k as DataKind].shares ? '' : ' (soon)'}`),
  reads: i.reads?.map((k) => lower(kname(k as DataKind))),
}));
const open = (p: PlatformData) => toast({ description: `Opening ${p.name} (${kindName(p.kind)}).` });
const href = (id: string) => `#${id}`;

/** One platform's tile: its identity colour, uploaded logo or monogram. */
function Logo({ p, size = 16, className }: { p: PlatformData; size?: 14 | 16 | 20 | 32; className?: string }) {
  return <PlatformLogo name={p.name} size={size} decorative color={p.color} src={p.logo} initials={p.mono} className={className} />;
}

const HL_TEXT: Record<Health['st'], string> = { ACTIVE: 'text-ok', DEGRADED: 'text-warn', SETUP: 'text-warn', OFFLINE: 'text-bad', NEW: 'text-muted' };
const HL_DOT: Record<Health['st'], string> = {
  ACTIVE: 'bg-ok-dot',
  DEGRADED: 'bg-warn-dot',
  SETUP: 'bg-warn-dot',
  OFFLINE: 'bg-bad-dot',
  NEW: 'border-[1.5px] border-muted',
};
/** The health word with its dot (the prototype's `.hl`). */
function Hl({ h, className }: { h: Health; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-small', HL_TEXT[h.st], className)}>
      <span aria-hidden className={cn('size-[7px] shrink-0 rounded-full', HL_DOT[h.st])} />
      {h.text}
    </span>
  );
}

/** Hovering a platform lights only its building and roads; a data link lights both ends and the road. The light stays until another row is hovered or the pointer leaves the list (the workshop page's `mouseover` on the list). */
const hoverProps = (set: (ids: string[] | null) => void) => ({
  onMouseOver: (e: { target: EventTarget }) => {
    const t = e.target as HTMLElement;
    if (t.closest('[role="menu"]')) return; // an open row menu belongs to its row (the workshop page keeps the menu inside the row)
    const r = t.closest<HTMLElement>('[data-hl]');
    set(r ? r.dataset.hl!.split(',') : null);
  },
  onMouseLeave: () => {
    if (!document.querySelector('[role="menu"]')) set(null);
  },
});

const nav = (to: Parameters<typeof go>[0]) => (e: { preventDefault: () => void }) => {
  e.preventDefault();
  go(to);
};

/** The platform's own kebab menu: Edit details, Connect data, Disconnect. */
function RowMenu({ p, onDisconnect }: { p: PlatformData; onDisconnect: (p: PlatformData) => void }) {
  return (
    <Menu
      trigger={<IconButton icon={DotsThree} label={`More for ${p.name}`} className="size-[30px] text-muted max-[640px]:size-10" />}
      items={[
        { label: 'Edit details', icon: PencilSimple, onSelect: () => go({ to: 'platform', id: p.id, tab: 'general' }) },
        { label: 'Connect data', icon: Plugs, onSelect: () => go({ to: 'platform', id: p.id, tab: 'connections' }) },
        { label: 'Disconnect', icon: LinkBreak, danger: true, onSelect: () => onDisconnect(p) },
      ]}
    />
  );
}

const Sep = () => <span className="text-muted">,</span>;
/** Logo chips ("[logo] Stockroom") for the platforms a line reads from or shares with. */
function Chips({ set, ids }: { set: PlatformSet; ids: string[] }) {
  if (ids.length > 2) {
    return (
      <>
        {ids.slice(0, 3).map((id) => (
          <Logo key={id} p={byId(set, id)} size={14} />
        ))}
        <span>{plural(ids.length, 'platform')}</span>
      </>
    );
  }
  return (
    <>
      {ids.map((id, i) => (
        <span key={id} className="contents">
          {i > 0 && <Sep />}
          <Logo p={byId(set, id)} size={14} />
          <span>{byId(set, id).short}</span>
        </span>
      ))}
    </>
  );
}
const V = ({ children }: { children: ReactNode }) => <span className="text-muted">{children}</span>;

function LinkLines({ set, p }: { set: PlatformSet; p: PlatformData }) {
  const reads = (catalogItem(p.kind).reads ?? []) as DataKind[];
  const by: Partial<Record<DataKind, string[]>> = {};
  sharesOf(set, p.id).forEach((l) => (by[l.kind] ??= []).push(l.to));
  const li = 'flex flex-wrap items-center gap-x-1.5 text-[13px] leading-5';
  const B = ({ children }: { children: ReactNode }) => <b className="font-bold">{children}</b>;
  const lines: ReactNode[] = reads.map((k) => {
    const from = sourcesOf(set, p.id, k).map((s) => s.from);
    return from.length ? (
      <li key={`r-${k}`} className={li}>
        <V>Reads</V>
        <B>{kname(k)}</B>
        <V>from</V>
        <Chips set={set} ids={from} />
      </li>
    ) : (
      <li key={`r-${k}`} className={cn(li, 'text-warn')}>
        <Warning aria-hidden size={14} />
        &nbsp;No {lower(kname(k))} source
      </li>
    );
  });
  (Object.keys(by) as DataKind[]).forEach((k) =>
    lines.push(
      <li key={`s-${k}`} className={li}>
        <V>Shares</V>
        <B>{kname(k)}</B>
        <V>with</V>
        <Chips set={set} ids={by[k]!} />
      </li>,
    ),
  );
  if (!lines.length) {
    const can = shareable(p);
    lines.push(
      <li key="none" className={cn(li, 'text-muted')}>
        {can.length ? `Can share ${andList(can.map((k) => lower(kname(k))))}` : "Doesn't share data"}
      </li>,
    );
  }
  return <ul className="m-0 flex list-none flex-col gap-1 p-0">{lines}</ul>;
}

/** The sheet's list on a wide screen; the same text as one line on the phone rows. */
function linkWords(set: PlatformSet, p: PlatformData): ReactNode {
  const reads = (catalogItem(p.kind).reads ?? []) as DataKind[];
  const parts: ReactNode[] = reads.map((k) => {
    const ss = sourcesOf(set, p.id, k);
    return ss.length ? (
      <span key={`r-${k}`}>Reads {kname(k)} from {ss.length <= 2 ? andList(ss.map((s) => byId(set, s.from).short)) : plural(ss.length, 'platform')}</span>
    ) : (
      <span key={`r-${k}`} className="text-warn">
        No {lower(kname(k))} source
      </span>
    );
  });
  const sh = sharesOf(set, p.id);
  if (sh.length) parts.push(<span key="sh">Shares {andList([...new Set(sh.map((l) => kname(l.kind)))])} with {sh.length === 1 ? byId(set, sh[0].to).short : plural(sh.length, 'platform')}</span>);
  if (!parts.length) return "Doesn't share data";
  return parts.flatMap((x, i) => (i ? [' · ', x] : [x]));
}

const kpiText = (p: PlatformData) => (p.kpis.length ? p.kpis.map(([v, l]) => `${v} ${l}`).join(' · ') : noFigures(p));

const COLUMNS = 'minmax(0,300fr) minmax(0,168fr) minmax(0,244fr) 112px';
const header = (
  <ListHeader>
    <ListHeaderCell>Platform</ListHeaderCell>
    <ListHeaderCell>Now</ListHeaderCell>
    <ListHeaderCell>Data links</ListHeaderCell>
    <ListHeaderCell>
      <span className="sr-only">Actions</span>
    </ListHeaderCell>
  </ListHeader>
);

interface ListProps {
  set: PlatformSet;
  onFocusPlatform: (ids: string[] | null) => void;
  onAdd: () => void;
  onDisconnect: (p: PlatformData) => void;
}

/** "All platforms": problem-first rows, then "Add another platform". */
function PlatformList({ set, onFocusPlatform, onAdd, onDisconnect }: ListProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const kinds = addableKinds().length;
  return (
    <List
      as="table"
      aria-label="All platforms"
      columns={COLUMNS}
      stackBelow="sheet760"
      cursorId={cursor}
      onCursorChange={(id) => {
        setCursor(id);
        onFocusPlatform([id]);
        // j and k land on the platform's name link (so Enter opens it), as in the workshop page
        document.querySelector<HTMLElement>(`[data-row-id="${id}"] a`)?.focus({ preventScroll: true });
      }}
      className="mt-5"
    >
      {header}
      {ordered(set).map((p) => {
        const h = health(set, p);
        return (
          <ListRow
            key={p.id}
            rowId={p.id}
            label={p.name}
            onActivate={() => go({ to: 'platform', id: p.id })}
            data-hl={p.id}
          >
            <ListCell kind="lead" className="flex items-start gap-3 [overflow-wrap:normal]">
              <Logo p={p} size={32} className="mt-0.5" />
              <div className="flex min-w-0 flex-col">
                <a
                  href={href(p.id)}
                  onClick={nav({ to: 'platform', id: p.id })}
                  className="rounded-chip text-left text-[15px] font-semibold leading-[22px] text-text hover:underline hover:underline-offset-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {p.name}
                </a>
                <span className="text-ui text-muted">
                  {kindName(p.kind)}
                  {p.place ? ` · ${p.place}` : ''}
                </span>
                <Hl h={h} className="mt-2" />
              </div>
            </ListCell>
            <ListCell className="[overflow-wrap:normal]">
              <ul className="m-0 list-none p-0 @max-[760px]/sheet:flex @max-[760px]/sheet:flex-wrap @max-[760px]/sheet:gap-x-3.5">
                {p.kpis.length ? (
                  p.kpis.map(([v, l], i) => (
                    <li key={l} className={cn('text-[13px] leading-5', i > 0 && 'mt-1')}>
                      <b className="font-medium tabular-nums">{v}</b> {l}
                    </li>
                  ))
                ) : (
                  <li className="text-[13px] leading-5 text-muted">{noFigures(p)}</li>
                )}
              </ul>
            </ListCell>
            <ListCell className="[overflow-wrap:normal]">
              <LinkLines set={set} p={p} />
            </ListCell>
            <ListCell kind="actions" className="[overflow-wrap:normal]">
              {setupNeeded(set, p) ? (
                <Button variant="primary" className="h-[30px] px-2.5 max-[640px]:h-9" onClick={() => go({ to: 'platform', id: p.id, tab: 'connections' })}>
                  Finish setup
                </Button>
              ) : hasApp(p.kind) ? (
                <Button variant="secondary" leftIcon={ArrowSquareOut} className="h-[30px] px-2.5 max-[640px]:h-9 max-[960px]:[&_svg]:hidden" onClick={() => open(p)}>
                  Open
                </Button>
              ) : (
                <span className="whitespace-nowrap px-1.5 text-small leading-5 text-muted">No app yet</span>
              )}
              <RowMenu p={p} onDisconnect={onDisconnect} />
            </ListCell>
          </ListRow>
        );
      })}
      <ListRow onActivate={onAdd} className="items-center py-0">
        <ListCell kind="lead" className="col-span-full">
          <button type="button" onClick={onAdd} className="flex min-h-[52px] w-full items-center gap-2 text-left text-[13px] leading-5 text-muted hover:[&>svg:last-child]:text-accent">
            <PlusSquare aria-hidden size={16} className="shrink-0 text-accent" />
            <b className="font-medium text-accent">Add another platform</b>
            <span>· {plural(kinds, 'kind')}</span>
            <ArrowRight aria-hidden size={13} className="shrink-0 text-muted" />
          </button>
        </ListCell>
      </ListRow>
    </List>
  );
}

const sk = (cls: string) => <Skeleton className={cls} />;

function LoadingList() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Loading your platforms
      </p>
      <List as="table" aria-hidden="true" columns={COLUMNS} stackBelow="sheet760" shortcuts={false} className="mt-5">
        {header}
        {[0, 1].map((i) => (
          <ListRow key={i}>
            <ListCell kind="lead" className="flex items-start gap-3 [overflow-wrap:normal]">
              <Skeleton variant="rect" className="size-8 shrink-0" />
              <div className="min-w-0 flex-1">
                {sk('mt-[3px] h-[15px] w-[70%]')}
                {sk('mt-2 h-[11px] w-[44%]')}
              </div>
            </ListCell>
            <ListCell>
              {[0, 1, 2].map((j) => (
                <span key={j} className="block">
                  {sk('mb-2 mt-1 h-3 w-[80%]')}
                </span>
              ))}
            </ListCell>
            <ListCell>{sk('mt-1 h-3 w-[90%]')}</ListCell>
            <ListCell kind="actions" />
          </ListRow>
        ))}
      </List>
    </div>
  );
}

/* ---------- the place column ---------- */

const GHEAD = 'flex items-baseline gap-2 px-3 pb-1.5 pt-2 text-small text-muted max-[640px]:px-pad max-[640px]:pt-3';
const LROW = 'relative block w-full rounded-card border border-transparent p-3 text-left transition-colors duration-hover hover:bg-frame-hover max-[640px]:min-h-11 max-[640px]:rounded-none max-[640px]:border-0 max-[640px]:px-pad';
const LR1 = 'flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ui font-semibold';
const LR2 = 'mt-1 flex items-center gap-2 text-ui text-muted';
const GHEAD_B = 'text-ui font-semibold leading-5 text-text';
const mt = (first: boolean) => (first ? '' : 'mt-2 max-[640px]:mt-0 max-[640px]:border-t max-[640px]:border-rule');

interface PlaceProps {
  set: PlatformSet;
  state: PlatformsState;
  phone: boolean;
  focusIds: string[] | null;
  onFocusPlatform: (ids: string[] | null) => void;
  onAdd: (pick?: string) => void;
  onRetry: () => void;
  onAsk: () => void;
}

function Place({ set, state, phone, focusIds, onFocusPlatform, onAdd, onAsk }: PlaceProps) {
  const live = state === 'live';
  const [mapHover, setMapHover] = useState<string | null>(null);
  const ids = focusIds ?? (mapHover ? [mapHover] : null);
  const need = set.platforms.filter((p) => setupNeeded(set, p));
  const idle = idleList(set);
  const slots: TownMapSlot[] =
    state === 'error'
      ? set.slots.map(() => null)
      : set.slots.map((id) => {
          const p = id ? set.platforms.find((x) => x.id === id) : undefined;
          if (!p) return null;
          const h = health(set, p);
          return {
            id: p.id,
            name: p.name,
            shortName: p.short,
            kind: kindName(p.kind),
            mapType: ({ inventory: 'warehouse', repair_shop: 'service', pos: 'store' } as const)[p.kind as 'inventory'],
            status: h.st === 'SETUP' ? 'DEGRADED' : h.st === 'NEW' ? 'ACTIVE' : p.status,
            sub: `${kindName(p.kind)} · ${lower(h.text)}`,
            subAlways: h.st === 'NEW',
            color: p.color,
            logo: p.logo,
            initials: p.mono,
          };
        });
  const links: TownMapLink[] = live ? set.links.map((l) => ({ from: l.from, to: l.to, status: l.road })) : [];
  const cap =
    state === 'loading' ? (
      <span aria-hidden className="inline-block h-3 w-[150px] rounded-[3px] bg-skeleton align-middle" />
    ) : state === 'error' ? (
      <span>No data</span>
    ) : set.platforms.length ? (
      <span>
        <b className="font-semibold text-text">{plural(set.platforms.length, 'platform')}</b> · {mapCaption(set).split(' · ')[1]}
      </span>
    ) : (
      <span>No platforms yet</span>
    );
  const stateBlock = phone && live && set.platforms.length ? (
    <div className="pb-2 pt-1">
      {ordered(set).map((p, i) => (
        <a
          key={p.id}
          href={href(p.id)}
          onClick={nav({ to: 'platform', id: p.id })}
          data-hl={p.id}
          className={cn('grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 px-pad py-3 text-left hover:bg-raised', i > 0 && 'border-t border-rule')}
        >
          <Logo p={p} size={32} className="row-span-3 mt-0.5" />
          <span className="text-[15px] font-semibold leading-[22px]">{p.name}</span>
          <Hl h={health(set, p)} className="col-start-3 row-start-1 self-center" />
          <span className="col-span-2 col-start-2 text-[13px] leading-[19px] text-muted">
            {kindName(p.kind)}
            {p.place ? ` · ${p.place}` : ''}
          </span>
          <span className="col-span-2 col-start-2 text-[13px] leading-[19px] tabular-nums">{kpiText(p)}</span>
          <span className="col-span-2 col-start-2 text-[13px] leading-[19px] text-muted">{linkWords(set, p)}</span>
        </a>
      ))}
    </div>
  ) : null;
  let rowIndex = 0;
  return (
    <div className="flex flex-col">
      <TownMap
        platforms={slots}
        links={links}
        loading={state === 'loading'}
        error={state === 'error'}
        caption={cap}
        errorNotice={false}
        fadeOthers
        platformLabel={(p) => {
          const q = byId(set, p.id);
          return `${q.name}, ${kindName(q.kind)}, ${health(set, q).text}`;
        }}
        label={`Map of ${plural(set.platforms.length, 'platform')} and their data links`}
        dimOthers={false}
        focus={live && ids?.length === 1 ? ids[0] : null}
        highlight={live && ids && ids.length > 1 ? ids : null}
        onAddPlatform={state === 'live' ? () => onAdd() : undefined}
        onSelect={(id) => {
          if (live && id) go({ to: 'platform', id });
        }}
        onHover={setMapHover}
      />
      <div className="flex flex-col pb-2 pl-3 pr-1 pt-3 max-[640px]:bg-surface max-[640px]:px-pad max-[640px]:pb-3 max-[640px]:pt-4">
        <div className="flex items-center gap-2.5">
          <h1 className="m-0 text-title text-text">Platforms</h1>
          {(state === 'live') && (
            <Button variant="text" leftIcon={Plus} onClick={() => onAdd()} className="ml-auto max-[640px]:h-10">
              Add
            </Button>
          )}
        </div>
        <div className="mt-1.5 flex items-start gap-2 text-body">
          <LedaMark size={16} decorative className="mt-0.5 shrink-0" />
          {state === 'loading' ? (
            <span className="flex-1">{sk('mt-[3px] h-[13px] w-[88%]')}</span>
          ) : state === 'error' ? (
            <span>Couldn't load your platforms.</span>
          ) : (
            <span>{headline(set)}</span>
          )}
        </div>
        {phone && (
          <div className="relative mt-3">
            <AskLedaBar variant="field" scope="your platforms" onOpen={onAsk} shortcuts={false} />
          </div>
        )}
      </div>
      <div className="pb-3 pt-1 max-[640px]:bg-surface max-[640px]:pb-4 max-[640px]:pt-0" {...hoverProps(onFocusPlatform)}>
        {stateBlock}
        {state === 'loading' && (
          <div aria-busy="true">
            <p role="status" className="sr-only">
              Loading data links
            </p>
            <div className={GHEAD}>
              <b className={GHEAD_B}>Data links</b>
            </div>
            {[0, 1].map((i) => (
              <div key={i} aria-hidden="true" className={cn(LROW, mt(i === 0))}>
                {sk('h-[13px] w-[70%]')}
                {sk('mt-[7px] h-[11px] w-[46%]')}
              </div>
            ))}
          </div>
        )}
        {state === 'error' && (
          <>
            <div className={GHEAD}>
              <b className={GHEAD_B}>Data links</b>
            </div>
            <p className="mx-3 rounded-card border border-dashed border-control px-3 py-2.5 text-ui text-muted max-[640px]:mx-pad">No data. Try again in the main panel.</p>
          </>
        )}
        {live && (
          <>
            <div className={GHEAD}>
              <h2 className="m-0 flex items-baseline gap-2">
                <b className={GHEAD_B}>Data links</b>
                <span className="tabular-nums">{set.links.length}</span>
              </h2>
            </div>
            {need.map((p) => (
              <div
                key={`need-${p.id}`}
                data-hl={p.id}
                className={cn(LROW, mt(rowIndex++ === 0), 'border-dashed border-control pr-[132px] max-[640px]:border-0 max-[640px]:pr-[140px]')}
              >
                <span className={LR1}>
                  <Logo p={p} />
                  <span>{p.name}</span>
                </span>
                <span className={cn(LR2, 'text-warn')}>
                  <Warning aria-hidden size={13} />
                  No {lower(missing(set, p).map(kname).join(', '))} source yet
                </span>
                <Button variant="secondary" className="absolute right-2.5 top-1/2 h-7 -translate-y-1/2 px-2.5 text-small max-[640px]:right-pad max-[640px]:h-9" onClick={() => go({ to: 'platform', id: p.id, tab: 'connections' })}>
                  Connect data
                </Button>
              </div>
            ))}
            {set.links.map((l) => (
              <LinkRow key={`${l.from}|${l.to}|${l.kind}`} set={set} l={l} first={rowIndex++ === 0} />
            ))}
            {!set.links.length && !need.length && (
              <p className="mx-3 rounded-card border border-dashed border-control px-3 py-2.5 text-ui text-muted max-[640px]:mx-pad">{set.platforms.length ? 'No platform reads data from another yet.' : 'Add a platform to start.'}</p>
            )}
            {idle.length > 0 && (
              <>
                <div className={cn(GHEAD, 'mt-2.5')}>
                  <h2 className="m-0 flex items-baseline gap-2">
                    <b className={GHEAD_B}>Not shared yet</b>
                    <span className="tabular-nums">{idle.length}</span>
                  </h2>
                </div>
                {idle.map((x, i) => (
                  <div
                    key={`idle-${x.platform.id}|${x.kind}`}
                    data-hl={x.platform.id}
                    className={cn(LROW, mt(i === 0), 'pr-[76px] max-[640px]:pr-[84px]')}
                  >
                    <span className={LR1}>
                      <Logo p={x.platform} />
                      <span>{x.platform.name}</span>
                      <span className="font-normal text-faint">·</span>
                      <span>{kname(x.kind)}</span>
                    </span>
                    <span className={LR2}>{andList(x.readers.map((key) => kindName(key)))} can read it</span>
                    <Button variant="text" leftIcon={Plus} className="absolute right-2.5 top-1/2 h-7 -translate-y-1/2 px-2 text-small max-[640px]:right-pad max-[640px]:h-9" onClick={() => onAdd(x.readers[0])}>
                      Add
                    </Button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LinkRow({ set, l, first }: { set: PlatformSet; l: DataLink; first: boolean }) {
  const from = byId(set, l.from);
  const to = byId(set, l.to);
  return (
    <a
      href={`#${to.id}-connections`}
      onClick={nav({ to: 'platform', id: to.id, tab: 'connections' })}
      data-hl={`${l.from},${l.to}`}
      className={cn(LROW, mt(first), 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent')}
    >
      <span className={LR1}>
        <Logo p={from} />
        <span>{from.name}</span>
        <ArrowRight aria-hidden size={13} className="text-faint" />
        <Logo p={to} />
        <span>{to.name}</span>
      </span>
      <span className={LR2}>
        <span aria-hidden className={cn('h-1 w-3.5 shrink-0 rounded-sm', l.road === 'slow' ? 'bg-warn-dot' : 'bg-accent')} />
        <b className="font-medium text-text">{kname(l.kind)}</b>
        <span>
          {lower(kshares(l.kind))}
          {l.road === 'slow' ? ' · slow' : ''}
        </span>
      </span>
    </a>
  );
}

/* ---------- Leda: read-only answers about platforms (platforms-core.js ledaAsks / ledaCommands / ledaReply) ---------- */

const ADD_CMD = 'Add a POS for the parts counter';
const asks = (set: PlatformSet) => [
  {
    q: 'What shares data with what?',
    run: () => {
      const need = set.platforms.filter((p) => setupNeeded(set, p));
      const idle = idleList(set);
      const note = set.links.length
        ? [need.length ? `${andList(need.map((p) => p.name))} still ${need.length === 1 ? 'needs' : 'need'} a source.` : '', idle.length ? `Not shared yet: ${andList(idle.slice(0, 2).map((x) => `${lower(kname(x.kind))} from ${x.platform.name}`))}.` : '']
            .filter(Boolean)
            .join(' ') || `${plural(set.links.length, 'data link')}, all in use.`
        : null;
      return {
        caption: 'Data links',
        columns: ['From', 'Shares', 'To'],
        rows: set.links.map((l) => [byId(set, l.from).name, kname(l.kind), byId(set, l.to).name]),
        empty: 'No data links yet.',
        note,
        next: ['Is everything running?'],
      };
    },
  },
  {
    q: 'Is everything running?',
    run: () => ({
      caption: 'Platform status',
      columns: ['Platform', 'Status', 'Last synced'],
      rows: ordered(set).map((p) => [p.name, health(set, p).text, '—']),
      empty: 'No platforms yet.',
      note: set.platforms.length ? healthLine(set) : null,
      next: ['What shares data with what?'],
    }),
  },
];
const commands = (set: PlatformSet) => {
  const src = set.platforms.find((p) => sharesOf(set, p.id).length) ?? set.platforms[0];
  return [
    { q: ADD_CMD, meta: 'opens Add a platform, you confirm', refusal: false as boolean, pid: '' },
    ...(src ? [{ q: `Disconnect ${src.name}`, meta: "Leda can't change platforms", refusal: true as boolean, pid: src.id }] : []),
  ];
};
const suggestions = (set: PlatformSet) => [...asks(set).map((x) => x.q), ...commands(set).map((x) => x.q)];
const matchQ = <T extends { q: string }>(list: T[], q: string) => {
  const t = q.toLowerCase().trim();
  return list.find((x) => x.q.toLowerCase() === t) ?? (t.length > 4 ? list.find((x) => x.q.toLowerCase().includes(t)) : undefined) ?? null;
};
const chipsOf = (qs: string[]): ChatChip[] => qs.map((q) => ({ id: q, label: q }));

/** Leda's reply to `q` as chat blocks, and what to do once it has streamed in. */
function ledaReply(set: PlatformSet, q: string): { blocks: ChatBlock[]; after?: 'add' } {
  const a = matchQ(asks(set), q);
  const c = a ? null : matchQ(commands(set), q);
  if (c?.refusal) {
    const p = byId(set, c.pid);
    return {
      blocks: [
        { type: 'refusal', text: "I can't add, rename or disconnect platforms, or change data links. You can, on the platform's page.", actions: p ? [{ id: 'go', label: `Go to ${p.name}`, href: `#${p.id}` }] : undefined },
      ],
    };
  }
  if (c) return { blocks: [{ type: 'text', text: "I've opened Add a platform with a POS for the parts counter filled in. Check the name, then add it there. I can't add it for you.", stream: true }], after: 'add' };
  if (!a) {
    return { blocks: [{ type: 'text', text: "Sorry, I can't answer that in this prototype.", stream: true }, { type: 'text', text: 'These ones work here:' }, { type: 'chips', chips: chipsOf(suggestions(set)) }] };
  }
  const r = a.run();
  const blocks: ChatBlock[] = [];
  if (r.note) blocks.push({ type: 'text', text: r.note, stream: true });
  blocks.push(
    r.rows.length
      ? { type: 'table', caption: r.caption, columns: r.columns.map((label, i) => ({ key: String(i), label })), rows: r.rows.map((row) => Object.fromEntries(row.map((v, i) => [String(i), v]))) }
      : { type: 'text', text: r.empty },
  );
  blocks.push({ type: 'meta', text: 'Read from Platforms' });
  if (r.next.length) blocks.push({ type: 'chips', chips: chipsOf(r.next) });
  return { blocks };
}

let seq = 100;

/** The Portal Platforms page (RDY-256, exact copy RDY-360) in the real PlatformShell. */
export function PlatformsPage({ set: setKey = 'duo', state: initial = 'live', add = null, start = null }: PlatformsPageProps) {
  const [work, setWork] = useState<PlatformSet>(() => structuredClone(sets[setKey]));
  const set = work;
  const [state, setState] = useState<PlatformsState>(initial);
  const [focusIds, setFocusIds] = useState<string[] | null>(null);
  const [market, setMarket] = useState<{ pick: string | null; fromLeda: boolean } | null>(add ? { pick: add.pick ?? null, fromLeda: !!add.fromLeda } : null);
  const [palette, setPalette] = useState(!!start?.palette);
  const [disconnecting, setDisconnectingState] = useState<PlatformData | null>(() => {
    const p = start?.disconnect ? sets[setKey].platforms.find((x) => x.id === start.disconnect) : undefined;
    return p && !sharesOf(sets[setKey], p.id).length ? p : null;
  });
  const [blocked, setBlocked] = useState<PlatformData | null>(() => {
    const p = start?.disconnect ? sets[setKey].platforms.find((x) => x.id === start.disconnect) : undefined;
    return p && sharesOf(sets[setKey], p.id).length ? p : null;
  });
  const [chat, setChat] = useState(!!start?.ask);
  const [messages, setMessages] = usePersistedChat<ChatMessageData[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const opener = useRef<HTMLElement | null>(null);
  const chatOpen = useRef(false);
  chatOpen.current = chat;
  /** Where focus goes when the palette closes: the composer once Leda's panel is open, else where it was. */
  const returnRef = useRef({ get current() { return chatOpen.current ? document.querySelector<HTMLElement>('[data-chat-composer]') : opener.current; } }).current as { current: HTMLElement | null };
  const lastDisconnect = useRef('');
  const setDisconnecting = (p: PlatformData | null) => {
    if (p) lastDisconnect.current = p.name;
    if (p && sharesOf(set, p.id).length) setBlocked(p);
    else setDisconnectingState(p);
  };
  const phone = useMatchMedia(PHONE);
  const sheetBody = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const prev = useRef(state);

  // After a failed load is retried the Try again button is gone: focus goes to the list heading, only if focus was lost.
  useLayoutEffect(() => {
    if (prev.current === 'error' && state === 'live') focusIfLost(sheetBody.current, heading.current, { preventScroll: true });
    prev.current = state;
  }, [state]);

  const addPlatform = (pick?: string) => {
    if (state === 'loading') return void toast({ description: 'Your platforms are still loading.' });
    if (state === 'error') return void toast({ description: "Your platforms didn't load. Try again first." });
    setMarket({ pick: pick ?? null, fromLeda: false });
  };
  const openChat = () => {
    opener.current = document.activeElement as HTMLElement | null;
    setPalette(false);
    setChat(true);
  };
  const send = useCallback(
    (q: string) => {
      if (busy) return;
      const id = `m${++seq}`;
      setText('');
      setBusy(true);
      setMessages((m) => [
        ...m,
        { id, from: 'owner', name: set.owner.name, time: NOW, scope: 'About your platforms', blocks: [{ type: 'text', text: q }] },
        { id: `${id}l`, from: 'leda', name: 'Leda', time: NOW, thinking: true, blocks: [] },
      ]);
      window.setTimeout(() => {
        const r = ledaReply(set, q);
        setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: r.blocks } : x)));
        setBusy(false);
        if (r.after === 'add') window.setTimeout(() => setMarket({ pick: 'pos', fromLeda: true }), 900);
      }, 1000);
    },
    [busy, set, setMessages],
  );
  const ask = (q: string) => {
    if (!q.trim()) return;
    openChat();
    send(q);
  };
  // a story that opens on Leda's answer: start from an empty thread, then ask
  useEffect(() => {
    if (!start?.ask) return;
    setMessages(() => []);
    send(start.ask);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const live = state === 'live';
  const empty = live && set.platforms.length === 0;
  const retry = () => {
    setState('live');
    toast({ description: 'Platforms loaded.' });
  };
  const disconnect = (p: PlatformData) =>
    setWork((w) => ({
      ...w,
      platforms: w.platforms.filter((x) => x.id !== p.id),
      links: w.links.filter((l) => l.from !== p.id && l.to !== p.id),
      slots: w.slots.map((s) => (s === p.id ? null : s)),
    }));

  const sheetHead = (title: string, sub: ReactNode, btn: boolean) => (
    <div className="flex items-start gap-4 max-[640px]:flex-col max-[640px]:gap-2.5">
      <div>
        <h2 ref={heading} tabIndex={-1} className="m-0 text-case text-text [outline-style:none] max-[640px]:text-header">
          {title}
        </h2>
        {sub ? <p className="m-0 mt-0.5 text-body text-muted">{sub}</p> : null}
      </div>
      {btn && (
        <Button variant="primary" leftIcon={Plus} onClick={() => addPlatform()} className="ml-auto shrink-0 max-[640px]:ml-0">
          Add a platform
        </Button>
      )}
    </div>
  );

  const sheetContent =
    state === 'loading' ? (
      <>
        {sheetHead('All platforms', <span className="inline-block h-[13px] w-[220px] rounded-[3px] bg-skeleton align-middle" />, false)}
        <LoadingList />
      </>
    ) : state === 'error' ? (
      <>
        {sheetHead('All platforms', '', false)}
        <div role="alert" className="mt-5 flex items-center gap-2.5 rounded-card border border-dashed border-control px-3.5 py-3 text-body">
          <WarningCircle aria-hidden size={18} className="text-bad" />
          <span>Couldn't load your platforms. Last loaded {LAST_LOADED}.</span>
          <Button variant="secondary" className="ml-auto" onClick={retry}>
            Try again
          </Button>
        </div>
      </>
    ) : empty ? (
      <>
        {sheetHead('No platforms yet', '', false)}
        <div className="mt-5 rounded-card bg-raised px-5 pb-5 pt-[18px]">
          <h3 className="m-0 text-[16px] font-semibold leading-[22px]">Add your first business</h3>
          <p className="m-0 mt-0.5 text-body text-muted">A repair shop, a stockroom, a point of sale or an online store. Pick one, then name it and set it up.</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <Button variant="primary" leftIcon={SquaresFour} onClick={() => addPlatform()} className="max-[640px]:h-11 max-[640px]:flex-[1_1_100%]">
              Browse platforms
            </Button>
            <span className="text-[13px] text-muted">{plural(addableKinds().length, 'kind')} to choose from</span>
          </div>
        </div>
      </>
    ) : (
      <>
        {sheetHead('All platforms', healthLine(set), true)}
        <PlatformList set={set} onFocusPlatform={setFocusIds} onAdd={() => addPlatform()} onDisconnect={setDisconnecting} />
      </>
    );

  const statusPlatforms: StatusBarPlatform[] = ordered(set).map((p) => {
    const h = health(set, p);
    return { id: p.id, name: p.short, initials: p.mono, color: p.color, logoSrc: p.logo, health: h.st === 'ACTIVE' ? 'ok' : h.st === 'OFFLINE' ? 'bad' : h.st === 'NEW' ? 'accent' : 'warn', healthText: h.st === 'ACTIVE' ? undefined : h.word, href: href(p.id) };
  });

  const askBar = <AskLedaBar variant="bar" scope="your platforms" paused={palette || chat} onOpen={() => { opener.current = document.activeElement as HTMLElement | null; setPalette(true); }} />;
  const cmds = commands(set);
  const noTouch = typeof window === 'undefined' || !window.matchMedia?.('(hover: none)').matches;
  const paletteGroups: CommandPaletteGroup[] = [
    { id: 'ask', label: 'Ask Leda', items: asks(set).map((x) => ({ id: `q:${x.q}`, label: x.q, icon: Table })) },
    {
      id: 'do',
      label: 'Tell Leda to do',
      items: cmds.map((c) => ({ id: `q:${c.q}`, label: c.q, icon: c.refusal ? Prohibit : PencilSimple, meta: c.meta, keepOpen: false })),
    },
    {
      id: 'go',
      label: 'Go to',
      items: [
        { id: 'all', label: 'All platforms', icon: SquaresFour, meta: plural(set.platforms.length, 'platform') },
        ...set.platforms.map((p) => ({ id: p.id, label: p.name, icon: catalogItem(p.kind).icon, meta: `${kindName(p.kind)} · ${health(set, p).text}` })),
        { id: 'add', label: 'Add a platform', icon: PlusSquare, meta: `${addableKinds().length} kinds` },
        { id: 'home', label: 'Home', icon: House, meta: 'Needs you' },
      ],
    },
    ...(phone || !noTouch
      ? []
      : [
          {
            id: 'states',
            label: 'Prototype states',
            items: [
              { id: 's:prototypes-platforms--loading', label: 'Loading', icon: CircleNotch },
              { id: 's:prototypes-platforms--error-state', label: "Platforms don't load", icon: WarningCircle },
              { id: 's:prototypes-platforms--empty', label: 'No platforms yet', icon: Plant },
              { id: 's:prototypes-platforms--many', label: '8 platforms (scale test)', icon: SquaresFour },
              { id: 's:prototypes-platforms--default', label: 'Start over (forget changes)', icon: ArrowCounterClockwise },
            ],
          },
        ]),
  ];

  const owned = (key: string) => set.platforms.filter((p) => p.kind === key).length;

  return (
    <>
      <PortalFrame
        current="platforms"
        pageName={state === 'live' ? plural(set.platforms.length, 'platform') : 'Platforms'}
        teamCount={0}
        onAddPlatform={() => addPlatform()}
        onNavigate={go}
        placeLabel="Your platforms"
        sheetLabel="All platforms"
        heading={null}
        account={{ name: set.owner.name, email: set.owner.email, role: set.owner.role, initials: set.owner.initials }}
        place={<Place set={set} state={state} phone={phone} focusIds={focusIds} onFocusPlatform={setFocusIds} onAdd={addPlatform} onRetry={retry} onAsk={() => setPalette(true)} />}
        sheetBar={
          <SheetBar actions={askBar} wrapChildren={false}>
            <Breadcrumbs variant="where" items={[{ label: 'All platforms', icon: SquaresFour }]} />
          </SheetBar>
        }
        status={
          <StatusBar
            ledaFirst
            platforms={live ? statusPlatforms : []}
            note={state === 'error' ? "Platforms didn't load" : state === 'loading' ? 'Loading platforms' : empty ? 'No platforms yet' : undefined}
            summary={
              live && set.platforms.length > 0 && set.platforms.length <= 3 ? (
                <>
                  <span className="tabular-nums">{plural(set.platforms.length, 'platform')}</span>
                  {set.platforms.every((p) => health(set, p).st === 'ACTIVE') ? <span>· all running</span> : null}
                </>
              ) : null
            }
            people={{ count: set.people }}
            leda={{ used: set.usedRequests, max: USAGE.limit, daysLeft: `${USAGE.daysLeft} days left` }}
            plan={set.plan}
            updatedAt={set.platforms.length <= 3 ? '9:12 AM' : undefined}
          />
        }
      >
        {!phone && (
          <div ref={sheetBody} className="px-pad pb-8 pt-5" {...hoverProps(setFocusIds)}>
            {sheetContent}
          </div>
        )}
      </PortalFrame>
      <Toaster />
      <CommandPalette
        open={palette}
        onOpenChange={setPalette}
        groups={paletteGroups}
        placeholder="Ask Leda about your platforms"
        onAsk={ask}
        query={query}
        onQueryChange={setQuery}
        conversationMessages={messages.length}
        onOpenConversation={openChat}
        returnFocusRef={returnRef}
        onSelect={(item) => {
          if (item.id.startsWith('q:')) ask(item.id.slice(2));
          else if (item.id.startsWith('s:')) goToStory(item.id.slice(2));
          else if (item.id === 'add') addPlatform();
          else if (item.id === 'home') go({ to: 'home' });
          else if (item.id === 'all') go({ to: 'platforms' });
          else go({ to: 'platform', id: item.id });
        }}
      />
      {chat && (
        <Chat onClose={() => setChat(false)} returnFocusTo={opener}>
          <ChatHeader busy={busy} empty={messages.length === 0} onNewConversation={() => setMessages([])} onClose={() => setChat(false)} />
          {messages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ChatEmpty scope="your platforms" chips={chipsOf(suggestions(set))} onPick={(c) => send(c.label)} />
            </div>
          ) : (
            <ChatThread>
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} onChip={(c) => send(c.label)} onAction={(a) => { if (a.href) go(a.href === '#home' ? { to: 'home' } : { to: 'platform', id: a.href.replace(/^#/, ''), tab: 'general' }); }} />
              ))}
            </ChatThread>
          )}
          <ChatComposer value={text} onChange={setText} onSend={send} busy={busy} scope="About your platforms" />
        </Chat>
      )}
      <Marketplace
        open={!!market}
        onOpenChange={(o) => !o && setMarket(null)}
        items={catalog.map((i) => ({ ...i, owned: owned(i.key) || undefined }))}
        defaultPicked={market?.pick ?? null}
        ledaNote={
          market?.fromLeda ? (
            <LedaNote>Picked from &ldquo;Add a POS for the parts counter&rdquo;. Nothing is added until you press Install and name it.</LedaNote>
          ) : undefined
        }
        onInstall={(item) => {
          setMarket(null);
          toast({ description: `Opening setup for ${item.name}.` });
        }}
      />
      <ConfirmDialog
        open={!!disconnecting}
        onOpenChange={(o) => !o && setDisconnectingState(null)}
        title={`Disconnect ${disconnecting?.name ?? ''}?`}
        description="This removes it and its data links. This can't be undone."
        name={disconnecting?.name}
        iconNode={disconnecting ? <Logo p={disconnecting} /> : undefined}
        confirmLabel="Disconnect"
        onCloseAutoFocus={(e) => {
          // The dialog was opened from a menu item that is gone: put focus back on that row's menu button, only if it was lost.
          e.preventDefault();
          const name = disconnecting?.name ?? lastDisconnect.current;
          focusIfLost(null, document.querySelector<HTMLElement>(`[aria-label="More for ${name}"]`));
        }}
        tone="danger"
        onCancel={() => setDisconnectingState(null)}
        onConfirm={() => {
          const p = disconnecting!;
          setDisconnectingState(null);
          disconnect(p);
          toast({ description: `${p.name} disconnected.` });
        }}
      />
      <BlockedDisconnect set={set} p={blocked} onClose={() => setBlocked(null)} />
    </>
  );
}

/** Disconnect is blocked while the platform still shares data: say who reads it and go to the connections. */
function BlockedDisconnect({ set, p, onClose }: { set: PlatformSet; p: PlatformData | null; onClose: () => void }) {
  const sh = p ? sharesOf(set, p.id) : [];
  const who = [...new Set(sh.map((l) => byId(set, l.to).name))];
  const what = [...new Set(sh.map((l) => kname(l.kind)))];
  return (
    <Modal open={!!p} onOpenChange={(o) => !o && onClose()} size="confirm" hideClose className="w-[min(440px,calc(100vw-32px))]">
      {p && (
        <div className="px-[22px] py-5">
          <Modal.Header className="border-b-0 p-0" titleClassName="flex items-center gap-2.5 text-[16px] font-semibold leading-[22px]">
            <Logo p={p} size={20} />
            {p.name} still shares data
          </Modal.Header>
          <p className="m-0 mt-2 text-body text-muted">
            <b className="font-medium text-text">{andList(who)}</b> {who.length === 1 ? 'reads' : 'read'} its {lower(andList(what))}. Remove {sh.length === 1 ? 'that link' : 'those links'} first, then disconnect it.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" actionBar className="max-[640px]:flex-auto" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              leftIcon={Graph}
              actionBar
              className="max-[640px]:flex-auto"
              onClick={() => {
                onClose();
                go({ to: 'platform', id: sh[0].from, tab: 'connections' });
              }}
            >
              View connections
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
