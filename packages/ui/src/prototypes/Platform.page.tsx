import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowSquareOut, Brain, Buildings, ChatCircle, IdentificationCard, LinkBreak, Plugs, SlidersHorizontal, ListChecks, LockSimple, Plus,
  ShieldCheck, UploadSimple, UserPlus, Users, X,
} from '@phosphor-icons/react';
import { AskLedaBar } from '../components/AskLedaBar';
import { Badge } from '../components/Badge';
import { BlockedQuestions, type BlockedQuestionItem } from '../components/BlockedQuestions';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ConnectionsEditor, type Connection, type ConnectionOption, type ConnectionPlatform } from '../components/ConnectionsEditor';
import { ErrorBlock } from '../components/ErrorBlock';
import { Fact, FactsLine } from '../components/FactsLine';
import { TextField } from '../components/TextField';
import { FactsTable } from '../components/FactsTable';
import { IconButton } from '../components/IconButton';
import { LedaMark } from '../components/Leda';
import { LedaNote } from '../components/LedaNote';
import { Modal } from '../components/Modal';
import { OnboardingStepper, type StepperStep } from '../components/OnboardingStepper';
import { OpeningHours, type OpeningHoursValue } from '../components/OpeningHours';
import { PlatformLogo } from '../components/PlatformLogo';
import { Select } from '../components/Select';
import { SheetBar } from '../components/SheetBar';
import { Skeleton } from '../components/Skeleton';
import { StatusBar } from '../components/StatusBar';
import { StatusDot, type StatusTone } from '../components/StatusDot';
import { Switch } from '../components/Switch';
import { Tabs, type TabItem } from '../components/Tabs';
import { TownMap, type TownMapHandle, type TownMapLink, type TownMapSlot } from '../components/TownMap';
import { TryIt, type TryItAnswer } from '../components/TryIt';
import { Toaster } from '../components/toast/Toaster';
import { toast } from '../components/toast/toastStore';
import { cn } from '../utils/cn';
import { PortalFrame } from './PortalFrame';
import { catalogItem } from './Platforms.data';
import { go, useHandoff } from './protoNav';
import { focusIfLost } from '../utils/focusIfLost';
import { useMatchMedia } from '../utils/useMatchMedia';
import {
  SECTIONS, tabFacts, andList, basicLabels, companyWeek, dataKinds, dataTopics, detailsStart, everyBusinessBlocked, invites, kinds, ledaStart, linksStart,
  memoryCap, neverShared, nowSample, people, person, plural, platformsStart, publicHolidays, requestDefs, sectionName, settingsDefaults, shortName,
  sampleSet, today, tryQuestions, usage, type BasicKey, type CustomTopic, type DataLink, type DataKind, type Detail, type KindKey, type LedaState, type PlatformRec,
  type SectionId, type SettingField,
} from './Platform.data';

/* ---------- types ---------- */
export interface OnboardProps {
  kind: KindKey;
  /** Leda's prefilled add: "Add a Repair shop for the parts counter". Nothing is added until the person presses Add. */
  byLeda?: string;
  /** Prefilled name (`&label=`). */
  label?: string;
  /** 0-based step to resume at (`?id=…&setup=N`). Needs `id`. */
  step?: number;
  /** An existing platform being set up. */
  id?: string;
}
export interface PlatformPageProps {
  platformId?: string;
  tab?: SectionId;
  onboard?: OnboardProps;
  state?: 'live' | 'loading' | 'error';
  /** Connections row to flash (deep link `&tab=connections&link=…`). */
  flash?: string;
  /** Open a disconnect dialog on first render. */
  dialog?: 'blocked' | 'confirm';
  /** Start with this tab's draft changed, to show the "Unsaved" state. */
  dirtyTab?: SectionId;
}

interface GeneralV { label: string; basics: Partial<Record<BasicKey, string>>; logo: string | null }
interface SystemV { settings: Record<string, string | number | boolean>; hours: OpeningHoursValue }
interface Drafts { general?: GeneralV; system?: SystemV; team?: Record<string, string>; leda?: LedaState }
interface Ob { kind: KindKey; step: number; pid: string | null; byLeda?: string; done: SectionId[]; later: SectionId[] }
interface MemEdit { id: string; title: string; content: string; err?: string }

const PHONE = '(max-width: 640px)';
const canon = (o: unknown) => JSON.stringify(o, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce<Record<string, unknown>>((a, x) => ((a[x] = v[x]), a), {}) : v));
const lowerName = (n: string) => (/^Leda/.test(n) ? n : n.toLowerCase());
const saveName = (id: SectionId) => SECTIONS.find((s) => s.id === id)?.save ?? sectionName(id);
const sectionNames: Record<SectionId, string> = { general: 'General info', system: 'System', team: 'Team', connections: 'Connections', leda: 'Leda & Memory' };

const field =
  'block w-full min-w-0 rounded-control border bg-surface px-3 text-body text-text placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:border-accent';
const link = 'text-accent underline underline-offset-2 hover:text-accent-hover';


/* ---------- small pieces ---------- */
const KIND_CATALOG: Record<string, string> = { repair: 'repair_shop' };
function KindIcon({ kind, size = 16 }: { kind: string; size?: number }) {
  const Icon = catalogItem(KIND_CATALOG[kind] ?? kind)?.icon;
  return Icon ? <Icon size={size} aria-hidden /> : null;
}
/** The workshop `.hl`: dot and word at 12/16 in the health colour. */
function Health({ tone, word }: { tone: StatusTone; word: string }) {
  return <StatusDot status={tone} label={word} className={cn('leading-4', tone === 'ok' && 'text-ok', tone === 'warn' && 'text-warn', tone === 'bad' && 'text-bad')} />;
}
/** One platform's identity: its uploaded logo or default monogram on its colour (as in the Platforms page). */
function Logo({ x, size = 32, src }: { x: PlatformRec; size?: 14 | 16 | 20 | 24 | 32 | 40; src?: string }) {
  return <PlatformLogo name={x.label} size={size} decorative color={x.color} src={src ?? x.logo} initials={x.mono} />;
}

function SwitchField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="min-w-0 self-end pb-2">
      <Switch label={label} description={hint} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Heading({ id, level = 3, children, aside }: { id: string; level?: 3 | 4; children: ReactNode; aside?: ReactNode }) {
  const H = level === 3 ? 'h3' : 'h4';
  return (
    <div className="mb-1 flex items-baseline justify-between gap-3">
      <H id={id} className={cn('m-0 font-semibold text-text', level === 3 ? 'text-body' : 'text-ui')}>{children}</H>
      {aside ? <span className="text-small tabular-nums text-muted">{aside}</span> : null}
    </div>
  );
}

function FormFoot({ dirty, saveLabel, onDiscard, saveRef }: { dirty: boolean; saveLabel: string; onDiscard: () => void; saveRef?: React.Ref<HTMLButtonElement> }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <Button ref={saveRef} type="submit" variant="primary" disabled={!dirty} keepFocus className="aria-disabled:opacity-50">{saveLabel}</Button>
      <Button type="button" variant="text" disabled={!dirty} keepFocus className="aria-disabled:opacity-50" onClick={onDiscard}>Discard</Button>
      <span role="status" className="ml-1 text-small text-muted">{dirty ? 'Unsaved changes' : ''}</span>
    </div>
  );
}

function ToggleRow({ title, text, lock, meta, onTry, tryLabel, checked, onChange, children }: {
  title: string; text: string; lock?: string; meta?: ReactNode; onTry?: () => void; tryLabel?: string; checked: boolean; onChange: (v: boolean) => void; children?: ReactNode;
}) {
  return (
    <li className={cn('flex items-start gap-4 py-3', !checked && 'text-muted')}>
      <div className="min-w-0 flex-1">
        <b className={cn('block text-body font-semibold', checked ? 'text-text' : 'text-muted')}>{title}</b>
        <p className="m-0 mt-0.5 text-ui [overflow-wrap:anywhere]">{text}</p>
        {lock ? (
          <p className="m-0 mt-1 flex items-start gap-1.5 text-small text-muted"><LockSimple aria-hidden size={14} className="mt-0.5 shrink-0" /><span>Off by default. {lock}</span></p>
        ) : null}
        {meta ? <p className="m-0 mt-1 flex flex-wrap items-center gap-x-1.5 text-small text-muted">{meta}</p> : null}
        {onTry ? <Button variant="text" className="-ml-2 mt-1" onClick={onTry} aria-label={`Try it: ${tryLabel}`}>Try it</Button> : null}
        {children}
      </div>
      <Switch aria-label={`${title}: customers’ Leda can use this`} checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </li>
  );
}

