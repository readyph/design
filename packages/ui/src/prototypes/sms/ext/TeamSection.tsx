import { useEffect, useMemo, useRef, useState } from 'react';
import { DotsThreeVertical, PencilSimple, Plus, Power } from '@phosphor-icons/react';
import { Badge, Button, ConfirmDialog, EmptyState, Menu, Select, cn, toast } from '../../../index';
import { PersonAvatar } from './avatarTone';
import { InfiniteSentinel, ListEnd, ResultCount } from './InfiniteList';
import { SearchBox } from './ServicesControls';
import { StaffModal } from './StaffModal';
import { ROLE_LABEL, initialsOf, summarizeWeek, type Staff, type StaffRole } from '../settingsModel';

const PAGE = 12;
const COLS = 'grid-cols-[minmax(200px,1.3fr)_112px_132px_minmax(150px,1.2fr)_88px_44px]';
const ROLE_OPTS = [{ value: 'any', label: 'All roles' }, ...(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))];
const STATUS_OPTS = [{ value: 'any', label: 'Active and inactive' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];
const roleTone = (r: StaffRole) => (r === 'manager' ? 'primary' : r === 'front_desk' ? 'info' : 'neutral');

/** F38 Team: ruled table (rows on a phone), search + role / status filters, infinite list, row opens the Edit staff modal, Add staff, row menu. */
export function TeamSection({ staff, onChange, initialOpen = null, phone }: { staff: Staff[]; onChange: (s: Staff[]) => void; initialOpen?: 'edit' | 'add' | null; phone: boolean }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('any');
  const [status, setStatus] = useState('any');
  const [count, setCount] = useState(PAGE);
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState<'new' | string | null>(initialOpen === 'add' ? 'new' : initialOpen === 'edit' ? staff.find((s) => !s.you)?.id ?? null : null);
  const [ask, setAsk] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const rows = useMemo(() => staff.filter((s) => (role === 'any' || s.role === role) && (status === 'any' || (status === 'active') === s.active) && `${s.name} ${s.phone} ${s.email}`.toLowerCase().includes(q.trim().toLowerCase())), [staff, q, role, status]);
  const page = rows.slice(0, count);
  const reset = () => { window.clearTimeout(timer.current); setMore(false); setCount(PAGE); };
  const loadMore = () => { if (more || page.length >= rows.length) return; setMore(true); timer.current = window.setTimeout(() => { setCount((c) => c + PAGE); setMore(false); }, 400); };
  const filtered = !!q.trim() || role !== 'any' || status !== 'any';
  const editing = open && open !== 'new' ? staff.find((s) => s.id === open) ?? null : null;
  const asked = ask ? staff.find((s) => s.id === ask) ?? null : null;

  const save = (s: Staff, invite: boolean) => {
    const before = staff.find((x) => x.id === s.id);
    onChange(before ? staff.map((x) => (x.id === s.id ? s : x)) : [...staff, s]);
    setOpen(null);
    toast.undo(before ? `${s.name} saved.` : invite ? `${s.name} added. We sent an invite to ${s.phone}.` : `${s.name} added.`, () => onChange(before ? staff : staff.filter((x) => x.id !== s.id)));
  };
  const setActive = (s: Staff, active: boolean) => {
    onChange(staff.map((x) => (x.id === s.id ? { ...x, active } : x)));
    setOpen(null);
    toast.undo(active ? `${s.name} is active again.` : `${s.name} is inactive. They can't sign in; past jobs keep their name.`, () => onChange(staff));
  };
  const menu = (s: Staff) => (
    <span className="flex flex-none items-center justify-center" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Menu align="end" items={[{ label: 'Edit', icon: PencilSimple, onSelect: () => setOpen(s.id) }, ...(s.you ? [] : [{ label: s.active ? 'Deactivate' : 'Reactivate', icon: Power, onSelect: () => setAsk(s.id) }])]}
        trigger={<button type="button" aria-label={`More actions for ${s.name}`} className="inline-flex size-9 items-center justify-center rounded-control text-muted hover:bg-raised-2 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:size-11"><DotsThreeVertical size={20} weight="bold" aria-hidden /></button>} />
    </span>
  );
  const status_ = (s: Staff) => <Badge tone={s.active ? 'success' : 'neutral'}>{s.invited && s.active ? 'Invited' : s.active ? 'Active' : 'Inactive'}</Badge>;
  const keys = (s: Staff) => ({ tabIndex: 0, onClick: () => setOpen(s.id), onKeyDown: (e: React.KeyboardEvent) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(s.id); } } });
  const rowCls = 'cursor-pointer border-b border-rule hover:bg-raised focus-visible:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent';

  const empty = staff.length === 0 ? (
    <EmptyState title="No one on your team yet" description="Add your manager, mechanics and front desk. Mechanics you add can be given services on the calendar and sign in to the mechanic app." action={<Button variant="primary" leftIcon={Plus} onClick={() => setOpen('new')}>Add your first staff</Button>} />
  ) : rows.length === 0 ? (
    <EmptyState title={q.trim() ? `No one matches "${q.trim()}"` : 'No staff match these filters'} description="Check the spelling, or clear the filters." action={<Button variant="secondary" onClick={() => { setQ(''); setRole('any'); setStatus('any'); reset(); }}>Clear filters</Button>} />
  ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-none flex-wrap items-start justify-between gap-3 px-6 pb-1 pt-5 max-[640px]:px-4">
        <div className="min-w-0"><h2 className="text-[18px] font-semibold">Team</h2><p className="mt-0.5 max-w-xl text-[13px] text-muted">Who works at this branch and what they can do. Mechanics here are the ones you give services to.</p></div>
        {staff.length > 0 && <Button variant="primary" leftIcon={Plus} onClick={() => setOpen('new')} className="max-[640px]:min-h-11 max-[640px]:w-full">Add staff</Button>}
      </div>
      {staff.length > 0 && (
        <div className="flex flex-none flex-wrap items-center gap-2 px-6 py-3 max-[640px]:px-4">
          <SearchBox value={q} onChange={(v) => { setQ(v); reset(); }} label="Search staff" placeholder="Search name, phone or email" className="w-[300px] max-w-full flex-1 min-[641px]:flex-none" />
          <Select size="sm" aria-label="Role" className="w-[150px] max-[640px]:w-full" value={role} onValueChange={(v) => { setRole(v); reset(); }} options={ROLE_OPTS} />
          <Select size="sm" aria-label="Status" className="w-[190px] max-[640px]:w-full" value={status} onValueChange={(v) => { setStatus(v); reset(); }} options={STATUS_OPTS} />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto px-2 max-[640px]:px-4">
        {empty ?? (phone ? (
          <ul aria-label="Team" className="border-t border-rule">
            {page.map((s) => (
              <li key={s.id} {...keys(s)} aria-label={`Edit ${s.name}`} className={cn(rowCls, 'flex items-start gap-3 py-3 pl-1', !s.active && 'opacity-80')}>
                <PersonAvatar personId={s.id} decorative name={s.name} initials={initialsOf(s.name)} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 break-words text-[15px] font-medium">{s.name}</p>
                  <p className="m-0 mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted"><Badge tone={roleTone(s.role)}>{ROLE_LABEL[s.role]}</Badge>{status_(s)}</p>
                  <p className="m-0 mt-1 text-[13px] text-muted tabular-nums">{s.phone}</p>
                  <p className="m-0 text-[13px] text-muted">{summarizeWeek(s.hours)}</p>
                </div>
                {menu(s)}
              </li>
            ))}
          </ul>
        ) : (
          <div role="table" aria-label="Team" className="min-w-[760px]">
            <div role="row" className={cn('grid h-9 items-center border-b border-rule', COLS)}>
              {['Name', 'Role', 'Phone', 'Shift', 'Status', ''].map((h, i) => <div key={i} role="columnheader" className="px-2 text-[12px] font-medium text-muted">{h}</div>)}
            </div>
            {page.map((s) => (
              <div key={s.id} role="row" {...keys(s)} aria-label={`Edit ${s.name}`} className={cn(rowCls, 'grid min-h-14 items-center', COLS, !s.active && 'text-muted')}>
                <div role="cell" className="flex min-w-0 items-center gap-3 px-2 py-2">
                  <PersonAvatar personId={s.id} decorative name={s.name} initials={initialsOf(s.name)} size={32} />
                  <span className="min-w-0"><span className="block break-words text-[14px] font-medium leading-5 text-text">{s.name}</span>{s.bay && <span className="block text-[12px] text-muted">{s.bay}</span>}</span>
                </div>
                <div role="cell" className="px-2"><Badge tone={roleTone(s.role)}>{ROLE_LABEL[s.role]}</Badge></div>
                <div role="cell" className="px-2 text-[14px] tabular-nums">{s.phone}</div>
                <div role="cell" className="px-2 text-[13px]">{summarizeWeek(s.hours)}</div>
                <div role="cell" className="px-2">{status_(s)}</div>
                <div role="cell">{menu(s)}</div>
              </div>
            ))}
          </div>
        ))}
        {!empty && <InfiniteSentinel hasMore={page.length < rows.length} loading={more} onLoadMore={loadMore} />}
        {!empty && page.length >= rows.length && rows.length > 0 && <ListEnd total={rows.length} noun="staff" />}
      </div>
      {!empty && <ResultCount shown={page.length} total={rows.length} loadingMore={more} noun={filtered ? 'matching staff' : 'staff'} />}
      {open && (open === 'new' || editing) && <StaffModal key={open} staff={editing} onSave={save} onClose={() => setOpen(null)} onToggleActive={(s) => setAsk(s.id)} />}
      {asked && (
        <ConfirmDialog open onOpenChange={(o) => !o && setAsk(null)} title={asked.active ? `Deactivate ${asked.name}?` : `Reactivate ${asked.name}?`}
          description={asked.active ? "They can't sign in and won't show when you give a service to someone. Their past jobs keep their name. You can reactivate them any time." : 'They can sign in and be given services again.'}
          confirmLabel={asked.active ? 'Deactivate' : 'Reactivate'} cancelLabel="Keep as is" tone={asked.active ? 'danger' : 'primary'}
          onCancel={() => setAsk(null)} onConfirm={() => { const s = asked; setAsk(null); setActive(s, !s.active); }} />
      )}
    </div>
  );
}
