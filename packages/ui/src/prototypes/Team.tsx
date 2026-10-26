import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle, DotsThree, IdentificationBadge, Key, Lock, PaperPlaneTilt, Prohibit, ArrowCounterClockwise, UserMinus, UserPlus, Users, Warning, XCircle, X, Chair } from '@phosphor-icons/react';
import { AccountMenu, initialsOf } from '../components/AccountMenu';
import { AskLedaBar } from '../components/AskLedaBar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { Chat, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, usePersistedChat, type ChatActionItem, type ChatBlock, type ChatMessageData } from '../components/Chat';
import { CommandPalette, type CommandPaletteGroup, type CommandPaletteItem } from '../components/CommandPalette';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataList } from '../components/DataList';
import { EmptyState } from '../components/EmptyState';
import { ErrorBlock } from '../components/ErrorBlock';
import { Fact, FactsLine } from '../components/FactsLine';
import { IconButton } from '../components/IconButton';
import { LedaMark } from '../components/Leda';
import { LedaNote } from '../components/LedaNote';
import { ListCell, ListHeaderCell, ListRow } from '../components/List';
import { ListGroup, ListGroups } from '../components/ListGroup';
import { Menu, type MenuItem } from '../components/Menu';
import { Modal } from '../components/Modal';
import { PlatformLogo } from '../components/PlatformLogo';
import { ProgressBar } from '../components/ProgressBar';
import { RolePicker, type CompanyAccess, type RolePickerPlatform, type RolePickerValue } from '../components/RolePicker';
import { SegmentedControl } from '../components/SegmentedControl';
import { Select } from '../components/Select';
import { SheetBar } from '../components/SheetBar';
import { Skeleton } from '../components/Skeleton';
import { StatusBar, type StatusBarHealth } from '../components/StatusBar';
import { StatusDot, type StatusTone } from '../components/StatusDot';
import { SubpageLane, SubpageTransition, type SubpageDirection } from '../components/SubpageTransition';
import { TownMap, type TownMapHandle, type TownMapSlot } from '../components/TownMap';
import { Toaster } from '../components/toast/Toaster';
import { toast } from '../components/toast/toastStore';
import { Badge } from '../components/Badge';
import { PortalFrame } from './PortalFrame';
import { go as navGo, type Dest } from './protoNav';
import { cn, focusRing } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { useMatchMedia } from '../utils/useMatchMedia';
import {
  LAST_GOOD, SAMPLE_NOW, SENT_UNTIL, accessCopy, activity, homeSet, initialDb, ledaInvite, people, platformsOf, roleOptions, rolesOfKind, seats, workRole,
  type Db, type Invite, type Person, type TeamSetKey, type TeamState,
} from './Team.data';

/**
 * Portal Team (RDY-258): the place column (map, where people work, roles by kind, Portal access, seats), the sheet
 * (everyone as a table with a role per platform, or one person as a subpage), the invite dialog and Leda's entry
 * points, composed only from @readyph/ui parts inside the shared `PortalFrame`. Prototype only: not exported from the package.
 */
export interface TeamProps {
  set?: TeamSetKey;
  state?: TeamState;
  /** Open this person's page on mount (story). */
  person?: string;
  /** Open the invite dialog on mount (story). */
  startInvite?: boolean;
}

