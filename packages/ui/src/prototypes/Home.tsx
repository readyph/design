import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowSquareOut, CalendarBlank, Clock, Gauge, House, SquaresFour, Users } from '@phosphor-icons/react';
import { AskLedaBar } from '../components/AskLedaBar';
import { Badge } from '../components/Badge';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { ChatChips, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, Chat, usePersistedChat, type ChatChip, type ChatMessageData, type ChatProposalData } from '../components/Chat';
import { chatSample } from '../components/Chat.sample';
import { CommandPalette, type CommandPaletteGroup, type CommandPaletteItem } from '../components/CommandPalette';
import { DataList } from '../components/DataList';
import { DayBar } from '../components/DayBar';
import { Fact, FactsLine } from '../components/FactsLine';
import { IconButton } from '../components/IconButton';
import { LedaMark } from '../components/Leda';
import { LedaNote } from '../components/LedaNote';
import { LedaProposal, type LedaProposalState } from '../components/LedaProposal';
import { Menu } from '../components/Menu';
import { OverviewCharts } from '../components/OverviewCharts';
import { PlatformLogo } from '../components/PlatformLogo';
import { PlatformToday } from '../components/PlatformToday';
import { Queue } from '../components/Queue';
import { SegmentedControl } from '../components/SegmentedControl';
import { SheetBar } from '../components/SheetBar';
import { cn } from '../utils/cn';
import { StatusBar, type StatusBarHealth } from '../components/StatusBar';
import { SubpageLane, SubpageTransition, type SubpageDirection } from '../components/SubpageTransition';
import { Tabs, type TabItem } from '../components/Tabs';
import { TownMap, type TownMapHandle } from '../components/TownMap';
import { Toaster } from '../components/toast/Toaster';
import { toast } from '../components/toast/toastStore';
import { PortalFrame } from './PortalFrame';
import { destFromHash, go } from './protoNav';
import { useMatchMedia } from '../utils/useMatchMedia';
import { ledaMode, mapSlots, queuePlatforms, sets, defaultSuggestions, type HomeCase, type HomePlatform, type HomeSetKey, type HomeState } from './Home.data';

/**
 * Portal Home (RDY-255): the place column (map, Needs you), the sheet (Today, a case, or the overview) and Leda's
 * entry points, composed only from @readyph/ui parts. Prototype only: not exported from the package.
 */
export interface HomeProps {
  set?: HomeSetKey;
  state?: HomeState;
  /** Open the Leda conversation on mount (story). */
  startChat?: boolean;
}

const NOW = 9 * 60 + 12;
const PHONE = '(max-width: 640px)';
const CHAT_KEY = 'rph-home-prototype-chat';
const ownerDefault = { name: 'Ramon Dela Cruz', short: 'Mon', initials: 'RD', email: 'mon@delacruzauto.ph' };
const healthOf = (p: HomePlatform): StatusBarHealth => (p.status === 'ACTIVE' ? 'ok' : p.status === 'DEGRADED' ? 'warn' : 'bad');
const dayPart = NOW < 12 * 60 ? 'morning' : NOW < 18 * 60 ? 'afternoon' : 'evening';
const clock = () => new Date(2026, 9, 26, 9, 12).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
let seq = 100;

function useWidth<T extends HTMLElement>(dep: unknown): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(1200);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, [dep]);
  return [ref as React.RefObject<T>, w];
}

function reply(q: string, scope: string): ChatMessageData['blocks'] {
  const t = q.toLowerCase();
  if (t.includes('reorder'))
    return [
      { type: 'text', text: 'Here is the change. Nothing is written until you confirm.' },
      { type: 'proposal', blockId: `CMD-RL-${seq}`, proposal: { id: 'CMD-RL', title: 'Raise oil filter reorder level to 30', writes: ['Oil filter (OF-114) reorder level: 20 to 30'], notes: ['Nothing is ordered yet.'], confirmLabel: 'Confirm change' } },
    ];
  if (t.includes('move jo'))
    return [{ type: 'refusal', text: 'Leda can’t write to Dela Cruz Auto Works yet. Open it to move the job.', actions: [{ id: 'go', label: 'Open Auto Works', href: '#autoworks' }] }];
  if (t.includes('disconnect'))
    return [{ type: 'refusal', text: 'Leda can’t add, rename or disconnect platforms or change links.', actions: [{ id: 'go', label: 'Go to Parts Stockroom', href: '#stockroom' }] }];
  if (t.includes('week'))
    return [
      { type: 'text', text: 'Sales are up on last week, and parts moved faster than usual.', stream: true },
      { type: 'figure', value: '₱148,200', label: 'Sales this week', detail: 'Last week ₱131,900' },
      { type: 'meta', text: `Read from Auto Works and Parts Stockroom, ${scope}` },
      { type: 'chips', chips: [{ id: 'x', label: 'What shares data with what?' }] },
    ];
  if (t.includes('parts'))
    return [{ type: 'text', text: 'Kahapon, ang pinakamaraming nagamit ay ang oil filter: 31 pcs.', stream: true }, { type: 'meta', text: 'Read from Parts Stockroom, yesterday' }];
  return [{ type: 'text', text: 'Sorry, I can’t answer that in this prototype.', stream: true }, { type: 'chips', chips: chatSample.chips.slice(0, 2) }];
}

