import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { Lock, X } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { IconButton } from './IconButton';
import { Link } from './Link';
import type { CompanyAccess, RoleOption, RolePickerRemoveConfirm } from './RolePicker';
import { DraftFooter, useDraftSave } from './RolePickerSave';
import { Select, type SelectOption } from './Select';

/** One person on the platform. */
export interface RolePickerPerson {
  id: string;
  name: string;
  initials?: string;
  /** Job title, shown under the name for a Member. */
  title?: string;
  /** Admin and Owner show as a tag instead of the title. The tag is not a control: company access is changed on Team. */
  access: CompanyAccess;
  /** What they do on the other platforms, after "also": "Stock clerk at Stockroom". */
  elsewhere?: ReactNode;
  /** Where the name links to (their person page). */
  href?: string;
}

/** Someone invited, not joined yet. Read only: the role is the one in the invite. */
export interface RolePickerInvite {
  id: string;
  name: string;
  initials?: string;
  /** "Invite not sent yet", "Invited, not joined yet", "Invite expired". */
  status: string;
  roleId: string;
  href?: string;
}

/** Each person's role on this platform: person id to role id, or `null` for "Not assigned". */
export type RolePickerRoles = Record<string, string | null>;

export interface RolePickerByRoleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** One platform's people by role, instead of one person's roles by platform. */
  mode: 'by-role';
  /** The draft. */
  value: RolePickerRoles;
  /** The last saved value. Dirty when `value` differs from it. Defaults to `value` (never dirty) for a host that owns Save. */
  savedValue?: RolePickerRoles;
  onChange: (next: RolePickerRoles) => void;
  /** Save the draft. Taking someone off ("Not assigned" on a saved role) asks first. */
  onSave?: (value: RolePickerRoles) => void;
  onDiscard?: () => void;
  people: RolePickerPerson[];
  invites?: RolePickerInvite[];
  /** The roles of this platform's kind, in the order shown after "Not assigned". */
  roles: RoleOption[];
  /** Used in "Take Ana off {platformName}?" and "Can't open {platformName}". */
  platformName: string;
  /** Optional heading; it takes focus when a save finishes. */
  heading?: ReactNode;
  /** Show the chosen role's line under each dropdown. Default true. */
  roleLines?: boolean;
  /** Called when a name is clicked (the link still has its `href`). */
  onOpenPerson?: (id: string) => void;
  /**
   * Show an X on each row for the host to remove the person its own way. The dropdowns then offer only the roles, no
   * "Not assigned", because the X is how someone is taken off.
   */
  onRemovePerson?: (id: string) => void;
  /** The host owns Save and Discard (a form with its own bar; `savedValue`, `onSave` and `onDiscard` are then not needed). Nothing is saved or asked here. */
  hideActions?: boolean;
  readOnly?: boolean;
  readOnlyReason?: ReactNode;
  saving?: boolean;
  error?: ReactNode;
  saveLabel?: string;
  /** Words for the confirm before a saved role is taken away. Defaults: "Take Ana off Auto Works?", "They will lose their role here.", "Save and remove". */
  removeConfirm?: RolePickerRemoveConfirm<RolePickerPerson>;
}

const NOT_ASSIGNED = '';
const nameLink = 'text-body font-medium no-underline hover:underline';