const PHONE = '(max-width: 640px)';
const CHAT_KEY = 'rph-team-prototype-chat';
const ACCESS_RANK: Record<CompanyAccess, number> = { owner: 0, admin: 1, member: 2 };
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const andList = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const aOr = (w: string) => (/^[AEIOU]/i.test(w) ? 'an' : 'a');
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const fmt = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${m >= 720 ? 'PM' : 'AM'}`;
const rolePl = (name: string, n: number) => (n === 1 || /staff$/i.test(name) ? lower(name) : `${lower(name)}s`);
let seq = 100;

function Initials({ text, invite, size = 32 }: { text: string; invite?: boolean; size?: 20 | 32 | 40 }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-medium',
        size === 20 ? 'size-5 text-[10px]' : size === 40 ? 'size-10 text-ui' : 'size-8 text-small',
        invite ? 'border border-dashed border-control bg-surface text-muted' : 'bg-accent-tint text-accent',
      )}
    >
      {text}
    </span>
  );
}
const invInitials = (v: Invite) => (v.name || v.email).split(/[\s.@_]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** A labelled text input in the style of BlockedQuestions (there is no form-field component yet). */
const fieldClass = 'block h-[var(--ctl-dropdown)] w-full min-w-0 rounded-control border bg-surface px-3 text-body text-text placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** A pressable row in the place column (filters). Local: the place column has no list part yet. */
function FilterRow({ title, count, about, on, onClick, onHover, leading }: { title: string; count?: ReactNode; about?: string; on: boolean; onClick: () => void; onHover?: (on: boolean) => void; leading?: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      className={cn('flex w-full min-w-0 flex-col gap-0.5 rounded-control px-3 py-2 text-left text-ui transition-colors duration-hover motion-reduce:transition-none max-[640px]:min-h-11', on ? 'bg-frame-active text-text' : 'text-text hover:bg-frame-hover', focusRing, 'focus-visible:ring-offset-frame')}
    >
      <span className="flex min-w-0 items-center gap-2">
        {leading}
        <span className="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">{title}</span>
        {count != null ? <span className="shrink-0 tabular-nums text-muted">{count}</span> : null}
      </span>
      {about ? <span className="text-small text-muted">{about}</span> : null}
    </button>
  );
}
function PlaceHeading({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <h2 className="m-0 flex items-baseline gap-2 px-3 pb-1 pt-4 text-small font-normal text-muted">
      <span className="text-ui font-semibold text-text">{children}</span>
      {note ? <span className="ml-auto">{note}</span> : null}
    </h2>
  );
}

type Filter = { plat: string } | { company: CompanyAccess } | { group: string; role: string } | null;
type View = { type: 'list' } | { type: 'person'; id: string };
type Confirm =
  | { kind: 'suspend'; id: string }
  | { kind: 'reset'; id: string }
  | { kind: 'revoke'; id: string }
  | { kind: 'leave' };
interface IV { open: boolean; step: 1 | 2; email: string; name: string; access: CompanyAccess; roles: Record<string, string>; err: string | null; created: string | null; byLeda: boolean }

export function Team({ set = 'live', state = 'live', person, startInvite = false }: TeamProps) {
  const phone = useMatchMedia(PHONE);
  const plats = platformsOf(set);
  const home = homeSet(set);
  const AS = state === 'noaccess' ? 'arnel' : state === 'manager' ? 'jun' : 'mon';
  const PLAN = state === 'over' ? 'Free' : 'Starter';
  const t0 = useRef(Date.now());
  const clockMin = () => SAMPLE_NOW + Math.floor((Date.now() - t0.current) / 60000);

  const [db, setDb] = useState<Db>(() => initialDb(set, state));
  const [loaded, setLoaded] = useState(false);
  const mode: 'live' | 'loading' | 'error' | 'noaccess' = state === 'loading' ? 'loading' : state === 'error' && !loaded ? 'error' : 'live';

  const byId = (id: string): Person => people.find((p) => p.id === id)!;
  const company = (id: string) => db.members[id]?.company ?? 'member';
  const isAdmin = (id: string) => company(id) !== 'member';
  const roleAt = (id: string, pid: string) => db.roles[pid]?.[id] ?? null;
  const kindOfPlat = (pid: string) => plats.find((p) => p.id === pid)!.kind;
  const rolesOf = (pid: string) => rolesOfKind(kindOfPlat(pid));
  const rName = (pid: string, k: string) => rolesOf(pid).find((r) => r.id === k)?.name ?? '';
  const rAbout = (pid: string, k: string) => rolesOf(pid).find((r) => r.id === k)?.about ?? '';
  const shortOf = (pid: string) => plats.find((p) => p.id === pid)?.shortName ?? plats.find((p) => p.id === pid)?.name ?? '';
  const manages = (id: string, pid: string) => roleAt(id, pid) === 'manager';
  const can = {
    manage: () => isAdmin(AS),
    inviteAt: (pid: string) => isAdmin(AS) || manages(AS, pid),
    invite: () => isAdmin(AS) || plats.some((p) => manages(AS, p.id)),
  };
  const effMode = mode === 'live' && !can.invite() ? 'noaccess' : mode;

  const memberList = useMemo(
    () =>
      people
        .filter((p) => db.members[p.id])
        .map((p, i) => [p, i] as const)
        .sort((a, b) => (a[0].id === AS ? -1 : b[0].id === AS ? 1 : 0) || ACCESS_RANK[db.members[a[0].id]!.company] - ACCESS_RANK[db.members[b[0].id]!.company] || a[1] - b[1])
        .map((x) => x[0]),
    [db.members, AS],
  );
  const active = memberList.filter((m) => db.members[m.id]!.status === 'ACTIVE');
  const admins = active.filter((m) => company(m.id) !== 'member');
  const inviteRank = (v: Invite) => (v.status === 'PENDING' && !v.sent ? 0 : v.status === 'EXPIRED' ? 1 : 2);
  const invites = db.invites.filter((v) => v.status === 'PENDING' || v.status === 'EXPIRED').map((v, i) => [v, i] as const).sort((a, b) => inviteRank(a[0]) - inviteRank(b[0]) || a[1] - b[1]).map((x) => x[0]);
  const pendingInv = invites.filter((v) => v.status === 'PENDING');
  const unsent = pendingInv.filter((v) => !v.sent);
  const platsOfPerson = (id: string) => plats.map((p) => [p.id, roleAt(id, p.id)] as const).filter((x): x is readonly [string, string] => !!x[1]);
  const peopleAt = (pid: string) => memberList.filter((m) => db.members[m.id]!.status === 'ACTIVE' && roleAt(m.id, pid));
  const lim = seats[PLAN] ?? null;
  const seatsUsed = active.length + pendingInv.length;
  const seatState = (extra = 0) => {
    const n = seatsUsed + extra;
    if (lim == null) return 'none';
    return n > lim ? 'over' : n === lim ? 'full' : lim - n <= 2 ? 'near' : 'ok';
  };
  const firstOf = (v: Invite) => v.name || v.email;
  const isCreator = (id: string) => !!byId(id).creator;
  const lastAdmin = (id: string) => company(id) !== 'member' && db.members[id]?.status === 'ACTIVE' && admins.length === 1;

  const workWords = (pid: string) => {
    const ppl = peopleAt(pid);
    if (!ppl.length) return 'Nobody yet';
    const by: Record<string, number> = {};
    ppl.forEach((m) => { const r = roleAt(m.id, pid)!; by[r] = (by[r] ?? 0) + 1; });
    return `${plural(ppl.length, 'person', 'people')} · ${rolesOf(pid).filter((r) => by[r.id]).map((r) => `${by[r.id]} ${rolePl(r.name, by[r.id]!)}`).join(', ')}`;
  };
  // kinds of platform the company has, each with its roles
  const kindGroups = useMemo(() => {
    const g: { key: string; plats: typeof plats; kinds: string[] }[] = [];
    plats.forEach((p) => {
      const key = roleOptions[p.kind] ? p.kind : 'other';
      let x = g.find((y) => y.key === key);
      if (!x) g.push((x = { key, plats: [], kinds: [] }));
      x.plats.push(p);
      if (!x.kinds.includes(p.kind)) x.kinds.push(p.kind);
    });
    return g;
  }, [plats]);
  const groupOf = (pid: string) => (roleOptions[kindOfPlat(pid)] ? kindOfPlat(pid) : 'other');

  // ---- guards (client-side; the API lacks them)
  const coGuard = (id: string): string | null => {
    if (!can.manage()) return 'Only an owner or admin can change Portal access.';
    if (id === AS) return isCreator(id) ? 'You created this company, so you stay the Owner.' : "You can't change your own Portal access. Ask another admin.";
    if (isCreator(id)) return `${byId(id).short} created this company, so ${byId(id).short} stays the Owner.`;
    if (lastAdmin(id)) return `${byId(id).short} is the only admin. Make someone else an admin first.`;
    return null;
  };
  const suspendGuard = (id: string): string | null => {
    if (!can.manage()) return 'Only an owner or admin can suspend people.';
    if (id === AS) return "You can't suspend yourself.";
    if (isCreator(id)) return `${byId(id).short} created this company and can't be suspended.`;
    if (lastAdmin(id)) return `${byId(id).short} is the only admin. Make someone else an admin first.`;
    return null;
  };
  const resetLeft = (id: string) => { const r = db.members[id]?.resetAt; return r ? Math.max(0, 5 * 60000 - (Date.now() - r)) : 0; };
  const resetRule = (id: string): { no: boolean; why?: string; sent?: boolean } => {
    const m = byId(id);
    if (!can.manage()) return { no: true, why: 'Only an owner or admin can send reset links.' };
    if (id === AS) return { no: true, why: 'To change your own password, use Account settings.' };
    if (isCreator(id)) return { no: true, why: `${m.short} created this company. Only ${m.short} can change that password.` };
    if (company(id) === 'admin' && !isCreator(AS)) return { no: true, why: "Only the company's owner can send a reset link to an admin." };
    if (db.members[id]?.status === 'SUSPENDED') return { no: true, why: `Reactivate ${m.short} first.` };
    const left = resetLeft(id);
    if (left > 0) return { no: true, sent: true, why: `Reset link sent just now. You can send another after ${fmt(clockMin() + Math.ceil(left / 60000))}.` };
    return { no: false };
  };

  // ---- view state
  const [view, setView] = useState<View>(() => (person && state !== 'solo' && byId(person) ? { type: 'person', id: person } : { type: 'list' }));
  const [dir, setDir] = useState<SubpageDirection>('in');
  const [filter, setFilter] = useState<Filter>(null);
  const [hover, setHover] = useState<string[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [draft, setDraft] = useState<RolePickerValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [cfm, setCfm] = useState<Confirm | null>(null);
  const [pending, setPending] = useState<'back' | null>(null);
  const depth = useRef(0);
  const mapRef = useRef<TownMapHandle>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const personId = view.type === 'person' && db.members[view.id] ? view.id : null;
  const committed = (id: string): RolePickerValue => ({ access: company(id), roles: Object.fromEntries(plats.map((p) => [p.id, roleAt(id, p.id)])) });
  const draftFor = (id: string): RolePickerValue => draft ?? committed(id);
  const dirty = (id: string) => {
    const d = draftFor(id), c = committed(id);
    return d.access !== c.access || plats.some((p) => (d.roles[p.id] ?? null) !== (c.roles[p.id] ?? null));
  };

  const go = (next: View, how: 'push' | 'pop' = 'push') => {
    setDir(next.type === 'list' ? 'out' : 'in');
    setDraft(null);
    setView(next);
    if (how === 'push' && next.type === 'person') {
      depth.current += 1;
      window.history.pushState({ rphTeam: depth.current, id: next.id }, '');
    }
  };
  const lastOpened = useRef('');
  const openPerson = (id: string) => {
    if (!db.members[id]) return;
    lastOpened.current = id;
    go({ type: 'person', id });
  };
  const back = () => {
    if (personId && dirty(personId)) { setPending('back'); setCfm({ kind: 'leave' }); return; }
    if (depth.current > 0) window.history.back();
    else go({ type: 'list' }, 'pop');
  };
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = e.state as { rphTeam?: number; id?: string } | null;
      depth.current = s?.rphTeam ?? 0;
      setDraft(null);
      if (s?.id) { setDir('in'); setView({ type: 'person', id: s.id }); } else { setDir('out'); setView({ type: 'list' }); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('[role=dialog],[role=alertdialog],[role=menu],[role=listbox]')) return;
      if (view.type === 'person') back();
      else if (filter) setFilter(null);
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
  });

  // ---- writes: one snapshot per change, with Undo
  const commit = (next: Db, message: string, opts?: { leda?: boolean; flashId?: string | null }) => {
    const before = db;
    setDb(next);
    setFlash(opts?.flashId ?? null);
    toast.undo(message, () => { setDb(before); setDraft(null); }, opts?.leda ? { leda: true } : undefined);
  };
  const patchMember = (id: string, p: Partial<Db['members'][string]>): Db => ({ ...db, members: { ...db.members, [id]: { ...db.members[id]!, ...p } } });

  const savePerson = (id: string, v: RolePickerValue) => {
    const m = byId(id);
    if (v.access !== company(id) && coGuard(id)) { toast.warning(coGuard(id)!); return; }
    const roles: Db['roles'] = {};
    plats.forEach((p) => {
      const r = { ...(db.roles[p.id] ?? {}) };
      if (v.roles[p.id]) r[id] = v.roles[p.id]!; else delete r[id];
      roles[p.id] = r;
    });
    const coChanged = v.access !== company(id);
    const next: Db = { ...db, roles, members: { ...db.members, [id]: { ...db.members[id]!, company: v.access } } };
    const now = plats.filter((p) => v.roles[p.id]).map((p) => `${rName(p.id, v.roles[p.id]!)} at ${shortOf(p.id)}`);
    commit(next, coChanged ? `${m.short} is now ${aOr(accessCopy[v.access].name)} ${accessCopy[v.access].name} in the Portal.` : `Saved. ${m.short}: ${now.length ? andList(now) : 'no platforms'}.`);
    setDraft(null);
  };
  const doSuspend = (id: string) => commit(patchMember(id, { status: 'SUSPENDED' }), `${byId(id).short} is suspended.`);
  const doReactivate = (id: string) => commit(patchMember(id, { status: 'ACTIVE' }), `${byId(id).short} can sign in again.`);
  const doReset = (id: string) => { setDb(patchMember(id, { resetAt: Date.now() })); toast(`Reset link sent to ${byId(id).email}.`); };
  const doRevoke = (invId: string) => {
    const v = db.invites.find((x) => x.id === invId)!;
    commit({ ...db, invites: db.invites.map((x) => (x.id === invId ? { ...x, status: 'REVOKED' as const } : x)) }, `${firstOf(v)}'s invite is revoked.`);
  };
  const doSend = (invId: string) => {
    const v = db.invites.find((x) => x.id === invId);
    if (!v) return;
    const hour = v.sends.filter((t) => Date.now() - t < 3600000);
    if (hour.length >= 3) { toast.warning(`Sent 3 times in the last hour. You can send it again after ${fmt(clockMin() + Math.ceil((3600000 - (Date.now() - hour[0]!)) / 60000))}.`); return; }
    const again = !!v.sent || v.status === 'EXPIRED';
    commit({ ...db, invites: db.invites.map((x) => (x.id === invId ? { ...x, sent: `Today, ${fmt(clockMin())}`, expires: SENT_UNTIL, status: 'PENDING' as const, sends: [...hour, Date.now()] } : x)) }, `${again ? 'Sent again' : 'Invite sent'} to ${v.email}. The link works until ${SENT_UNTIL}.`, { flashId: invId });
  };

  // ---- invite dialog
  const blankIV = (): IV => ({ open: false, step: 1, email: '', name: '', access: 'member', roles: {}, err: null, created: null, byLeda: false });
  const [iv, setIv] = useState<IV>(() => {
    const base = blankIV();
    if (startInvite && state !== 'noaccess') { const o = { ...base, open: true }; if (state === 'manager') plats.filter((p) => p.id === 'autoworks').forEach((p) => (o.roles[p.id] = workRole(p.kind))); return o; }
    return base;
  });
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const sendNowRef = useRef<HTMLButtonElement>(null);
  const ivBody = useRef<HTMLDivElement>(null);
  const openInvite = (pre?: Partial<IV>) => {
    if (effMode !== 'live') return;
    const o: IV = { ...blankIV(), open: true, ...pre };
    // a platform manager's invite starts on their own platform, at its everyday role
    if (!pre && !can.manage()) plats.filter((p) => can.inviteAt(p.id)).slice(0, 1).forEach((p) => (o.roles[p.id] = workRole(p.kind)));
    setIv(o);
  };
  const createInvite = () => {
    const email = iv.email.trim().toLowerCase();
    let err: string | null = null;
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) err = email ? "That doesn't look like an email. Check for a typo." : 'An email is needed. The invite goes there.';
    else {
      const m = memberList.find((x) => x.email.toLowerCase() === email);
      if (m) err = `${m.name} is already on the team with this email.`;
      else if (db.invites.some((v) => v.email.toLowerCase() === email && v.status === 'PENDING')) err = 'An invitation is already pending for this email.';
    }
    if (err) { setIv({ ...iv, err }); return; }
    const id = `inv-${db.seq + 1}-${email.split('@')[0]!.replace(/[^a-z0-9]/g, '')}`;
    const roles: Record<string, string> = {};
    Object.keys(iv.roles).forEach((pid) => { if (iv.roles[pid] && can.inviteAt(pid)) roles[pid] = iv.roles[pid]!; });
    // a new invite replaces an expired one for the same email
    const nextInvites = db.invites.map((v) => (v.email.toLowerCase() === email && v.status === 'EXPIRED' ? { ...v, status: 'REVOKED' as const } : v));
    const created: Invite = { id, name: iv.name.trim(), email, company: iv.access, roles, by: AS, created: `Today, ${fmt(clockMin())}`, sent: null, expires: null, status: 'PENDING', sends: [] };
    setDb({ ...db, invites: [created, ...nextInvites], seq: db.seq + 1 });
    setFlash(id);
    setIv({ ...iv, step: 2, created: id, err: null });
  };
  useLayoutEffect(() => {
    if (iv.open && iv.step === 2) focusIfLost(ivBody.current, sendNowRef.current, { preventScroll: true });
  }, [iv.open, iv.step]);
  useLayoutEffect(() => {
    if (iv.open && iv.step === 1 && iv.err) emailRef.current?.focus({ preventScroll: true });
  }, [iv.err, iv.open, iv.step]);

  // ---- Leda
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState(false);
  const [messages, setMessages] = usePersistedChat<ChatMessageData[]>([], CHAT_KEY);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const me = byId(AS);
  const platQ = (pid: string) => `Who works at ${shortOf(pid) === 'Stockroom' ? 'the stockroom' : shortOf(pid)}?`;
  const inviteCmd = `Invite ${ledaInvite.email} as a mechanic at Auto Works`;
  const suspendTarget = memberList.find((m) => company(m.id) === 'member' && db.members[m.id]!.status === 'ACTIVE' && plats.some((p) => roleAt(m.id, p.id) === 'mechanic')) ?? memberList.find((m) => m.id !== AS);
  const canLedaInvite = effMode === 'live' && can.inviteAt('autoworks') && !!plats.find((p) => p.id === 'autoworks') && !db.invites.some((v) => v.email === ledaInvite.email && v.status === 'PENDING');
  const asks = effMode === 'live' ? [...plats.map((p) => platQ(p.id)), 'How many seats are left?', "Who hasn't signed in today?"] : [];
  const commands = effMode === 'live' ? [...(canLedaInvite ? [inviteCmd] : []), ...(suspendTarget ? [`Suspend ${suspendTarget.name}`] : [])] : [];
  const chipsOf = (qs: string[]): ChatBlock => ({ type: 'chips', chips: qs.slice(0, 3).map((q) => ({ id: q, label: q })) });
  const rolesLine = (id: string) => platsOfPerson(id).map(([pid, k]) => `${rName(pid, k)} at ${shortOf(pid)}`).join(', ') || 'No platforms';
  const table = (caption: string, cols: string[], rows: string[][], right = false): ChatBlock => ({
    type: 'table', caption, columns: cols.map((c, i) => ({ key: `c${i}`, label: c, align: right && i ? ('right' as const) : undefined })), rows: rows.map((r) => Object.fromEntries(r.map((v, i) => [`c${i}`, v]))),
  });
  const reply = (q: string): ChatBlock[] => {
    if (effMode !== 'live') return [{ type: 'text', text: effMode === 'noaccess' ? "You can't see the team, so I can't answer about it either." : "I can't read the team right now. Try again when it has loaded." }];
    const s = q.toLowerCase().trim();
    const plat = plats.find((p) => platQ(p.id).toLowerCase() === s);
    if (plat) {
      const rs = rolesOf(plat.id);
      const ppl = peopleAt(plat.id).sort((a, b) => rs.findIndex((r) => r.id === roleAt(a.id, plat.id)) - rs.findIndex((r) => r.id === roleAt(b.id, plat.id)));
      const said = rs.map((r) => { const ns = ppl.filter((m) => roleAt(m.id, plat.id) === r.id).map((m) => m.short); return ns.length ? `${andList(ns)} ${ns.length === 1 ? `is ${aOr(r.name)} ${lower(r.name)}` : `are ${rolePl(r.name, 2)}`}.` : ''; }).filter(Boolean).join(' ');
      const inv = invites.filter((v) => v.roles[plat.id]);
      const invSaid = inv.map((v) => `${firstOf(v)}'s invite (${rName(plat.id, v.roles[plat.id]!)}) ${v.status === 'EXPIRED' ? `ran out on ${v.expires}` : v.sent ? 'is waiting' : "hasn't been sent"}`).join('. ');
      return [
        { type: 'text', text: `${said || 'Nobody works there yet.'}${invSaid ? ` ${invSaid}.` : ''}`, stream: true },
        ppl.length ? table(`People at ${plat.name}`, ['Person', `Role at ${shortOf(plat.id)}`, 'Portal'], ppl.map((m) => [m.name, rName(plat.id, roleAt(m.id, plat.id)!), accessCopy[company(m.id)].name])) : { type: 'text', text: 'Nobody yet.' },
        { type: 'meta', text: 'Read from Team' },
        chipsOf([...plats.filter((p) => p.id !== plat.id).map((p) => platQ(p.id)), 'How many seats are left?']),
      ];
    }
    if (s === 'how many seats are left?')
      return [
        { type: 'text', text: lim == null ? 'Your plan has no seat limit.' : seatsUsed >= lim ? `All ${lim} seats on ${PLAN} are used. Invites still work, and Plan and billing has more seats.` : `${lim - seatsUsed} of ${lim} seats left on ${PLAN}. Suspended people and expired invites don't use one.`, stream: true },
        table('Seats', ['', 'Seats'], [['People', String(active.length)], ['Invites not accepted yet', String(pendingInv.length)], ['Used', String(seatsUsed)], ['On your plan', lim == null ? 'No limit' : String(lim)]], true),
        { type: 'meta', text: 'Read from Team' },
        chipsOf(plats.map((p) => platQ(p.id))),
      ];
    if (s === "who hasn't signed in today?") {
      const rows = memberList.filter((m) => !/^(Now|Today)/.test(m.last));
      return [
        { type: 'text', text: rows.length ? `${andList(rows.map((m) => m.short))} ${rows.length === 1 ? "hasn't" : "haven't"} signed in today. Everyone else has.` : 'Everyone has signed in today.', stream: true },
        ...(rows.length ? [table('Not signed in today', ['Person', 'Roles', 'Last active'], rows.map((m) => [m.name, rolesLine(m.id), m.last]))] : []),
        { type: 'meta', text: 'Read from Team' },
        chipsOf(['How many seats are left?']),
      ];
    }
    if (canLedaInvite && s === inviteCmd.toLowerCase()) {
      const seat = lim ? `Uses seat ${seatsUsed + 1} of ${lim} on ${PLAN}.` : '';
      return [
        { type: 'text', text: `Picked Mechanic at Auto Works because ${ledaInvite.name.split(' ')[0]} will fix cars there, like Benjie and Tonyo. I can draft invites but never send them.` },
        {
          type: 'proposal', blockId: `team-invite-${++seq}`,
          proposal: {
            title: `Invite ${ledaInvite.name} as a mechanic at Auto Works`, topLabel: "Leda's draft", writesHeading: 'Confirm creates',
            writes: [`An invite for ${ledaInvite.email} (${ledaInvite.name})`, `Dela Cruz Auto Works: Mechanic, when they join. ${rAbout('autoworks', 'mechanic')}`, ...plats.filter((x) => x.id !== 'autoworks').map((x) => `${x.name}: not assigned`), `Portal access: Member. ${accessCopy.member.can}`],
            notes: ['No email yet. You send it from the invite, and the link works for 7 days.', ...(seat ? [seat] : [])], confirmLabel: 'Confirm invite', extraLabel: 'Change it first', doneActionLabel: 'Send invite now',
          },
        },
      ];
    }
    if (suspendTarget && s === `suspend ${suspendTarget.name}`.toLowerCase())
      return [{ type: 'refusal', text: "I can't suspend people or change their roles or Portal access. An owner or admin can, on the person's page.", actions: [{ id: `go:${suspendTarget.id}`, label: `Go to ${suspendTarget.name}` }] }];
    return [{ type: 'text', text: 'Sorry, I can’t answer that in this prototype.', stream: true }, chipsOf(asks)];
  };
  const openChat = () => { opener.current = document.activeElement as HTMLElement | null; setPalette(false); setChat(true); };
  const send = useCallback(
    (q: string) => {
      const id = `m${++seq}`;
      setText('');
      setBusy(true);
      setMessages((m) => [...m, { id, from: 'owner', name: me.name, time: fmt(clockMin()), scope: 'About your team', blocks: [{ type: 'text', text: q }] }, { id: `${id}l`, from: 'leda', name: 'Leda', time: fmt(clockMin()), thinking: true, blocks: [] }]);
      window.setTimeout(() => {
        setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: replyRef.current(q) } : x)));
        setBusy(false);
      }, 900);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setMessages, me.name],
  );
  const replyRef = useRef(reply);
  replyRef.current = reply;
  const ask = (q: string) => { openChat(); send(q); };
  const setBlock = (blockId: string, st: 'waiting' | 'writing' | 'done' | 'discarded', extra: Record<string, unknown> = {}) =>
    setMessages((ms) => ms.map((m) => ({ ...m, blocks: m.blocks.map((b) => (b.type === 'proposal' && b.blockId === blockId ? { ...b, proposal: { ...b.proposal, state: st, ...extra } } : b)) })));
  const lastInviteId = useRef<string | null>(null);
  const confirmLedaInvite = (blockId: string) => {
    setBlock(blockId, 'writing');
    return new Promise<void>((res) =>
      window.setTimeout(() => {
        const id = `inv-${db.seq + 1}-leda`;
        lastInviteId.current = id;
        const created: Invite = { id, name: ledaInvite.name, email: ledaInvite.email, company: ledaInvite.company, roles: { ...ledaInvite.roles }, by: AS, created: `Today, ${fmt(clockMin())}`, sent: null, expires: null, status: 'PENDING', sends: [] };
        const before = db;
        setDb({ ...db, invites: [created, ...db.invites], seq: db.seq + 1 });
        setFlash(id);
        setBlock(blockId, 'done', { after: `Invite for ${ledaInvite.name} created. Nothing is emailed yet.`, doneAt: fmt(clockMin()) });
        toast.undo(`Invite for ${ledaInvite.name} created.`, () => { setDb(before); setBlock(blockId, 'waiting'); }, { leda: true });
        res();
      }, 800),
    );
  };

  const palGroups: CommandPaletteGroup[] = [
    { id: 'ask', label: 'Ask Leda', items: asks.slice(0, 4).map((q) => ({ id: `ask:${q}`, label: q, leda: true })) },
    { id: 'do', label: 'Tell Leda to do', items: commands.map((q) => ({ id: `ask:${q}`, label: q, leda: true, refused: q.startsWith('Suspend'), meta: q.startsWith('Suspend') ? "Leda can't change people" : 'Leda drafts it, you confirm' })) },
    ...(effMode === 'live'
      ? [{
          id: 'people', label: 'People',
          items: [
            ...memberList.map((m) => ({ id: `person:${m.id}`, label: m.name, icon: Users, meta: `${accessCopy[company(m.id)].name} · ${rolesLine(m.id)}` })),
            ...(can.invite() ? [{ id: 'invite', label: 'Invite someone', icon: UserPlus, meta: lim ? `${seatsUsed} of ${lim} seats` : undefined }] : []),
          ],
        }]
      : []),
    { id: 'go', label: 'Go to', items: [{ id: 'go:everyone', label: 'Everyone', icon: Users, meta: plural(active.length, 'person', 'people') }, ...plats.map((p) => ({ id: `go:plat:${p.id}`, label: `${p.name} · Team tab`, leading: <PlatformLogo name={p.name} index={p.index} size={16} decorative />, meta: workWords(p.id) }))] },
  ];
  const onPalette = (item: CommandPaletteItem) => {
    if (item.id.startsWith('ask:')) ask(item.id.slice(4));
    else if (item.id.startsWith('person:')) openPerson(item.id.slice(7));
    else if (item.id === 'invite') openInvite();
    else if (item.id === 'go:everyone') { setFilter(null); if (view.type === 'person') back(); }
    else if (item.id.startsWith('go:plat:')) toast(`Opening ${plats.find((p) => p.id === item.id.slice(8))?.name} Team tab…`);
  };
  const askBar = (variant: 'bar' | 'overview', shortcuts: boolean) => (
    <AskLedaBar variant={variant} scope="your team" paused={palette || chat} shortcuts={shortcuts} onOpen={() => { opener.current = document.activeElement as HTMLElement | null; setPalette(true); }} />
  );

  // ---- map
  const platformSlots = useMemo<TownMapSlot[]>(
    () => home.platforms.map((p) => { const { ledaCanAct: _a, facts: _f, lists: _l, week: _w, yesterday: _y, ...rest } = p; return { ...rest, count: 0 }; }),
    [home],
  );
  const personPlats = personId ? platsOfPerson(personId).map((x) => x[0]) : null;
  const hl = hover ?? personPlats;
  const one = hl && hl.length === 1 ? hl[0]! : null;
  const selectedPlat = filter && 'plat' in filter ? filter.plat : null;

  const setF = (f: Filter) => { setFilter(f); if (view.type === 'person') go({ type: 'list' }, 'pop'); };
  const toggle = (f: NonNullable<Filter>) => {
    const same = JSON.stringify(filter) === JSON.stringify(f);
    setF(same ? null : f);
  };
  const filterName = (f: NonNullable<Filter>) => {
    if ('plat' in f) return plats.find((p) => p.id === f.plat)!.name;
    if ('company' in f) return `${accessCopy[f.company].name}s`;
    const r = roleOptions[f.group]!.find((x) => x.id === f.role)!.name;
    return /Staff$/.test(r) ? r : `${r}s`;
  };
  const applyFilter = <T extends { id: string; roles?: Record<string, string>; company?: CompanyAccess }>(list: T[], isInv: boolean): T[] => {
    if (!filter) return list;
    const r = (x: T, pid: string) => (isInv ? x.roles?.[pid] : roleAt(x.id, pid));
    if ('plat' in filter) return list.filter((x) => r(x, filter.plat));
    if ('company' in filter) return list.filter((x) => (isInv ? x.company : company(x.id)) === filter.company);
    return list.filter((x) => plats.some((p) => groupOf(p.id) === filter.group && r(x, p.id) === filter.role));
  };

  // ---- the place column
  const headline = (() => {
    if (effMode === 'loading') return null;
    if (effMode === 'error') return "Couldn't load your team.";
    if (effMode === 'noaccess') return "You don't have access to the team.";
    const n = active.length;
    const sus = memberList.filter((m) => db.members[m.id]!.status === 'SUSPENDED');
    const ex = invites.filter((v) => v.status === 'EXPIRED');
    const ss = seatState();
    const head = n === 1 && !invites.length ? 'Just you so far.' : `${plural(n, 'person', 'people')}${sus.length ? `, ${sus.length} suspended` : ''}.`;
    let more = '';
    if (ss === 'over') more = ` That's ${seatsUsed} of the ${lim} seats on ${PLAN}.`;
    else if (unsent.length) more = unsent.length === 1 ? ` ${firstOf(unsent[0]!)}'s invite is ready but hasn't been sent.` : ` ${unsent.length} invites are ready but haven't been sent.`;
    else if (ex.length) more = ` ${firstOf(ex[0]!)}'s invite ran out on ${ex[0]!.expires}.`;
    else if (ss === 'full') more = ` All ${lim} seats on your plan are used.`;
    else if (n > 1) more = ' Everyone has signed in this week.';
    return head + more;
  })();

  const seatsBlock = (() => {
    const s = seatState();
    const n = seatsUsed;
    const label = lim == null ? `${plural(n, 'seat')} used. Your plan has no seat limit.` : s === 'over' ? `${n} of ${lim} seats. That's over your plan.` : s === 'full' ? `All ${lim} seats used.` : `${n} of ${lim} seats used`;
    const note = s === 'over' || s === 'full' ? 'Invites still work. Upgrade in Plan and billing to add more.' : s === 'near' ? `${lim! - n} left. Upgrade in Plan and billing when you need more.` : `${plural(active.length, 'person', 'people')}${pendingInv.length ? ` and ${plural(pendingInv.length, 'invite')}` : ''}. Suspended people and expired invites don't use one.`;
    return (
      <>
        <PlaceHeading note={`${PLAN} plan`}>Seats</PlaceHeading>
        <div className="px-3 pb-2">
          {lim != null ? <ProgressBar layout="full" value={n} max={lim} warnAt={lim - 2} label={label} actionHref="#plan-and-billing" /> : <p className="m-0 text-ui text-text">{label}</p>}
          <p className="m-0 mt-1 text-small text-muted">{note}</p>
        </div>
      </>
    );
  })();

  const peopleTable = (() => {
    if (effMode !== 'live') return null;
    const groupLevel = phone ? 2 : 3;
    const COLS = plats.length <= 3;
    const columns = COLS
      ? `minmax(0,216fr) minmax(0,96fr) ${plats.map(() => 'minmax(0,132fr)').join(' ')} minmax(0,124fr) 96px`
      : 'minmax(0,220fr) minmax(0,96fr) minmax(0,300fr) minmax(0,124fr) 96px';
    const header = (
      <>
        <ListHeaderCell>Person</ListHeaderCell>
        <ListHeaderCell>Portal access</ListHeaderCell>
        {COLS ? plats.map((p) => <ListHeaderCell key={p.id} className="flex min-w-0 items-center gap-1.5"><PlatformLogo name={p.name} index={p.index} size={16} decorative /><span className="truncate">{shortOf(p.id)}</span></ListHeaderCell>) : <ListHeaderCell>Roles on each platform</ListHeaderCell>}
        <ListHeaderCell>Status</ListHeaderCell>
        <ListHeaderCell><span className="sr-only">Actions</span></ListHeaderCell>
      </>
    );
    const chipsOf = (roles: Record<string, string | null | undefined>) => {
      const assigned = plats.filter((p) => roles[p.id]);
      const chips = !assigned.length ? (
        <span className="text-ui text-muted">No platforms yet</span>
      ) : plats.length > 3 && assigned.length === plats.length && assigned.every((p) => rName(p.id, roles[p.id]!) === rName(assigned[0]!.id, roles[assigned[0]!.id]!)) ? (
        <span className="inline-flex h-6 items-center gap-1.5 rounded-chip bg-raised pl-1 pr-2 text-small">
          <span aria-hidden className="flex">{assigned.slice(0, 3).map((p, i) => <PlatformLogo key={p.id} name={p.name} index={p.index} size={16} decorative className={cn(i > 0 && '-ml-1', 'ring-1 ring-raised')} />)}</span>
          All {assigned.length} · {rName(assigned[0]!.id, roles[assigned[0]!.id]!)}
        </span>
      ) : (
        <span className="flex flex-wrap gap-1">
          {assigned.map((p) => (
            <span key={p.id} className="inline-flex h-6 min-w-0 items-center gap-1.5 rounded-chip bg-raised pl-1 pr-2 text-small">
              <PlatformLogo name={p.name} index={p.index} size={16} decorative />
              <span className="sr-only">{shortOf(p.id)}: </span>
              <span className="truncate">{rName(p.id, roles[p.id]!)}</span>
            </span>
          ))}
        </span>
      );
      return chips;
    };
    const roleCells = (roles: Record<string, string | null | undefined>, dim: boolean) => {
      const chips = chipsOf(roles);
      return COLS ? (
        <>
          {plats.map((p) => {
            const k = roles[p.id];
            return (
              <ListCell key={p.id} whenStacked="hide" className={cn('text-ui', (!k || dim) && 'text-muted')}>
                {k ? <><span className="sr-only">{shortOf(p.id)}: </span>{rName(p.id, k)}</> : <><span className="sr-only">{shortOf(p.id)}: not assigned</span><span aria-hidden>—</span></>}
              </ListCell>
            );
          })}
          <ListCell whenStacked="only">{chips}</ListCell>
        </>
      ) : (
        <ListCell>{chips}</ListCell>
      );
    };
    const statusTone = (v: Invite | null, suspended: boolean): [StatusTone, string, string] => {
      if (v) {
        if (v.status === 'EXPIRED') return ['bad', 'Expired', `Ran out ${v.expires}`];
        if (!v.sent) return ['warn', 'Not sent yet', `Added ${v.created.split(',')[0]!.replace(/ \d+ \w+$/, '')} by ${v.by === AS ? 'you' : byId(v.by).short}`];
        return ['accent', 'Invited', `Link works until ${v.expires}`];
      }
      return suspended ? ['bad', 'Suspended', "Can't sign in"] : ['ok', 'Active', ''];
    };
    const memberMenuItems = (m: Person): MenuItem[] => {
      const items: MenuItem[] = [];
      if (can.manage()) items.push({ label: 'Change roles', icon: IdentificationBadge, onSelect: () => openPerson(m.id) });
      if (!resetRule(m.id).no) items.push({ label: 'Send reset link', icon: Key, onSelect: () => setCfm({ kind: 'reset', id: m.id }) });
      if (can.manage() && !suspendGuard(m.id)) items.push(db.members[m.id]!.status === 'SUSPENDED' ? { label: 'Reactivate', icon: ArrowCounterClockwise, onSelect: () => doReactivate(m.id) } : { label: 'Suspend', icon: Prohibit, danger: true, onSelect: () => setCfm({ kind: 'suspend', id: m.id }) });
      return items;
    };
    const memberRow = (m: Person) => {
      const st = db.members[m.id]!;
      const sus = st.status === 'SUSPENDED';
      const [tone, word] = statusTone(null, sus);
      if (phone) {
        return (
          <ListRow key={m.id} rowId={m.id} label={m.name} dimmed={sus} onActivate={() => openPerson(m.id)} flash={flash === m.id}>
            <ListCell flush className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5">
              <span className="row-span-3 mt-0.5"><Initials text={m.initials} /></span>
              <span className="min-w-0 text-body font-semibold">
                <a id={`team-open-${m.id}`} href={`#team-${m.id}`} onClick={(e) => { e.preventDefault(); openPerson(m.id); }} className={cn('rounded-chip hover:underline hover:underline-offset-4', focusRing)}>{m.name}</a>
                {m.id === AS ? <span className="ml-1 text-ui font-normal text-muted">(you)</span> : null}
              </span>
              <span className="self-center">{sus ? <StatusDot status={tone} label={word} /> : null}</span>
              <span className="col-span-2 text-small text-muted">{accessCopy[st.company].name}{m.title ? ` · ${m.title}` : ''}</span>
              <span className="col-span-2 mt-0.5 block">{chipsOf(Object.fromEntries(plats.map((p) => [p.id, roleAt(m.id, p.id)])))}</span>
            </ListCell>
          </ListRow>
        );
      }
      const sub = sus ? "Can't sign in" : resetLeft(m.id) > 0 ? 'Reset link sent just now' : m.last === 'Now' ? 'Here now' : m.last.replace('Today, ', 'Today ');
      const menu = memberMenuItems(m);
      return (
        <ListRow key={m.id} rowId={m.id} label={m.name} dimmed={sus} onActivate={() => openPerson(m.id)} flash={flash === m.id} onMouseEnter={() => setHover(platsOfPerson(m.id).map((x) => x[0]))} onMouseLeave={() => setHover(null)}>
          <ListCell kind="lead" className="flex items-start gap-3">
            <Initials text={m.initials} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2">
                <a id={`team-open-${m.id}`} href={`#team-${m.id}`} onClick={(e) => { e.preventDefault(); openPerson(m.id); }} className={cn('min-w-0 rounded-chip text-body font-semibold hover:underline hover:underline-offset-4', focusRing)}>{m.name}</a>
                {m.id === AS ? <span className="text-ui text-muted">(you)</span> : null}
              </div>
              <div className="truncate text-ui text-muted">{m.title}</div>
            </div>
          </ListCell>
          <ListCell className="text-ui"><b className="block font-medium">{accessCopy[st.company].name}</b>{m.creator ? <span className="text-muted">Creator</span> : null}</ListCell>
          {roleCells(Object.fromEntries(plats.map((p) => [p.id, roleAt(m.id, p.id)])), sus)}
          <ListCell className="flex flex-col gap-1 text-ui"><StatusDot status={tone} label={word} /><span className="text-muted">{sub}</span></ListCell>
          <ListCell kind="actions">{menu.length ? <Menu align="end" trigger={<IconButton icon={DotsThree} label={`More for ${m.name}`} />} items={menu} /> : null}</ListCell>
        </ListRow>
      );
    };
    const inviteRow = (v: Invite) => {
      const [tone, word, sub] = statusTone(v, false);
      if (phone) {
        const again = v.sent || v.status === 'EXPIRED';
        return (
          <ListRow key={v.id} rowId={v.id} label={firstOf(v)} flash={flash === v.id}>
            <ListCell flush className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5">
              <span className="row-span-3 mt-0.5"><Initials text={invInitials(v)} invite /></span>
              <span className="min-w-0 text-body font-semibold">{firstOf(v)}</span>
              <span className="self-center"><StatusDot status={tone} label={word} /></span>
              <span className="col-span-2 text-small text-muted">{accessCopy[v.company].name} when they join</span>
              <span className="col-span-2 mt-0.5 block">{chipsOf(Object.fromEntries(plats.map((p) => [p.id, v.roles[p.id] ?? null])))}</span>
              {can.invite() ? (
                <span className="col-span-3 mt-1.5 flex gap-2">
                  <Button variant="secondary" onClick={() => doSend(v.id)}>{again ? 'Resend' : 'Send invite'}</Button>
                  <Button variant="text" onClick={() => setCfm({ kind: 'revoke', id: v.id })}>Revoke</Button>
                </span>
              ) : null}
            </ListCell>
          </ListRow>
        );
      }
      return (
        <ListRow key={v.id} rowId={v.id} label={firstOf(v)} flash={flash === v.id} onMouseEnter={() => setHover(Object.keys(v.roles))} onMouseLeave={() => setHover(null)}>
          <ListCell kind="lead" className="flex items-start gap-3">
            <Initials text={invInitials(v)} invite />
            <div className="min-w-0"><div className="text-body font-semibold">{firstOf(v)}</div><div className="truncate text-ui text-muted">{v.email}</div></div>
          </ListCell>
          <ListCell className="text-ui"><b className="block font-medium">{accessCopy[v.company].name}</b><span className="text-muted">When they join</span></ListCell>
          {roleCells(Object.fromEntries(plats.map((p) => [p.id, v.roles[p.id] ?? null])), false)}
          <ListCell className="flex flex-col gap-1 text-ui"><StatusDot status={tone} label={word} /><span className="text-muted">{sub}</span></ListCell>
          <ListCell kind="actions">
            {can.invite() ? (
              <>
                <Button variant="secondary" onClick={() => doSend(v.id)}>{v.sent || v.status === 'EXPIRED' ? 'Resend' : 'Send'}</Button>
                <Menu align="end" trigger={<IconButton icon={DotsThree} label={`More for ${firstOf(v)}'s invite`} />} items={[{ label: v.sent || v.status === 'EXPIRED' ? 'Send again' : 'Send invite', icon: PaperPlaneTilt, onSelect: () => doSend(v.id) }, { label: 'Revoke invite', icon: XCircle, danger: true, onSelect: () => setCfm({ kind: 'revoke', id: v.id }) }]} />
              </>
            ) : null}
          </ListCell>
        </ListRow>
      );
    };
    const fm = applyFilter(memberList, false);
    const fi = applyFilter(invites, true);
    const susp = fm.filter((m) => db.members[m.id]!.status === 'SUSPENDED');
    const act = fm.filter((m) => db.members[m.id]!.status !== 'SUSPENDED');
    return (
      <ListGroups as="table" aria-label="People" columns={columns} header={header} cursorId={cursor} onCursorChange={setCursor}>
        {fi.length ? <ListGroup title="Waiting to join" count={fi.length} note={fi.some((v) => !v.sent && v.status === 'PENDING') ? 'Nothing is emailed until you press Send' : undefined} level={groupLevel}>{fi.map(inviteRow)}</ListGroup> : null}
        {susp.length ? <ListGroup title="Suspended" count={susp.length} level={groupLevel}>{susp.map(memberRow)}</ListGroup> : null}
        <ListGroup title="People" count={act.length} level={groupLevel} empty="Nobody here yet.">{act.map(memberRow)}</ListGroup>
      </ListGroups>
    );
  })();

  const place = (
    <div className="flex h-full min-h-0 flex-col max-[640px]:h-auto">
      <TownMap
        ref={mapRef}
        className="shrink-0"
        platforms={platformSlots}
        links={home.links}
        caption={effMode === 'loading' ? undefined : effMode !== 'live' ? 'No data' : filter && 'plat' in filter ? `${plats.find((p) => p.id === filter.plat)!.name} · ${lower(workWords(filter.plat))}` : `${plural(plats.length, 'platform')} · pick one to see who works there`}
        label="Where your team works"
        selected={selectedPlat}
        highlight={one || !hl || !hl.length ? null : hl}
        focus={one}
        loading={effMode === 'loading'}
        error={effMode === 'error' || effMode === 'noaccess'}
        onSelect={(id) => { if (effMode === 'live' && id) toggle({ plat: id }); }}
        onHover={(id) => setHover(id ? [id] : null)}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto max-[640px]:overflow-visible">
        <div className="px-3 pb-1 pt-3">
          <div className="flex items-center gap-2">
            <h1 className="m-0 min-w-0 flex-1 text-title text-text">Team</h1>
            {effMode === 'live' && can.invite() ? <Button variant="text" leftIcon={UserPlus} onClick={() => openInvite()}>Invite</Button> : null}
          </div>
          <div className="mt-1 flex items-start gap-2 text-ui text-text" role="status">
            <LedaMark size={16} effect={effMode === 'loading' ? 'aurora' : 'glint'} active={effMode === 'loading'} once={effMode !== 'loading'} decorative className="mt-0.5 shrink-0" />
            {headline == null ? <Skeleton variant="text" width="88%" /> : <span className="min-w-0">{headline}</span>}
          </div>
          {phone ? <div className="mt-3">{askBar('overview', false)}</div> : null}
        </div>
        {effMode === 'loading' ? (
          <div className="px-3 pt-4" aria-hidden>
            <Skeleton variant="text" width="40%" />
            {[0, 1].map((i) => <div key={i} className="mt-3"><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" className="mt-2" /></div>)}
          </div>
        ) : effMode === 'error' ? (
          phone ? <div className="px-3 pt-4"><ErrorBlock thing="team" lastLoaded={LAST_GOOD} onRetry={() => setLoaded(true)} /></div> : <p className="m-0 px-3 pt-4 text-ui text-muted">No data. Try again in the main panel.</p>
        ) : effMode === 'noaccess' ? (
          <>
            <PlaceHeading>Company admins</PlaceHeading>
            {admins.map((m) => (
              <div key={m.id} className="flex flex-col gap-0.5 px-3 py-2 text-ui">
                <span className="flex items-center gap-2 font-medium"><Initials text={m.initials} size={20} />{m.name}</span>
                <span className="text-small text-muted">{m.email}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            {phone ? <div className="px-3 pb-2 pt-3">{peopleTable}</div> : null}
            <PlaceHeading note="A role on each">Where they work</PlaceHeading>
            {plats.length ? plats.map((p) => (
              <FilterRow key={p.id} title={p.name} about={workWords(p.id)} on={selectedPlat === p.id} onClick={() => toggle({ plat: p.id })} onHover={(on) => setHover(on ? [p.id] : null)} leading={<PlatformLogo name={p.name} index={p.index} size={16} decorative />} />
            )) : <p className="m-0 px-3 text-ui text-muted">No platforms yet.</p>}
            <PlaceHeading note="By kind of platform">Roles</PlaceHeading>
            {kindGroups.map((g) => (
              <div key={g.key} role="group" aria-label={`${g.kinds.join(', ')} roles`}>
                <p className="m-0 flex items-center gap-2 px-3 pb-0.5 pt-2 text-small text-muted">
                  <span aria-hidden className="flex">{g.plats.slice(0, 4).map((p, i) => <PlatformLogo key={p.id} name={p.name} index={p.index} size={16} decorative className={cn(i > 0 && '-ml-1', 'ring-1 ring-frame')} />)}</span>
                  <b className="font-semibold text-text">{g.kinds.join(', ')}</b>
                  <span className="min-w-0 truncate">{g.plats.length > 3 ? plural(g.plats.length, 'platform') : andList(g.plats.map((p) => shortOf(p.id)))}</span>
                </p>
                {roleOptions[g.key]!.map((r) => {
                  const n = memberList.filter((m) => g.plats.some((p) => roleAt(m.id, p.id) === r.id)).length;
                  const on = !!filter && 'group' in filter && filter.group === g.key && filter.role === r.id;
                  return <FilterRow key={r.id} title={r.name} count={n || '—'} about={r.about} on={on} onClick={() => toggle({ group: g.key, role: r.id })} onHover={(h) => setHover(h ? g.plats.map((p) => p.id) : null)} />;
                })}
              </div>
            ))}
            <PlaceHeading note="One per person">Portal access</PlaceHeading>
            {(['owner', 'admin', 'member'] as CompanyAccess[]).map((k) => (
              <FilterRow key={k} title={accessCopy[k].name} count={memberList.filter((m) => company(m.id) === k).length} about={accessCopy[k].can} on={!!filter && 'company' in filter && filter.company === k} onClick={() => toggle({ company: k })} />
            ))}
            <p className="m-0 px-3 pt-2 text-small text-muted">Portal access says who can change the Portal itself. What someone does inside a platform is their role there, so the same person can be a Manager in one and a Viewer in another.</p>
            {seatsBlock}
          </>
        )}
        <div className="h-4 shrink-0" />
      </div>
    </div>
  );

  // ---- the sheet
  const header = (title: string, sub: ReactNode, withInvite = true) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="m-0 text-title text-text" data-subpage-focus tabIndex={-1}>{title}</h2>
        {sub ? <p className="m-0 mt-1 text-ui text-muted">{sub}</p> : null}
      </div>
      {withInvite && can.invite() ? <Button variant="primary" leftIcon={UserPlus} onClick={() => openInvite()}>Invite someone</Button> : null}
    </div>
  );
  const subLine = (() => {
    const sus = memberList.length - active.length;
    const ex = invites.length - pendingInv.length;
    return [plural(active.length, 'person', 'people'), sus ? `${sus} suspended` : '', unsent.length ? `${plural(unsent.length, 'invite')} not sent` : '', pendingInv.length - unsent.length ? `${plural(pendingInv.length - unsent.length, 'invite')} waiting` : '', ex ? `${ex} expired` : ''].filter(Boolean).join(' · ');
  })();
  const listView = (() => {
    if (effMode === 'loading')
      return (
        <div className="px-pad pb-10 pt-5" aria-busy>
          {header('Everyone', <Skeleton variant="text" width={220} />, false)}
          <div className="mt-5 border-t border-rule" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 border-b border-rule py-row-y">
                <Skeleton variant="circle" width={32} height={32} />
                <div className="min-w-0 flex-1"><Skeleton variant="text" width="30%" /><Skeleton variant="text" width="20%" className="mt-2" /></div>
              </div>
            ))}
          </div>
        </div>
      );
    if (effMode === 'error') return <div className="px-pad pb-10 pt-5">{header('Everyone', null, false)}<ErrorBlock className="mt-5" thing="team" lastLoaded={LAST_GOOD} onRetry={() => { setLoaded(true); toast('Team loaded.'); }} /></div>;
    if (effMode === 'noaccess')
      return (
        <div className="px-pad pb-10 pt-5">
          {header('Team', null, false)}
          <EmptyState align="start" className="mt-5 px-0" icon={Lock} title="You don't have access to the team." description={`Ask a company admin: ${andList(admins.map((m) => m.name))}.`} />
        </div>
      );
    if (memberList.length === 1 && !invites.length)
      return (
        <div className="px-pad pb-10 pt-5">
          {header('Just you so far', `${memberList[0]!.name}, ${accessCopy[company(memberList[0]!.id)].name}`)}
          <div className="mt-5">{peopleTable}</div>
          <div className="mt-6 rounded-card border border-border bg-raised px-pad py-5">
            <EmptyState align="start" className="p-0" icon={UserPlus} headingLevel={3} title="Invite the people who work with you" description="Add their email and pick their role on each platform. Nothing is emailed until you press Send, and the link works for 7 days." action={
              <div className="flex flex-wrap items-center gap-3"><Button variant="primary" leftIcon={UserPlus} onClick={() => openInvite()}>Invite someone</Button>{lim ? <span className="text-ui text-muted">{`${lim - seatsUsed} of ${lim} seats free on ${PLAN}`}</span> : null}</div>
            } />
          </div>
        </div>
      );
    const title = filter ? ('plat' in filter ? `At ${filterName(filter)}` : filterName(filter)) : 'Everyone';
    const fm = applyFilter(memberList, false);
    const fi = applyFilter(invites, true);
    const sub = filter ? `${plural(fm.length, 'person', 'people')}${fi.length ? ` · ${plural(fi.length, 'invite')}` : ''}` : subLine;
    return (
      <div className="px-pad pb-10 pt-5">
        {header(title, sub)}
        {filter ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {'plat' in filter ? <Button variant="text" leftIcon={ArrowUpRight} onClick={() => toast(`Opening ${shortOf(filter.plat)}'s Team tab…`)}>{shortOf(filter.plat)}'s Team tab</Button> : null}
            <Button variant="text" leftIcon={X} onClick={() => setFilter(null)}>Show everyone</Button>
          </div>
        ) : null}
        <div className="mt-5">{peopleTable}</div>
      </div>
    );
  })();

  const personView = (() => {
    if (!personId) return null;
    const m = byId(personId);
    const st = db.members[personId]!;
    const sus = st.status === 'SUSPENDED';
    const d = draftFor(personId);
    const g = coGuard(personId);
    const r = resetRule(personId);
    const sg = suspendGuard(personId);
    const toAdmin = d.access === 'admin' && st.company === 'member';
    const fromAdmin = st.company === 'admin' && d.access === 'member';
    const pickerPlats: RolePickerPlatform[] = plats.map((p) => ({ id: p.id, name: p.name, kind: p.kind, index: p.index }));
    const roleLine = platsOfPerson(personId).map(([pid, k]) => `${rName(pid, k)} at ${shortOf(pid)}`).join(' · ') || 'No platforms yet';
    const act = (activity[personId] ?? []).slice(0, 3);
    const Warn = ({ children }: { children: ReactNode }) => (
      <p className="m-0 flex items-start gap-2 rounded-card bg-warn-bg px-3 py-2 text-small text-warn-ink"><Warning aria-hidden size={14} weight="bold" className="mt-0.5 shrink-0" /><span className="min-w-0">{children}</span></p>
    );
    return (
      <div className="px-pad pb-10 pt-5">
        <div className="flex items-center gap-3">
          <Initials text={m.initials} size={40} />
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {phone ? (
              <h1 ref={headingRef} data-subpage-focus tabIndex={-1} className="m-0 min-w-0 text-title text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">{m.name}</h1>
            ) : (
              <h2 ref={headingRef} data-subpage-focus tabIndex={-1} className="m-0 min-w-0 text-title text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">{m.name}</h2>
            )}
            {m.id === AS ? <span className="text-ui text-muted">(you)</span> : null}
            {m.creator ? <Badge tone="neutral">Creator</Badge> : null}
          </div>
        </div>
        <FactsLine aria-label="Person facts" className="mt-2">
          <Fact value={roleLine} />
          <Fact>{accessCopy[st.company].name} in the Portal</Fact>
          {m.title && !/^(Owner|Admin)$/.test(m.title) && !platsOfPerson(personId).some(([pid, k]) => rName(pid, k) === m.title) ? <Fact>{m.title}</Fact> : null}
          <Fact>{m.email}</Fact>
          {sus ? <Fact tone="bad">Suspended</Fact> : null}
        </FactsLine>
        {phone ? <h2 className="sr-only">Roles and account</h2> : null}
        <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 @min-[760px]/sheet:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
          <div className="flex min-w-0 flex-col gap-3">
            <RolePicker
              value={d}
              savedValue={committed(personId)}
              platforms={pickerPlats}
              roleOptions={roleOptions}
              subject={m.short}
              readOnly={!can.manage()}
              readOnlyReason="Only an owner or admin can change roles."
              accessReason={can.manage() ? g ?? undefined : undefined}
              accessCopy={{ owner: accessCopy.owner.can, admin: accessCopy.admin.can, member: accessCopy.member.can }}
              rolesIntro={`What ${m.short} does in each one. A different role on each is fine. The same as each platform's Team tab.`}
              accessIntro="Who can change the Portal itself: platforms, the team, the plan and billing."
              removeConfirm={{
                title: (gone) => `Take ${m.short} off ${andList(gone.map((p) => shortOf(p.id)))}?`,
                description: (gone) => `${m.short} can't open ${andList(gone.map((p) => p.name))} once you save. Their records there stay, and their other changes save too.`,
                confirmLabel: (gone) => (gone.length === 1 ? 'Remove and save' : `Remove from ${gone.length} and save`),
              }}
              saving={saving}
              onChange={setDraft}
              onDiscard={() => setDraft(null)}
              onSave={(v) => {
                setSaving(true);
                window.setTimeout(() => { setSaving(false); savePerson(personId, v); }, 400);
              }}
            />
            {toAdmin ? <Warn>Admins can change everything in the Portal, including the plan, the platforms and the team. {m.short}'s roles on each platform stay as set above.</Warn> : null}
            {fromAdmin ? <Warn>{m.short} can no longer change the Portal. {m.short}'s roles on each platform stay as set above.</Warn> : null}
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <section aria-labelledby="acct-h">
              <h3 id="acct-h" className="m-0 mb-1 text-ui font-medium text-text">Account</h3>
              <DataList stacked items={[
                { label: 'Status', value: <StatusDot status={sus ? 'bad' : 'ok'} label={sus ? 'Suspended' : 'Active'} /> },
                { label: 'Last active', value: m.last },
                { label: 'Joined', value: m.joined },
                { label: 'Added by', value: m.by ? byId(m.by).name : 'Created the company' },
              ]} />
            </section>
            <section aria-labelledby="pw-h">
              <h3 id="pw-h" className="m-0 mb-1 text-ui font-medium text-text">Password</h3>
              {r.no ? (
                <p className={cn('m-0 flex items-start gap-1.5 text-small', r.sent ? 'text-ok-ink' : 'text-muted')}>{r.sent ? <CheckCircle aria-hidden size={14} weight="fill" className="mt-0.5 shrink-0" /> : null}<span className="min-w-0">{r.why}</span></p>
              ) : (
                <>
                  <p className="m-0 mb-2 text-small text-muted">We'll email {m.email} a link to set a new password. Their current password keeps working until they use it.</p>
                  <Button variant="secondary" leftIcon={Key} onClick={() => setCfm({ kind: 'reset', id: personId })}>Send reset link</Button>
                </>
              )}
            </section>
            <section aria-labelledby="act-h">
              <h3 id="act-h" className="m-0 mb-1 text-ui font-medium text-text">Recent activity</h3>
              {act.length ? (
                <ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-small">
                  {act.map(([t, w]) => <li key={`${t}${w}`} className="flex gap-3"><span className="w-20 shrink-0 tabular-nums text-muted">{t}</span><span className="min-w-0 text-text">{w}</span></li>)}
                </ol>
              ) : <p className="m-0 text-small text-muted">Nothing yet.</p>}
            </section>
            {m.id === AS ? null : (
              <section aria-labelledby="sus-h" className="rounded-card border border-border px-3 py-3">
                <h3 id="sus-h" className="m-0 mb-1 text-ui font-medium text-text">{sus ? 'Reactivate' : 'Suspend'}</h3>
                {sg ? <p className="m-0 flex items-start gap-1.5 text-small text-muted"><Lock aria-hidden size={12} weight="bold" className="mt-1 shrink-0" /><span className="min-w-0">{sg}</span></p>
                  : sus ? (<><p className="m-0 mb-2 text-small text-muted">{m.short} can't sign in or use any platform. Their records stay.</p><Button variant="secondary" leftIcon={ArrowCounterClockwise} onClick={() => doReactivate(personId)}>Reactivate {m.short}</Button></>)
                  : (<><p className="m-0 mb-2 text-small text-muted">{m.short} can't sign in or use any platform until you reactivate them. Their records stay. People can't be removed, only suspended.</p><Button variant="secondary" leftIcon={Prohibit} className="text-bad-ink" onClick={() => setCfm({ kind: 'suspend', id: personId })}>Suspend {m.short}</Button></>)}
              </section>
            )}
          </div>
        </div>
      </div>
    );
  })();

  const crumbs = personId
    ? [{ label: 'Team', href: '#team', onClick: (e: React.MouseEvent) => { e.preventDefault(); back(); } }, { label: byId(personId).name }]
    : filter && effMode === 'live'
      ? [{ label: 'Team', href: '#team', onClick: (e: React.MouseEvent) => { e.preventDefault(); setFilter(null); } }, { label: filterName(filter) }]
      : [{ label: 'Team' }];
  const sheetBar = phone ? undefined : (
    <SheetBar actions={askBar('bar', true)}>
      {personId || (filter && effMode === 'live') ? (
        <Breadcrumbs variant="sheet" aria-label="You are here" items={crumbs} />
      ) : (
        <span className="inline-flex items-center gap-2 text-ui font-semibold text-text"><Users aria-hidden size={16} />Team</span>
      )}
    </SheetBar>
  );
  const detailBar = phone && personId ? (
    <>
      <IconButton icon={ArrowLeft} label="Back to Team" onClick={back} />
      <span className="min-w-0 flex-1 truncate text-ui font-semibold">Team</span>
      {askBar('bar', false)}
      <AccountMenu name={me.name} email={me.email} role={accessCopy[company(AS)].name} applyToDocument={false} />
    </>
  ) : undefined;

  const subKey = personId ? `person:${personId}` : 'list';
  const dlgName = cfm && cfm.kind !== 'revoke' && cfm.kind !== 'leave' ? byId(cfm.id) : null;
  const closeConfirm = () => { setCfm(null); setPending(null); };

  return (
    <>
      <SubpageTransition paneKey={subKey} direction={dir} restoreFocus={() => document.getElementById(`team-open-${lastOpened.current}`) ?? document.querySelector<HTMLElement>('[data-shell-place] h1')}>
        <PortalFrame
          current="team"
          pageName="Team"
          account={{ name: me.name, email: me.email, role: accessCopy[company(AS)].name }}
          teamCount={effMode === 'live' ? unsent.length : 0}
          onAddPlatform={() => navGo({ to: 'platforms', add: true })}
          onNavigate={(d: Dest) => (d.to === 'team' ? (personId ? back() : undefined) : navGo(d))}
          leda={askBar('bar', false)}
          place={place}
          placeLabel="Your team"
          sheetBar={sheetBar}
          sheetLabel={personId ? byId(personId).name : 'Everyone'}
          detail={phone && !!personId}
          heading={null}
          topBar={detailBar}
          status={
            <StatusBar
              platforms={home.platforms.map((p) => ({ id: p.id, name: p.shortName ?? p.name, color: p.index, health: (p.status === 'ACTIVE' ? 'ok' : p.status === 'DEGRADED' ? 'warn' : 'bad') as StatusBarHealth }))}
              people={effMode === 'noaccess' ? undefined : { count: active.length }}
              invites={{ count: effMode === 'live' ? pendingInv.length : 0 }}
              leda={{ used: home.plan.used, max: home.plan.max }}
              plan={PLAN}
              updatedAt={fmt(SAMPLE_NOW)}
            />
          }
        >
          <SubpageLane from="right">
            {personId ? personView : phone ? null : listView}
          </SubpageLane>
        </PortalFrame>
      </SubpageTransition>

      <Modal
        open={iv.open}
        onOpenChange={(o) => { if (!o) setIv((x) => ({ ...x, open: false })); }}
        size="lg"
        icon={iv.step === 2 ? CheckCircle : UserPlus}
        title={iv.step === 2 ? `${db.invites.find((v) => v.id === iv.created)?.name || db.invites.find((v) => v.id === iv.created)?.email}'s invite is ready` : 'Invite someone'}
        description={iv.step === 2 ? 'Nothing has been emailed yet. When you send it, they get this:' : 'Nothing is emailed until you press Send. The link works for 7 days.'}
        initialFocus={emailRef}
        footer={
          iv.step === 2 ? (
            <div key="s2" className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => { setIv((x) => ({ ...x, open: false })); toast('Invite saved. Press Send on it when you are ready.'); }}>Send later</Button>
              <Button ref={sendNowRef} variant="primary" leftIcon={PaperPlaneTilt} onClick={() => { setIv((x) => ({ ...x, open: false })); doSend(iv.created!); }}>Send now</Button>
            </div>
          ) : (
            <div key="s1" className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setIv((x) => ({ ...x, open: false }))}>Cancel</Button>
              <Button variant="primary" onClick={createInvite}>Create invite</Button>
            </div>
          )
        }
      >
        <div ref={ivBody} className="flex flex-col gap-5">
          {iv.step === 2 ? (() => {
            const v = db.invites.find((x) => x.id === iv.created)!;
            const w = Object.entries(v.roles).map(([pid, k]) => `${aOr(rName(pid, k))} ${rName(pid, k)} at ${plats.find((p) => p.id === pid)!.name}`);
            return (
              <div role="group" aria-label="The invite email" className="rounded-card border border-border bg-raised px-4 py-4 text-ui text-text">
                <p className="m-0 font-semibold">{me.name} invited you to ReadyPH</p>
                <p className="m-0 mt-2">{me.short} added you to the team{w.length ? ` as ${andList(w)}` : ''}{v.company === 'admin' ? ', and as an admin of the Portal' : ''}. Set your password to join.</p>
                <span className="mt-3 inline-flex h-8 items-center rounded-control bg-accent px-3 text-ui font-medium text-accent-ink">Join the team</span>
                <p className="m-0 mt-3 text-small text-muted">The link works for 7 days. To {v.email}.</p>
              </div>
            );
          })() : (
            <>
              {iv.byLeda ? <LedaNote>Filled in from Leda's draft. Change anything before you create it.</LedaNote> : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor="iv-email" className="mb-1 block text-small text-muted">Email</label>
                  <input ref={emailRef} id="iv-email" type="email" inputMode="email" autoComplete="off" value={iv.email} onChange={(e) => setIv({ ...iv, email: e.target.value, err: null })} aria-invalid={iv.err ? true : undefined} aria-describedby="iv-email-h" className={cn(fieldClass, iv.err ? 'border-bad' : 'border-control')} />
                  {iv.err ? <p id="iv-email-h" role="alert" className="m-0 mt-1 text-small text-bad-ink">{iv.err}</p> : <p id="iv-email-h" className="m-0 mt-1 text-small text-muted">Where the invite goes. They sign in with it.</p>}
                </div>
                <div className="min-w-0">
                  <label htmlFor="iv-name" className="mb-1 block text-small text-muted">Name (optional)</label>
                  <input ref={nameRef} id="iv-name" type="text" maxLength={80} autoComplete="off" value={iv.name} onChange={(e) => setIv({ ...iv, name: e.target.value })} aria-describedby="iv-name-h" className={cn(fieldClass, 'border-control')} />
                  <p id="iv-name-h" className="m-0 mt-1 text-small text-muted">So you know who it is before they join.</p>
                </div>
              </div>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="mb-1 p-0 text-ui font-medium text-text">Role on each platform</legend>
                <p className="m-0 mb-2 text-small text-muted">Pick what they'll do in each one. It can be different on each.</p>
                <ul className="m-0 flex list-none flex-col p-0">
                  {plats.map((p) => {
                    const ok = can.inviteAt(p.id);
                    const k = iv.roles[p.id] ?? '';
                    const about = !ok ? `Only an admin or ${shortOf(p.id)}'s manager can add people here.` : k ? rAbout(p.id, k) : 'Not assigned: they can’t open it.';
                    return (
                      <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-x-3 gap-y-1 border-t border-rule py-3 last:border-b max-sm:grid-cols-1">
                        <div className="flex min-w-0 items-center gap-3">
                          <PlatformLogo decorative name={p.name} index={p.index} size={24} />
                          <div className="flex min-w-0 flex-col"><span className="text-body font-medium">{p.name}</span><span className="text-small text-muted">{p.kind}</span></div>
                        </div>
                        <Select size="sm" aria-label={`Role at ${p.name}`} aria-describedby={`iv-${p.id}-about`} disabled={!ok} value={k} onValueChange={(v) => setIv({ ...iv, roles: { ...iv.roles, [p.id]: v } })} options={[{ value: '', label: 'Not assigned' }, ...rolesOf(p.id).map((r) => ({ value: r.id, label: r.name, textValue: r.name }))]} />
                        <p id={`iv-${p.id}-about`} className="col-span-full m-0 pl-9 text-small text-muted max-sm:pl-0">{about}</p>
                      </li>
                    );
                  })}
                </ul>
                {!Object.values(iv.roles).some(Boolean) && iv.access === 'member' ? <p className="m-0 mt-2 text-small text-muted">With no role anywhere they can sign in but can't open any platform.</p> : null}
              </fieldset>
              <div className="min-w-0">
                <span id="iv-access" className="mb-1 block text-ui font-medium text-text">Portal access</span>
                <SegmentedControl aria-labelledby="iv-access" semantics="radio" value={iv.access} onChange={(v) => setIv({ ...iv, access: v as CompanyAccess })} options={[{ value: 'member', label: 'Member' }, { value: 'admin', label: 'Admin', disabled: !can.manage() }]} />
                <p className="m-0 mt-1 text-small text-muted">{iv.access === 'admin' ? `${accessCopy.admin.can} Gets every platform.` : accessCopy.member.can}{!can.manage() ? ' Only an owner or admin can invite an admin.' : ''}</p>
              </div>
              {lim ? (() => {
                const ss = seatState(1);
                return (
                  <p className={cn('m-0 flex items-start gap-2 text-small', ss === 'over' || ss === 'full' ? 'text-bad-ink' : ss === 'near' ? 'text-warn-ink' : 'text-muted')}>
                    {ss === 'ok' ? <Chair aria-hidden size={14} className="mt-0.5 shrink-0" /> : <Warning aria-hidden size={14} weight="bold" className="mt-0.5 shrink-0" />}
                    <span className="min-w-0">{ss === 'over' ? `This goes over your plan's ${lim} seats (${seatsUsed + 1} of ${lim}). The invite still works. Upgrade in Plan and billing.` : `Uses seat ${seatsUsed + 1} of ${lim} on ${PLAN}.`}</span>
                  </p>
                );
              })() : null}
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!cfm}
        onOpenChange={(o) => { if (!o) closeConfirm(); }}
        tone={cfm?.kind === 'reset' ? 'primary' : 'danger'}
        icon={cfm?.kind === 'reset' ? Key : cfm?.kind === 'revoke' ? XCircle : cfm?.kind === 'leave' ? UserMinus : Prohibit}
        title={
          cfm?.kind === 'suspend' ? `Suspend ${dlgName!.name}?`
          : cfm?.kind === 'reset' ? `Send ${dlgName!.short} a reset link?`
          : cfm?.kind === 'revoke' ? `Revoke ${firstOf(db.invites.find((v) => v.id === cfm.id)!)}'s invite?`
          : 'Leave without saving?'
        }
        description={
          cfm?.kind === 'suspend' ? `${dlgName!.short} can't sign in to the Portal${platsOfPerson(dlgName!.id).length ? ` or ${andList(platsOfPerson(dlgName!.id).map((x) => shortOf(x[0])))}` : ''} until you reactivate them. Their roles, jobs, records and history stay. Their seat is freed.`
          : cfm?.kind === 'reset' ? `We'll email ${dlgName!.email} a link to set a new password. Their current password keeps working until they use it.`
          : cfm?.kind === 'revoke' ? (() => { const v = db.invites.find((x) => x.id === cfm.id)!; return `${v.sent && v.status === 'PENDING' ? 'The link in the email stops working. ' : ''}You can invite ${v.email} again later.`; })()
          : 'Your changes to this person are not saved.'
        }
        confirmLabel={cfm?.kind === 'suspend' ? `Suspend ${dlgName!.short}` : cfm?.kind === 'reset' ? 'Send reset link' : cfm?.kind === 'revoke' ? 'Revoke invite' : 'Leave'}
        cancelLabel={cfm?.kind === 'leave' ? 'Keep editing' : 'Cancel'}
        onConfirm={() => {
          const c = cfm;
          closeConfirm();
          if (!c) return;
          if (c.kind === 'suspend') doSuspend(c.id);
          else if (c.kind === 'reset') doReset(c.id);
          else if (c.kind === 'revoke') doRevoke(c.id);
          else if (pending === 'back') { setDraft(null); if (depth.current > 0) window.history.back(); else go({ type: 'list' }, 'pop'); }
        }}
      />

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
        placeholder="Ask Leda about your team"
      />
      {chat && (
        <Chat onClose={() => setChat(false)} returnFocusTo={opener}>
          <ChatHeader busy={busy} empty={messages.length === 0} onNewConversation={() => setMessages([])} onClose={() => setChat(false)} />
          {messages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto"><ChatEmpty scope="your team" chips={[...asks.slice(0, 3), ...commands].map((q) => ({ id: q, label: q }))} onPick={(c) => send(c.label)} /></div>
          ) : (
            <ChatThread>
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onChip={(c) => send(c.label)}
                  onAction={(a: ChatActionItem) => { if (a.id.startsWith('go:')) { setChat(false); openPerson(a.id.slice(3)); } }}
                  onConfirm={confirmLedaInvite}
                  onDiscard={(bid) => setBlock(bid, 'discarded')}
                  onProposalAction={(_bid, which) => {
                    if (which === 'extra') { setChat(false); openInvite({ email: ledaInvite.email, name: ledaInvite.name, access: ledaInvite.company, roles: { ...ledaInvite.roles }, byLeda: true }); }
                    else { setChat(false); if (lastInviteId.current) doSend(lastInviteId.current); }
                  }}
                />
              ))}
            </ChatThread>
          )}
          <ChatComposer value={text} onChange={setText} onSend={send} busy={busy} scope="About your team" />
        </Chat>
      )}
      <Toaster />
    </>
  );
}
void ArrowRight;
void initialsOf;
void SAMPLE_NOW;
