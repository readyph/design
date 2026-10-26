import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpen, DotsThree, House, Plugs, Plus, PlusSquare, Users, Warning } from '@phosphor-icons/react';
import { AccountMenu } from '../components/AccountMenu';
import { AskLedaBar } from '../components/AskLedaBar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { CommandPalette, type CommandPaletteGroup } from '../components/CommandPalette';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorBlock } from '../components/ErrorBlock';
import { IconButton } from '../components/IconButton';
import { IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from '../components/IconRail';
import { LedaMark } from '../components/Leda';
import { LedaNote } from '../components/LedaNote';
import { List, ListCell, ListHeader, ListHeaderCell, ListMetric, ListMetrics, ListRow } from '../components/List';
import { ListGroup, ListGroups } from '../components/ListGroup';
import { Marketplace } from '../components/Marketplace';
import { sampleCatalog } from '../components/Marketplace.sample';
import { Menu } from '../components/Menu';
import { PlatformLogo } from '../components/PlatformLogo';
import { PlatformShell } from '../components/PlatformShell';
import { SheetBar } from '../components/SheetBar';
import { Skeleton } from '../components/Skeleton';
import { StatusBar, type StatusBarPlatform } from '../components/StatusBar';
import { StatusDot } from '../components/StatusDot';
import { TownMap } from '../components/TownMap';
import { Toaster } from '../components/toast/Toaster';
import { toast } from '../components/toast/toastStore';
import { focusIfLost } from '../utils/focusIfLost';
import { useMatchMedia } from '../utils/useMatchMedia';
import {
  andList,
  byId,
  dataKindName,
  headline,
  initialsOf,
  healthLine,
  healthOf,
  hasApp,
  idleShares,
  kindName,
  linkLines,
  mapLinks,
  mapPlatforms,
  noFigures,
  ordered,
  plural,
  roadStatusWord,
  sets,
  setupNeeded,
  missing,
  lowerKind,
  type DataLink,
  type PlatformData,
  type PlatformSet,
} from './Platforms.data';

export type PlatformsState = 'live' | 'loading' | 'error';
export type PlatformsSetKey = 'duo' | 'few' | 'many' | 'empty';

export interface PlatformsPageProps {
  set?: PlatformsSetKey;
  state?: PlatformsState;
  /** Marketplace open on first render (`?add=1`, or Leda's "Add a POS for the parts counter"). */
  add?: { pick?: string; fromLeda?: boolean } | null;
}

/** One platform's logo: its identity colour by position, and collision-safe initials across the set. */
function Logo({ set, p, size = 16, className }: { set: PlatformSet; p: PlatformData; size?: 16 | 24 | 32; className?: string }) {
  return <PlatformLogo name={p.name} size={size} decorative index={set.platforms.indexOf(p) + 1} initials={initialsOf(set)[p.id]} className={className} />;
}

const PHONE = '(max-width: 640px)';
const open = (name: string) => toast({ description: `Opening ${name}.` });

/** The platform's own kebab menu: Edit details, Connect data, Disconnect. */
function RowMenu({ p, onDisconnect }: { p: PlatformData; onDisconnect: (p: PlatformData) => void }) {
  return (
    <Menu
      trigger={<IconButton icon={DotsThree} label={`More for ${p.name}`} />}
      items={[
        { label: 'Edit details', onSelect: () => open(`${p.name} details`) },
        { label: 'Connect data', icon: Plugs, onSelect: () => open(`${p.name} connections`) },
        { type: 'separator' },
        { label: 'Disconnect', danger: true, onSelect: () => onDisconnect(p) },
      ]}
    />
  );
}

function LinkLines({ set, p }: { set: PlatformSet; p: PlatformData }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-ui">
      {linkLines(set, p).map((l) => (
        <li key={l.key} className={l.need ? 'inline-flex items-center gap-1.5 text-warn-ink' : undefined}>
          {l.need && <Warning aria-hidden size={14} weight="fill" />}
          {l.text}
        </li>
      ))}
    </ul>
  );
}

