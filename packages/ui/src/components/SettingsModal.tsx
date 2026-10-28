import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Bell, Check, Desktop, Key, Lightbulb, SignOut, User, X, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { ActionLink } from './ActionLink';
import { Switch } from './Switch';

/*
 * RDY-402 I20. Transcribed from inventory-home FINAL/settings-modal.css (all), settings-modal.js (build/ask/keep/finish/open 17-77),
 * my-settings.css (all) and settings.js (ITEMS 33-41, normPhone 76-77, mount 100-end). The one form draws both frames: the modal
 * with a side nav (`layout="modal"`) and the inline page form without tabs (`layout="page"`, `compact` for the stocker's phone page).
 */
export interface SettingsValue {
  /** Contact number as typed or saved. */
  phone: string;
  /** Notification id -> on. */
  notify: Record<string, boolean>;
  /** Channel id (`app`, `sms`, `email`) -> on. */
  channels: Record<string, boolean>;
  /** Leda suggestions. */
  leda: boolean;
}

export interface SettingsNotification {
  id: string;
  label: string;
  help: string;
  /** Group heading in the modal ("Stock and deliveries", "Transfers", "Requests"). The page form lists them all under "Tell me when". */
  group: string;
}

export interface SettingsChannel {
  id: string;
  label: string;
  /** Helper under the label. The `sms` row ignores it: it says where the text goes. */
  help?: string;
}

export type SettingsTheme = 'light' | 'dark' | 'system';
export type SettingsTabId = 'profile' | 'display' | 'notifications' | 'leda' | 'account';

export interface SettingsFormProps {
  /** `modal`: side nav (a strip on a phone), one footer. `page`: one long form, no tabs. */
  layout?: 'modal' | 'page';
  /** Page layout on the stocker's phone: 48px fields, 52px Save. */
  compact?: boolean;
  /** The stocker role: no Leda section, no Back to Portal, stocker copy. */
  stocker?: boolean;
  /** Platform name, e.g. "Parts Stockroom". */
  platform: string;
  person: { name: string; initials: string; title: string; roleLabel?: string };
  /** Notifications this role may have, already gated by role permission. */
  notifications: SettingsNotification[];
  channels: SettingsChannel[];
  /** What Leda can do for this role (ledaScope()). Leave out for no Leda section. */
  ledaScope?: string[];
  /** Saved settings. */
  value: SettingsValue;
  /** Called with the new settings when Save passes. Throw or reject to show a failed save: edits are kept. */
  onSave: (next: SettingsValue) => void | Promise<void>;
  theme: SettingsTheme;
  /** Theme applies at once. */
  onThemeChange: (theme: SettingsTheme) => void;
  /** Time shown in "Saved at ..." (e.g. "9:12 AM"). */
  savedAt: string;
  portalHref: string;
  signOutHref: string;
  /** Modal layout: tab to open on, and the tab last used while the modal stays open. */
  tab?: SettingsTabId;
  onTabChange?: (tab: SettingsTabId) => void;
  /** Cancel in the footer (modal layout). */
  onCancel?: () => void;
  /** Reports whether there are unsaved edits, and the count line the discard question uses. */
  onDirtyChange?: (state: { dirty: boolean; count: number; tabs: string[] }) => void;
  state?: 'loading' | 'error';
  /** Error state: "Last loaded ...". */
  lastLoaded?: string;
  onRetry?: () => void;
}

export interface SettingsModalProps extends Omit<SettingsFormProps, 'layout' | 'compact' | 'onCancel' | 'onDirtyChange' | 'tab' | 'onTabChange'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tab to open on (`?settings=notifications`). */
  tab?: SettingsTabId;
}

const GROUPS = ['Stock and deliveries', 'Transfers', 'Requests'];
const TABS: { id: SettingsTabId; label: string; sec: string; Ic: PhosphorIcon }[] = [
  { id: 'profile', label: 'Profile', sec: 'profile', Ic: User },
  { id: 'display', label: 'Display', sec: 'disp', Ic: Desktop },
  { id: 'notifications', label: 'Notifications', sec: 'notify', Ic: Bell },
  { id: 'leda', label: 'Leda', sec: 'leda', Ic: Lightbulb },
  { id: 'account', label: 'Account', sec: 'acct', Ic: Key },
];
const TL: Record<string, string> = { profile: 'Profile', display: 'Display', notifications: 'Notifications', leda: 'Leda', account: 'Account' };
const SECTION_ICON: Record<string, PhosphorIcon> = { profile: User, disp: Desktop, notify: Bell, leda: Lightbulb, acct: Key };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const clone = <T,>(s: T): T => JSON.parse(JSON.stringify(s));

/** Philippine mobile: 0917 123 4567 or +63 917 123 4567, tidied to 0917 123 4567 (settings.js 76-77). */
export function normPhone(t: string): string | null {
  const d = String(t || '').replace(/[^\d+]/g, '');
  const m = /^(?:\+63|63|0)(9\d{9})$/.exec(d);
  return m ? `0${m[1].slice(0, 3)} ${m[1].slice(3, 6)} ${m[1].slice(6)}` : null;
}

function useMedia(q: string) {
  const [m, setM] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false));
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