/* ---------- the page ---------- */
export function PlatformPage({ platformId: platformId0 = 'autoworks', tab: tab00 = 'general', onboard, state = 'live', flash, dialog, dirtyTab }: PlatformPageProps) {
  const arrived = useHandoff('platform');
  const platformId = arrived?.platform && !onboard ? arrived.platform : platformId0;
  const tab0 = arrived?.tab && !onboard ? arrived.tab : tab00;
  const uid = useId();
  const phone = useMatchMedia(PHONE);
  const [platforms, setPlatforms] = useState<PlatformRec[]>(platformsStart);
  const [details, setDetails] = useState<Record<string, Detail>>(detailsStart);
  const [links, setLinks] = useState<DataLink[]>(linksStart);
  const [pid, setPid] = useState(platformId);
  const [ob, setOb] = useState<Ob | null>(() => {
    if (!onboard) return null;
    if (onboard.id) {
      const d = detailsStart()[onboard.id];
      const step = Math.max(1, Math.min(4, onboard.step ?? 1));
      return { kind: onboard.kind, step, pid: onboard.id, done: SECTIONS.slice(0, step).map((s) => s.id).filter((s) => !(d?.skipped ?? []).includes(s)), later: d?.skipped ?? [] };
    }
    return { kind: onboard.kind, step: 0, pid: null, byLeda: onboard.byLeda, done: [], later: [] };
  });
  const [tab, setTab] = useState<SectionId>(tab0);
  const [drafts, setDrafts] = useState<Drafts>(() => {
    if (dirtyTab === 'general') return { general: { label: 'Dela Cruz Auto Works Quezon City', basics: detailsStart().autoworks.basics, logo: null } };
    return {};
  });
  const [hover, setHover] = useState<string[] | null>(null);
  const [flashId, setFlashId] = useState<string | null>(flash ?? null);
  const [confirmDisc, setConfirmDisc] = useState(dialog === 'confirm');
  const [blockedDisc, setBlockedDisc] = useState(dialog === 'blocked');
  const [unteam, setUnteam] = useState<string | null>(null);
  const [delTopic, setDelTopic] = useState<CustomTopic | null>(null);
  const [memEdit, setMemEdit] = useState<MemEdit | null>(null);
  const [tryOpen, setTryOpen] = useState(false);
  const [tryQ, setTryQ] = useState<string | undefined>();
  const [genErr, setGenErr] = useState('');
  const [teamPick, setTeamPick] = useState('');
  const [gone, setGone] = useState(false);
  const mapRef = useRef<TownMapHandle>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const uploadBtn = useRef<HTMLButtonElement>(null);
  const topicAddBtn = useRef<HTMLButtonElement>(null);
  const topicTitle = useRef<HTMLInputElement>(null);
  const teamAddRef = useRef<HTMLDivElement>(null);
  const [tabId, setTabId] = useState<string | undefined>();
  const [focusTick, setFocusTick] = useState<{ what: string; n: number } | null>(null);

  const p = ob ? (ob.pid ? platforms.find((x) => x.id === ob.pid) : undefined) : platforms.find((x) => x.id === pid);
  const d = p ? details[p.id] : undefined;
  const kind = kinds[ob ? ob.kind : (p?.kind ?? 'repair')];
  const first = ob ? SECTIONS[ob.step].id : tab;

  /* ----- drafts ----- */
  const committed = (sec: SectionId): unknown => {
    if (sec === 'general') return d ? ({ label: d.label, basics: d.basics, logo: d.logo ?? null } as GeneralV) : undefined;
    if (sec === 'system') return d ? ({ settings: d.settings, hours: d.hours } as SystemV) : undefined;
    if (sec === 'team') return d?.team;
    if (sec === 'leda') return d?.leda;
    return undefined;
  };
  const blankGeneral = (): GeneralV => ({ label: onboard?.label ?? kind.name, basics: {}, logo: null });
  const general: GeneralV = drafts.general ?? (committed('general') as GeneralV | undefined) ?? blankGeneral();
  const system: SystemV = drafts.system ?? (committed('system') as SystemV | undefined) ?? { settings: settingsDefaults(kind.key), hours: { sameAsCompany: true, week: { ...companyWeek }, holidays: { closed: true, openOn: [] }, closures: [] } };
  const team: Record<string, string> = drafts.team ?? d?.team ?? {};
  const leda: LedaState = drafts.leda ?? d?.leda ?? ledaStart(kind.key, general.label);
  const isDirty = (sec: SectionId) => {
    if (!p) return sec === 'general' && !!ob;
    const dr = drafts[sec as keyof Drafts];
    return !!dr && canon(dr) !== canon(committed(sec));
  };
  const setDraft = <K extends keyof Drafts>(sec: K, v: Drafts[K]) => setDrafts((x) => ({ ...x, [sec]: v }));
  const clearDraft = (sec: SectionId) => setDrafts((x) => { const n = { ...x }; delete n[sec as keyof Drafts]; return n; });
  const anyDirty = !ob && (['general', 'system', 'team'] as SectionId[]).some(isDirty);
  const dirtyRef = useRef(false);
  dirtyRef.current = anyDirty;

  useEffect(() => {
    if (!anyDirty) return undefined;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [anyDirty]);

  // Esc goes back, unless it closes a menu, dropdown, palette or dialog, or focus is in a text field.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest('input, textarea, select, [contenteditable="true"]') || t.closest('[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]'))) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]')) return;
      if (dirtyRef.current) toast({ description: 'Save or discard your changes first.' });
      else go({ to: 'platforms' });
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  // The panel is named by the tab that opened it (the tab list lives in the place column, outside the Tabs panels).
  useLayoutEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    setTabId(el?.id || undefined);
  }, [tab, phone, p?.id, ob]);

  // Focus requests made by a handler run here, after the new DOM is in. Dialogs call `doFocus` from onCloseAutoFocus instead,
  // once the dialog is gone (while it is still mounted focus sits inside it and counts as the person's own).
  const doFocus = (w: string | null) => {
    const root = sheetRef.current;
    if (!w) return;
    if (w === 'upload') focusIfLost(root, uploadBtn.current);
    else if (w === 'topic-add') focusIfLost(root, topicAddBtn.current);
    else if (w === 'topic-title') topicTitle.current?.focus();
    else if (w === 'team-add') focusIfLost(root, teamAddRef.current?.querySelector<HTMLElement>('button, [role="combobox"]') ?? null);
    else if (w.startsWith('team-row:')) focusIfLost(root, root?.querySelector<HTMLElement>(`[data-person="${w.slice(9)}"] [role="combobox"], [data-person="${w.slice(9)}"] button`) ?? null);
    else if (w === 'panel') focusIfLost(root, panelRef.current);
  };
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!focusTick) return;
    doFocus(focusTick.what);
    setFocusTick(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);
  const refocus = (what: string) => setFocusTick((t) => ({ what, n: (t?.n ?? 0) + 1 }));

  /* ----- derived: health, links, map ----- */
  const needsLink = (x: PlatformRec) => kinds[x.kind].reads.length > 0 && !links.some((l) => l.to === x.id);
  const healthOf = (x: PlatformRec): { tone: StatusTone; word: string } => {
    if (x.isNew) return needsLink(x) ? { tone: 'neutral', word: 'Setup needed' } : { tone: 'accent', word: 'Setting up' };
    if (x.health === 'slow') return { tone: 'warn', word: x.note ?? 'Slow' };
    if (x.health === 'offline') return { tone: 'bad', word: 'Offline' };
    return { tone: 'ok', word: 'Running' };
  };
  const nameOf = (id: string) => details[id]?.label ?? platforms.find((x) => x.id === id)?.label ?? id;
  const connPlatform = (id: string): ConnectionPlatform => {
    const x = platforms.find((q) => q.id === id)!;
    return { id, name: nameOf(id), kind: kinds[x.kind].name, index: x.index, src: details[id]?.logo };
  };
  const toConn = (l: DataLink, dir: 'reads' | 'shares', otherId: string): Connection => ({
    id: `${dir}:${l.kind}:${otherId}`,
    platform: connPlatform(otherId),
    kind: dataKinds[l.kind].name,
    shares: dataKinds[l.kind].shares,
    status: l.status,
    statusLabel: l.status === 'pending' ? 'Connects when you continue' : undefined,
  });
  const reads = p ? links.filter((l) => l.to === p.id).map((l) => toConn(l, 'reads', l.from)) : [];
  const shares = p ? links.filter((l) => l.from === p.id).map((l) => toConn(l, 'shares', l.to)) : [];
  const available: ConnectionOption[] = useMemo(() => {
    if (!p) return [];
    const out: ConnectionOption[] = [];
    platforms.filter((q) => q.id !== p.id).forEach((q) => {
      const qk = kinds[q.kind];
      qk.provides.filter((k) => kind.reads.includes(k) && !links.some((l) => l.from === q.id && l.to === p.id && l.kind === k)).forEach((k) => {
        const c = toConn({ from: q.id, to: p.id, kind: k, status: ob ? 'pending' : 'linked' }, 'reads', q.id);
        out.push({ id: c.id, direction: 'reads', label: `Read ${dataKinds[k].name.toLowerCase()} from ${nameOf(q.id)}`, connection: c });
      });
      kind.provides.filter((k) => qk.reads.includes(k) && !links.some((l) => l.from === p.id && l.to === q.id && l.kind === k)).forEach((k) => {
        const c = toConn({ from: p.id, to: q.id, kind: k, status: ob ? 'pending' : 'linked' }, 'shares', q.id);
        out.push({ id: c.id, direction: 'shares', label: `Share ${dataKinds[k].name.toLowerCase()} with ${nameOf(q.id)}`, connection: c });
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id, platforms, links, details, ob]);
  const linkFromId = (c: Connection, dir: 'reads' | 'shares'): DataLink => {
    const [, k, other] = c.id.split(':');
    return dir === 'reads' ? { from: other, to: p!.id, kind: k as DataKind, status: c.status === 'pending' ? 'pending' : 'linked' } : { from: p!.id, to: other, kind: k as DataKind, status: c.status === 'pending' ? 'pending' : 'linked' };
  };
  const sameLink = (a: DataLink, b: DataLink) => a.from === b.from && a.to === b.to && a.kind === b.kind;

  const mapPlatforms: TownMapSlot[] = sampleSet.slots.map((id): TownMapSlot => {
    const x = id ? platforms.find((q) => q.id === id) : undefined;
    if (!x) return null;
    const h = healthOf(x);
    const k = kinds[x.kind];
    return { id: x.id, name: nameOf(x.id), shortName: shortName(x), kind: k.name, mapType: k.mapType, status: h.tone === 'bad' ? 'OFFLINE' : h.tone === 'warn' ? 'DEGRADED' : 'ACTIVE', sub: `${k.name} · ${h.word.toLowerCase()}`, color: x.color, logo: details[x.id]?.logo ?? x.logo, initials: x.mono, index: x.index };
  });
  const mapLinks: TownMapLink[] = links.map((l) => ({ from: l.from, to: l.to, status: l.status === 'slow' ? 'slow' : 'ok' }));

  /* ----- section status words (tab list) ----- */
  const secStatus = (sec: SectionId, x: PlatformRec): [string, 'warn' | 'muted'] => {
    const dd = details[x.id];
    if (!ob && sec !== 'connections' && sec !== 'leda' && isDirty(sec)) return ['Unsaved', 'warn'];
    if (dd.skipped.includes(sec) && x.isNew) return ['Skipped', 'warn'];
    if (sec === 'general') return dd.basics.address ? ['Address set', 'muted'] : ['No address yet', 'warn'];
    if (sec === 'system') {
      const n = kinds[x.kind].settings.filter((f) => dd.settings[f.key] !== f.def).length;
      return [`${tabFacts(x.id, x.kind).ownHours ? 'Own hours' : 'Company hours'}${n ? ` · ${plural(n, 'change')}` : ''}`, 'muted'];
    }
    if (sec === 'team') { const n = tabFacts(x.id, x.kind).people; return n ? [plural(n, 'person', 'people'), 'muted'] : ['Nobody yet', 'warn']; }
    if (sec === 'connections') {
      if (needsLink(x)) return ['Setup needed', 'warn'];
      const n = links.filter((l) => l.to === x.id || l.from === x.id).length;
      return [n ? plural(n, 'link') : 'No links', 'muted'];
    }
    const tf = tabFacts(x.id, x.kind);
    const b = tf.blocked;
    return [`${tf.topicsOn} of ${tf.topicsAll} topics on${b ? ` · ${b} blocked` : ''}`, 'muted'];
  };

  /* ----- saving ----- */
  const commit = (sec: 'general' | 'system' | 'team', quiet?: boolean) => {
    if (!p) return;
    const before = details[p.id];
    const draft = drafts[sec];
    if (!draft) return;
    setDetails((all) => {
      const cur = all[p.id];
      if (sec === 'general') { const g = draft as GeneralV; return { ...all, [p.id]: { ...cur, label: g.label, basics: g.basics, logo: g.logo ?? undefined } }; }
      if (sec === 'system') { const s = draft as SystemV; return { ...all, [p.id]: { ...cur, settings: s.settings, hours: s.hours } }; }
      return { ...all, [p.id]: { ...cur, team: draft as Record<string, string> } };
    });
    if (sec === 'general') setPlatforms((all) => all.map((x) => (x.id === p.id ? { ...x, label: (draft as GeneralV).label } : x)));
    clearDraft(sec);
    if (!quiet) {
      toast.undo(`${saveName(sec).replace(/^./, (c) => c.toUpperCase())} saved.`, () => {
        setDetails((all) => ({ ...all, [p.id]: before }));
        setPlatforms((all) => all.map((x) => (x.id === p.id ? { ...x, label: before.label } : x)));
      });
    }
  };
  const submit = (sec: 'general' | 'system' | 'team') => {
    if (sec === 'general' && !general.label.trim()) { setGenErr('Give it a name.'); return; }
    setGenErr('');
    commit(sec);
  };

  /* ----- onboarding ----- */
  const steps: StepperStep[] = ob
    ? SECTIONS.map((s, i) => ({
        id: s.id,
        label: s.name,
        required: !s.optional,
        status: ob.done.includes(s.id) ? 'done' : ob.later.includes(s.id) ? 'skipped' : 'todo',
        locked: !ob.pid && i > 0,
        reason: !ob.pid && i > 0 ? 'Add the platform first.' : undefined,
      }))
    : [];
  const finishOb = (later: SectionId[]) => {
    if (!ob?.pid) return;
    const id = ob.pid;
    setDetails((all) => ({ ...all, [id]: { ...all[id], skipped: later } }));
    setPid(id);
    setOb(null);
    setTab(later.length ? later[0] : 'general');
    setDrafts({});
    refocus('panel');
  };
  const advance = (skip: boolean) => {
    if (!ob) return;
    const sec = SECTIONS[ob.step].id;
    // step 1 creates the platform
    if (!ob.pid) {
      if (!general.label.trim()) { setGenErr('Give it a name.'); return; }
      setGenErr('');
      const id = `new-${platforms.length + 1}`;
      const rec: PlatformRec = { id, label: general.label.trim(), kind: ob.kind, place: general.basics.address ?? '', health: 'offline', connected: '22 Oct 2026', isNew: true, index: platforms.length + 1 };
      setPlatforms((all) => [...all, rec]);
      setDetails((all) => ({ ...all, [id]: { label: rec.label, basics: general.basics, logo: general.logo ?? undefined, settings: settingsDefaults(ob.kind), hours: system.hours, team: {}, leda: ledaStart(ob.kind, rec.label), skipped: [] } }));
      setDrafts({});
      setOb({ ...ob, pid: id, step: 1, done: ['general'] });
      toast({ description: 'Platform added.' });
      return;
    }
    if (!skip) {
      if (sec === 'system') commit('system', true);
      if (sec === 'team') commit('team', true);
      if (sec === 'leda' && drafts.leda) { const l = drafts.leda; setDetails((all) => ({ ...all, [ob.pid!]: { ...all[ob.pid!], leda: l } })); }
      if (sec === 'connections') setLinks((all) => all.map((l) => (l.to === ob.pid || l.from === ob.pid ? { ...l, status: 'linked' } : l)));
      if (sec === 'general') commit('general', true);
    }
    clearDraft(sec);
    const done = skip ? ob.done : [...new Set([...ob.done, sec])];
    const later = skip ? [...new Set([...ob.later, sec])] : ob.later.filter((x) => x !== sec);
    if (ob.step === SECTIONS.length - 1) {
      setOb({ ...ob, done, later });
      finishOb(later);
      return;
    }
    const next = ob.step + 1;
    // Connections: preselect the only provider as a pending row.
    if (SECTIONS[next].id === 'connections' && !links.some((l) => l.to === ob.pid)) {
      const prov = platforms.filter((q) => q.id !== ob.pid && kinds[q.kind].provides.some((k) => kinds[ob.kind].reads.includes(k)));
      if (prov.length === 1) {
        const k = kinds[prov[0].kind].provides.find((x) => kinds[ob.kind].reads.includes(x))!;
        setLinks((all) => [...all, { from: prov[0].id, to: ob.pid!, kind: k, status: 'pending' }]);
      }
    }
    setOb({ ...ob, step: next, done, later });
  };
  const goStep = (id: string) => { if (ob) setOb({ ...ob, step: SECTIONS.findIndex((s) => s.id === id) }); };

  /* ----- Leda state writes ----- */
  const writeLeda = (next: LedaState, undoMsg?: string) => {
    if (ob) { setDraft('leda', next); return; }
    if (!p) return;
    const before = details[p.id].leda;
    setDetails((all) => ({ ...all, [p.id]: { ...all[p.id], leda: next } }));
    if (undoMsg) toast.undo(undoMsg, () => setDetails((all) => ({ ...all, [p.id]: { ...all[p.id], leda: before } })));
  };
  const toggleTopic = (key: string, title: string, on: boolean) => writeLeda({ ...leda, data: { ...leda.data, [key]: on } }, `${title} turned ${on ? 'on' : 'off'}.`);
  const toggleRequest = (key: string, title: string, on: boolean) => writeLeda({ ...leda, requests: { ...leda.requests, [key]: on } }, `${title} turned ${on ? 'on' : 'off'}.`);
  const used = leda.custom.reduce((n, c) => n + c.title.length + c.content.length, 0) + 1840;
  const room = memoryCap - used;
  const saveTopic = () => {
    if (!memEdit || !p) return;
    const t = memEdit.title.trim(), c = memEdit.content.trim();
    if (!t || !c) { setMemEdit({ ...memEdit, err: 'Write a title and what Leda should know.' }); return; }
    if (leda.custom.some((x) => x.id !== memEdit.id && x.title.toLowerCase() === t.toLowerCase())) { setMemEdit({ ...memEdit, err: 'A memory with this title already exists.' }); return; }
    const delta = t.length + c.length - (leda.custom.find((x) => x.id === memEdit.id)?.title.length ?? 0) - (leda.custom.find((x) => x.id === memEdit.id)?.content.length ?? 0);
    if (delta > room) { setMemEdit({ ...memEdit, err: 'The memory is full. Shorten or delete entries first.' }); return; }
    if (memEdit.id === 'new') {
      const id = `k${Date.now()}`;
      writeLeda({ ...leda, custom: [...leda.custom, { id, title: t, content: c, updated: 'Today' }], data: { ...leda.data, [`c:${id}`]: true } }, `${t} added.`);
    } else writeLeda({ ...leda, custom: leda.custom.map((x) => (x.id === memEdit.id ? { ...x, title: t, content: c, updated: 'Today' } : x)) }, `${t} saved.`);
    const wasNew = memEdit.id === 'new';
    setMemEdit(null);
    refocus(wasNew ? 'topic-add' : 'panel');
  };
  const answer = (about: string, q: string): TryItAnswer => {
    void about;
    const refusal = leda.reply;
    const [t, k] = [q.slice(0, 1), q.slice(2)];
    const nm = d?.label ?? '';
    if (t === 't') {
      const tp = dataTopics[kind.key].find((x) => x.key === k)!;
      return leda.data[k] ? { tone: 'ok', answer: tp.text, reason: `Used the topic “${tp.title}”, from ${nm} data.` } : { tone: 'no', answer: refusal, reason: `The topic “${tp.title}” is off.` };
    }
    if (t === 'c') {
      const c = leda.custom.find((x) => x.id === k);
      if (!c) return { tone: 'no', answer: refusal, reason: 'That topic was deleted.' };
      return leda.data[`c:${k}`] ? { tone: 'ok', answer: c.content, reason: `Used the topic “${c.title}”, written by you.` } : { tone: 'no', answer: refusal, reason: `The topic “${c.title}” is off.` };
    }
    if (t === 'r') {
      const r = requestDefs[kind.key].find((x) => x[0] === k)!;
      return leda.requests[k] ? { tone: 'ok', answer: `I have sent that to the team at ${nm}. They will confirm with you.`, reason: `The request “${r[1]}” is on. Staff accept it.` } : { tone: 'no', answer: refusal, reason: `The request “${r[1]}” is off.` };
    }
    return { tone: 'no', answer: refusal, reason: 'This is a blocked question: Leda never answers it.' };
  };

  /* ----- disconnect ----- */
  const sharing = p ? links.filter((l) => l.from === p.id) : [];
  const startDisconnect = () => (sharing.length ? setBlockedDisc(true) : setConfirmDisc(true));
  const doDisconnect = () => {
    if (!p) return;
    setConfirmDisc(false);
    setLinks((all) => all.filter((l) => l.from !== p.id && l.to !== p.id));
    setPlatforms((all) => all.filter((x) => x.id !== p.id));
    setGone(true);
    toast({ description: `${nameOf(p.id)} disconnected.` });
  };

  /* ----- the logo ----- */
  const readLogo = (file: File | undefined) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const s = Math.min(img.width, img.height) || 1;
        c.getContext('2d')?.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
        setDraft('general', { ...general, logo: c.toDataURL('image/png') });
      };
      img.onerror = () => setDraft('general', { ...general, logo: String(fr.result) });
      img.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  };

  /* =============== section bodies =============== */
  const generalBody = () => {
    const customLogo = general.logo ? true : general.logo === '' ? false : !!p?.logo;
    return (
      <>
        <div className="grid max-w-[720px] gap-x-6 gap-y-6 @min-[641px]/sheet:grid-cols-2">
          <TextField id={`${uid}-name`} label="Name" value={general.label} required hint="Give this a clear name, like a branch name." error={genErr || undefined} onChange={(v) => { setGenErr(''); setDraft('general', { ...general, label: v }); }} />
          <div className="min-w-0">
            <span id={`${uid}-logo`} className="block text-body font-medium text-text">Logo</span>
            <div role="group" aria-labelledby={`${uid}-logo`} className="mt-2 flex items-center gap-3">
              {p ? <Logo x={p} src={general.logo ?? undefined} size={40} /> : <PlatformLogo name={general.label || kind.name} src={general.logo ?? undefined} index={platforms.length + 1} size={40} decorative />}
              <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { readLogo(e.target.files?.[0]); e.target.value = ''; }} />
              <Button ref={uploadBtn} type="button" variant="secondary" leftIcon={UploadSimple} onClick={() => logoInput.current?.click()}>Upload</Button>
              {customLogo ? (
                <Button type="button" variant="text" onClick={() => { setDraft('general', { ...general, logo: '' }); refocus('upload'); }}>Use the default</Button>
              ) : (
                <span className="text-small text-muted">Default: initials on a colour.<br />PNG, JPG or SVG.</span>
              )}
            </div>
          </div>
          {kind.basics.map((b) => (
            <TextField key={b} id={`${uid}-b-${b}`} label={basicLabels[b][0]} hint={basicLabels[b][1]} type={b === 'phone' ? 'tel' : 'text'} className={b === 'address' ? '@min-[641px]/sheet:col-span-2' : undefined} value={general.basics[b] ?? ''} onChange={(v) => setDraft('general', { ...general, basics: { ...general.basics, [b]: v } })} />
          ))}
        </div>
      </>
    );
  };
  const factsAndDanger = () => {
    if (!p) return null;
    const h = healthOf(p);
    return (
      <>
        <FactsTable
          className="mt-8"
          items={[
            { label: 'Kind', value: <><KindIcon kind={p.kind} />{kind.name}</> },
            { label: 'Status', value: <Health tone={h.tone} word={h.word} /> },
            { label: 'Version', value: p.version ?? 'Not reported yet' },
            { label: 'Last synced', value: p.synced ?? 'Not synced yet' },
            { label: 'Connected', value: p.connected },
            { label: 'App', value: kind.hasApp ? <Button type="button" variant="secondary" className="h-7" leftIcon={ArrowSquareOut} onClick={() => toast({ description: `Opening ${shortName({ label: nameOf(p.id) })}.` })}>Open {shortName({ label: nameOf(p.id) })}</Button> : <span className="text-muted">No app yet. It works through its data links.</span> },
          ]}
        />
        <section aria-labelledby={`${uid}-dz`} className="mt-8 flex max-w-[720px] items-start gap-4 rounded-card border border-border p-4 max-[640px]:flex-col max-[640px]:gap-2.5">
          <div className="min-w-0">
            <h3 id={`${uid}-dz`} className="m-0 text-ui font-semibold leading-5 text-text">Disconnect</h3>
            <p className="m-0 mt-0.5 text-ui leading-[19px] text-muted">
              {sharing.length
                ? `${andList([...new Set(sharing.map((l) => nameOf(l.to)))])} ${sharing.length === 1 ? 'reads' : 'read'} its ${andList([...new Set(sharing.map((l) => dataKinds[l.kind].name.toLowerCase()))])}. Remove ${sharing.length === 1 ? 'that link' : 'those links'} first.`
                : 'Removes it and its data links. This can’t be undone.'}
            </p>
          </div>
          <Button type="button" variant="secondary" leftIcon={LinkBreak} onClick={startDisconnect} className="ml-auto shrink-0 text-bad hover:border-bad max-[640px]:ml-0 max-[640px]:h-[var(--ctl-touch)]">Disconnect</Button>
        </section>
      </>
    );
  };

  const settingField = (f: SettingField) => {
    const v = system.settings[f.key];
    const set = (nv: string | number | boolean) => setDraft('system', { ...system, settings: { ...system.settings, [f.key]: nv } });
    const id = `${uid}-s-${f.key}`;
    if (f.type === 'toggle') return <SwitchField key={f.key} label={f.label} hint={f.hint} checked={!!v} onChange={set} />;
    if (f.type === 'select')
      return (
        <div key={f.key} className="min-w-0">
          <span id={`${id}-l`} className="mb-1 block text-ui font-medium text-text">{f.label}</span>
          <Select aria-labelledby={`${id}-l`} value={String(v)} onValueChange={set} options={f.options!.map((o) => ({ value: o, label: o }))} />
          {f.hint ? <p className="mt-1 text-small text-muted">{f.hint}</p> : null}
        </div>
      );
    return <TextField key={f.key} id={id} label={f.label} unit={f.unit} hint={f.hint} type={f.type === 'number' ? 'number' : 'text'} value={String(v ?? '')} onChange={(nv) => set(f.type === 'number' ? (nv === '' ? '' : Number(nv)) : nv)} />;
  };
  const systemBody = () => (
    <>
      <div className="grid max-w-[720px] gap-x-6 gap-y-6 @min-[641px]/sheet:grid-cols-2">{kind.settings.map(settingField)}</div>
      <div className="mt-8">
        <OpeningHours
          value={system.hours}
          onChange={(hours) => setDraft('system', { ...system, hours })}
          companyWeek={companyWeek}
          publicHolidays={publicHolidays}
          today={today}
          now={nowSample}
          platformName={shortName({ label: d?.label ?? general.label })}
          headingLevel={3}
        />
      </div>
    </>
  );

  const teamBody = () => {
    if (!p) return null;
    const rs = kind.roles;
    const rank = (id: string) => rs.findIndex((r) => r.id === team[id]);
    const ids = Object.keys(team).sort((a, b) => rank(a) - rank(b));
    const others = people.filter((x) => !team[x.id]);
    const elsewhere = (id: string) => {
      const o = platforms.filter((q) => q.id !== p.id && details[q.id]?.team[id]).map((q) => `${kinds[q.kind].roles.find((r) => r.id === details[q.id].team[id])?.name} at ${shortName({ label: nameOf(q.id) })}`);
      return o.length ? ` · also ${andList(o)}` : '';
    };
    const pending = invites.filter((v) => v.platformId === p.id);
    return (
      <>
        {ids.length ? (
          <ul className="m-0 list-none divide-y divide-rule p-0">
            {ids.map((id) => {
              const x = person(id);
              return (
                <li key={id} data-person={id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-raised text-small font-semibold text-muted">{x.initials}</span>
                  <span className="min-w-0 flex-1 basis-40">
                    <a href="#team" onClick={(e) => { e.preventDefault(); go({ to: 'team' }); }} className={cn(link, 'text-body font-medium no-underline hover:underline')}>{x.name}</a>
                    <span className="block text-small text-muted">
                      {x.access === 'member' ? x.title : <Badge tone="neutral">{x.access === 'owner' ? 'Admin · Owner' : 'Admin'}</Badge>}{elsewhere(id)}
                    </span>
                  </span>
                  <Select
                    size="sm"
                    className="w-44"
                    aria-label={`${x.name}’s role at ${nameOf(p.id)}`}
                    value={team[id]}
                    onValueChange={(v) => setDraft('team', { ...team, [id]: v })}
                    options={rs.map((r) => ({ value: r.id, label: r.name }))}
                  />
                  <IconButton icon={X} label={`Take ${x.name} off ${nameOf(p.id)}`} onClick={() => setUnteam(id)} />
                </li>
              );
            })}
            {pending.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-control bg-surface text-small font-semibold text-muted">{v.name.split(' ').map((w) => w[0]).join('')}</span>
                <span className="min-w-0 flex-1 basis-40">
                  <a href="#team" onClick={(e) => { e.preventDefault(); go({ to: 'team' }); }} className={cn(link, 'text-body font-medium no-underline hover:underline')}>{v.name}</a>
                  <span className="block text-small text-muted">{v.sent ? 'Invited, not joined yet' : 'Invite not sent yet'}</span>
                </span>
                <span className="text-ui text-muted">{rs.find((r) => r.id === v.roleId)?.name} when they join</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-ui text-muted">Nobody works here yet. Add the people who run {nameOf(p.id)}.</p>
        )}
        {others.length ? (
          <div ref={teamAddRef} className="mt-4 flex flex-wrap items-center gap-2">
            <Select size="sm" className="w-64" aria-label={`Add a person to ${nameOf(p.id)}`} placeholder="Choose a person…" value={teamPick} onValueChange={setTeamPick} options={others.map((x) => ({ value: x.id, label: x.name, meta: x.title }))} />
            <Button type="button" variant="secondary" leftIcon={UserPlus} disabled={!teamPick} keepFocus onClick={() => { setDraft('team', { ...team, [teamPick]: (rs[1] ?? rs[0]).id }); setTeamPick(''); refocus('team-add'); }}>Add to {shortName({ label: nameOf(p.id) })}</Button>
          </div>
        ) : null}
        <dl className="m-0 mt-6 grid gap-1 text-small text-muted">
          {rs.map((r) => <div key={r.id}><dt className="inline font-semibold text-text">{r.name}</dt> <dd className="m-0 inline">{(r.about ?? '').replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())}</dd></div>)}
        </dl>
        <p className="m-0 mt-2 text-small text-muted">The roles of {kind.lower}. Someone can hold a different role on each platform.</p>
        <p className="m-0 mt-3 text-ui"><a href="#team" onClick={(e) => { e.preventDefault(); go({ to: 'team' }); }} className={cn(link, 'inline-flex items-center gap-1.5')}><Users aria-hidden size={16} />Roles, invites and everyone on Team</a></p>
      </>
    );
  };

  const connectionsBody = () => {
    if (!p) return null;
    const flashBlocked = flashId;
    return (
      <ConnectionsEditor
        platformId={p.id}
        platformName={nameOf(p.id)}
        reads={reads}
        shares={shares}
        available={available}
        flashId={flashBlocked}
        shortcuts={false}
        sourceKinds={kind.reads.length ? platforms.filter((q) => kinds[q.kind].provides.some((k) => kind.reads.includes(k))).length ? undefined : ['Inventory'] : undefined}
        onHover={(c) => setHover(c ? [p.id, c.platform.id] : null)}
        onAdd={(o, ch) => {
          setLinks((all) => [...all, linkFromId(o.connection, o.direction)]);
          if (!ch.undo && !ob) mapRef.current?.runVan(o.direction === 'reads' ? o.connection.platform.id : p.id, o.direction === 'reads' ? p.id : o.connection.platform.id);
        }}
        onRemove={(c, dir) => setLinks((all) => all.filter((l) => !sameLink(l, linkFromId(c, dir))))}
      />
    );
  };

  const ledaBody = () => {
    if (!p && !ob) return null;
    const nm = shortName({ label: d?.label ?? general.label });
    const topics = dataTopics[kind.key];
    const onCount = topics.filter((t) => leda.data[t.key]).length + leda.custom.filter((c) => leda.data[`c:${c.id}`]).length;
    const nAll = topics.length + leda.custom.length;
    const reqs = requestDefs[kind.key];
    const nr = reqs.filter((r) => leda.requests[r[0]]).length;
    const pId = p?.id ?? 'new';
    const every: BlockedQuestionItem[] = Array.from({ length: everyBusinessBlocked }, (_, i) => ({ id: `e${i}`, question: ['Can I get a discount for my friend?', 'Are you cheaper than the shop next door?'][i], scope: 'company' }));
    const openTry = (q: string) => { setTryQ(q); setTryOpen(true); };
    const form = (m: MemEdit) => (
      <form
        className="rounded-card border border-border bg-raised p-4"
        onSubmit={(e) => { e.preventDefault(); saveTopic(); }}
        noValidate
      >
        <label htmlFor={`${uid}-tt`} className="mb-1 block text-ui font-medium text-text">Title</label>
        <input ref={topicTitle} id={`${uid}-tt`} value={m.title} maxLength={60} autoComplete="off" aria-invalid={m.err ? true : undefined} aria-describedby={m.err ? `${uid}-te` : undefined} onChange={(e) => setMemEdit({ ...m, title: e.target.value, err: undefined })} className={cn(field, 'h-[var(--ctl-dropdown)]', m.err ? 'border-bad' : 'border-control')} />
        <label htmlFor={`${uid}-tc`} className="mb-1 mt-3 block text-ui font-medium text-text">What Leda should know</label>
        <textarea id={`${uid}-tc`} rows={3} value={m.content} maxLength={600} onChange={(e) => setMemEdit({ ...m, content: e.target.value, err: undefined })} className={cn(field, 'resize-none py-2', m.err ? 'border-bad' : 'border-control')} />
        {m.err ? <p id={`${uid}-te`} role="alert" className="mt-1 text-small text-bad-ink">{m.err}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="submit" variant="primary">Save topic</Button>
          <Button type="button" variant="text" onClick={() => { const wasNew = m.id === 'new'; setMemEdit(null); refocus(wasNew ? 'topic-add' : 'panel'); }}>Cancel</Button>
        </div>
      </form>
    );
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="m-0 max-w-[52ch] text-body">Each topic has a switch. <b className="font-semibold">Off means Leda can’t answer any customer question that needs that topic.</b></p>
          <Button type="button" variant="secondary" leftIcon={ChatCircle} aria-haspopup="dialog" onClick={() => openTry(`t:${topics[0].key}`)}>Try it</Button>
        </div>

        <section aria-labelledby={`${uid}-mem`}>
          <Heading id={`${uid}-mem`} aside={`${onCount} of ${nAll} topics on`}>Memory</Heading>
          <h4 className="m-0 mt-3 text-ui font-semibold text-text">From this platform</h4>
          <p className="m-0 text-small text-muted">Written from {nm}’s own data, so they change when the data does.</p>
          <ul className="m-0 mt-1 list-none divide-y divide-rule p-0">
            {topics.map((t) => (
              <ToggleRow
                key={t.key}
                title={t.title}
                text={t.text}
                lock={t.sensitive}
                tryLabel={t.ask}
                onTry={() => openTry(`t:${t.key}`)}
                checked={!!leda.data[t.key]}
                onChange={(on) => toggleTopic(t.key, t.title, on)}
                meta={
                  <>
                    <span>Comes from {nm} data</span>
                    {'tab' in t.edit ? (
                      <><span aria-hidden>·</span><a href={`#${t.edit.tab}`} className={link} onClick={(e) => { e.preventDefault(); if (!ob) setTab(t.edit && 'tab' in t.edit ? t.edit.tab : 'general'); }}>{t.edit.label}</a></>
                    ) : (
                      <><span aria-hidden>·</span><span>{t.edit.app}</span></>
                    )}
                  </>
                }
              />
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="m-0 text-ui font-semibold text-text">Custom</h4>
            <span className="text-small tabular-nums text-muted">{room.toLocaleString('en-PH')} of {memoryCap.toLocaleString('en-PH')} characters left</span>
          </div>
          <p className="m-0 text-small text-muted">Topics you write: common questions, policies, payment, directions.</p>
          {leda.custom.length ? (
            <ul className="m-0 mt-1 list-none divide-y divide-rule p-0">
              {leda.custom.map((c) =>
                memEdit?.id === c.id ? (
                  <li key={c.id} className="py-3">{form(memEdit)}</li>
                ) : (
                  <ToggleRow
                    key={c.id}
                    title={c.title}
                    text={c.content}
                    tryLabel={c.title}
                    onTry={() => openTry(`c:${c.id}`)}
                    checked={!!leda.data[`c:${c.id}`]}
                    onChange={(on) => toggleTopic(`c:${c.id}`, c.title, on)}
                    meta={
                      <>
                        <span>Written by you · updated {c.updated}</span>
                        <Button type="button" variant="text" aria-label={`Edit ${c.title}`} onClick={() => { setMemEdit({ id: c.id, title: c.title, content: c.content }); refocus('topic-title'); }}>Edit</Button>
                        <Button type="button" variant="text" aria-label={`Delete ${c.title}`} onClick={() => setDelTopic(c)}>Delete</Button>
                      </>
                    }
                  />
                ),
              )}
            </ul>
          ) : (
            <p className="m-0 mt-2 text-ui text-muted">No custom topics yet. Add what customers often ask about {d?.label ?? general.label}, like its warranty or where to park.</p>
          )}
          <div className="mt-3">
            {memEdit?.id === 'new' ? form(memEdit) : <Button ref={topicAddBtn} type="button" variant="secondary" leftIcon={Plus} onClick={() => { setMemEdit({ id: 'new', title: '', content: '' }); refocus('topic-title'); }}>Add a topic</Button>}
          </div>
        </section>

        <div role="group" aria-labelledby={`${uid}-bq`}>
          <Heading id={`${uid}-bq`}>Blocked questions</Heading>
          <BlockedQuestions
            items={[...leda.blocked.map((b) => ({ ...b, scope: pId })), ...every]}
            scopes={[{ id: 'company', label: 'Every business' }, { id: pId, label: d?.label ?? general.label }]}
            replies={{ company: 'I can’t help with that one. Please ask our staff.', [pId]: leda.reply }}
            scope={pId}
            shortcuts={false}
            intro="Leda won’t answer these, even when a topic could. Every one gets the same reply."
            inheritedLink={<a className={link} href="#memory" onClick={(e) => { e.preventDefault(); go({ to: 'memory' }); }}>in Memory</a>}
            onBlock={({ question }) => writeLeda({ ...leda, blocked: [...leda.blocked, { id: `n${Date.now()}`, question, scope: pId }] })}
            onRemove={(item, { undo }) => writeLeda({ ...leda, blocked: undo ? [item, ...leda.blocked] : leda.blocked.filter((b) => b.id !== item.id) })}
            onEditReply={(_s, text) => writeLeda({ ...leda, reply: text })}
            onTry={(item) => openTry(`b:${item.id}`)}
          />
        </div>

        <section aria-labelledby={`${uid}-rq`}>
          <Heading id={`${uid}-rq`} aside={`${nr} of ${reqs.length} on`}>Requests customers can make</Heading>
          <p className="m-0 text-small text-muted">Each request goes to staff to accept. Leda never accepts one on its own.</p>
          <ul className="m-0 mt-1 list-none divide-y divide-rule p-0">
            {reqs.map((r) => (
              <ToggleRow key={r[0]} title={r[1]} text={r[2]} tryLabel={r[3]} onTry={() => openTry(`r:${r[0]}`)} checked={!!leda.requests[r[0]]} onChange={(on) => toggleRequest(r[0], r[1], on)} />
            ))}
          </ul>
        </section>

        <p className="m-0 flex items-start gap-2 text-ui text-muted"><ShieldCheck aria-hidden size={18} className="mt-0.5 shrink-0" /><span>{neverShared} Your team’s own use of Leda follows their role on the Team tab.</span></p>
        <a href="#memory" onClick={(e) => { e.preventDefault(); go({ to: 'memory' }); }} className={cn(link, 'inline-flex items-center gap-2 text-ui no-underline hover:underline')}><Brain aria-hidden size={18} />Manage all platforms in Memory<ArrowRight aria-hidden size={16} /></a>
      </div>
    );
  };

  const subs: Record<SectionId, string> = {
    general: 'Name, logo and where to find it.',
    system: `How ${kind.lower} works for ${shortName({ label: d?.label ?? general.label })}, and when it’s open.`,
    team: 'Who works here, and the role each holds here.',
    connections: 'What it reads from your other platforms, and who reads from it.',
    leda: `What customers’ Leda knows about ${shortName({ label: d?.label ?? general.label })} in your mobile app, and what it won’t answer.`,
  };

  const body = (sec: SectionId) => {
    if (sec === 'general') return <>{generalBody()}{!ob ? factsAndDanger() : null}</>;
    if (sec === 'system') return systemBody();
    if (sec === 'team') return teamBody();
    if (sec === 'connections') return connectionsBody();
    return ledaBody();
  };
  const editable = (sec: SectionId): sec is 'general' | 'system' | 'team' => sec === 'general' || sec === 'system' || sec === 'team';

  const section = (sec: SectionId) => {
    const dirty = editable(sec) && isDirty(sec);
    const foot = <FormFoot dirty={dirty} saveLabel={`Save ${lowerName(saveName(sec))}`} onDiscard={() => { clearDraft(sec); setGenErr(''); }} />;
    const inner = sec === 'general' && !ob ? <>{generalBody()}{foot}{factsAndDanger()}</> : body(sec);
    const head = (
      <header className="flex flex-wrap items-baseline gap-x-2.5 gap-y-2.5">
        <h2 id={`${uid}-h-${sec}`} className="m-0 flex items-center gap-2 text-dialog font-semibold text-text">
          {sec === 'leda' ? <LedaMark size={20} decorative /> : null}{sectionNames[sec]}
        </h2>
        <p className="m-0 text-ui leading-[18px] text-muted">{subs[sec]}</p>
      </header>
    );
    return (
      <section ref={panelRef} role={ob ? undefined : 'tabpanel'} aria-labelledby={ob ? `${uid}-h-${sec}` : tabId} tabIndex={-1} className={cn('outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent', !ob && 'mt-5 border-t border-rule pb-2 pt-7')}>
        {head}
        {editable(sec) && !ob ? (
          <form onSubmit={(e) => { e.preventDefault(); submit(sec); }} noValidate className="mt-6">
            {inner}
            {sec === 'general' ? null : foot}
          </form>
        ) : ob ? (
          inner
        ) : (
          <div className="mt-6">{inner}</div>
        )}
      </section>
    );
  };

  /* =============== chrome =============== */
  const tabItems: TabItem[] = p
    ? SECTIONS.map((s) => {
        const [w, tone] = secStatus(s.id, p);
        const icon = { general: IdentificationCard, system: SlidersHorizontal, team: Users, connections: Plugs, leda: undefined }[s.id];
        return { value: s.id, label: s.name, icon, leading: s.id === 'leda' ? <LedaMark size={16} decorative /> : undefined, status: w, statusTone: tone === 'warn' ? 'warn' : 'muted' } as TabItem;
      })
    : [];
  const kindAny = kind;
  const header = p && !ob ? (
    <div className={phone ? 'mt-4' : undefined}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-muted">
        <a href="#platforms" onClick={(e) => { e.preventDefault(); go({ to: 'platforms' }); }} className="rounded-[2px] hover:text-text">All platforms</a>
        <span aria-hidden className="text-control">/</span>
        <span className="inline-flex items-center gap-1.5"><KindIcon kind={p.kind} size={14} />{kind.name}</span>
      </div>
      <div className={`mt-2 flex gap-3 ${phone ? 'flex-wrap items-start' : 'items-center'}`}>
        <Logo x={p} src={details[p.id].logo} />
        <h1 className={`m-0 font-semibold text-text ${phone ? 'text-[18px] leading-[25px]' : 'text-case'}`}>{nameOf(p.id)}</h1>
        <div className={phone ? 'flex basis-full gap-2 [&>*]:h-11 [&>*]:flex-1' : 'ml-auto flex shrink-0 gap-2'}>
          {needsLink(p) ? (
            <Button variant="primary" leftIcon={ArrowRight} onClick={() => { setTab('connections'); setFlashId(null); refocus('panel'); }}>Finish setup</Button>
          ) : kindAny.hasApp ? (
            <Button variant="primary" leftIcon={ArrowSquareOut} onClick={() => toast({ description: `Opening ${shortName({ label: nameOf(p.id) })}.` })}>Open {shortName({ label: nameOf(p.id) })}</Button>
          ) : (
            <span className="text-ui text-muted">No app yet</span>
          )}
        </div>
      </div>
      <FactsLine className="mt-2" aria-label="Facts">
        <Fact><Health tone={healthOf(p).tone} word={healthOf(p).word} /></Fact>
        <Fact>{p.synced ? `Synced ${p.synced}` : 'Not synced yet'}</Fact>
        {p.version ? <Fact>{p.version}</Fact> : null}
        <Fact>Connected {p.connected}</Fact>
      </FactsLine>
      {p.isNew && details[p.id].skipped.length ? (
        <p role="note" className="m-0 mt-3 flex max-w-[720px] items-start gap-2 rounded-card bg-raised p-3 text-ui text-text">
          <ListChecks aria-hidden size={18} className="mt-0.5 shrink-0 text-muted" />
          <span>You skipped {andList(details[p.id].skipped.map((x) => lowerName(sectionNames[x])))} while setting up. Fill {details[p.id].skipped.length === 1 ? 'it' : 'them'} in on {details[p.id].skipped.length === 1 ? 'its tab' : 'their tabs'} whenever you’re ready.</span>
        </p>
      ) : null}
    </div>
  ) : null;

  const place = (
    <div className="flex min-h-0 flex-col gap-4 px-2 pb-4">
      <div className="-mx-2">
      <TownMap
        ref={mapRef}
        platforms={mapPlatforms}
        links={mapLinks}
        selected={p?.id ?? null}
        focus={p?.id ?? null}
        highlight={hover}
        dimOthers
        loading={state === 'loading'}
        caption={<><b className="font-semibold text-text">{plural(platforms.length, 'platform')}</b> · {links.length ? plural(links.length, 'data link') : 'no data links'}</>}
        label="This platform on your map"
        onSelect={(id) => { if (id && id !== p?.id && !ob) { setPid(id); setDrafts({}); setTab('general'); setMemEdit(null); } }}
        onHover={(id) => setHover(id ? [id] : null)}
      />
      </div>
      <div className="px-1">
        <div className="mt-0.5 flex items-center gap-2.5">
          {p ? <Logo x={p} src={details[p.id].logo} /> : <PlatformLogo name={general.label || kind.name} src={general.logo ?? undefined} index={platforms.length + 1} size={32} decorative />}
          <p className="m-0 min-w-0 flex-1 truncate text-title font-semibold tracking-[-0.01em] text-text">{p ? nameOf(p.id) : general.label || kind.name}</p>
        </div>
        <p className="m-0 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] leading-5 text-muted">
          <span>{kind.name}{p?.place ? ` · ${p.place}` : ''}</span>
          {p ? <Health tone={healthOf(p).tone} word={healthOf(p).word} /> : <span>Not added yet</span>}
        </p>
      </div>
      {p && !ob ? (
        <div ref={tabsRef} className="-mx-2 -mt-1">
          <Tabs variant="vertical" aria-label={nameOf(p.id)} items={tabItems} value={tab} onValueChange={(v) => { setTab(v as SectionId); setFlashId(null); setGenErr(''); }} />
        </div>
      ) : null}
    </div>
  );

  const ask = <AskLedaBar variant="bar" scope="your platforms" onOpen={() => toast({ description: 'Leda is ready.', leda: true })} />;
  const crumbs = [{ label: 'All platforms', href: '#platforms', onClick: (e: MouseEvent) => { e.preventDefault(); go({ to: 'platforms' }); } }, ...(ob ? [{ label: 'Add a platform' }] : []), { label: p ? nameOf(p.id) : ob ? general.label || kind.name : 'Platform' }];

  const whereCrumbs = [{ label: 'All platforms', icon: ArrowLeft, plain: true, href: '#platforms', onClick: (e: MouseEvent) => { e.preventDefault(); go({ to: 'platforms' }); } }, ...(ob ? [{ label: 'Add a platform' }] : []), { label: p ? nameOf(p.id) : ob ? general.label || kind.name : 'Platform', ...(p ? { leading: <Logo x={p} src={details[p.id].logo} size={16} /> } : {}) }];

  const obTitle = p ? `Set up ${nameOf(p.id)}` : `Add ${/^[AEIOU]/.test(kind.name) ? 'an' : 'a'} ${kind.name}`;
  const lastStep = ob ? ob.step === SECTIONS.length - 1 : false;
  const content = (() => {
    if (state === 'loading') {
      return (
        <div className="p-pad" aria-busy="true">
          <h1 className="sr-only">Loading this platform</h1>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="mt-6 h-10 w-full max-w-[560px]" />)}
        </div>
      );
    }
    if (state === 'error') return <div className="p-pad"><h1 className="sr-only">This platform</h1><ErrorBlock thing="this platform" lastLoaded="9:10 AM" onRetry={() => {}} /></div>;
    if (gone || (!p && !ob)) {
      return (
        <div className="p-pad">
          <p role="status" className="m-0 text-body text-text">This platform is no longer connected.</p>
          <Button className="mt-3" variant="secondary" onClick={() => go({ to: 'platforms' })}>All platforms</Button>
        </div>
      );
    }
    if (ob) {
      return (
        <div className="p-pad">
          <h1 className="m-0 mb-4 text-title font-semibold text-text">{obTitle}</h1>
          <OnboardingStepper
            steps={steps}
            current={SECTIONS[ob.step].id}
            onStepChange={goStep}
            description={`Step ${ob.step + 1} of ${SECTIONS.length} · ${sectionNames[SECTIONS[ob.step].id]}${SECTIONS[ob.step].optional ? ' · you can skip this' : ''}`}
            intro={ob.byLeda && !p ? <LedaNote byline="Leda, 9:12 AM">Filled in from “{ob.byLeda}”. Nothing is added until you press Add and continue.</LedaNote> : undefined}
            continueLabel={!p ? 'Add and continue' : lastStep ? 'Finish setup' : 'Save and continue'}
            onContinue={() => advance(false)}
            onSkip={SECTIONS[ob.step].optional ? () => advance(true) : undefined}
            onBack={ob.step > 0 ? () => setOb({ ...ob, step: ob.step - 1 }) : undefined}
            onFinishLater={p && !lastStep ? () => finishOb(ob.later) : undefined}
          >
            <div ref={panelRef} className="max-w-[720px]">
              <p className="sr-only" id={`${uid}-h-${first}`}>{sectionNames[first]}</p>
              {body(first)}
            </div>
          </OnboardingStepper>
        </div>
      );
    }
    return (
      <div ref={sheetRef} className="p-pad pb-8 pt-5 max-[640px]:pt-4">
        <div>
          {phone && p ? (
            <div ref={tabsRef} className="sticky top-0 z-[5] -mx-4 -mt-4 border-b border-rule bg-surface px-4 py-2">
              <Tabs variant="chips" aria-label={nameOf(p.id)} items={tabItems.map((t) => ({ ...t, status: undefined }))} value={tab} onValueChange={(v) => { setTab(v as SectionId); setFlashId(null); }} />
            </div>
          ) : null}
          {header}
          {section(tab)}
        </div>
      </div>
    );
  })();

  return (
    <>
      <PortalFrame
        current="platforms"
        pageName="Platform"
        heading={null}
        account={{ name: sampleSet.owner.name, email: sampleSet.owner.email, role: sampleSet.owner.role, initials: sampleSet.owner.initials }}
        onAddPlatform={() => go({ to: 'platforms', add: true })}
        onNavigate={go}
        placeLabel="This platform on your map"
        sheetLabel={p ? nameOf(p.id) : 'Platform'}
        detail
        place={place}
        topBar={
          <>
            <Breadcrumbs variant="phone" aria-label="Back" items={crumbs} />
            <span className="min-w-0 flex-1" />
            <AskLedaBar variant="bar" scope="your platforms" shortcuts={false} onOpen={() => toast({ description: 'Leda is ready.', leda: true })} />
          </>
        }
        sheetBar={phone ? undefined : <SheetBar actions={ask} wrapChildren={false}><Breadcrumbs variant="where" aria-label="You are here" items={whereCrumbs} /></SheetBar>}
        status={<StatusBar ledaFirst platforms={platforms.map((x) => { const h = healthOf(x); return { id: x.id, name: shortName(x), initials: x.mono, color: x.color, logoSrc: x.logo, health: h.tone === 'ok' ? 'ok' as const : h.tone === 'bad' ? 'bad' as const : h.tone === 'accent' ? 'accent' as const : 'warn' as const, healthText: x.isNew || x.health !== 'ok' ? h.word.split(' since')[0].toLowerCase() : undefined, href: `#${x.id}` }; })} summary={<><span className="tabular-nums">{plural(platforms.length, 'platform')}</span>{platforms.every((x) => !x.isNew && x.health === 'ok') ? <span>· all running</span> : null}</>} people={{ count: sampleSet.people }} leda={{ used: sampleSet.usedRequests, max: usage.limit, daysLeft: `${usage.daysLeft} days left` }} plan={sampleSet.plan} updatedAt="9:12 AM" />}
      >
        {content}
      </PortalFrame>
      <Toaster />

      <TryIt
        open={tryOpen}
        onOpenChange={setTryOpen}
        abouts={[{ value: p?.id ?? 'new', label: d?.label ?? general.label, icon: <PlatformLogo name={d?.label ?? general.label} index={p?.index ?? 1} decorative /> }]}
        about={p?.id ?? 'new'}
        aboutFixed
        questions={tryQuestions(kind.key, leda.blocked, leda.custom)}
        question={tryQ}
        onQuestionChange={setTryQ}
        ask={answer}
        thinkingMs={200}
      />

      <ConfirmDialog
        open={confirmDisc}
        onOpenChange={setConfirmDisc}
        title={`Disconnect ${p ? nameOf(p.id) : ''}?`}
        description="This removes it and its data links. This can’t be undone."
        name={p ? nameOf(p.id) : undefined}
        context={p ? `${kind.name}${p.place ? ` · ${p.place}` : ''}` : undefined}
        icon={LinkBreak}
        confirmLabel="Disconnect"
        tone="danger"
        onCancel={() => setConfirmDisc(false)}
        onConfirm={doDisconnect}
      />
      <Modal
        open={blockedDisc}
        onOpenChange={setBlockedDisc}
        size="sm"
        title={`${p ? nameOf(p.id) : ''} still shares data`}
        icon={Buildings}
        footer={
          <>
            <Button variant="text" onClick={() => setBlockedDisc(false)}>Close</Button>
            <Button variant="primary" onClick={() => { setBlockedDisc(false); const l = sharing[0]; setTab('connections'); setFlashId(l ? `shares:${l.kind}:${l.to}` : null); }}>View connections</Button>
          </>
        }
      >
        <p className="m-0 text-body text-text">
          {andList(sharing.map((l) => `${nameOf(l.to)} reads its ${dataKinds[l.kind].name.toLowerCase()}`))}. Remove {sharing.length === 1 ? 'that link' : 'those links'} first.
        </p>
      </Modal>
      <ConfirmDialog
        open={!!unteam}
        onOpenChange={(o) => !o && setUnteam(null)}
        title={`Take ${unteam ? person(unteam).name : ''} off ${p ? nameOf(p.id) : ''}?`}
        description="They lose their role here. It applies when you save the team."
        name={unteam ? person(unteam).name : undefined}
        context={unteam && p ? kind.roles.find((r) => r.id === team[unteam])?.name : undefined}
        icon={X}
        confirmLabel="Take off"
        tone="danger"
        onCancel={() => setUnteam(null)}
        onCloseAutoFocus={(e) => { e.preventDefault(); doFocus(pendingFocus.current); pendingFocus.current = null; }}
        onConfirm={() => {
          if (!unteam) return;
          const rest = Object.keys(team).filter((i) => i !== unteam);
          const next = Object.fromEntries(rest.map((i) => [i, team[i]]));
          const idx = Object.keys(team).indexOf(unteam);
          setDraft('team', next);
          setUnteam(null);
          pendingFocus.current = rest.length ? `team-row:${rest[Math.min(idx, rest.length - 1)]}` : 'team-add';
        }}
      />
      <ConfirmDialog
        open={!!delTopic}
        onOpenChange={(o) => !o && setDelTopic(null)}
        title="Delete this topic?"
        description="Leda stops using it for customers."
        name={delTopic?.title}
        context="Custom topic"
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDelTopic(null)}
        onCloseAutoFocus={(e) => { e.preventDefault(); doFocus('topic-add'); }}
        onConfirm={() => {
          if (!delTopic) return;
          const t = delTopic;
          const before = leda;
          const { [`c:${t.id}`]: _drop, ...data } = leda.data;
          void _drop;
          writeLeda({ ...leda, custom: leda.custom.filter((c) => c.id !== t.id), data });
          setDelTopic(null);
          toast.undo(`${t.title} deleted.`, () => writeLeda(before));
        }}
      />
    </>
  );
}