const COLUMNS = 'minmax(0,300fr) minmax(0,168fr) minmax(0,244fr) 150px';
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
  shortcuts: boolean;
  onFocusPlatform: (ids: string[] | null) => void;
  onAdd: () => void;
  onDisconnect: (p: PlatformData) => void;
}

/** "All platforms": problem-first rows, then "Add another platform". Also used in the place column on a phone. */
function PlatformList({ set, shortcuts, onFocusPlatform, onAdd, onDisconnect }: ListProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const kinds = sampleCatalog.filter((i) => !i.comingSoon).length;
  return (
    <List
      as="table"
      aria-label="All platforms"
      columns={COLUMNS}
      shortcuts={shortcuts}
      cursorId={cursor}
      onCursorChange={(id) => {
        setCursor(id);
        onFocusPlatform(id === 'add' ? null : [id]);
      }}
    >
      {header}
      {ordered(set).map((p) => {
        const h = healthOf(set, p);
        return (
          <ListRow
            key={p.id}
            rowId={p.id}
            label={p.name}
            onActivate={() => open(p.name)}
            onMouseEnter={() => onFocusPlatform([p.id])}
            onMouseLeave={() => onFocusPlatform(null)}
          >
            <ListCell kind="lead" className="flex items-start gap-3">
              <Logo set={set} p={p} size={32} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <a
                  href={`#${p.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    open(p.name);
                  }}
                  className="block rounded-chip text-body font-semibold text-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {p.name}
                </a>
                <div className="text-ui text-muted">
                  {kindName(p.kind)} · {p.place}
                </div>
                <StatusDot status={h.tone} label={h.word} className="mt-2" />
              </div>
            </ListCell>
            <ListCell>
              {p.metrics.length ? (
                <ListMetrics aria-label={`${p.name} figures`}>
                  {p.metrics.map(([l, v]) => (
                    <ListMetric key={l} label={l} value={v} />
                  ))}
                </ListMetrics>
              ) : (
                <span className="text-ui text-muted">{noFigures(p)}</span>
              )}
            </ListCell>
            <ListCell>
              <LinkLines set={set} p={p} />
            </ListCell>
            <ListCell kind="actions">
              {setupNeeded(set, p) ? (
                <Button variant="primary" onClick={() => open(`${p.name} setup`)}>
                  Finish setup
                </Button>
              ) : hasApp(p.kind) ? (
                <Button variant="secondary" onClick={() => open(p.name)}>
                  Open
                </Button>
              ) : (
                <span className="px-1.5 text-small text-muted">No app yet</span>
              )}
              <RowMenu p={p} onDisconnect={onDisconnect} />
            </ListCell>
          </ListRow>
        );
      })}
      <ListRow rowId="add" label="Add another platform" onActivate={onAdd}>
        <ListCell kind="lead" className="col-span-full">
          <Button variant="text" leftIcon={PlusSquare} rightIcon={ArrowRight} onClick={onAdd}>
            Add another platform · {plural(kinds, 'kind')}
          </Button>
        </ListCell>
      </ListRow>
    </List>
  );
}

function LoadingList() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Loading your platforms
      </p>
      <List as="table" aria-hidden="true" columns={COLUMNS} shortcuts={false}>
        {header}
        {[0, 1].map((i) => (
          <ListRow key={i}>
            <ListCell kind="lead" className="flex items-start gap-3">
              <Skeleton variant="rect" className="size-8 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </ListCell>
            <ListCell>
              <Skeleton className="h-3.5 w-24" />
            </ListCell>
            <ListCell>
              <Skeleton className="h-3.5 w-3/4" />
            </ListCell>
            <ListCell kind="actions">
              <Skeleton className="h-8 w-16" />
            </ListCell>
          </ListRow>
        ))}
      </List>
    </div>
  );
}

interface PlaceProps {
  set: PlatformSet;
  state: PlatformsState;
  phone: boolean;
  focusIds: string[] | null;
  onFocusPlatform: (ids: string[] | null) => void;
  onAdd: (pick?: string) => void;
  onDisconnect: (p: PlatformData) => void;
  onRetry: () => void;
  /** The list, loading bars, error block or empty state: in the sheet on desktop, in the place column on a phone. */
  stateBlock: ReactNode;
}

/** The place column: the map, Leda's finding, the data links and what is not shared yet. */
function Place({ set, state, phone, focusIds, onFocusPlatform, onAdd, onRetry, stateBlock }: PlaceProps) {
  const live = state === 'live';
  const [mapHover, setMapHover] = useState<string | null>(null);
  const ids = focusIds ?? (mapHover ? [mapHover] : null);
  const need = set.platforms.filter((p) => setupNeeded(set, p));
  const idle = idleShares(set);
  const caption = state === 'loading' ? undefined : state === 'error' ? 'No data' : `${plural(set.platforms.length, 'platform')} · ${plural(set.links.length, 'data link')}`;
  return (
    <div className="flex flex-col">
      <TownMap
        platforms={mapPlatforms(set)}
        links={live ? mapLinks(set) : []}
        loading={state === 'loading'}
        error={state === 'error'}
        onRetry={onRetry}
        caption={caption}
        label={`Map of ${plural(set.platforms.length, 'platform')} and their data links`}
        dimOthers={false}
        focus={live && ids?.length === 1 ? ids[0] : null}
        highlight={live && ids && ids.length > 1 ? ids : null}
        onSelect={(id) => {
          if (live && id) open(byId(set, id)?.name ?? '');
        }}
        onHover={setMapHover}
      />
      <div className="flex flex-col gap-2 px-3 pb-6 pt-3 max-[640px]:px-pad">
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0 text-title text-text">Platforms</h1>
          {live && (
            <Button variant="text" leftIcon={Plus} onClick={() => onAdd()}>
              Add
            </Button>
          )}
        </div>
        <div className="flex items-start gap-2 text-ui text-muted">
          <LedaMark size={16} decorative className="mt-0.5 shrink-0" />
          {state === 'loading' ? <Skeleton className="mt-1 h-3.5 w-11/12" /> : state === 'error' ? <p className="m-0">Couldn&rsquo;t load your platforms.</p> : <p className="m-0">{headline(set)}</p>}
        </div>
        {phone && <div className="mt-2">{stateBlock}</div>}
        {state === 'loading' && (
          <div aria-busy="true" className="mt-4">
            <p role="status" className="sr-only">
              Loading data links
            </p>
            <h2 className="m-0 mb-2 text-ui font-semibold text-text">Data links</h2>
            {[0, 1].map((i) => (
              <div key={i} aria-hidden="true" className="flex flex-col gap-2 border-b border-rule py-row-y">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}
        {state === 'error' && (
          <div className="mt-4">
            <h2 className="m-0 mb-2 text-ui font-semibold text-text">Data links</h2>
            <p className="m-0 text-ui text-muted">No data. {phone ? 'Try again above.' : 'Try again in the main panel.'}</p>
          </div>
        )}
        {live && (
          <ListGroups
            className="mt-4"
            aria-label="Data links"
            columns="minmax(0,1fr) auto"
            stackBelow={600}
            shortcuts={false}
          >
            <ListGroup title="Data links" count={set.links.length} level={2} empty={set.platforms.length ? 'No platform reads data from another yet.' : 'Add a platform to start.'}>
              {need.map((p) => (
                <ListRow
                  key={`need:${p.id}`}
                  rowId={`need:${p.id}`}
                  label={`${p.name} needs a ${lowerKind(missing(set, p)[0])} source`}
                  onMouseEnter={() => onFocusPlatform([p.id])}
                  onMouseLeave={() => onFocusPlatform(null)}
                >
                  <ListCell kind="lead" className="flex items-start gap-2">
                    <Logo set={set} p={p} className="mt-0.5" />
                    <span className="min-w-0">
                      <span className="block text-body font-medium">{p.name}</span>
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-ui text-warn-ink">
                        <Warning aria-hidden size={14} weight="fill" />
                        No {andList(missing(set, p).map(lowerKind))} source yet
                      </span>
                    </span>
                  </ListCell>
                  <ListCell kind="actions">
                    <Button variant="secondary" onClick={() => open(`${p.name} connections`)}>
                      Connect data
                    </Button>
                  </ListCell>
                </ListRow>
              ))}
              {set.links.map((l) => (
                <LinkRow key={`${l.from}|${l.to}|${l.kind}`} set={set} l={l} onFocusPlatform={onFocusPlatform} />
              ))}
            </ListGroup>
            {idle.length > 0 && (
              <ListGroup title="Not shared yet" count={idle.length} level={2}>
                {idle.map((x) => (
                  <ListRow
                    key={`idle:${x.platform.id}|${x.kind}`}
                    rowId={`idle:${x.platform.id}|${x.kind}`}
                    label={`${x.platform.name} ${lowerKind(x.kind)} is not shared yet`}
                    onMouseEnter={() => onFocusPlatform([x.platform.id])}
                    onMouseLeave={() => onFocusPlatform(null)}
                  >
                    <ListCell kind="lead" className="flex items-start gap-2">
                      <Logo set={set} p={x.platform} className="mt-0.5" />
                      <span className="min-w-0">
                        <span className="block text-body font-medium">
                          {x.platform.name} <span className="font-normal text-muted">·</span> {dataKindName[x.kind]}
                        </span>
                        <span className="block text-ui text-muted">{andList(x.readers.map(kindName))} can read it</span>
                      </span>
                    </ListCell>
                    <ListCell kind="actions">
                      <Button variant="text" leftIcon={Plus} aria-label={`Add ${kindName(x.readers[0])} to read ${x.platform.name} ${lowerKind(x.kind)}`} onClick={() => onAdd(x.readers[0])}>
                        Add
                      </Button>
                    </ListCell>
                  </ListRow>
                ))}
              </ListGroup>
            )}
          </ListGroups>
        )}
      </div>
    </div>
  );
}

function LinkRow({ set, l, onFocusPlatform }: { set: PlatformSet; l: DataLink; onFocusPlatform: (ids: string[] | null) => void }) {
  const from = byId(set, l.from);
  const to = byId(set, l.to);
  const id = `${l.from}|${l.to}|${l.kind}`;
  return (
    <ListRow
      rowId={id}
      label={`${from.name} to ${to.name}, ${dataKindName[l.kind]}`}
      onActivate={() => open(`${to.name} connections`)}
      onMouseEnter={() => onFocusPlatform([l.from, l.to])}
      onMouseLeave={() => onFocusPlatform(null)}
    >
      <ListCell kind="lead">
        <a
          href={`#${to.id}-connections`}
          onClick={(e) => {
            e.preventDefault();
            open(`${to.name} connections`);
          }}
          className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-chip text-body text-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Logo set={set} p={from} />
          <span className="font-medium">{from.name}</span>
          <ArrowRight aria-hidden size={12} className="text-muted" />
          <Logo set={set} p={to} />
          <span className="font-medium">{to.name}</span>
        </a>
        <span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-ui text-muted">
          <b className="font-medium text-text">{dataKindName[l.kind]}</b>
          <span>shares {kindShare(l)}</span>
          <span aria-hidden>·</span>
          <StatusDot status={l.status === 'ok' ? 'ok' : l.status === 'slow' ? 'warn' : 'bad'} label={roadStatusWord(l)} />
        </span>
      </ListCell>
    </ListRow>
  );
}
const kindShare = (l: DataLink) => ({ stock: 'products and levels', catalog: 'parts and services', sales: 'receipts and totals' })[l.kind];

/** The Portal Platforms page (RDY-256) in the real PlatformShell. */
export function PlatformsPage({ set: setKey = 'duo', state: initial = 'live', add = null }: PlatformsPageProps) {
  const set = sets[setKey];
  const [state, setState] = useState<PlatformsState>(initial);
  const [focusIds, setFocusIds] = useState<string[] | null>(null);
  const [market, setMarket] = useState<{ pick: string | null; fromLeda: boolean } | null>(add ? { pick: add.pick ?? null, fromLeda: !!add.fromLeda } : null);
  const [palette, setPalette] = useState(false);
  const [disconnecting, setDisconnectingState] = useState<PlatformData | null>(null);
  const lastDisconnect = useRef('');
  const setDisconnecting = (p: PlatformData | null) => {
    if (p) lastDisconnect.current = p.name;
    setDisconnectingState(p);
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

  const addPlatform = (pick?: string) => setMarket({ pick: pick ?? null, fromLeda: false });
  const live = state === 'live';
  const empty = live && set.platforms.length === 0;
  const retry = () => setState('live');
  const stateBlock =
    state === 'loading' ? (
      <LoadingList />
    ) : state === 'error' ? (
      <ErrorBlock thing="platforms" lastLoaded="9:10 AM" onRetry={retry} />
    ) : empty ? (
      <EmptyState
        icon={PlusSquare}
        title="Add your first business"
        description="A repair shop, a stockroom, a point of sale or an online store. Pick one, then name it and set it up."
        action={<Button onClick={() => addPlatform()}>Choose a platform</Button>}
      />
    ) : (
      <PlatformList set={set} shortcuts onFocusPlatform={setFocusIds} onAdd={() => addPlatform()} onDisconnect={setDisconnecting} />
    );

  const statusPlatforms: StatusBarPlatform[] = set.platforms.map((p) => {
    const h = healthOf(set, p);
    return { id: p.id, name: p.short, initials: initialsOf(set)[p.id], health: h.tone === 'ok' ? 'ok' : h.tone, healthText: h.tone === 'ok' ? undefined : h.word.split(' since')[0].toLowerCase(), href: `#${p.id}` };
  });

  const paletteGroups: CommandPaletteGroup[] = [
    {
      id: 'do',
      label: 'Tell Leda to do',
      items: [{ id: 'add-pos', label: 'Add a POS for the parts counter', leda: true, meta: 'Opens the catalog' }],
    },
    { id: 'go', label: 'Go to', items: set.platforms.map((p) => ({ id: p.id, label: p.name, leading: <Logo set={set} p={p} />, meta: 'Platform' })) },
  ];

  const ask = (
    <AskLedaBar variant="bar" scope="your platforms" paused={palette} onOpen={() => setPalette(true)} />
  );

  return (
    <>
      <PlatformShell
        railLabel="Portal"
        phoneNavLabel="Portal, phone"
        placeLabel="Your platforms"
        sheetLabel="All platforms"
        rail={
          <IconRailContent>
            <IconRailMark href="#home" />
            <IconRailItem icon={House} label="Home" href="#home" />
            <IconRailItem icon={PlusSquare} label="Platforms" href="#platforms" current />
            <IconRailItem icon={Users} label="Team" href="#team" />
            <IconRailItem icon={BookOpen} label="Memory" href="#memory" />
            <IconRailItem icon={Plus} label="Add a platform" onClick={() => addPlatform()} className="mt-2" />
            <IconRailSpacer />
            <IconRailFoot>
              <AccountMenu name="Maria Santos" email="maria@santosauto.ph" role="Owner" applyToDocument={false} />
            </IconRailFoot>
          </IconRailContent>
        }
        topBar={
          <>
            <span className="font-semibold">ReadyPH</span>
            <span className="min-w-0 flex-1 truncate text-muted">{live && !empty ? plural(set.platforms.length, 'platform') : 'Platforms'}</span>
            <AskLedaBar variant="bar" scope="your platforms" shortcuts={false} paused={palette} onOpen={() => setPalette(true)} />
            <AccountMenu name="Maria Santos" email="maria@santosauto.ph" role="Owner" applyToDocument={false} />
          </>
        }
        phoneNav={
          <ul className="m-0 flex w-full list-none p-0">
            {(
              [
                [House, 'Home', '#home', false],
                [PlusSquare, 'Platforms', '#platforms', true],
                [Users, 'Team', '#team', false],
                [BookOpen, 'Memory', '#memory', false],
              ] as const
            ).map(([Ic, label, href, current]) => (
              <li key={label} className="flex-1">
                <a href={href} aria-current={current ? 'page' : undefined} className="flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-small text-muted aria-[current=page]:font-medium aria-[current=page]:text-text">
                  <Ic aria-hidden size={20} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        }
        place={
          <Place
            set={set}
            state={state}
            phone={phone}
            focusIds={focusIds}
            onFocusPlatform={setFocusIds}
            onAdd={addPlatform}
            onDisconnect={setDisconnecting}
            onRetry={retry}
            stateBlock={stateBlock}
          />
        }
        sheetBar={
          <SheetBar actions={ask}>
            <Breadcrumbs variant="sheet" items={[{ label: 'All platforms' }]} />
          </SheetBar>
        }
        status={
          <StatusBar
            platforms={live ? statusPlatforms : []}
            people={{ count: 14 }}
            leda={{ used: 412, max: 1000 }}
            plan="Business"
            updatedAt="9:12 AM"
          />
        }
      >
        {!phone && (
          <div ref={sheetBody} className="p-pad">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 ref={heading} tabIndex={-1} className="m-0 text-header font-semibold text-text outline-none">
                  {empty ? 'No platforms yet' : 'All platforms'}
                </h2>
                {state === 'loading' ? <Skeleton className="mt-1.5 h-3.5 w-56" /> : live && !empty ? <p className="m-0 mt-1 text-ui text-muted">{healthLine(set)}</p> : null}
              </div>
              {live && !empty && (
                <Button variant="primary" leftIcon={Plus} onClick={() => addPlatform()}>
                  Add a platform
                </Button>
              )}
            </div>
            {stateBlock}
          </div>
        )}
      </PlatformShell>
      <Toaster />
      <CommandPalette
        open={palette}
        onOpenChange={setPalette}
        groups={paletteGroups}
        onAsk={() => toast({ description: 'Leda is answering in the conversation panel.', leda: true })}
        onSelect={(item) => {
          if (item.id === 'add-pos') setMarket({ pick: 'pos', fromLeda: true });
          else open(item.label);
        }}
      />
      <Marketplace
        open={!!market}
        onOpenChange={(o) => !o && setMarket(null)}
        items={sampleCatalog}
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
        onOpenChange={(o) => !o && setDisconnecting(null)}
        title={`Disconnect ${disconnecting?.name ?? ''}?`}
        description="Its data links stop working. You can connect it again later."
        name={disconnecting?.name}
        context={disconnecting ? `${kindName(disconnecting.kind)} · ${disconnecting.place}` : undefined}
        confirmLabel="Disconnect"
        onCloseAutoFocus={(e) => {
          // The dialog was opened from a menu item that is gone: put focus back on that row's menu button, only if it was lost.
          e.preventDefault();
          const name = disconnecting?.name ?? lastDisconnect.current;
          focusIfLost(null, document.querySelector<HTMLElement>(`[aria-label="More for ${name}"]`));
        }}
        tone="danger"
        onCancel={() => setDisconnecting(null)}
        onConfirm={() => {
          toast({ description: `${disconnecting?.name} disconnected.` });
          setDisconnecting(null);
        }}
      />
    </>
  );
}