const sameRoles = (a: RolePickerRoles, b: RolePickerRoles, ids: string[]) => ids.every((id) => (a[id] ?? null) === (b[id] ?? null));
const andList = (n: string[]) => (n.length < 3 ? n.join(' and ') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`);

/**
 * RolePicker, by-role mode: one platform's people. One row per person with the role dropdown and the chosen role's line
 * under it; Admin and Owner as a tag; people who have not joined yet read only ("Mechanic when they join").
 * Edits a draft like the person mode: one Save and Discard, and taking someone off asks first. Controlled.
 */
export const RolePickerByRole = forwardRef<HTMLDivElement, RolePickerByRoleProps>(function RolePickerByRole(
  {
    mode: _mode,
    value,
    savedValue = value,
    onChange,
    onSave,
    onDiscard,
    people,
    invites = [],
    roles,
    platformName,
    heading,
    roleLines = true,
    onOpenPerson,
    onRemovePerson,
    hideActions = false,
    readOnly = false,
    readOnlyReason,
    saving = false,
    error,
    saveLabel = 'Save changes',
    removeConfirm,
    className,
    ...rest
  },
  ref,
) {
  const uid = useId();
  const ids = people.map((p) => p.id);
  const dirty = !sameRoles(value, savedValue, ids);
  const off = readOnly || saving;
  const removed = people.filter((p) => (savedValue[p.id] ?? null) && !(value[p.id] ?? null));
  const draft = useDraftSave({ dirty, saving, error, removedCount: removed.length, save: () => onSave?.(value), discard: () => onDiscard?.() });
  const options: SelectOption[] = [
    ...(onRemovePerson ? [] : [{ value: NOT_ASSIGNED, label: 'Not assigned' }]),
    ...roles.map((r) => ({ value: r.id, label: r.name, textValue: r.name })),
  ];
  const setRole = (id: string, role: string) => onChange({ ...value, [id]: role === NOT_ASSIGNED ? null : role });
  const open = (id: string) => (e: { preventDefault: () => void }) => {
    if (!onOpenPerson) return;
    e.preventDefault();
    onOpenPerson(id);
  };
  const names = andList(removed.map((p) => p.name));
  const call = <T,>(v: T | ((r: RolePickerPerson[]) => T) | undefined, fallback: T): T => (typeof v === 'function' ? (removed.length ? (v as (r: RolePickerPerson[]) => T)(removed) : fallback) : (v ?? fallback));

  return (
    <div ref={ref} className={cn('@container flex min-w-0 flex-col gap-4 [overflow-wrap:anywhere]', className)} {...rest}>
      {readOnly && readOnlyReason ? (
        <p className="flex items-start gap-2 rounded-card bg-raised px-3 py-2 text-small text-text">
          <Lock aria-hidden size={14} className="mt-0.5 shrink-0 text-muted" />
          <span className="min-w-0">{readOnlyReason}</span>
        </p>
      ) : null}

      {heading ? (
        <h3 ref={draft.heading} tabIndex={-1} className="m-0 text-ui font-medium text-text outline-0">
          {heading}
        </h3>
      ) : null}

      {people.length || invites.length ? (
        <ul className="m-0 list-none divide-y divide-rule p-0">
          {people.map((x) => {
            const role = value[x.id] ?? null;
            const about = roles.find((r) => r.id === role)?.about;
            const line = role ? about : `${x.name} can't open ${platformName}.`;
            const lineId = `${uid}-${x.id}-about`;
            return (
              <li key={x.id} data-person={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <Avatar decorative name={x.name} initials={x.initials} />
                <span className="min-w-0 flex-1 basis-40">
                  <Link href={x.href ?? '#'} onClick={open(x.id)} className={nameLink}>
                    {x.name}
                  </Link>
                  <span className="block text-small text-muted">
                    {x.access === 'member' ? x.title : <Badge tone="neutral">{x.access === 'owner' ? 'Admin · Owner' : 'Admin'}</Badge>}
                    {x.elsewhere ? <> · also {x.elsewhere}</> : null}
                  </span>
                </span>
                <Select
                  size="sm"
                  className="w-44"
                  aria-label={`${x.name}’s role at ${platformName}`}
                  aria-describedby={roleLines && line ? lineId : undefined}
                  value={role ?? NOT_ASSIGNED}
                  onValueChange={(v) => setRole(x.id, v)}
                  disabled={off}
                  options={options}
                />
                {onRemovePerson ? <IconButton icon={X} label={`Take ${x.name} off ${platformName}`} disabled={off} onClick={() => onRemovePerson(x.id)} /> : null}
                {roleLines && line ? (
                  <p id={lineId} className="m-0 basis-full pl-11 text-small text-muted">
                    {line}
                  </p>
                ) : null}
              </li>
            );
          })}
          {invites.map((v) => (
            <li key={v.id} data-invite={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
              <Avatar decorative tone="pending" name={v.name} initials={v.initials} />
              <span className="min-w-0 flex-1 basis-40">
                <Link href={v.href ?? '#'} onClick={open(v.id)} className={nameLink}>
                  {v.name}
                </Link>
                <span className="block text-small text-muted">{v.status}</span>
              </span>
              <span className="text-ui text-muted">{roles.find((r) => r.id === v.roleId)?.name} when they join</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-ui text-muted">Nobody works here yet.</p>
      )}

      {hideActions ? null : (
        <DraftFooter
          draft={draft}
          dirty={dirty}
          saving={saving}
          error={error}
          saveLabel={saveLabel}
          hidden={readOnly}
          confirmTitle={call(removeConfirm?.title, `Take ${names} off ${platformName}?`)}
          confirmDescription={call(removeConfirm?.description, `${names} will lose their role here.`)}
          confirmLabel={call(removeConfirm?.confirmLabel, 'Save and remove')}
        />
      )}
    </div>
  );
});