type Status = { kind: 'idle' } | { kind: 'saved'; off: string[] } | { kind: 'undone' } | { kind: 'error'; msg: string };

/** The My settings form (MYSET.mount). Used inside `SettingsModal`, and on its own as the inline page form. */
export function SettingsForm(props: SettingsFormProps) {
  const {
    layout = 'page', compact = false, stocker = false, platform, person, notifications, channels, ledaScope, value, onSave, theme, onThemeChange, savedAt,
    portalHref, signOutHref, tab, onTabChange, onCancel, onDirtyChange, state, lastLoaded, onRetry,
  } = props;
  const modal = layout === 'modal';
  const tabbed = modal;
  const uid = useId();
  const id = (s: string) => `${uid}${s}`;
  const showLeda = !!ledaScope;
  const TB = TABS.filter((t) => t.id !== 'leda' || showLeda);
  const phone = useMedia('(max-width: 640px)');

  const [cur, setCur] = useState<SettingsTabId>(() => (TB.find((t) => t.id === tab) ?? TB[0]).id);
  const [saved, setSaved] = useState<SettingsValue>(() => clone(value));
  const [draft, setDraft] = useState<SettingsValue>(() => clone(value));
  const [prev, setPrev] = useState<SettingsValue | null>(null);
  const [st, setSt] = useState<Status>({ kind: 'idle' });
  const [err, setErr] = useState<{ phone?: string; sms?: string }>({});
  const [flash, setFlash] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const smsRef = useRef<HTMLButtonElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const secsRef = useRef<HTMLDivElement>(null);

  const phoneOK = () => normPhone(draft.phone);
  const dirty = !same(draft, saved);
  const smsHelp = `Goes to ${draft.phone && phoneOK() ? phoneOK() : 'your contact number, which you have not added yet'}.`;
  const offs = (a: SettingsValue, b: SettingsValue) => {
    const out: string[] = [];
    notifications.forEach((i) => { if (a.notify[i.id] && !b.notify[i.id]) out.push(i.label); });
    channels.forEach((c) => { if (a.channels[c.id] && !b.channels[c.id]) out.push(c.label); });
    if (a.leda && !b.leda) out.push('Leda suggestions');
    return out;
  };

  const ch: Record<string, number> = {
    profile: draft.phone !== saved.phone ? 1 : 0,
    notifications: notifications.filter((i) => draft.notify[i.id] !== saved.notify[i.id]).length + channels.filter((c) => draft.channels[c.id] !== saved.channels[c.id]).length,
    leda: draft.leda !== saved.leda ? 1 : 0,
  };
  const er: Record<string, number> = { profile: err.phone ? 1 : 0, notifications: err.sms ? 1 : 0 };
  const count = Object.values(ch).reduce((a, b) => a + b, 0);
  const tabsChanged = Object.keys(ch).filter((k) => ch[k]).map((k) => TL[k]);
  useEffect(() => {
    onDirtyChange?.({ dirty, count, tabs: tabsChanged });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, count, tabsChanged.join('|')]);

  const edge = useCallback(() => {
    const t = tabsRef.current;
    if (t) setAtEnd(t.scrollLeft + t.clientWidth >= t.scrollWidth - 2);
  }, []);
  useLayoutEffect(() => {
    if (tabbed) edge();
  }, [tabbed, edge, phone]);

  function showTab(next: SettingsTabId, focus: boolean) {
    if (!tabbed || !TB.some((t) => t.id === next)) return;
    flushSync(() => setCur(next));
    onTabChange?.(next);
    if (secsRef.current) secsRef.current.scrollTop = 0;
    const b = document.getElementById(id(`-tab-${next}`));
    if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (focus) b?.focus({ preventScroll: true });
    edge();
  }
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key;
    const ids = TB.map((t) => t.id);
    const i = ids.indexOf(cur);
    let j = -1;
    if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % ids.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + ids.length) % ids.length;
    else if (k === 'Home') j = 0;
    else if (k === 'End') j = ids.length - 1;
    if (j < 0) return;
    e.preventDefault();
    showTab(ids[j], true);
  };

  const resetEdits = (to: SettingsValue) => {
    setDraft(clone(to));
    setErr({});
  };
  const flip = (key: 'leda' | `n:${string}` | `c:${string}`) => {
    const d = clone(draft);
    if (key === 'leda') d.leda = !d.leda;
    else if (key.startsWith('n:')) d.notify[key.slice(2)] = !d.notify[key.slice(2)];
    else d.channels[key.slice(2)] = !d.channels[key.slice(2)];
    setDraft(d);
    const sms = key === 'c:sms' && d.channels.sms && !normPhone(d.phone) ? 'Add your contact number first. Text messages go there.' : '';
    setErr((e) => ({ ...e, sms }));
    if (st.kind === 'saved' || st.kind === 'undone' || st.kind === 'error') setSt({ kind: 'idle' });
  };

  async function save() {
    if (!dirty) return;
    const e: { phone?: string; sms?: string } = {};
    const raw = draft.phone.trim();
    const n = normPhone(raw);
    if (raw && !n) e.phone = 'Check the number. It should look like 0917 123 4567.';
    if (draft.channels.sms && !n) {
      e.sms = 'Add your contact number first. Text messages go there.';
      if (!raw) e.phone = 'Add a number to get text messages, or turn text messages off.';
    }
    if (e.phone || e.sms) {
      setErr(e);
      if (tabbed) showTab(e.phone ? 'profile' : 'notifications', false);
      (e.phone ? phoneRef.current : smsRef.current)?.focus();
      return;
    }
    setErr({});
    const next = clone(draft);
    if (n) next.phone = n;
    setDraft(next);
    try {
      await onSave(clone(next));
    } catch {
      setSt({ kind: 'error', msg: 'We could not save. Your changes are still here. Save again to try once more.' });
      return;
    }
    const off = offs(saved, next);
    setPrev(off.length ? clone(saved) : null); // Undo only comes back when Save turned something off
    setSaved(clone(next));
    setSt({ kind: 'saved', off });
  }
  function undo() {
    if (!prev) return;
    setSaved(clone(prev));
    resetEdits(prev);
    void onSave(clone(prev));
    setPrev(null);
    setSt({ kind: 'undone' });
    saveRef.current?.focus({ preventScroll: true });
  }
  function discard() {
    resetEdits(saved);
    setSt({ kind: 'idle' });
    saveRef.current?.focus({ preventScroll: true });
  }

  /* ---------- class sets ---------- */
  const narrow = compact ? 'grid-cols-[minmax(0,1fr)] gap-y-[10px]' : 'max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-[10px]';
  const narrowC = compact ? 'justify-self-stretch text-left' : 'max-[640px]:justify-self-stretch max-[640px]:text-left';
  const mutedH = 'mt-[3px] text-[13px] leading-[19px] text-muted';
  const rowCls = (extra?: string) =>
    cn(
      'grid min-h-[64px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-8 border-t border-rule py-4 max-[640px]:py-[14px]',
      modal && 'gap-x-6',
      extra,
    );
  const lastRowBorder = 'last:border-b last:border-rule';
  const errCls = 'text-[13px] font-semibold leading-[19px] text-bad empty:hidden';
  const helpIn = (cls?: string) => cn(mutedH, cls);
  const linkCls = cn('inline-block h-6 px-0 text-[15px] leading-[22px]', compact ? 'min-h-11 !inline-flex items-center' : 'max-[640px]:min-h-11 max-[640px]:!inline-flex max-[640px]:items-center');
  const helpLink = cn('h-6 px-0 leading-[19px]', compact ? 'min-h-11 !inline-flex items-center' : 'max-[640px]:min-h-11 max-[640px]:!inline-flex max-[640px]:items-center');
  // Rendered in the workshop at 12px / 21px, gap 4px, 24px high (computed); max-[640px]: .ms-bar .va min-height 44.
  const barLink = cn('!flex h-6 gap-1 px-0 text-[12px] leading-[21px]', compact ? 'min-h-11' : 'max-[640px]:min-h-11');
  const inCls = cn(
    'h-10 w-[220px] rounded-control border border-control bg-surface px-3 text-[15px] text-text hover:border-muted focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent aria-[invalid=true]:border-bad',
    compact ? 'h-12 w-full text-[16px]' : 'max-[640px]:h-12 max-[640px]:w-full',
  );
  const segCls = cn('inline-grid grid-cols-[repeat(3,auto)] overflow-hidden rounded-control border border-control', compact ? 'grid w-full' : 'max-[640px]:grid max-[640px]:w-full');
  const segBtn = cn(
    'h-[38px] px-4 text-[14px] font-medium text-text hover:bg-raised aria-pressed:bg-accent-tint aria-pressed:font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&+&]:border-l [&+&]:border-control',
    compact ? 'h-12 text-[15px]' : 'max-[640px]:h-12',
  );

  const secCls = cn(
    modal
      ? 'block'
      : cn(
          'mt-2 grid grid-cols-[260px_minmax(0,1fr)] gap-x-16 border-t border-border pt-8 first:mt-0 first:border-t-0 max-[1099px]:grid-cols-[minmax(0,1fr)] max-[1099px]:gap-y-2 max-[640px]:pt-7',
          compact && 'grid-cols-[minmax(0,1fr)] gap-y-2 pt-7',
        ),
  );
  const shCls = modal ? 'm-0 flex flex-col items-start pb-1 pt-4' : compact ? '-mx-5 flex items-center gap-2.5 bg-raised px-5 py-2 max-[360px]:-mx-4 max-[360px]:px-4' : 'max-[1099px]:pb-2';
  const shH2 = modal ? 'sr-only' : compact ? 'gap-2 text-[16px] font-semibold uppercase leading-[22px] tracking-[.08em] text-muted' : 'text-[16px] font-semibold leading-[22px]';
  const shP = cn(modal ? 'mt-0 pl-0 text-[13px] leading-[19px] text-muted' : 'mt-1 text-[13px] leading-[19px] text-muted');

  const hd = (sid: string, t: string, help: ReactNode) => {
    const Ic = SECTION_ICON[sid];
    return (
      <div className={shCls}>
        <h2 id={id(`-h-${sid}`)} className={cn('m-0 flex items-center gap-2', shH2)}>
          <Ic aria-hidden size={18} className={modal ? '' : compact ? 'flex-none tracking-[0] text-muted' : 'hidden'} />
          {t}
        </h2>
        <p className={shP}>{help}</p>
      </div>
    );
  };
  const pa = (tid: SettingsTabId, h: string) =>
    tabbed
      ? { id: id(`-panel-${tid}`), role: 'tabpanel' as const, 'aria-labelledby': id(`-tab-${tid}`), hidden: tid !== cur }
      : { 'aria-labelledby': id(`-h-${h}`) };
  const secClass = (tid: SettingsTabId) => cn(secCls, tabbed && tid !== cur && 'hidden');
  const bodyCls = cn('min-w-0', modal && 'pt-1 [&>div:first-child]:border-t-0');
  const gCls = cn(
    modal
      ? 'mt-6 pb-2 text-[13px] font-semibold leading-[19px] text-muted first:mt-3'
      : 'pb-2 pt-1 text-[14px] font-semibold leading-5 [&:not(:first-child)]:mt-7',
  );
  const groupRowsCls = modal ? '[&>div:first-child]:border-t [&>div:first-child]:border-rule' : '';

  const itemRow = (i: SettingsNotification) => (
    <div key={i.id} className={rowCls(lastRowBorder)}>
      <div>
        <label className="block cursor-pointer text-[15px] font-semibold leading-[22px] text-text" htmlFor={id(`-sw-n-${i.id}`)} id={id(`-lb-n-${i.id}`)}>{i.label}</label>
        <p className={helpIn()} id={id(`-h-n-${i.id}`)}>{i.help}</p>
      </div>
      <div className="justify-self-end text-right">
        <Switch look="settings" compact={compact} id={id(`-sw-n-${i.id}`)} checked={!!draft.notify[i.id]} onCheckedChange={() => flip(`n:${i.id}`)} aria-label={i.label} aria-describedby={id(`-h-n-${i.id}`)} />
      </div>
    </div>
  );
  const chRow = (c: SettingsChannel) => (
    <div key={c.id} className={rowCls(lastRowBorder)}>
      <div>
        <span className="block text-[15px] font-semibold leading-[22px] text-text" id={id(`-lb-c-${c.id}`)}>{c.label}</span>
        <p className={helpIn()} id={id(`-h-c-${c.id}`)}>{c.id === 'sms' ? smsHelp : c.help}</p>
        <p className={errCls} id={id(`-e-c-${c.id}`)} role="alert">{c.id === 'sms' ? err.sms || '' : ''}</p>
      </div>
      <div className="justify-self-end text-right">
        <Switch ref={c.id === 'sms' ? smsRef : undefined} look="settings" compact={compact} id={id(`-sw-c-${c.id}`)} checked={!!draft.channels[c.id]} onCheckedChange={() => flip(`c:${c.id}`)} aria-label={c.label} aria-describedby={id(`-h-c-${c.id}`)} />
      </div>
    </div>
  );

  const rootCls = cn(
    'text-[14px] leading-[21px]',
    modal ? 'flex min-h-0 max-w-none flex-1 flex-col min-[641px]:grid min-[641px]:grid-cols-[216px_minmax(0,1fr)] min-[641px]:grid-rows-[minmax(0,1fr)_auto]' : 'max-w-[1060px]',
  );

  if (state === 'loading') {
    return (
      <div className={rootCls}>
        <div role="status" aria-live="polite">
          <p className="my-[22px] h-4 w-[38%] rounded-[4px] bg-skeleton" />
          <p className="my-[22px] h-4 w-[82%] rounded-[4px] bg-skeleton" />
          <p className="my-[22px] h-4 w-[64%] rounded-[4px] bg-skeleton" />
          <p className="my-[22px] h-4 w-[90%] rounded-[4px] bg-skeleton" />
          <p className="text-[13px] text-muted">Loading your settings.</p>
        </div>
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className={rootCls}>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-y border-border py-5 text-[15px] leading-[22px]" role="alert">
          <p>
            <b>Your settings did not load.</b> Nothing was changed. Last loaded {lastLoaded}.
          </p>
          <ActionLink onClick={onRetry} className={compact ? '!inline-flex min-h-[var(--tap)] items-center rounded-[4px] px-1 text-[15px] leading-[22px]' : undefined}>Try again</ActionLink>
        </div>
      </div>
    );
  }

  const tabLabel = (t: (typeof TB)[number]) => {
    const c = ch[t.id] || 0;
    const e = er[t.id] || 0;
    return (
      <span className={cn('inline-flex gap-1', 'min-[641px]:ml-auto')}>
        {e ? (
          <>
            <span aria-hidden="true" className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-[9px] bg-transparent px-0.5 text-[14px] font-semibold leading-none text-bad">!</span>
            <span className="sr-only">, {e} to fix</span>
          </>
        ) : null}
        {c ? (
          <>
            <span aria-hidden="true" className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-[9px] bg-accent-tint-2 px-[5px] text-[11px] font-semibold leading-none text-text">{c}</span>
            <span className="sr-only">, {c} unsaved {c === 1 ? 'change' : 'changes'}</span>
          </>
        ) : null}
      </span>
    );
  };

  const statusMsg = dirty ? (
    <>
      <b className="font-semibold text-text">You have changes that are not saved.</b>{' '}
      {st.kind === 'error' ? <span className="font-semibold text-bad">{st.msg}</span> : 'Save to keep them.'}
    </>
  ) : st.kind === 'saved' ? (
    <>
      <b className="font-semibold text-ok">
        <Check aria-hidden size={14} className="mr-1 inline" />
        Saved
      </b>{' '}
      at {savedAt}.{st.off.length ? ` You turned off ${st.off.join(', ')}.` : ''}
    </>
  ) : st.kind === 'undone' ? (
    <>
      <b className="font-semibold text-ok">
        <Check aria-hidden size={14} className="mr-1 inline" />
        Undone.
      </b>{' '}
      Your settings are back to what they were before.
    </>
  ) : (
    'No changes yet. Change something above, then save.'
  );

  const none = !draft.channels.app && !draft.channels.sms && !draft.channels.email && notifications.some((i) => draft.notify[i.id]);
  const barStack = compact ? 'flex-col items-stretch gap-[10px]' : 'max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-[10px]';
  const actsRev = compact ? 'flex-row-reverse justify-between' : 'max-[640px]:flex-row-reverse max-[640px]:justify-between';
  const theme3: SettingsTheme[] = ['light', 'dark', 'system'];

  return (
    <div className={rootCls}>
      {tabbed && (
        <div
          ref={tabsRef}
          id={id('-tabs')}
          role="tablist"
          aria-orientation={phone ? 'horizontal' : 'vertical'}
          aria-label="My settings groups"
          data-end={atEnd}
          onScroll={edge}
          onKeyDown={onTabKey}
          className={cn(
            'flex flex-none gap-1 overflow-x-auto border-b border-border px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'max-[640px]:data-[end=false]:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)] max-[640px]:data-[end=false]:[mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)]',
            'min-[641px]:col-start-1 min-[641px]:row-start-1 min-[641px]:flex-col min-[641px]:gap-0 min-[641px]:overflow-y-auto min-[641px]:overflow-x-visible min-[641px]:border-b-0 min-[641px]:border-r min-[641px]:px-0 min-[641px]:py-3',
          )}
        >
          {TB.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={id(`-tab-${t.id}`)}
              aria-controls={id(`-panel-${t.id}`)}
              aria-selected={t.id === cur}
              tabIndex={t.id === cur ? 0 : -1}
              onClick={() => showTab(t.id, false)}
              className={cn(
                'relative -mb-px inline-flex h-12 flex-none items-center gap-[6px] whitespace-nowrap rounded-none border-b-2 border-transparent px-[14px] text-[14px] font-medium text-muted hover:text-text aria-selected:border-accent aria-selected:font-semibold aria-selected:text-text',
                'focus-visible:rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent min-[641px]:focus-visible:rounded-none',
                'min-[641px]:m-0 min-[641px]:h-11 min-[641px]:w-full min-[641px]:justify-start min-[641px]:gap-3 min-[641px]:rounded-none min-[641px]:border-b-0 min-[641px]:border-l-[3px] min-[641px]:py-0 min-[641px]:pl-[17px] min-[641px]:pr-4 min-[641px]:text-left',
                'min-[641px]:hover:bg-raised min-[641px]:aria-selected:bg-raised min-[641px]:aria-selected:[&>svg]:text-accent min-[641px]:focus-visible:-outline-offset-[3px]',
              )}
            >
              <t.Ic aria-hidden size={18} className="flex-none" />
              <span>{t.label}</span>
              {tabLabel(t)}
            </button>
          ))}
        </div>
      )}
      <div
        ref={secsRef}
        className={cn(
          modal &&
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-1 min-[641px]:col-start-2 min-[641px]:row-start-1 min-[641px]:min-w-0 min-[641px]:px-7 min-[641px]:pb-8',
        )}
      >
        <section className={secClass('profile')} {...pa('profile', 'profile')}>
          {hd('profile', 'Profile', `Who you are in ${platform}.`)}
          <div className={bodyCls}>
            <div className={cn(rowCls(modal ? 'border-t-0' : ''), 'grid-cols-[auto_minmax(0,1fr)]', !modal && 'gap-x-4', 'max-[640px]:grid-cols-[auto_minmax(0,1fr)]')}>
              <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-full bg-raised-2 text-[18px] font-semibold text-text">{person.initials}</span>
              <div>
                <b className="block text-[16px] font-semibold leading-[22px] text-text">{person.name}</b>
                <p className={helpIn()}>
                  Your initials show where a photo would go. <ActionLink href={portalHref} className={helpLink}>Add a photo in the Portal</ActionLink>
                </p>
              </div>
            </div>
            <div className={rowCls(cn(narrow))}>
              <div>
                <span className="block text-[15px] font-semibold leading-[22px] text-text">Name</span>
                <p className={helpIn()}>Your name comes from the Portal. You cannot change it here.</p>
              </div>
              <div className={cn('justify-self-end text-right text-[14px] leading-5 text-text', narrowC)}>{person.name}</div>
            </div>
            <div className={rowCls(cn(narrow))}>
              <div>
                <span className="block text-[15px] font-semibold leading-[22px] text-text">Role</span>
                <p className={helpIn()}>Your role comes from the Portal and decides what you can do here.</p>
              </div>
              <div className={cn('justify-self-end text-right text-[14px] leading-5 text-text', narrowC)}>
                {person.title}
                <small className="block text-[13px] leading-[18px] text-muted">
                  {person.roleLabel && person.roleLabel !== person.title ? `${person.roleLabel} · ` : ''}
                  {platform}
                </small>
              </div>
            </div>
            <div className={rowCls(cn(narrow, lastRowBorder))}>
              <div>
                <label className="block cursor-pointer text-[15px] font-semibold leading-[22px] text-text" htmlFor={id('-phone')}>Contact number</label>
                <p className={helpIn()} id={id('-h-phone')}>Used for text messages. Example: 0917 123 4567.</p>
                <p className={cn(errCls, 'mt-1')} id={id('-e-phone')} role="alert">{err.phone || ''}</p>
              </div>
              <div className={cn('justify-self-end text-right', narrowC)}>
                <input
                  ref={phoneRef}
                  id={id('-phone')}
                  className={inCls}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={draft.phone}
                  aria-invalid={err.phone ? 'true' : 'false'}
                  aria-describedby={`${id('-h-phone')} ${id('-e-phone')}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => ({ ...d, phone: v }));
                    setErr((x) => ({ phone: '', sms: draft.channels.sms && normPhone(v) ? '' : x.sms }));
                    if (st.kind !== 'idle') setSt({ kind: 'idle' });
                  }}
                  onBlur={(e) => {
                    const n = normPhone(e.target.value);
                    if (n) setDraft((d) => ({ ...d, phone: n }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void save();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={secClass('display')} {...pa('display', 'disp')}>
          {hd('disp', 'Language and display', 'How the app looks to you.')}
          <div className={bodyCls}>
            <div className={rowCls(narrow)}>
              <div>
                <span className="block text-[15px] font-semibold leading-[22px] text-text">Language</span>
                <p className={helpIn()}>Only English is available for now.</p>
              </div>
              <div className={cn('justify-self-end text-right text-[14px] leading-5 text-text', narrowC)}>English</div>
            </div>
            <div className={rowCls(cn(narrow, lastRowBorder))}>
              <div>
                <span className="block text-[15px] font-semibold leading-[22px] text-text" id={id('-lb-theme')}>Light or dark</span>
                <p className={helpIn()} id={id('-h-theme')}>{stocker ? 'Dark is easier in a dim stockroom. Light is easier in sun.' : 'Auto follows your device. This applies at once and is remembered on this device.'}</p>
                <p className="mt-[3px] text-[13px] font-semibold leading-[19px] text-ok empty:hidden" role="status" aria-live="polite">
                  {flash ? (
                    <>
                      <Check aria-hidden size={14} className="mr-1 inline" />
                      Saved
                    </>
                  ) : null}
                </p>
              </div>
              <div className={cn('justify-self-end text-right', narrowC)}>
                <div className={segCls} role="group" aria-labelledby={id('-lb-theme')} aria-describedby={id('-h-theme')}>
                  {theme3.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={segBtn}
                      aria-pressed={theme === t}
                      onClick={() => {
                        onThemeChange(t);
                        setFlash(true);
                      }}
                    >
                      {t === 'system' ? 'Auto' : t[0].toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={secClass('notifications')} {...pa('notifications', 'notify')}>
          {hd('notify', 'Notifications', `What you get told, and how. ${stocker ? '' : 'You only see what your role can use.'}`)}
          <div className={bodyCls}>
            {tabbed ? (
              GROUPS.map((g, k) => {
                const l = notifications.filter((i) => i.group === g);
                return l.length ? (
                  <Fragment key={g}>
                    <h3 className={gCls} id={id(`-g-${k}`)}>{g}</h3>
                    <div role="group" aria-labelledby={id(`-g-${k}`)} className={groupRowsCls}>{l.map(itemRow)}</div>
                  </Fragment>
                ) : null;
              })
            ) : (
              <>
                <h3 className={gCls} id={id('-g-when')}>Tell me when</h3>
                <div role="group" aria-labelledby={id('-g-when')} className={groupRowsCls}>{notifications.map(itemRow)}</div>
              </>
            )}
            <h3 className={gCls} id={id('-g-how')}>How to tell me</h3>
            <div role="group" aria-labelledby={id('-g-how')} className={groupRowsCls}>{channels.map(chRow)}</div>
            <p className={cn(errCls, 'pt-3')} id={id('-e-none')} role="status" aria-live="polite">{none ? 'All three ways are off, so nothing will reach you. Turn one on.' : ''}</p>
          </div>
        </section>

        {showLeda && (
          <section className={secClass('leda')} {...pa('leda', 'leda')}>
            {hd('leda', 'Leda', 'Suggestions on Home and Products.')}
            <div className={bodyCls}>
              <div className={rowCls(lastRowBorder)}>
                <div>
                  <label className="block cursor-pointer text-[15px] font-semibold leading-[22px] text-text" htmlFor={id('-sw-leda')}>Leda suggestions</label>
                  <p className={helpIn()} id={id('-h-leda')}>Leda offers ideas on Home and Products, like what to order. When this is off you can still ask Leda yourself.</p>
                </div>
                <div className="justify-self-end text-right">
                  <Switch look="settings" compact={compact} id={id('-sw-leda')} checked={draft.leda} onCheckedChange={() => flip('leda')} aria-label="Leda suggestions" aria-describedby={id('-h-leda')} />
                </div>
              </div>
              <div className={cn(rowCls(lastRowBorder), 'block')}>
                <div>
                  <span className="block text-[15px] font-semibold leading-[22px] text-text">What Leda can do for you</span>
                  <ul className="m-0 mt-1.5 list-none p-0">
                    {ledaScope!.map((t) => (
                      <li key={t} className="relative mt-1 pl-4 text-[14px] leading-[21px] before:absolute before:left-[3px] before:top-[9px] before:h-1 before:w-1 before:rounded-full before:bg-faint before:content-['']">{t}</li>
                    ))}
                  </ul>
                  <p className={helpIn()}>Leda can never do more than your role allows. You cannot change this list.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className={secClass('account')} {...pa('account', 'acct')}>
          {hd('acct', 'Your account', 'Your password, and logging out.')}
          <div className={bodyCls}>
            <div className={rowCls(modal ? 'border-t-0' : '')}>
              <div>
                <ActionLink href={portalHref} className={linkCls}>Change password or PIN</ActionLink>
                <p className={helpIn()}>Opens the Portal. Passwords and PINs are only changed there.</p>
              </div>
            </div>
            {!stocker && (
              <div className={rowCls()}>
                <div>
                  <ActionLink href={portalHref} className={linkCls}>Back to Portal</ActionLink>
                  <p className={helpIn()}>Leaves {platform} and goes to all your platforms.</p>
                </div>
              </div>
            )}
            <div className={rowCls(cn('last:border-b last:border-rule', modal && 'block'))}>
              <div>
                <a
                  id={id('-logout')}
                  href={signOutHref}
                  className={cn(
                    'inline-flex items-center rounded-control border border-control bg-surface font-semibold text-text no-underline hover:border-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    compact
                      ? 'mt-7 min-h-[var(--tap-big)] w-full justify-center gap-2.5 rounded-[8px] border-[1.5px] px-5 text-[16px] leading-[22px]'
                      : 'mt-0 min-h-10 w-auto gap-2 px-4 text-[14px] max-[640px]:min-h-12 max-[640px]:w-full max-[640px]:justify-center',
                  )}
                >
                  <SignOut aria-hidden size={compact ? 20 : 16} />
                  Log out
                </a>
                <p className={helpIn(modal ? 'mt-2' : '')}>
                  Logs you out of {platform}
                  {stocker ? ' on this phone' : ''}. Anything you have not saved above is lost.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div
        className={cn(
          'flex items-center gap-4 border-t border-border bg-surface',
          modal
            ? 'flex-none px-6 py-[14px] max-[640px]:px-4 max-[640px]:pb-[calc(12px+env(safe-area-inset-bottom))] max-[640px]:pt-3 min-[641px]:col-span-2 min-[641px]:col-start-1 min-[641px]:row-start-2'
            : cn('sticky z-[3] mt-10 pb-[calc(14px+env(safe-area-inset-bottom))] pt-[14px]', compact ? 'bottom-[calc(var(--tabh)+env(safe-area-inset-bottom))]' : 'bottom-0'),
          barStack,
        )}
        id={id('-bar')}
      >
        <p className="min-w-0 flex-1 text-[14px] leading-5 text-muted" id={id('-st')} role="status" aria-live="polite">{statusMsg}</p>
        <span className={cn('flex flex-none items-center', modal ? 'gap-5' : 'gap-4', actsRev)}>
          <ActionLink hidden={!(st.kind === 'saved' && prev && !dirty)} onClick={undo} className={cn(barLink, !(st.kind === 'saved' && prev && !dirty) && '!hidden')}>Undo</ActionLink>
          {modal ? (
            <ActionLink onClick={onCancel} className={barLink}>Cancel</ActionLink>
          ) : (
            <ActionLink hidden={!dirty} onClick={discard} className={cn(barLink, !dirty && '!hidden')}>Discard changes</ActionLink>
          )}
          <button
            ref={saveRef}
            type="button"
            aria-disabled={!dirty}
            onClick={() => void save()}
            className={cn(
              'h-10 rounded-control px-7 text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              dirty ? 'bg-accent text-accent-ink hover:bg-accent-hover' : 'cursor-default bg-raised-2 text-muted',
              compact ? 'h-[52px] flex-1 text-[16px]' : 'max-[640px]:h-12 max-[640px]:flex-1',
            )}
          >
            Save
          </button>
        </span>
      </div>
    </div>
  );
}

/**
 * My settings as a modal (I20): native `dialog` opened by the account menu, 880px with a 216px side nav (a scrolling strip on a phone),
 * one footer for all tabs. Close, Cancel, Esc and the backdrop leave at once when nothing is unsaved; otherwise the footer is replaced by
 * "Discard your changes?" (`role="alertdialog"`). Focus returns to the element that opened it.
 */
export function SettingsModal({ open, onOpenChange, tab, ...form }: SettingsModalProps) {
  const uid = useId();
  const dlg = useRef<HTMLDialogElement>(null);
  const from = useRef<HTMLElement | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const [asking, setAsking] = useState(false);
  const [lastTab, setLastTab] = useState<SettingsTabId | undefined>(tab);
  const [dirt, setDirt] = useState({ dirty: false, count: 0, tabs: [] as string[] });
  const tId = `${uid}-smT`;
  const qT = `${uid}-smQt`;
  const qP = `${uid}-smQp`;
  const phoneFirst = useRef(false);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      from.current = document.activeElement as HTMLElement | null;
      setAsking(false);
      setLastTab(tab);
      phoneFirst.current = true;
      d.showModal();
      const f = d.querySelector<HTMLElement>('input[type="tel"]') ?? d.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ?? d.querySelector<HTMLElement>('[data-sm-x]');
      const t = d.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      const first = t?.id.endsWith('-tab-profile') ? f : t ?? f;
      first?.focus({ preventScroll: true });
    } else if (!open && d.open) {
      d.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const finish = () => {
    setAsking(false);
    const d = dlg.current;
    if (d?.open) d.close();
    setLastTab(undefined);
    const f = from.current;
    from.current = null;
    if (f && f.isConnected) f.focus({ preventScroll: true });
    onOpenChange(false);
  };
  const keep = () => {
    setAsking(false);
    dlg.current?.querySelector<HTMLElement>('[data-sm-save]')?.focus({ preventScroll: true });
  };
  const ask = () => {
    if (asking) {
      keep();
      return;
    }
    if (!dirt.dirty) {
      finish();
      return;
    }
    setAsking(true);
  };
  useEffect(() => {
    if (asking) keepRef.current?.focus();
  }, [asking]);

  const qText = dirt.count
    ? `${dirt.count} ${dirt.count === 1 ? 'change is' : 'changes are'} not saved (${dirt.tabs.join(', ')}). Discarding puts everything back as it was.`
    : 'What you changed is not saved. Discarding puts everything back as it was.';

  return (
    <dialog
      ref={dlg}
      aria-labelledby={tId}
      onCancel={(e) => {
        e.preventDefault();
        ask();
      }}
      onClick={(e) => {
        if (e.target === dlg.current) ask();
      }}
      onKeyDownCapture={(e) => {
        if (e.key === 'Escape' && asking) {
          e.preventDefault();
          e.stopPropagation();
          keep();
        }
      }}
      className={cn(
        'fixed inset-0 m-auto h-[min(640px,90vh)] max-h-[90vh] w-[880px] max-w-[90vw] overflow-hidden rounded-[10px] border border-border bg-surface p-0 text-text shadow-[0_4px_16px_rgba(0,0,0,.07)] backdrop:bg-scrim',
        'open:flex open:flex-col motion-safe:open:animate-sm-in',
        'max-[640px]:h-dvh max-[640px]:max-h-none max-[640px]:w-screen max-[640px]:max-w-none max-[640px]:rounded-none max-[640px]:border-0',
      )}
    >
      <div className="flex flex-none items-center gap-4 border-b border-border px-6 pb-4 pt-[18px] max-[640px]:px-4 max-[640px]:pb-3 max-[640px]:pt-[calc(12px+env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <h2 id={tId} className="text-[18px] font-semibold leading-6 tracking-[-.005em]">My settings</h2>
          <p className="mt-0.5 truncate text-[13px] leading-[18px] text-muted">{form.platform} · {form.person.name}</p>
        </div>
        <button
          type="button"
          data-sm-x=""
          aria-label="Close My settings"
          onClick={ask}
          className={cn('grid h-9 w-9 flex-none place-items-center rounded-control text-text hover:bg-raised max-[640px]:h-11 max-[640px]:w-11', 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent')}
        >
          <X aria-hidden size={18} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {open && (
          <div className={cn('flex min-h-0 flex-1 flex-col', asking && '[&_[id$=-bar]]:invisible')} data-sm-host="">
            <SettingsForm {...form} layout="modal" tab={lastTab} onTabChange={setLastTab} onCancel={ask} onDirtyChange={setDirt} />
          </div>
        )}
      </div>
      <div
        id={`${uid}-smQ`}
        role="alertdialog"
        aria-labelledby={qT}
        aria-describedby={qP}
        hidden={!asking}
        className={cn(
          'absolute inset-x-0 bottom-0 z-[5] flex items-center gap-4 border-t border-border bg-surface px-6 py-[14px]',
          'max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-[10px] max-[640px]:px-4 max-[640px]:pb-[calc(12px+env(safe-area-inset-bottom))] max-[640px]:pt-3',
          !asking && 'hidden',
        )}
      >
        <div className="min-w-0 flex-1">
          <b id={qT} className="text-[15px] font-semibold">Discard your changes?</b>
          <p id={qP} className="mt-0.5 text-[13px] leading-[19px] text-muted">{qText}</p>
        </div>
        <span className="flex flex-none items-center gap-5 max-[640px]:flex-row-reverse max-[640px]:justify-between">
          <ActionLink ref={keepRef as never} onClick={keep} className="!flex h-6 gap-1 text-[12px] leading-5">Keep editing</ActionLink>
          <button
            type="button"
            onClick={finish}
            className={cn('h-10 rounded-control border border-control bg-surface px-4 text-[14px] font-semibold text-text hover:border-muted max-[640px]:h-12 max-[640px]:flex-1', focusRing)}
          >
            Discard changes
          </button>
        </span>
      </div>
    </dialog>
  );
}