export function Home({ set = 'live', state = 'live', startChat = false }: HomeProps) {
  const base = sets[set];
  const phone = useMatchMedia(PHONE);
  const quiet = state === 'quiet';
  const data = quiet && base.quietSet ? base.quietSet : base;
  const suggestions = data.suggestions ?? defaultSuggestions;
  const owner = data.owner ? { ...ownerDefault, name: data.owner.name, short: data.owner.short, initials: data.owner.initials, email: data.owner.initials === ownerDefault.initials ? ownerDefault.email : '' } : ownerDefault;
  const loading = state === 'loading';
  const failedId = state === 'error' ? (data.platforms.find((p) => p.id === 'counter') ?? data.platforms[data.platforms.length - 1]!).id : null;
  const [fixed, setFixed] = useState(false);
  const failed = fixed ? null : failedId;

  // decisions
  const itemsAll = quiet ? [] : data.items;
  const [openIds, setOpenIds] = useState<string[]>(() => itemsAll.map((i) => i.id));
  const [snoozedExtra, setSnoozedExtra] = useState<{ id: string; until: string }[]>([]);
  const [doneExtra, setDoneExtra] = useState<{ id: string; at: string }[]>([]);
  const open = itemsAll.filter((i) => openIds.includes(i.id));
  const snoozed = [...data.snoozed, ...snoozedExtra.map((s) => ({ ...itemsAll.find((i) => i.id === s.id)!, ...s })).map((i) => ({ id: i.id, platform: i.platform, source: i.source, title: i.title, until: i.until }))];
  const done = [...doneExtra.map((d) => itemsAll.find((i) => i.id === d.id)!).map((i, k) => ({ id: i.id, platform: i.platform, source: i.source, title: i.title, at: doneExtra[k]!.at })), ...data.done];

  // sheet
  const [tabs, setTabs] = useState<string[]>(quiet ? [] : ['today']);
  const [tab, setTab] = useState<string | null>(quiet ? null : 'today');
  const [phoneDetail, setPhoneDetail] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [hover, setHover] = useState<string[] | null>(null);
  const [sub, setSub] = useState<{ n: number; dir: SubpageDirection }>({ n: 0, dir: 'in' });
  const slide = (dir: SubpageDirection) => setSub((x) => ({ n: x.n + 1, dir }));
  const lastOpened = useRef<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(() => itemsAll[0]?.id ?? null);
  const [pstate, setPstate] = useState<Record<string, LedaProposalState>>({});
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState(0);
  const [flashRow, setFlashRow] = useState<{ pid: string; ref: string; n: number } | null>(null);
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});

  // Leda
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState(startChat);
  const [messages, setMessages] = usePersistedChat<ChatMessageData[]>([], CHAT_KEY);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  const mapRef = useRef<TownMapHandle>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const proposalRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<'confirm' | 'heading' | null>(null);
  const [bodyRef, bodyW] = useWidth<HTMLDivElement>(sub.n);
  // The subpage lane keeps the old pane mounted for a moment: refs here only ever take the newest element, never reset to null by the leaving one.
  const headingEl = (el: HTMLHeadingElement | null) => { if (el) (headingRef as { current: HTMLHeadingElement | null }).current = el; };
  const proposalEl = (el: HTMLDivElement | null) => { if (el) (proposalRef as { current: HTMLDivElement | null }).current = el; };

  const platformById = (id: string) => (id === 'hq' ? data.hq : data.platforms.find((p) => p.id === id));
  const shortOf = (id: string | null) => (id ? platformById(id)?.shortName ?? 'HQ' : null);
  const scopeName = filter ? (filter === 'hq' ? 'HQ' : shortOf(filter)!) : 'all your platforms';
  const visible = filter === 'hq' ? [] : data.platforms.filter((p) => !filter || p.id === filter);
  const shown = filter === 'hq' ? [data.hq] : visible;

  const lookup = (id: string) => {
    const it = itemsAll.find((i) => i.id === id) ?? data.watching.find((i) => i.id === id) ?? data.snoozed.find((i) => i.id === id) ?? data.done.find((i) => i.id === id);
    return it;
  };
  const caseOf = (id: string): HomeCase => {
    const c = data.cases[id];
    if (c) return c;
    const it = lookup(id);
    return { id, evidence: [{ label: 'Platform', value: it?.platform.name ?? '' }], note: `${(it as { detail?: string } | undefined)?.detail ?? 'Leda is watching this.'} Nothing needs you yet.`, noDraft: true };
  };

  // The platforms a decision touches: its own, and where Leda acts (the van's ends), as the workshop's platformsOf.
  const platformsOf = (id: string): string[] => {
    const it = lookup(id);
    if (!it) return [];
    return [...new Set([it.platform.id, ...(data.cases[id]?.proposal?.van ?? [])])];
  };
  const platTab = tab && tab.startsWith('plat:') ? tab.slice(5) : null;
  const caseTab = tab && tab !== 'today' && !platTab ? tab : null;
  const mapHighlight = hover ?? (caseTab ? platformsOf(caseTab) : platTab ? [platTab] : filter ? [filter] : null);

  // After the sheet changes by the user's own action: focus Confirm (row action) or the heading. Layout effect, no timeout.
  useLayoutEffect(() => {
    const want = pendingFocus.current;
    if (!want) return;
    pendingFocus.current = null;
    let target: HTMLElement | null = headingRef.current;
    if (want === 'confirm') {
      const c = proposalRef.current?.querySelector<HTMLElement>('button:not([disabled])');
      target = (c as HTMLElement | null) ?? target;
    }
    target?.focus();
  }, [tab, flash, phoneDetail]);

  const openCase = useCallback((id: string, focus: 'confirm' | 'heading') => {
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setTab(id);
    setPhoneDetail(true);
    pendingFocus.current = focus;
    if (focus === 'confirm') setFlash((n) => n + 1);
  }, []);

  /** A click on a queue row or its action: the case slides in (phone: over the list); j/k, confirms and palette stay instant. */
  const pushCase = (id: string, focus: 'confirm' | 'heading') => {
    lastOpened.current = id;
    const same = tab === id && !(phone && !phoneDetail);
    if (!same && (phone ? !phoneDetail : true)) slide('in');
    openCase(id, focus);
  };
  const openPlatform = (pid: string) => {
    const id = `plat:${pid}`;
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setTab(id);
    setPhoneDetail(true);
    pendingFocus.current = 'heading';
  };
  const showToday = () => {
    setTabs((t) => (t.includes('today') ? t : ['today', ...t]));
    setTab('today');
    setPhoneDetail(true);
    pendingFocus.current = 'heading';
  };
  const closeTab = (value: string) => {
    const next = tabs.filter((t) => t !== value);
    setTabs(next);
    if (value === `plat:${filter}`) setFilter(null);
    if (tab === value) {
      const i = tabs.indexOf(value);
      setTab(next[i] ?? next[i - 1] ?? null);
      if (!next.length) setPhoneDetail(true);
      pendingFocus.current = 'heading';
    }
  };
  // The map, the chips and the status bar pick a platform: it becomes the filter and (not on a phone) opens its tab; the
  // previous filter's tab closes. Picking it again, or an empty spot, clears the filter (the workshop's pickPlatform).
  const setFilterTo = (id: string | null) => {
    const drop = (pid: string | null) => {
      if (!pid) return;
      const gone = `plat:${pid}`;
      setTabs((t) => t.filter((x) => x !== gone));
      if (tab === gone) setTab(tabs.filter((x) => x !== gone).slice(-1)[0] ?? null);
    };
    if (!id || filter === id) {
      setFilter(null);
      drop(filter);
      return;
    }
    if (filter && filter !== id) drop(filter);
    setFilter(id);
    if (phone) return;
    if (id === 'hq') showToday();
    else openPlatform(id);
  };

  const snooze = (id: string, until: string) => {
    setOpenIds((o) => o.filter((x) => x !== id));
    setSnoozedExtra((s) => [...s, { id, until }]);
    toast.undo(`Snoozed until ${until.split('·')[1]?.trim() ?? until}.`, () => {
      setOpenIds((o) => [...o, id]);
      setSnoozedExtra((s) => s.filter((x) => x.id !== id));
    });
    setTabs((t) => t.filter((x) => x !== id));
    if (tab === id) {
      setTab(tabs.includes('today') ? 'today' : null);
      pendingFocus.current = 'heading';
    }
  };
  const snoozeItems = (id: string) => [
    { label: 'Later today', meta: '13:00', onSelect: () => snooze(id, 'Later today · 13:00') },
    { label: 'Tomorrow', meta: '8:00', onSelect: () => snooze(id, 'Tomorrow · 8:00') },
  ];

  // After a confirm the sheet moves on to the next decision in view, in the same tab (a phone goes back to the list), as the workshop does.
  const advance = (id: string) => {
    const rest = open.filter((o) => o.id !== id);
    const next = rest.find((o) => !filter || o.platform.id === filter) ?? rest[0];
    if (next) {
      setTabs((t) => (t.includes(next.id) ? t.filter((x) => x !== id) : t.map((x) => (x === id ? next.id : x))));
      setTab(next.id);
      setCursor(next.id);
    } else {
      setTabs((t) => t.filter((x) => x !== id));
      setTab(tabs.includes('today') ? 'today' : null);
    }
    if (phone) setPhoneDetail(false);
    pendingFocus.current = 'heading';
  };
  const confirm = (id: string, c: NonNullable<HomeCase['proposal']>) => {
    setPstate((s) => ({ ...s, [id]: 'writing' }));
    return new Promise<void>((res) =>
      window.setTimeout(() => {
        setPstate((s) => ({ ...s, [id]: 'done' }));
        setOpenIds((o) => o.filter((x) => x !== id));
        setDoneExtra((d) => [{ id, at: '9:13' }, ...d]);
        if (c.van && c.van[0] !== c.van[1]) {
          mapRef.current?.runVan(c.van[0], c.van[1]);
          setHover([c.van[0], c.van[1]]);
          window.setTimeout(() => setHover(null), 2600);
        }
        toast.undo(c.toast, () => {
          setPstate((s) => ({ ...s, [id]: 'waiting' }));
          setOpenIds((o) => (o.includes(id) ? o : [...o, id]));
          setDoneExtra((d) => d.filter((x) => x.id !== id));
          openCase(id, 'heading');
        }, { leda: true });
        advance(id);
        res();
      }, 550),
    );
  };

  // Leda
  const openChat = () => {
    opener.current = document.activeElement as HTMLElement | null;
    setPalette(false);
    setChat(true);
  };
  const send = useCallback(
    (q: string) => {
      const id = `m${++seq}`;
      setText('');
      setBusy(true);
      setMessages((m) => [
        ...m,
        { id, from: 'owner', name: owner.name, time: clock(), scope: `About ${scopeName}`, blocks: [{ type: 'text', text: q }] },
        { id: `${id}l`, from: 'leda', name: 'Leda', time: clock(), thinking: true, blocks: [] },
      ]);
      window.setTimeout(() => {
        setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: reply(q, 'today') } : x)));
        setBusy(false);
      }, 1000);
    },
    [setMessages, scopeName],
  );
  const ask = (q: string) => {
    openChat();
    send(q);
  };
  const setBlockProposal = (blockId: string, st: ChatProposalData['state'], extra: Partial<ChatProposalData> = {}) =>
    setMessages((ms) => ms.map((m) => ({ ...m, blocks: m.blocks.map((b) => (b.type === 'proposal' && b.blockId === blockId ? { ...b, proposal: { ...b.proposal, state: st, ...extra } } : b)) })));

  const palGroups: CommandPaletteGroup[] = useMemo(
    () => [
      { id: 'ask', label: 'Ask Leda', items: [suggestions[0]!, suggestions[1]!].map((q) => ({ id: `ask:${q}`, label: q, leda: true })) },
      {
        id: 'do',
        label: 'Tell Leda to do',
        items: [
          { id: `ask:${suggestions[2]}`, label: suggestions[2]!, leda: true },
          { id: `ask:${suggestions[3]}`, label: suggestions[3]!, leda: true },
          { id: 'ask:Disconnect Parts Stockroom', label: 'Disconnect Parts Stockroom', leda: true, refused: true },
        ],
      },
      {
        id: 'needs',
        label: 'Needs you',
        items: open.map((i) => ({ id: `case:${i.id}`, label: i.title, leading: <PlatformLogo name={i.platform.name} src={i.platform.src} index={i.platform.index} hq={i.platform.hq} size={16} decorative />, meta: i.platform.hq ? 'HQ' : (platformById(i.platform.id)?.shortName ?? '') })),
      },
      {
        id: 'go',
        label: 'Go to',
        items: [
          { id: 'go:today', label: 'Today at your platforms', icon: SquaresFour, meta: 'Go' },
          { id: 'go:overview', label: 'Overview', icon: House, meta: 'Go' },
          ...data.platforms.map((p) => ({ id: `filter:${p.id}`, label: `Only ${p.shortName}`, leading: <PlatformLogo name={p.name} src={p.logo} index={p.index} size={16} decorative />, meta: 'Filter' })),
        ],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open.map((i) => i.id).join(','), data],
  );
  const onPalette = (item: CommandPaletteItem) => {
    if (item.id.startsWith('ask:')) ask(item.id.slice(4));
    else if (item.id.startsWith('case:')) openCase(item.id.slice(5), 'heading');
    else if (item.id === 'go:today') showToday();
    else if (item.id === 'go:overview') {
      setTabs([]);
      setTab(null);
      setPhoneDetail(true);
      pendingFocus.current = 'heading';
    } else if (item.id.startsWith('filter:')) setFilterTo(item.id.slice(7));
  };

  const askBar = (variant: 'bar' | 'overview', shortcuts: boolean) => (
    <AskLedaBar variant={variant} scope={filter ? scopeName : undefined} paused={palette || chat} shortcuts={shortcuts} onOpen={() => { opener.current = document.activeElement as HTMLElement | null; setPalette(true); }} />
  );

  // ---- the sheet
  const overview = tab === null;
  const queueLoading = loading;
  const idKey = (p: HomePlatform) => p.id;
  const maxRows = visible.length >= 4 || bodyW < 900 ? 2 : 3;
  const run = (() => {
    const ps = filter === 'hq' ? [] : visible;
    const up = ps.filter((p) => p.status === 'ACTIVE' && p.id !== failed).length;
    const all = !ps.length ? 'HQ is up to date' : up === ps.length ? (ps.length === 1 ? `${ps[0]!.name} is running` : `${ps.length === 2 ? 'Both' : `All ${ps.length}`} platforms are running`) : `${up} of ${ps.length} platforms running`;
    return `${all}.${open.length === 0 ? ' Nothing needs you right now.' : ''}`;
  })();

  // Phone (workshop `.plive`): the Today blocks sit under the Needs-you list in the same scroll, so the sheet keeps no copy of them.
  const inlineToday = phone && !phoneDetail;
  const pct = Math.round((data.plan.used / data.plan.max) * 100);

  const listsOf = (p: HomePlatform) =>
    p.lists.map((l) => ({
                ...l,
                onViewAll: () => toast(`All ${l.total} in ${p.shortName ?? p.name}…`),
                items: l.items.map((it) => {
                  const to = it.linkTo ? platformById(it.linkTo) : undefined;
                  return to
                    ? {
                        ...it,
                        link: {
                          platform: { name: to.name, src: to.logo, index: to.index, hq: to.hq },
                          ref: it.linkRef,
                          text: it.linkText ?? '',
                          onSelect: () => {
                            const ref = it.linkRef ?? '';
                            const row = document.querySelector<HTMLElement>(`#today-${to.id} [data-ref="${ref}"]`);
                            if (!row) { go(to.hq ? { to: 'team' } : { to: 'platform', id: to.id }); return; }
                            row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                            setFlashRow((f) => ({ pid: to.id, ref, n: (f?.n ?? 0) + 1 }));
                          },
                        },
                      }
                    : it;
                }),
              }));

  const hqGo = filter === 'hq' ? (
    <p className="m-0 mt-4 flex flex-wrap gap-2">
      <Button variant="secondary" leftIcon={Users} onClick={() => go({ to: 'team' })}>Open Team</Button>
      <Button variant="secondary" leftIcon={Gauge} onClick={() => go({ to: 'plan' })}>Open Plan</Button>
    </p>
  ) : null;
  const todayContent = (
    <>
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3.5">
        <h2 ref={headingEl} tabIndex={-1} className="m-0 text-case tracking-normal text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">Today</h2>
        <p className="m-0 text-ui leading-5 text-muted tabular-nums">
          {filter === 'hq' ? 'HQ only' : `${shown.length} ${shown.length === 1 ? 'platform' : 'platforms'}`}
          {set === 'live' && !filter ? <span> · Stockroom → Auto Works, parts for jobs</span> : null} · <span className="whitespace-nowrap">{clock()}</span>
        </p>
      </div>
      <div className={cn('grid grid-cols-1 gap-x-10 gap-y-12', shown.length > 1 && '@min-[720px]/sheet:grid-cols-2 @min-[720px]/sheet:gap-x-14')}>
        {shown.map((p) => (
          <div
            key={idKey(p)}
            id={`today-${p.id}`}
            tabIndex={-1}
            className="rounded-card outline-none"
            onMouseEnter={() => setHover([p.id])}
            onMouseLeave={() => setHover(null)}
          >
            <PlatformToday
              surface="surface"
              level={3}
              platform={{ name: p.name, src: p.logo, index: p.index, hq: p.hq }}
              kind={p.kind}
              facts={p.facts}
              leda={p.hq ? undefined : ledaMode(p)}
              headerNote={p.hq && open.some((o) => o.platform.id === 'hq') ? `${open.filter((o) => o.platform.id === 'hq').length} in Needs you` : undefined}
              maxRows={maxRows}
              rowLayout={inlineToday ? 'phone' : phone || bodyW <= 720 ? 'narrow' : 'wide'}
              flashRow={flashRow?.pid === p.id ? flashRow : null}
              loading={loading}
              error={failed === p.id}
              lastLoaded="9:10 AM"
              retryLabel="Retry"
              onRetry={() => {
                window.setTimeout(() => setFixed(true), 600);
              }}
              onOpen={p.hq ? undefined : () => go({ to: 'platform', id: p.id })}
              lists={listsOf(p)}
            >
              {p.hq ? (
                <div>
                  <h4 className="m-0 pt-3.5 text-ui font-semibold leading-5 text-text">{`Starter plan`}</h4>
                  <div className="mt-3">
                    <div role="img" aria-label={`${pct}% of Leda requests used`} className="relative h-2 overflow-hidden rounded bg-raised-2">
                      <span className={cn('absolute inset-y-0 left-0 rounded', pct >= 80 ? 'bg-warn-dot' : 'bg-accent')} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-small text-muted">
                      <span className="tabular-nums">{data.plan.cycleStart}</span>
                      <span><b className="font-medium tabular-nums text-text">{pct}%</b> used · {data.plan.daysLeft} days left</span>
                      <span className="tabular-nums">{data.plan.cycleEnd}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </PlatformToday>
          </div>
        ))}
      </div>
      {hqGo}
    </>
  );
  const todayView = <div className="px-pad pb-8 pt-5">{todayContent}</div>;


  const linkLabel = (from: string, to: string) => (set === 'live' && from === 'stockroom' && to === 'autoworks' ? 'Parts for jobs' : '');
  const platformView = (pid: string) => {
    const p = platformById(pid);
    if (!p) return null;
    const conns = data.links.filter((c) => c.from === pid || c.to === pid);
    const n = open.filter((o) => o.platform.id === pid).length;
    const err = failed === pid;
    const statusText = p.status === 'ACTIVE' ? 'Running' : p.status === 'DEGRADED' ? 'Slow' : 'Offline';
    return (
      <div className="px-pad pb-10 pt-5">
        <p className="m-0 text-small text-muted">{[p.kind, n ? `${n} in Needs you` : ''].filter(Boolean).join(' · ')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <PlatformLogo name={p.name} src={p.logo} index={p.index} size={24} decorative />
          <h2 ref={headingEl} tabIndex={-1} className="m-0 min-w-0 text-title text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">{p.name}</h2>
          <Button variant="primary" leftIcon={ArrowSquareOut} className="ml-auto" onClick={() => go({ to: 'platform', id: p.id })}>Open {p.name}</Button>
        </div>
        <FactsLine aria-label={`${p.name} facts`} className="mt-2">
          <Fact tone={p.status === 'ACTIVE' ? 'ok' : p.status === 'DEGRADED' ? 'warn' : 'bad'}>{statusText}</Fact>
          {err ? <Fact tone="muted">no data · last good 9:10 AM</Fact> : p.facts.slice(0, 3).map((f, i) => <Fact key={i} value={f.value} tone={f.tone} valueFirst>{f.label}</Fact>)}
          {p.ledaCanAct ? <Fact tone="ok">Leda acts here</Fact> : <Fact tone="muted">Leda reads only, can’t act here yet</Fact>}
        </FactsLine>
        {err ? <p className="m-0 mt-5 text-ui text-muted">Couldn’t load {p.name}’s overview. Last good 9:10 AM.</p> : null}
        {p.lists.length && !err ? (
          <PlatformToday surface="surface" platform={{ name: p.name, src: p.logo, index: p.index }} aria-label={`${p.name} lists`} bare lists={listsOf(p)} maxRows={6} rowLayout={phone ? 'phone' : bodyW <= 720 ? 'narrow' : 'wide'} className="mt-2" />
        ) : null}
        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 @min-[760px]/sheet:grid-cols-2">
          <section>
            <h3 className="m-0 text-ui font-semibold text-text">Today</h3>
            {err ? (
              <p className="m-0 mt-2 text-ui text-muted">No data</p>
            ) : (
              <ol className="m-0 mt-1 list-none p-0">
                {(p.activity ?? []).map((a) => (
                  <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 border-t border-rule py-2 text-ui">
                    <span className="min-w-[4.5ch] text-small tabular-nums leading-5 text-muted">{a.at}</span>
                    <span className="min-w-0 [overflow-wrap:anywhere]">{a.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          {conns.length ? (
            <section>
              <h3 className="m-0 text-ui font-semibold text-text">Linked platforms</h3>
              <ul className="m-0 mt-1 list-none p-0">
                {conns.map((c) => {
                  const o = platformById(c.from === pid ? c.to : c.from)!;
                  const word = { ok: 'OK', slow: 'Slow', broken: 'Broken' }[c.status];
                  return (
                    <li key={`${c.from}-${c.to}`} className="flex items-center gap-2 border-t border-rule py-2 text-ui">
                      <PlatformLogo name={o.name} src={o.logo} index={o.index} hq={o.hq} size={16} decorative />
                      <span>{o.name}</span>
                      <span className="text-muted">{linkLabel(c.from, c.to)}</span>
                      <span className={cn('ml-auto', c.status === 'broken' ? 'text-bad' : c.status === 'slow' ? 'text-warn' : 'text-ok')}>{word}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    );
  };

  const caseView = (id: string) => {
    const item = lookup(id);
    if (!item) return null;
    const c = caseOf(id);
    const p = platformById(item.platform.id)!;
    const isOpen = openIds.includes(id);
    const kind = 'due' in item || openIds.includes(id) ? 'open' : data.watching.some((w) => w.id === id) ? 'watching' : 'closed';
    const st = pstate[id] ?? 'waiting';
    const ch = choice[id] ?? 'dispute';
    const label = c.variance ? (ch === 'accept' ? 'Accept' : 'Dispute') : c.proposal?.confirmLabel ?? 'Confirm';
    const more = showMore[id];
    return (
      <div className="px-pad pb-10 pt-5">
        <Breadcrumbs
          aria-label="Where this is"
          items={[
            { label: p.name, logo: <PlatformLogo name={p.name} src={p.logo} index={p.index} hq={p.hq} size={16} decorative />, href: p.hq ? '#team' : `#${p.id}`, onClick: (e) => { e.preventDefault(); go(p.hq ? { to: 'team' } : { to: 'platform', id: p.id }); } },
            { label: p.kind },
          ]}
        />
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {p.status !== 'ACTIVE' ? <Badge tone={p.status === 'DEGRADED' ? 'warn' : 'bad'}>{p.status === 'DEGRADED' ? 'Slow' : 'Offline'}</Badge> : null}
          {kind === 'watching' ? <Badge tone="accent">Watching</Badge> : null}
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h2 ref={headingEl} tabIndex={-1} className="m-0 min-w-0 text-title text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">{item.title}</h2>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" rightIcon={ArrowSquareOut} onClick={() => go({ to: 'platform', id: p.id })}>Open {p.shortName ?? p.name}</Button>
            {isOpen ? (
              <span className="max-[640px]:hidden">
                <Menu trigger={<Button variant="secondary" leftIcon={Clock}>Snooze</Button>} items={snoozeItems(id)} align="end" />
              </span>
            ) : null}
          </div>
        </div>
        <FactsLine aria-label="Case facts" className="mt-2">
          {c.due ? <Fact value={c.due}>Due</Fact> : null}
          {c.left ? <Fact tone={c.left.tone} value={c.left.text}>Time</Fact> : null}
          {c.deadline ? <Fact value={c.deadline}>Deadline</Fact> : null}
          {c.impact ? <Fact value={c.impact}>Impact</Fact> : null}
          {p.ledaCanAct ? <Fact tone="ok">Leda acts in {p.shortName ?? p.name}</Fact> : <Fact tone="muted">Leda can’t act in {p.shortName ?? p.name} yet</Fact>}
        </FactsLine>
        {c.day ? <DayBar className="mt-4" aria-label={`Today at ${p.name}`} hours={c.day.hours} now={NOW} marks={c.day.marks} /> : null}
        <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 @min-[760px]/sheet:grid-cols-2">
          <div className="min-w-0">
            <DataList items={more ? c.evidence : c.evidence.slice(0, 3)} />
            {c.evidence.length > 3 ? (
              <Button variant="text" className="mt-1" aria-expanded={!!more} onClick={() => setShowMore((s) => ({ ...s, [id]: !s[id] }))}>
                {more ? 'Fewer details' : 'More details'}
              </Button>
            ) : null}
            <LedaNote className="mt-4">{c.note}</LedaNote>
          </div>
          <div className="min-w-0">
            {c.proposal ? (
              <>
                {c.variance && st === 'waiting' ? (
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className="text-ui text-muted">Your choice</span>
                    <SegmentedControl
                      aria-label="Your choice"
                      semantics="radio"
                      value={ch}
                      onChange={(v) => setChoice((s) => ({ ...s, [id]: v }))}
                      options={[{ value: 'dispute', label: 'Dispute' }, { value: 'accept', label: 'Accept' }]}
                    />
                  </div>
                ) : null}
                <div key={`${id}-${flash}`} className={flash && tab === id ? 'animate-row-flash rounded-card' : 'rounded-card'}>
                  <LedaProposal
                    ref={proposalEl}
                    id={c.proposal.id}
                    title={c.variance && ch === 'accept' ? 'Accept the invoice as it is' : c.proposal.title}
                    writes={c.proposal.writes}
                    notes={c.proposal.notes}
                    state={st}
                    confirmLabel={label}
                    doneAt="9:13"
                    after={c.proposal.toast}
                    discardedText="Draft discarded."
                    onConfirm={() => confirm(id, { ...c.proposal!, confirmLabel: label })}
                    onDiscard={() => setPstate((s) => ({ ...s, [id]: 'discarded' }))}
                  />
                </div>
              </>
            ) : (
              <p className="m-0 text-ui text-muted">No draft for this one. Open {p.shortName ?? p.name} to decide.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const hero = (
    <div className="mx-auto flex max-w-[640px] flex-col items-center px-pad pb-8 pt-12 text-center max-[640px]:pt-6">
      <LedaMark size={88} effect={loading ? 'aurora' : 'glint'} active={loading} once={!loading} decorative />
      <h2 ref={headingEl} tabIndex={-1} className="m-0 mt-4 text-title text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">Good {dayPart}, {owner.short}</h2>
      <p className="m-0 mt-1 text-body text-muted">{run}</p>
      <div className="mt-5 w-full max-[640px]:hidden">{askBar('overview', true)}</div>
      <ChatChips
        className="mt-3 justify-center"
        label="Ask Leda"
        chips={[...suggestions].sort((a, b) => a.length - b.length).map((q) => ({ id: q, label: q }))}
        onPick={(c: ChatChip) => ask(c.label)}
      />
    </div>
  );
  const overviewView = (
    <div className="pb-12">
      {hero}
      {visible.length ? (
        <div className="px-pad">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 id="ov7" className="m-0 text-header text-text">Last 7 days</h3>
            <span className="text-ui text-muted">{data.weekRange ?? 'Thu 15 – Wed 21 Oct'}</span>
            <Button variant="text" leftIcon={SquaresFour} rightIcon={ArrowRight} className="ml-auto" onClick={showToday}>Today at your platforms</Button>
          </div>
          <OverviewCharts
            locale="en-PH"
            platforms={visible.map((p) => ({
              ...p.week,
              name: p.name,
              state: loading ? 'loading' : failed === p.id ? 'error' : 'ready',
              onRetry: () => { window.setTimeout(() => setFixed(true), 600); },
              onOpen: () => openPlatform(p.id),
            }))}
          />
        </div>
      ) : null}
      <div className="mt-8 border-t border-rule px-pad pt-5">
        {quiet ? (
          <p className="m-0 mb-5 flex items-center gap-2 text-ui text-muted">
            <CalendarBlank size={14} aria-hidden />
            <span>{data.next}</span>
          </p>
        ) : null}
        {!loading && visible.length ? (
          <section aria-labelledby="yday">
            <h3 id="yday" className="m-0 mb-2 text-ui font-semibold text-text">Yesterday, {data.yesterdayDate}</h3>
            <table className="w-full border-collapse text-ui">
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-t border-rule">
                    <th scope="row" className="w-1/3 py-2 pr-3 text-left font-normal text-text">
                      <span className="inline-flex items-center gap-2"><PlatformLogo name={p.name} src={p.logo} index={p.index} size={16} decorative />{p.name}</span>
                    </th>
                    <td className="py-2 text-muted">
                      {p.yesterday.map((k, i) => (
                        <span key={String(k.label)}>{i ? ' · ' : ''}<b className="font-medium tabular-nums text-text">{k.value}</b> {k.label}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </div>
  );

  const tabItems: TabItem[] = tabs.map((id) => {
    if (id === 'today') return { value: 'today', label: 'Today', icon: SquaresFour, closable: true };
    if (id.startsWith('plat:')) {
      const pp = platformById(id.slice(5));
      return { value: id, label: pp?.name ?? id, leading: pp ? <PlatformLogo name={pp.name} src={pp.logo} index={pp.index} hq={pp.hq} size={16} decorative /> : undefined, closable: true };
    }
    const it = lookup(id);
    return { value: id, label: it?.title ?? id, leading: it ? <PlatformLogo name={it.platform.name} src={it.platform.src} index={it.platform.index} hq={it.platform.hq} size={16} decorative /> : undefined, closable: true };
  });

  const sheetBar = phone ? undefined : overview ? undefined : (
    <SheetBar actions={askBar('bar', !overview)}>
      <Tabs variant="editor" aria-label="Open items" items={tabItems} value={tab ?? undefined} onValueChange={(v) => { setTab(v); }} onClose={closeTab} />
    </SheetBar>
  );

  const sheetBody = overview ? overviewView : tab === 'today' ? (inlineToday ? null : todayView) : platTab ? platformView(platTab) : caseView(tab);

  const queueHeadline =
    filter || loading
      ? undefined
      : quiet
        ? `Watching ${data.watching.length}. ${data.yesterdayLine ?? 'Yesterday: 9 jobs completed, 41 stock movements.'}`
        : open[0]?.id === 'q1'
          ? `${open.length} decisions. First: alternator for the 11:00 Vios, order by 9:45.`
          : data.headline && open.length === data.items.length
            ? data.headline
            : undefined;

  const place = (
    <div className="flex h-full min-h-0 flex-col max-[640px]:h-auto">
      <TownMap
        ref={mapRef}
        className="shrink-0"
        platforms={mapSlots({ ...data, hq: quiet || loading ? { ...data.hq, count: 0 } : data.hq, platforms: data.platforms.map((p) => ({ ...p, count: quiet || loading ? 0 : p.count, ...(p.id === failed ? { error: true } : {}) })) })}
        links={data.links}
        caption={<span><b className="font-semibold text-text">{data.platforms.length} platforms</b>{data.hasHq === false ? '' : ' + HQ'}</span>}
        captionInside
        identityPlots={false}
        label="Your platforms"
        selected={filter}
        highlight={mapHighlight}
        loading={loading}
        onSelect={setFilterTo}
        onHover={(id) => setHover(id ? [id] : null)}
      />
      <Queue
        className="min-h-0 flex-1"
        items={open}
        watching={loading ? [] : data.watching}
        snoozed={loading ? [] : snoozed}
        done={loading ? [] : done}
        platforms={queuePlatforms(data)}
        filter={filter}
        onFilterChange={setFilterTo}
        loading={queueLoading}
        headline={queueHeadline}
        belowHeadline={phone ? askBar('overview', false) : undefined}
        defaultOpenGroups={quiet ? ['watching'] : []}
        retryLabel="Retry"
        errors={failed ? [{ platform: { id: failed, name: platformById(failed)!.name, index: platformById(failed)!.index }, lastLoaded: '9:10 AM' }] : []}
        onRetry={() => { window.setTimeout(() => setFixed(true), 600); }}
        cursorId={cursor}
        onCursorChange={setCursor}
        onItemHover={(id) => setHover(id ? platformsOf(id) : null)}
        onOpen={(id) => pushCase(id, 'heading')}
        onAction={(id) => pushCase(id, 'confirm')}
        onSnooze={(id) => snooze(id, 'Later today · 13:00')}
        shortcuts={!phone || !phoneDetail}
      />
      {inlineToday && !overview ? <div className="mt-2 border-t border-border px-4 pb-2 pt-5">{todayContent}</div> : null}
    </div>
  );

  const caseId = caseTab;
  const detailBar = phone && phoneDetail ? (
    <>
      <IconButton
        icon={ArrowLeft}
        label="Back to Needs you"
        onClick={() => {
          lastOpened.current = tab;
          slide('out');
          setPhoneDetail(false);
        }}
      />
      <span className="min-w-0 flex-1 truncate text-ui font-semibold">{caseId ? lookup(caseId)?.platform.name : platTab ? platformById(platTab)?.name : tab === 'today' ? 'Today' : 'Overview'}</span>
      {caseId && openIds.includes(caseId) ? <Menu trigger={<IconButton icon={Clock} label="Snooze" />} items={snoozeItems(caseId)} align="end" /> : null}
      {askBar('bar', false)}
    </>
  ) : undefined;

  return (
    <>
      <SubpageTransition paneKey={`k${sub.n}`} direction={sub.dir} restoreFocus={() => (lastOpened.current ? document.querySelector<HTMLElement>(`[data-row-id="${lastOpened.current}"] button`) : null) ?? document.querySelector<HTMLElement>('[data-shell-place] h1')}>
      <PortalFrame
        current="home"
        account={{ name: owner.name, email: owner.email, role: 'Owner', initials: owner.initials }}
        teamCount={1}
        onAddPlatform={() => go({ to: 'platforms', add: true })}
        onNavigate={go}
        pageName={`${data.platforms.length} platforms${data.hasHq === false ? '' : ' + HQ'}`}
        place={place}
        placeLabel="Your platforms"
        heading={phone && phoneDetail ? 'Home' : null}
        sheetBar={sheetBar}
        sheetLabel={overview ? 'Overview' : tab === 'today' ? 'Today' : platTab ? (platformById(platTab)?.name ?? 'Platform') : 'Case'}
        detail={phone && phoneDetail}
        topBar={detailBar}
        status={
          <StatusBar
            platforms={data.platforms.map((p) => ({ id: p.id, name: p.shortName ?? p.name, logoSrc: p.logo, color: p.index, initials: p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase(), health: p.id === failed ? 'bad' : healthOf(p), healthText: p.id === failed ? 'no data' : undefined, selected: filter === p.id, onSelect: () => setFilterTo(filter === p.id ? null : p.id) }))}
            people={{ count: 9 }}
            invites={{ count: 1 }}
            leda={{ used: data.plan.used, max: data.plan.max, daysLeft: '7 days left' }}
            ledaFirst
            plan="Starter"
            updatedAt={clock()}
          />
        }
      >
        <SubpageLane from="right">
          <div ref={(el) => { if (el) { (bodyRef as { current: HTMLDivElement | null }).current = el; (sheetRef as { current: HTMLDivElement | null }).current = el; } }} data-home-body>
            {sheetBody}
          </div>
        </SubpageLane>
      </PortalFrame>
      </SubpageTransition>
      <CommandPalette
        open={palette}
        onOpenChange={setPalette}
        groups={palGroups}
        onSelect={onPalette}
        onAsk={ask}
        query={query}
        onQueryChange={setQuery}
        conversationMessages={messages.length}
        onOpenConversation={openChat}
        returnFocusRef={opener}
        placeholder={filter ? `Ask Leda about ${scopeName}` : 'Ask Leda or tell it what to do'}
      />
      {chat && (
        <Chat onClose={() => setChat(false)} returnFocusTo={opener}>
          <ChatHeader busy={busy} empty={messages.length === 0} onNewConversation={() => setMessages([])} onClose={() => setChat(false)} />
          {messages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto"><ChatEmpty scope={scopeName} chips={suggestions.map((q) => ({ id: q, label: q }))} onPick={(c) => send(c.label)} /></div>
          ) : (
            <ChatThread>
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onChip={(c) => send(c.label)}
                  onAction={(a) => { if (a.href) go(destFromHash(a.href)); }}
                  onConfirm={(bid) => {
                    setBlockProposal(bid, 'writing');
                    return new Promise<void>((res) =>
                      window.setTimeout(() => {
                        setBlockProposal(bid, 'done', { after: 'Reorder level is now 30.', doneAt: clock() });
                        toast.undo('Oil filter reorder level is now 30.', () => setBlockProposal(bid, 'waiting'), { leda: true });
                        res();
                      }, 800),
                    );
                  }}
                  onDiscard={(bid) => setBlockProposal(bid, 'discarded')}
                />
              ))}
            </ChatThread>
          )}
          <ChatComposer value={text} onChange={setText} onSend={send} busy={busy} scope={`About ${scopeName}`} />
        </Chat>
      )}
      <Toaster />
    </>
  );
}
