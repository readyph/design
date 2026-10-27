import { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { Bank, Calculator, CircleNotch, DeviceMobile, Gift, Graph, Hash, Moon, Package, PencilSimple, PlusSquare, Storefront, Table, Truck, WarningCircle, Wrench, ArrowRight, ArrowSquareOut, CalendarBlank, CaretDown, CaretLeft, CheckCircle, Clock, Prohibit, Gauge, SquaresFour, Users } from '@phosphor-icons/react';
import { AskLedaBar } from '../components/AskLedaBar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ChatChips, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, Chat, usePersistedChat, type ChatChip, type ChatMessageData, type ChatProposalData } from '../components/Chat';
import { CommandPalette, type CommandPaletteGroup, type CommandPaletteItem } from '../components/CommandPalette';
import { Fact, FactsLine } from '../components/FactsLine';
import { LedaMark } from '../components/Leda';
import { LedaNote } from '../components/LedaNote';
import type { LedaProposalState } from '../components/LedaProposal';
import { Menu } from '../components/Menu';
import { OverviewCharts } from '../components/OverviewCharts';
import { PlatformLogo } from '../components/PlatformLogo';
import { LedaFact, PlatformToday } from '../components/PlatformToday';
import { Queue } from '../components/Queue';
import { SheetBar } from '../components/SheetBar';
import { cn, focusRing } from '../utils/cn';
import { StatusBar, type StatusBarHealth } from '../components/StatusBar';
import { SubpageLane, SubpageTransition, type SubpageDirection } from '../components/SubpageTransition';
import { Tabs, type TabItem } from '../components/Tabs';
import { TownMap, type TownMapHandle } from '../components/TownMap';
import { Toaster } from '../components/toast/Toaster';
import { toast } from '../components/toast/toastStore';
import { PortalFrame } from './PortalFrame';
import { CaseKv, DayLine, LedaDraft, MoreButton, peso, type DraftLine } from './Home.case';
import { destFromHash, go } from './protoNav';
import { useMatchMedia } from '../utils/useMatchMedia';
import { ledaMode, mapSlots, queuePlatforms, sets, defaultSuggestions, type HomeCase, type HomeLedaAnswer, type HomeCaseLine, type HomePlatform, type HomeSetKey, type HomeState } from './Home.data';

/**
 * Portal Home (RDY-255): the place column (map, Needs you), the sheet (Today, a case, or the overview) and Leda's
 * entry points, composed only from @readyph/ui parts. Prototype only: not exported from the package.
 */
export interface HomeProps {
  set?: HomeSetKey;
  state?: HomeState;
  /** Open the Leda conversation on mount (story). */
  startChat?: boolean;
  /** Start with the map filtered to one platform ('hq' or a platform id); story arg so the filtered pages can be shown and measured. */
  filter?: string;
}

const NOW = 9 * 60 + 12;
const PHONE = '(max-width: 640px)';
const CHAT_KEY = 'rph-home-prototype-chat';
const ownerDefault = { name: 'Ramon Dela Cruz', short: 'Mon', initials: 'RD', email: 'mon@delacruzauto.ph' };
const healthOf = (p: HomePlatform): StatusBarHealth => (p.status === 'ACTIVE' ? 'ok' : p.status === 'DEGRADED' ? 'warn' : 'bad');
const dayPart = NOW < 12 * 60 ? 'morning' : NOW < 18 * 60 ? 'afternoon' : 'evening';
const clock = () => new Date(2026, 9, 26, 9, 12).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
let seq = 100;
const toMin = (v: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(v); return m ? +m[1]! * 60 + +m[2]! : null; };
const hmin = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

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

export function Home({ set = 'live', state = 'live', startChat = false, filter: initialFilter }: HomeProps) {
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
  const startPlat = initialFilter && initialFilter !== 'hq' && !(typeof window !== 'undefined' && window.matchMedia(PHONE).matches) ? `plat:${initialFilter}` : null;
  const [tabs, setTabs] = useState<string[]>(quiet ? [] : startPlat ? ['today', startPlat] : ['today']);
  const [tab, setTab] = useState<string | null>(quiet ? null : startPlat ?? 'today');
  const [phoneDetail, setPhoneDetail] = useState(false);
  const [filter, setFilter] = useState<string | null>(initialFilter ?? null);
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
  const [addOn, setAddOn] = useState<Record<string, boolean>>({});
  const [extraLines, setExtraLines] = useState<Record<string, HomeCaseLine[]>>({});
  const [writes, setWrites] = useState(0);
  const [reviewed, setReviewed] = useState<string | null>(null);
  const nowMin = NOW + writes;

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
    return { id, evidence: [{ label: 'Platform', value: it?.platform.name ?? '' }], note: `${(it as { detail?: string } | undefined)?.detail ?? 'Leda is watching this.'} Nothing needs you yet.`, facts: [] };
  };

  // The platforms a decision touches: its own, and where Leda acts (the van's ends), as the workshop's platformsOf.
  const platformsOf = (id: string): string[] => {
    const it = lookup(id);
    if (!it) return [];
    return data.cases[id]?.pids ?? [it.platform.id];
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

  // Phone: the sticky bar reads "Review" until the "Leda will write" list has been on screen, then it becomes Confirm.
  useLayoutEffect(() => {
    if (!phone || !phoneDetail || !caseTab) return;
    const last = proposalRef.current?.querySelector('ul li:last-child');
    if (!last || typeof IntersectionObserver === 'undefined') { setReviewed(caseTab); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setReviewed(caseTab); io.disconnect(); } }, { rootMargin: '0px 0px -64px 0px', threshold: 1 });
    io.observe(last);
    return () => io.disconnect();
  }, [phone, phoneDetail, caseTab, sub.n]);
  // Enter confirms the open draft (the workshop's keyboard rule) unless focus is on a control that takes Enter itself.
  const enterRef = useRef<() => void>(() => {});
  enterRef.current = () => { if (caseTab && caseOf(caseTab).proposal && !phone) void confirm(caseTab); };
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest('button,a,[role="tab"],label,input,textarea,[role="dialog"],[role="menu"],[role="combobox"]')) return;
      enterRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const openCase = useCallback((id: string, focus: 'confirm' | 'heading') => {
    setTabs((t) => [id, ...t.filter((x) => x === 'today' || x.startsWith('plat:'))]);
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
  const finish = (id: string, text: string, opts: { van?: [string, string]; leda: boolean; at: string; undo: () => void }) => {
    setPstate((s) => ({ ...s, [id]: 'done' }));
    setOpenIds((o) => o.filter((x) => x !== id));
    setDoneExtra((d) => [{ id, at: opts.at }, ...d]);
    setWrites((n) => n + 1);
    if (opts.van && opts.van[0] !== opts.van[1]) {
      mapRef.current?.runVan(opts.van[0], opts.van[1]);
      setHover([opts.van[0], opts.van[1]]);
      window.setTimeout(() => setHover(null), 2600);
    }
    toast.undo(text, () => {
      setPstate((s) => ({ ...s, [id]: 'waiting' }));
      setOpenIds((o) => (o.includes(id) ? o : [...o, id]));
      setDoneExtra((d) => d.filter((x) => x.id !== id));
      setWrites((n) => Math.max(0, n - 1));
      opts.undo();
      openCase(id, 'heading');
    }, { leda: opts.leda });
    advance(id);
  };
  const confirm = (id: string) => {
    const c = caseOf(id);
    const pr = c.proposal;
    if (!pr || pstate[id] === 'writing') return Promise.resolve();
    const opt = pr.options ? (pr.options.find((o) => o.id === (choice[pr.id] ?? pr.options![0]!.id)) ?? pr.options[0]) : null;
    let text = opt ? opt.after : pr.after;
    const add = pr.addOn && addOn[pr.id] ? pr.addOn : null;
    if (add) text += ` ${add.proposalId} + ${add.line.qty} ${add.line.unit}.`;
    setPstate((s) => ({ ...s, [id]: 'writing' }));
    return new Promise<void>((res) =>
      window.setTimeout(() => {
        if (add) setExtraLines((x) => ({ ...x, [add.proposalId]: [...(x[add.proposalId] ?? []), add.line] }));
        finish(id, text, { van: c.van, leda: true, at: hmin(nowMin + 1), undo: () => { if (add) setExtraLines((x) => ({ ...x, [add.proposalId]: (x[add.proposalId] ?? []).slice(0, -1) })); } });
        res();
      }, 550),
    );
  };
  const discard = (id: string) => {
    const pr = caseOf(id).proposal;
    if (!pr) return;
    finish(id, `${pr.id} discarded. Nothing was written.`, { leda: false, at: hmin(nowMin + 1), undo: () => {} });
  };

  // Leda
  const openChat = () => {
    opener.current = document.activeElement as HTMLElement | null;
    setPalette(false);
    setChat(true);
  };
  const numFmt = (n: number) => Number(n).toLocaleString('en-PH');
  const ledaSuggest = [...(data.leda?.answers ?? []).map((a) => a.q), ...(data.leda?.commands ?? []).map((c) => c.q)];
  const findAsk = (q: string) => {
    const s = q.toLowerCase().trim();
    const cmds = data.leda?.commands ?? [], ans = data.leda?.answers ?? [];
    const cmd = cmds.find((c) => c.q.toLowerCase() === s) ?? (s.length > 4 ? cmds.find((c) => c.q.toLowerCase().includes(s)) : undefined);
    if (cmd) return { cmd };
    const a = ans.find((x) => x.q.toLowerCase() === s) ?? (s.length > 4 ? ans.find((x) => x.q.toLowerCase().includes(s)) : undefined);
    return a ? { a } : null;
  };
  const answerBlock = (a: HomeLedaAnswer): ChatMessageData['blocks'][number] => {
    if (a.kind === 'figure') return { type: 'answerFigure', figure: a.figure!, sub: a.sub! };
    const cols = a.columns!, rows = a.rows!;
    const withTotal = cols.length === rows[0]!.values.length + 2;
    const tot = rows.map((x) => x.values.reduce<number>((s, v) => s + Number(v), 0));
    const rank = withTotal ? tot : rows.map((x) => Number(x.values[0]));
    const max = Math.max(...rank), lead = rank.indexOf(max);
    return {
      type: 'answerTable',
      caption: a.q,
      columns: cols,
      rows: rows.map((x, i) => {
        const cells = [...x.values.map((v) => (typeof v === 'number' ? numFmt(v) : String(v))), ...(withTotal ? [numFmt(tot[i]!)] : [])];
        return { label: x.label, cells, lead: i === lead, bar: { at: withTotal ? cells.length - 1 : 0, pct: Math.round(((withTotal ? tot[i]! : Number(x.values[0])) / max) * 100) } };
      }),
      ...(withTotal ? { foot: [...rows[0]!.values.map((_, j) => numFmt(rows.reduce((s, x) => s + Number(x.values[j]), 0))), numFmt(tot.reduce((s, v) => s + v, 0))] } : {}),
      ...(a.unit ? { unit: a.unit } : {}),
    };
  };
  const reply = (q: string): ChatMessageData['blocks'] => {
    const r = findAsk(q);
    if (!r) return [{ type: 'text', text: "Sorry, I can't answer that in this prototype.", stream: true }, ...(ledaSuggest.length ? [{ type: 'text' as const, text: 'These ones work here:', stream: true }, { type: 'chips' as const, chips: ledaSuggest.map((x) => ({ id: x, label: x })) }] : [])];
    if (r.cmd) {
      const c = r.cmd;
      if (!c.allowed) return [{ type: 'refuse', text: c.refusal! }, { type: 'actions', actions: [{ id: `open:${c.platformId}`, label: c.offerLabel!, href: `#${c.platformId}` }] }];
      const pr = c.proposal!;
      return [
        { type: 'text', text: `Here is the change for ${c.platformLabel}. Nothing is written until you confirm.`, stream: true },
        { type: 'proposal', blockId: `${pr.id}-${seq}`, proposal: { id: pr.id, title: pr.title, topLabel: 'You asked · drafted by Leda', writes: pr.writes, writesHeading: 'Leda will write', notes: pr.notifies ? [`Notifies ${pr.notifies}`] : [], confirmLabel: pr.confirmLabel, after: pr.after } },
      ];
    }
    const a = r.a!;
    const said = a.note ? ({ type: 'text', text: a.note, stream: true } as const) : null, widget = answerBlock(a);
    return [...(a.kind === 'figure' ? [widget, said] : [said, widget]), a.from ? { type: 'meta' as const, text: `Read from ${a.from}` } : null, a.next?.length ? { type: 'chips' as const, chips: a.next.map((x) => ({ id: x, label: x })) } : null].filter(Boolean) as ChatMessageData['blocks'];
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
        setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: reply(q) } : x)));
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

  const KIND_ICON: Record<string, Icon> = { Inventory: Package, 'Repair shop': Wrench, POS: Bank, Storefront, 'Mobile app': DeviceMobile, Accounting: Calculator, Delivery: Truck, Loyalty: Gift };
  const statusText = (p: HomePlatform) => (p.status === 'ACTIVE' ? 'Active' : `${p.status === 'OFFLINE' ? 'Offline' : 'Degraded'}${p.statusSince ? ` since ${p.statusSince}` : ''}`);
  const gotoState = (args: string) => { const u = new URL(window.location.href); u.searchParams.set('args', args); window.location.href = u.toString(); };
  const palGroups: CommandPaletteGroup[] = useMemo(
    () => [
      { id: 'ask', label: 'Ask Leda', items: (data.leda?.answers ?? []).map((a) => ({ id: `ask:${a.q}`, label: a.q, icon: a.kind === 'table' ? Table : Hash })) },
      { id: 'do', label: 'Tell Leda to do', items: (data.leda?.commands ?? []).map((c) => ({ id: `ask:${c.q}`, label: c.q, icon: PencilSimple, meta: c.allowed ? 'you confirm' : `${platformById(c.platformId)?.kind ?? ''} · read only` })) },
      {
        id: 'go',
        label: 'Go to',
        items: [
          ...data.platforms.map((p) => ({ id: `filter:${p.id}`, label: p.name, icon: KIND_ICON[p.kind] ?? SquaresFour, meta: `${p.kind} · ${statusText(p)}` })),
          { id: 'nav:platforms', label: 'Platforms', icon: Graph, meta: 'add, rename, data links' },
          { id: 'nav:team', label: 'Team', icon: Users, meta: `9 people${(data.hq.lists.find((l) => l.id === 'invites')?.total ?? 0) ? ' · 1 invite' : ''}` },
          { id: 'nav:plan', label: 'Plan and AI usage', icon: Gauge, meta: `${Math.round((data.plan.used / data.plan.max) * 100)}% used` },
          { id: 'nav:add', label: 'Add a platform', icon: PlusSquare, meta: 'Platforms' },
        ],
      },
      ...(phone ? [] : [{ id: 'states', label: 'Prototype states', items: [{ id: 'state:quiet', label: 'Quiet day', icon: Moon, meta: 'nothing needs you' }, { id: 'state:loading', label: 'Loading', icon: CircleNotch }, { id: 'state:error', label: 'A platform fails to load', icon: WarningCircle }] }]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, phone],
  );
  const onPalette = (item: CommandPaletteItem) => {
    if (item.id.startsWith('ask:')) ask(item.id.slice(4));
    else if (item.id.startsWith('filter:')) setFilterTo(item.id.slice(7));
    else if (item.id === 'nav:platforms') go({ to: 'platforms' });
    else if (item.id === 'nav:team') go({ to: 'team' });
    else if (item.id === 'nav:plan') go({ to: 'plan' });
    else if (item.id === 'nav:add') go({ to: 'platforms', add: true });
    else if (item.id.startsWith('state:')) gotoState(`state:${item.id.slice(6)}`);
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
      <div className="mb-5 flex flex-wrap items-baseline gap-3.5">
        <h2 ref={headingEl} tabIndex={-1} className="m-0 text-case tracking-normal text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">Today</h2>
        <p className="m-0 text-ui leading-5 text-muted tabular-nums">
          {filter === 'hq' ? 'HQ only' : filter && shown.length === 1 ? `${shown[0]!.name} only` : `${data.platforms.length} ${data.platforms.length === 1 ? 'platform' : 'platforms'}`}
          {!filter && data.links.length === 1 ? <span> · Stockroom → Auto Works, parts for jobs</span> : !filter && data.links.length > 1 ? <span> · {data.links.length} links</span> : null} · <span className="whitespace-nowrap">{clock()}</span>
        </p>
      </div>
      <div className={cn('grid gap-y-12 gap-x-14 @max-[720px]/sheet:gap-x-10', phone || shown.length <= 1 ? 'grid-cols-[minmax(0,1fr)]' : 'grid-cols-[repeat(auto-fit,minmax(236px,1fr))]')}>
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
              status={p.status !== 'ACTIVE' && !p.hq ? { label: p.status, tone: p.status === 'DEGRADED' ? 'warn' : 'bad', since: p.statusSince } : undefined}
              note={p.statusNote}
              leda={p.hq ? undefined : ledaMode(p)}
              headerNote={p.hq && open.some((o) => o.platform.id === 'hq') ? `${open.filter((o) => o.platform.id === 'hq').length} in Needs you` : undefined}
              maxRows={filter && !p.hq ? 4 : maxRows}
              activity={p.activity ? p.activity.slice(-(filter && !p.hq ? 4 : maxRows)).reverse() : undefined}
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
    return (
      <div className="px-pad pb-10 pt-5">
        <p className="m-0 text-small text-muted">{[p.kind, p.place ?? '', n ? `${n} in Needs you` : ''].filter(Boolean).map((t, i) => <span key={t}>{i ? <span aria-hidden className="mx-2 text-faint">/</span> : null}{t}</span>)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <PlatformLogo name={p.name} src={p.logo} index={p.index} size={24} decorative />
          <h2 ref={headingEl} tabIndex={-1} className="m-0 min-w-0 text-title text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">{p.name}</h2>
          <Button variant="primary" leftIcon={ArrowSquareOut} className="ml-auto" onClick={() => go({ to: 'platform', id: p.id })}>Open {p.name}</Button>
        </div>
        <FactsLine aria-label={`${p.name} facts`} className="mt-2">
          <Fact valueFirst value={<Badge tone={p.status === 'ACTIVE' ? 'ok' : p.status === 'DEGRADED' ? 'warn' : 'bad'}>{p.status === 'ACTIVE' ? 'ACTIVE' : p.status}</Badge>}>{p.statusSince ? `since ${p.statusSince}` : null}</Fact>
          {err ? <Fact tone="muted">no data · last good 9:10 AM</Fact> : p.facts.slice(0, 3).map((f, i) => <Fact key={i} value={f.value} tone={f.tone} valueFirst>{f.label}</Fact>)}
          <LedaFact mode={p.ledaCanAct ? 'acts' : p.status === 'OFFLINE' ? 'offline' : 'reads'} wide />
        </FactsLine>
        {err ? <p className="m-0 mt-5 text-ui text-muted">Couldn’t load {p.name}’s overview. Last good 9:10 AM.</p> : null}
        {p.lists.length && !err ? (
          <div className={cn('mt-5 grid gap-x-14 gap-y-12 @max-[720px]/sheet:gap-x-10', phone ? 'grid-cols-[minmax(0,1fr)]' : 'grid-cols-[repeat(auto-fit,minmax(236px,1fr))]')}>
            {listsOf(p).map((l) => (
              <PlatformToday key={l.id} surface="surface" platform={{ name: p.name, src: p.logo, index: p.index }} aria-label={`${p.name}: ${l.title}`} bare level={2} lists={[l]} maxRows={6} rowLayout={phone ? 'phone' : bodyW <= 720 ? 'narrow' : 'wide'} />
            ))}
          </div>
        ) : null}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 @min-[701px]/sheet:grid-cols-2">
          <section>
            <h3 className="m-0 mb-1 text-ui font-semibold leading-5 text-text">Today</h3>
            {err ? (
              <p className="m-0 text-ui text-muted">No data</p>
            ) : (
              <ol className="m-0 list-none p-0">
                {(p.activity ?? []).map((a) => (
                  <li key={a.id} className="grid grid-cols-[76px_minmax(0,1fr)] gap-x-3 border-t border-rule py-[7px] text-ui leading-[19px]">
                    <span className="whitespace-nowrap tabular-nums text-muted">{a.at}</span>
                    <span className="min-w-0 [overflow-wrap:anywhere]">{a.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          {conns.length ? (
            <section>
              <h3 className="m-0 mb-1 text-ui font-semibold leading-5 text-text">Linked platforms</h3>
              <ul className="m-0 list-none p-0">
                {conns.map((c) => {
                  const o = platformById(c.from === pid ? c.to : c.from)!;
                  const word = { ok: 'OK', slow: 'Slow', broken: 'Broken' }[c.status];
                  return (
                    <li key={`${c.from}-${c.to}`} className="flex items-center gap-2 border-t border-rule py-[7px] text-ui leading-[19px]">
                      <span aria-hidden className={cn('shrink-0', c.status === 'broken' ? 'h-0 w-3.5 border-t-[3px] border-dashed border-bad-dot' : cn('h-1 w-3.5 rounded-[2px]', c.status === 'slow' ? 'bg-warn-dot' : 'bg-accent'))} />
                      <PlatformLogo name={o.name} src={o.logo} index={o.index} hq={o.hq} size={16} decorative />
                      <span>{o.name}</span>
                      <span className="text-muted">{linkLabel(c.from, c.to)}</span>
                      <Badge tone={c.status === 'broken' ? 'bad' : c.status === 'slow' ? 'warn' : 'ok'} className="ml-auto">{word}</Badge>
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

  const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
  const propOf = (pid: string) => Object.values(data.cases).find((x) => x.proposal?.id === pid)?.proposal;
  const linesOf = (pid: string): DraftLine[] => [...(propOf(pid)?.lines ?? []), ...(extraLines[pid] ?? []).map((l) => ({ ...l, added: true }))];
  const caseView = (id: string) => {
    const item = lookup(id);
    if (!item) return null;
    const c = caseOf(id);
    const p = platformById(item.platform.id)!;
    const src = (item as { source?: string }).source;
    const isOpen = openIds.includes(id);
    const watch = !isOpen && data.watching.some((w) => w.id === id);
    const pr = c.proposal;
    const opt = pr?.options ? (pr.options.find((o) => o.id === (choice[pr.id] ?? pr.options![0]!.id)) ?? pr.options[0]) : null;
    const more = !!showMore[id];
    const involved = platformsOf(id).filter((pid) => pid !== failed);
    const acts = involved
      .flatMap((pid) => (platformById(pid)?.activity ?? []).map((a) => ({ ...a, pid })))
      .map((a) => ({ ...a, m: toMin(a.at) }))
      .filter((a) => a.m != null)
      .sort((x, y) => y.m! - x.m!)
      .slice(0, 4);
    const ev = c.evidence.slice(0, 6);
    const fold = ev.length > 3 || acts.length > 0;
    const sep = <span aria-hidden className="text-control">/</span>;
    const crumbs: ReactNode[] = [
      <Fragment key="p"><PlatformLogo name={p.name} src={p.logo} index={p.index} hq={p.hq} size={16} decorative /><b className="font-semibold text-text">{src ?? p.name}</b></Fragment>,
      ...(!src && p.kind ? [<span key="k" className="inline-flex items-center gap-1.5">{p.kind}</span>] : []),
      ...(p.status !== 'ACTIVE' ? [<Badge key="s" tone={p.status === 'DEGRADED' ? 'warn' : 'bad'}>{p.status}</Badge>] : []),
      ...(watch ? [<Badge key="w" tone="neutral">Watching</Badge>] : []),
    ];
    const snz = snoozed.find((x) => x.id === id);
    return (
      <div className="px-pad pb-10 pt-5 max-[640px]:pt-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-muted">
          {crumbs.map((x, i) => <Fragment key={i}>{i ? sep : null}{x}</Fragment>)}
        </div>
        <div className="mt-2 flex items-start gap-4 max-[640px]:flex-col max-[640px]:gap-2.5">
          <h2 ref={headingEl} tabIndex={-1} className="m-0 min-w-0 text-case text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">{item.title}</h2>
          <div className="ml-auto flex flex-none gap-2 max-[640px]:ml-0">
            {p && !c.open ? <Button variant="secondary" leftIcon={ArrowSquareOut} className="@max-[680px]/sheet:hidden" onClick={() => go(p.hq ? { to: 'team' } : { to: 'platform', id: p.id })}>Open {p.name}</Button> : null}
            {!phone ? <Menu trigger={<Button variant="secondary" leftIcon={Clock} rightIcon={CaretDown}>Snooze</Button>} items={snoozeItems(id)} align="end" /> : null}
          </div>
        </div>
        {snz ? <p className="m-0 mt-3 flex items-start gap-2.5 rounded-card bg-raised px-3.5 py-3 text-ui leading-[19px] text-text"><Clock aria-hidden size={14} className="mt-0.5" /><span>Snoozed · {snz.until}</span></p> : null}
        <FactsLine aria-label="Case facts" className="mt-2">
          {c.facts.map((f, i) => {
            const left = f.left != null ? f.left - nowMin : 0;
            return (
              <Fact key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                {f.leda ? (f.leda === 'cant' ? <Prohibit aria-hidden size={14} /> : <CheckCircle aria-hidden size={14} />) : null}
                {f.pre}
                {f.b ? <b className={cn('font-semibold text-text', f.num && 'tabular-nums')}>{f.b}</b> : null}
                {f.mono ? <span className="font-mono text-ui leading-5">{f.text}</span> : f.text && !f.leda ? f.text : null}
                {f.leda ? <span className={f.leda === 'can' ? 'text-ok' : undefined}>{f.text}</span> : null}
                {f.post}
                {left > 0 ? <span className={cn('font-semibold', left <= 90 ? 'text-bad' : 'text-warn')}>{dur(left)} left</span> : null}
              </Fact>
            );
          })}
        </FactsLine>
        {c.day ? (
          <DayLine
            open={c.day.hours.open}
            close={c.day.hours.close}
            now={nowMin}
            window={c.day.marks[0]!.at}
            marks={[{ t: nowMin, label: `Now ${hmin(nowMin)}`, short: 'Now', tone: 'now' }, ...c.day.marks.map((m) => ({ t: m.at, label: m.label, short: m.shortLabel ?? hmin(m.at), tone: (m.tone === 'bad' ? 'bad' : 'ink') as 'bad' | 'ink' }))]}
          />
        ) : null}
        <div className="mt-[22px] grid grid-cols-[minmax(0,1fr)_360px] items-start gap-gap @max-[900px]/sheet:grid-cols-[minmax(0,1fr)_320px] @max-[680px]/sheet:grid-cols-1">
          <div>
            <CaseKv items={(more ? ev : ev.slice(0, 3)).map((e) => ({ label: String(e.label), value: String(e.value), note: e.note ? String(e.note) : undefined, tone: e.tone, mono: e.mono }))} />
            {fold ? <MoreButton open={more} onClick={() => setShowMore((s) => ({ ...s, [id]: !s[id] }))} /> : null}
            {more && acts.length ? (
              <section className="mt-3">
                <h3 className="m-0 mb-1 text-ui font-semibold leading-5 text-text">Today in {involved.map((pid) => platformById(pid)?.name).join(' and ')}</h3>
                <ol className="m-0 list-none p-0">
                  {acts.map((a) => (
                    <li key={a.id + a.pid} className="grid grid-cols-[76px_minmax(0,1fr)] gap-x-3 border-t border-rule py-[7px] text-ui leading-[19px]">
                      <span className="whitespace-nowrap tabular-nums text-muted">{a.at}</span>
                      <span className="inline-flex items-start gap-1.5">{involved.length > 1 ? <span className="mt-0.5"><PlatformLogo name={platformById(a.pid)!.name} src={platformById(a.pid)!.logo} index={platformById(a.pid)!.index} hq={platformById(a.pid)!.hq} size={14} decorative /></span> : null}<span>{a.text}</span></span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
            {c.note ? <LedaNote className="mt-4" byline={`Leda, ${hmin(NOW)} AM`}>{c.note}</LedaNote> : null}
          </div>
          <div>
            {pr ? (
              <LedaDraft
                ref={proposalEl}
                id={pr.id}
                title={opt && pr.options ? `${opt.label}: ${pr.title.replace(/^(Approve|Resolve)\s/, '')}` : pr.title}
                options={pr.options?.map((o) => ({ id: o.id, label: o.label }))}
                option={opt?.id}
                onOption={(v) => setChoice((s) => ({ ...s, [pr.id]: v }))}
                lines={linesOf(pr.id)}
                writes={[...(opt ? opt.writes : pr.writes), ...(pr.addOn && addOn[pr.id] ? [`${pr.addOn.proposalId}: + ${pr.addOn.line.qty} ${pr.addOn.line.unit} ${pr.addOn.line.ref} (${peso(pr.addOn.line.qty * pr.addOn.line.unitCost)})`] : [])]}
                cannot={pr.cannot}
                notifies={opt ? opt.notifies : pr.notifies}
                addOn={pr.addOn ? { label: pr.addOn.label, amount: pr.addOn.line.qty * pr.addOn.line.unitCost, checked: !!addOn[pr.id], onChange: (v) => setAddOn((s) => ({ ...s, [pr.id]: v })) } : undefined}
                confirmLabel={opt?.confirmLabel ?? pr.confirmLabel}
                busy={pstate[id] === 'writing'}
                kbd={!phone}
                barOwnsConfirm={phone}
                onConfirm={() => confirm(id)}
                onDiscard={() => discard(id)}
              />
            ) : c.open ? (
              <div id="prop" ref={proposalEl} className="rounded-card bg-raised px-[18px] pb-[18px] pt-4 max-[640px]:px-4 max-[640px]:pb-4 max-[640px]:pt-3.5">
                <div className="flex items-center gap-2 text-small leading-5 text-muted"><LedaMark size={16} decorative /><span>No draft</span><span aria-hidden>·</span><span>{platformById(c.open.platformId)?.kind}</span></div>
                <h3 className="m-0 mt-2 text-[16px] font-semibold leading-[22px] text-text">{c.open.label}</h3>
                <div className="mt-[18px] flex flex-wrap items-center gap-2 max-[640px]:[&_button]:h-11"><Button className={c.open.primary ? 'max-[640px]:flex-[1_1_100%]' : undefined} variant={c.open.primary ? 'primary' : 'secondary'} leftIcon={ArrowSquareOut} onClick={() => go({ to: 'platform', id: c.open!.platformId })}>Open {platformById(c.open.platformId)?.name}</Button></div>
              </div>
            ) : c.plan ? (
              <div id="prop" ref={proposalEl} className="rounded-card bg-raised px-[18px] pb-[18px] pt-4 max-[640px]:px-4 max-[640px]:pb-4 max-[640px]:pt-3.5">
                <div className="flex items-center gap-2 text-small leading-5 text-muted"><LedaMark size={16} decorative /><span>{data.plan.name ?? 'Starter'} plan</span><span aria-hidden>·</span><span className="tabular-nums">{data.plan.cycleStart} to {data.plan.cycleEnd}</span></div>
                <h3 className="m-0 mt-2 text-[16px] font-semibold leading-[22px] tabular-nums text-text">{data.plan.used.toLocaleString('en-PH')} of {data.plan.max.toLocaleString('en-PH')} requests</h3>
                <div className="mt-3">
                  <div className="relative h-2 overflow-hidden rounded bg-raised-2"><span className={cn('absolute inset-y-0 left-0 rounded', Math.round((data.plan.used / data.plan.max) * 100) >= 80 ? 'bg-warn-dot' : 'bg-accent')} style={{ width: `${Math.round((data.plan.used / data.plan.max) * 100)}%` }} /></div>
                  <div className="mt-1.5 flex justify-between text-small text-muted"><span className="tabular-nums">0</span><span><b className="font-medium tabular-nums text-text">{Math.round((data.plan.used / data.plan.max) * 100)}%</b> used</span><span className="tabular-nums">{data.plan.max.toLocaleString('en-PH')}</span></div>
                </div>
                <div className="mt-[18px] flex flex-wrap items-center gap-2 max-[640px]:[&_button]:h-11"><Button variant="secondary" onClick={() => go({ to: 'plan' })}>See plan</Button></div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const hero = (
    <div className="mx-auto flex flex-col items-center px-pad pt-9 text-center max-[640px]:pt-6">
      <LedaMark size={88} effect={loading ? 'aurora' : 'glint'} active={loading} once={!loading} decorative />
      <h2 ref={headingEl} tabIndex={-1} className="m-0 mt-3.5 text-case text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">Good {dayPart}, {owner.short}</h2>
      <p className="m-0 mt-1 text-body text-muted">{run}</p>
      <div className="mt-7 w-full max-w-[560px] max-[640px]:hidden">{askBar('overview', true)}</div>
      <ChatChips
        className="mt-3 max-w-[780px] justify-center"
        variant="overview"
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
        <div className="mt-12 px-pad">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h3 id="ov7" className="m-0 text-section text-text">Last 7 days</h3>
            <span className="text-ui leading-5 text-muted">{data.weekRange ?? 'Thu 15 – Wed 21 Oct'}</span>
            <Button variant="text" leftIcon={SquaresFour} rightIcon={ArrowRight} className="ml-auto self-center !h-8" onClick={showToday}>Today at your platforms</Button>
          </div>
          <OverviewCharts
            variant="home"
            locale="en-PH"
            platforms={visible.map((p) => ({
              ...p.week,
              name: p.name,
              facts: (
                <FactsLine aria-label={`${p.name} facts`} className="!mt-0">
                  {p.facts.slice(0, 3).map((f, i) => <Fact key={i} value={f.value} valueFirst>{f.label}</Fact>)}
                  <LedaFact mode={ledaMode(p)} />
                </FactsLine>
              ),
              state: loading ? 'loading' : failed === p.id ? 'error' : 'ready',
              onRetry: () => { window.setTimeout(() => setFixed(true), 600); },
              onOpen: () => openPlatform(p.id),
            }))}
          />
        </div>
      ) : null}
      {(quiet && data.next) || (!loading && visible.length) ? (
        <div className="px-pad">
          <div className="mt-9 border-t border-border pt-5">
            {quiet ? (
              <p className="m-0 mb-6 flex items-center gap-2 text-body text-text">
                <CalendarBlank size={14} aria-hidden className="text-muted" />
                <span>{data.next}</span>
              </p>
            ) : null}
            {!loading && visible.length ? (
              <section aria-labelledby="yday">
                <h3 id="yday" className="m-0 mb-1 text-ui font-semibold leading-5 text-text">Yesterday, {data.yesterdayDate}</h3>
                <table className="w-full border-collapse text-ui">
                  <tbody>
                    {visible.map((p) => (
                      <tr key={p.id} className="border-t border-rule">
                        <th scope="row" className="py-[9px] pr-2 text-left font-normal text-text">
                          <span className="inline-flex items-center gap-2"><PlatformLogo name={p.name} src={p.logo} index={p.index} size={16} decorative />{p.name}</span>
                        </th>
                        <td className="whitespace-nowrap py-[9px] pl-3 text-right tabular-nums">
                          {p.yesterday.map((k, i) => (
                            <span key={String(k.label)}>{i ? <span className="text-muted"> · </span> : null}<b className="font-medium tabular-nums text-text">{k.value}</b> <span className="text-muted">{k.label}</span></span>
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
      ) : null}
    </div>
  );

  const tabItems: TabItem[] = tabs.map((id) => {
    if (id === 'today') return { value: 'today', label: 'Today', icon: SquaresFour, closable: true };
    if (id.startsWith('plat:')) {
      const pp = platformById(id.slice(5));
      return { value: id, label: pp?.name ?? id, leading: pp ? <PlatformLogo name={pp.name} src={pp.logo} index={pp.index} hq={pp.hq} size={14} decorative /> : undefined, closable: true };
    }
    const it = lookup(id);
    return { value: id, label: it ? (it.title.length > 30 ? `${it.title.slice(0, 29)}…` : it.title) : id, leading: it ? <PlatformLogo name={it.platform.name} src={it.platform.src} index={it.platform.index} hq={it.platform.hq} size={14} decorative /> : undefined, closable: true };
  });

  const sheetBar = phone ? undefined : overview ? undefined : (
    <SheetBar actions={askBar('bar', !overview)}>
      <Tabs variant="editor" aria-label="Open items" items={tabItems} value={tab ?? undefined} onValueChange={(v) => { setTab(v); }} onClose={closeTab} />
    </SheetBar>
  );

  const sheetBody = overview ? overviewView : tab === 'today' ? (inlineToday ? null : todayView) : platTab ? platformView(platTab) : caseView(tab);

  const phoneOverview = phone && quiet && !filter ? (
    <div className="-mx-1 mt-4 border-b border-border px-1 pb-6">
      <ChatChips
        className="-mx-4 mb-5 px-4"
        variant="strip"
        label="Ask Leda"
        chips={[...suggestions].sort((a, b) => a.length - b.length).map((q) => ({ id: q, label: q }))}
        onPick={(c: ChatChip) => ask(c.label)}
      />
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 className="m-0 text-section text-text">Last 7 days</h2>
        <span className="text-ui leading-5 text-muted">{data.weekRange ?? 'Thu 15 – Wed 21 Oct'}</span>
      </div>
      <OverviewCharts
        variant="home-phone"
        locale="en-PH"
        aria-label="Last 7 days, by platform"
        platforms={data.platforms.map((p) => ({
          ...p.week,
          name: p.name,
          chart: p.week.chart ? { ...p.week.chart, labels: p.week.chart.labels.map((l) => l.split(' ')[0]!) } : p.week.chart,
          state: 'ready' as const,
          onOpen: () => setFilterTo(p.id),
        }))}
      />
    </div>
  ) : null;

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
        caption={<><b className="font-semibold text-text">{data.platforms.length} platforms</b> <span>+ HQ</span></>}
        label="Your platforms"
        onAddPlatform={() => go({ to: 'platforms', add: true })}
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
        title={quiet && !filter ? 'All clear' : undefined}
        hideEmpty={quiet && data.watching.length > 0}
        flushGroups={!!phoneOverview}
        tightGroups={phone && !phoneOverview}
        footer={phoneOverview ? data.next : undefined}
        belowHeadline={phone ? <>{askBar('overview', false)}{phoneOverview}</> : undefined}
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
      <button
        type="button"
        className={cn('-ml-3 inline-flex h-11 items-center gap-1 rounded-control px-2 text-body text-text', focusRing)}
        onClick={() => {
          lastOpened.current = tab;
          slide('out');
          setPhoneDetail(false);
        }}
      >
        <CaretLeft aria-hidden size={14} />
        Needs you
      </button>
      {caseId ? <div className="ml-auto"><Menu trigger={<button type="button" aria-label="Snooze" className={cn('grid size-11 place-items-center rounded-control text-text', focusRing)}><Clock aria-hidden size={20} /></button>} items={snoozeItems(caseId)} align="end" /></div> : null}
      <div className="ml-auto">{askBar('bar', false)}</div>
    </>
  ) : undefined;
  const barCase = phone && phoneDetail && caseTab ? caseOf(caseTab) : null;
  const barPr = barCase?.proposal ?? null;
  const barOpt = barPr?.options ? (barPr.options.find((o) => o.id === (choice[barPr.id] ?? barPr.options![0]!.id)) ?? barPr.options[0]) : null;
  const barTotal = barPr ? linesOf(barPr.id).reduce((s, l) => s + l.qty * l.unitCost, 0) : 0;
  const actionBar = barPr && caseTab ? (
    reviewed === caseTab || pstate[caseTab] === 'writing' ? (
      <Button variant="primary" actionBar fullWidth disabled={pstate[caseTab] === 'writing'} onClick={() => confirm(caseTab)}>{pstate[caseTab] === 'writing' ? 'Writing…' : barOpt?.confirmLabel ?? barPr.confirmLabel}</Button>
    ) : (
      <Button variant="secondary" actionBar fullWidth onClick={() => proposalRef.current?.scrollIntoView({ block: 'center' })}>Review{barTotal ? ` · ${peso(barTotal)}` : ''}</Button>
    )
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
        actionBar={actionBar}
        topBar={detailBar}
        status={
          <StatusBar
            platforms={data.platforms.map((p) => ({ id: p.id, name: p.shortName ?? p.name, logoSrc: p.logo, color: p.index, initials: p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase(), health: p.id === failed ? 'bad' : healthOf(p), healthText: p.id === failed ? 'no data' : undefined, selected: filter === p.id, onSelect: () => setFilterTo(filter === p.id ? null : p.id) }))}
            people={{ count: 9 }}
            invites={{ count: data.hq.lists.find((l) => l.id === 'invites')?.total ?? 0 }}
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
          <ChatHeader layout="inline" busy={busy} empty={messages.length === 0} onNewConversation={() => setMessages([])} onClose={() => setChat(false)} />
          {messages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto pt-2"><ChatEmpty layout="workshop" scope={scopeName} chips={ledaSuggest.map((q) => ({ id: q, label: q }))} onPick={(c) => send(c.label)} /></div>
          ) : (
            <ChatThread>
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  layout="workshop"
                  onChip={(c) => send(c.label)}
                  onAction={(a) => { if (a.href) go(destFromHash(a.href)); }}
                  onConfirm={(bid) => {
                    setBlockProposal(bid, 'writing');
                    const after = messages.flatMap((m) => m.blocks).find((b) => b.type === 'proposal' && b.blockId === bid && b.proposal.after);
                    const text = after && after.type === 'proposal' ? String(after.proposal.after) : 'Done.';
                    return new Promise<void>((res) =>
                      window.setTimeout(() => {
                        setBlockProposal(bid, 'done', { after: text, doneAt: clock() });
                        toast.undo(text, () => setBlockProposal(bid, 'waiting'), { leda: true });
                        res();
                      }, 800),
                    );
                  }}
                  onDiscard={(bid) => setBlockProposal(bid, 'discarded')}
                />
              ))}
            </ChatThread>
          )}
          <ChatComposer layout="workshop" label="Message Leda" placeholder="Reply to Leda" value={text} onChange={setText} onSend={send} busy={busy} scope={`About ${scopeName}`} />
        </Chat>
      )}
      <Toaster />
    </>
  );
}
