import { forwardRef, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { Lock, Warning } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { PlatformLogo, type PlatformLogoProps } from './PlatformLogo';
import { RolePickerByRole, type RolePickerByRoleProps } from './RolePickerByRole';
import { DraftFooter, useDraftSave } from './RolePickerSave';
import { Select, type SelectOption } from './Select';

export type { RolePickerByRoleProps, RolePickerPerson, RolePickerInvite, RolePickerRoles } from './RolePickerByRole';

/** Company (Portal) access. `owner` can be shown but never chosen. */
export type CompanyAccess = 'owner' | 'admin' | 'member';

/** What the picker edits. A platform with no role is `null` ("Not assigned"). Admin and Owner ignore `roles` on screen but keep them. */
export interface RolePickerValue {
  access: CompanyAccess;
  roles: Record<string, string | null>;
}

export interface RolePickerPlatform extends Pick<PlatformLogoProps, 'src' | 'index' | 'color' | 'hq' | 'initials'> {
  id: string;
  /** Full name. It wraps, it is never cut in the row (the logo and the dropdown keep their size). */
  name: string;
  /** Which role list the platform uses: a key of `roleOptions`; unknown kinds use `fallbackKind`. */
  kind: string;
  /** This row cannot change. Say why in `reason`. */
  locked?: boolean;
  /** Why the row is locked: "Only an admin can add people here." */
  reason?: ReactNode;
}

export interface RoleOption {
  id: string;
  name: string;
  /** One line shown under the dropdown for the chosen role. */
  about?: string;
}

export interface RolePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Person by platform (default): one person's role on each platform. `by-role` is one platform's people, see `RolePickerByRoleProps`. */
  mode?: 'by-platform';
  /** The draft. */
  value: RolePickerValue;
  /** The last saved value. The picker is "dirty" when `value` differs from it; Save and Discard stay disabled until then. */
  savedValue: RolePickerValue;
  onChange: (next: RolePickerValue) => void;
  /** Save the draft. Removals ("Not assigned" on a saved role) ask first. */
  onSave: (value: RolePickerValue) => void;
  /** Throw the draft away: the page sets `value` back to `savedValue`. */
  onDiscard: () => void;
  platforms: RolePickerPlatform[];
  /** The roles of each kind of platform, in the order shown after "Not assigned". */
  roleOptions: Record<string, RoleOption[]>;
  /** Used for a platform whose kind is not in `roleOptions` (default `other`). */
  fallbackKind?: string;
  /** Who the roles are for, in the role lines and names: "Maria", "Maria Santos". Default "They". */
  subject?: string;
  /** Hide the company access radios (the single-platform Team form shows rows only). */
  hideAccess?: boolean;
  /** Why the company access cannot change. Disables the radios and shows the reason. */
  accessReason?: ReactNode;
  /** Words under each company access choice. */
  accessCopy?: Partial<Record<CompanyAccess, string>>;
  /** Everything is read only (viewer without rights); say why in `readOnlyReason`. */
  readOnly?: boolean;
  readOnlyReason?: ReactNode;
  /** Save is running: Save shows a spinner, everything else is disabled. */
  saving?: boolean;
  /** Save failed: shown above the buttons as an alert. The draft stays. */
  error?: ReactNode;
  /** Label of the Save button. */
  saveLabel?: string;
  /** Optional line under the "Roles on each platform" heading. Nothing is shown by default. */
  rolesIntro?: ReactNode;
  /** Optional line under the "Portal access" heading. Nothing is shown by default. */
  accessIntro?: ReactNode;
  /**
   * Words for the confirm that asks before a saved role is removed. Each part may be text or a function of the
   * platforms being removed. Defaults: "Remove access?", "<names>: <subject> will no longer be able to open it.", "Save and remove".
   */
  removeConfirm?: RolePickerRemoveConfirm;
}

export interface RolePickerRemoveConfirm<T = RolePickerPlatform> {
  title?: ReactNode | ((removed: T[]) => ReactNode);
  description?: ReactNode | ((removed: T[]) => ReactNode);
  confirmLabel?: string | ((removed: T[]) => string);
}

const ACCESS: Record<CompanyAccess, { name: string; can: string }> = {
  owner: { name: 'Owner', can: 'Created the company. Can change everything, including billing.' },
  admin: { name: 'Admin', can: 'Can change the Portal: platforms, the team, the plan and billing. Full access to every platform.' },
  member: { name: 'Member', can: 'Works on the platforms they are given a role on. Cannot change the Portal.' },
};

const NOT_ASSIGNED = '';

const same = (a: RolePickerValue, b: RolePickerValue, ids: string[]) =>
  a.access === b.access && ids.every((id) => (a.roles[id] ?? null) === (b.roles[id] ?? null));

/**
 * Per-platform role picker (C22): one row per platform (logo, name, kind, a dropdown with "Not assigned" and that kind's roles,
 * the chosen role's line), then the company access radios. Admin and Owner replace the rows with "Full access to every platform".
 * It edits a draft: one Save and Discard, disabled until something changed. Controlled: the page owns `value`.
 */
export const RolePicker = forwardRef<HTMLDivElement, RolePickerProps | RolePickerByRoleProps>(function RolePicker(props, ref) {
  return props.mode === 'by-role' ? <RolePickerByRole ref={ref} {...props} /> : <RolePickerByPlatform ref={ref} {...props} />;
});

const RolePickerByPlatform = forwardRef<HTMLDivElement, RolePickerProps>(function RolePickerByPlatform(
  {
    mode: _mode,
    value,
    savedValue,
    onChange,
    onSave,
    onDiscard,
    platforms,
    roleOptions,
    fallbackKind = 'other',
    subject = 'They',
    hideAccess = false,
    accessReason,
    accessCopy,
    readOnly = false,
    readOnlyReason,
    saving = false,
    error,
    saveLabel = 'Save changes',
    rolesIntro,
    accessIntro,
    removeConfirm,
    className,
    ...rest
  },
  ref,
) {
  const uid = useId();
  const ids = useMemo(() => platforms.map((p) => p.id), [platforms]);
  const dirty = !same(value, savedValue, ids);
  const full = value.access !== 'member';
  const [announce, setAnnounce] = useState('');
  const first = useRef(true);
  const copy = { ...ACCESS, ...Object.fromEntries(Object.entries(accessCopy ?? {}).map(([k, v]) => [k, { ...ACCESS[k as CompanyAccess], can: v }])) } as typeof ACCESS;

  // Say what changed when Admin swaps the rows; focus stays on the radio.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setAnnounce(full ? 'Full access to every platform. Role dropdowns hidden.' : 'Role dropdowns shown for each platform.');
  }, [full]);

  const optionsOf = (p: RolePickerPlatform): RoleOption[] => roleOptions[p.kind] ?? roleOptions[fallbackKind] ?? [];
  const selectOptions = (p: RolePickerPlatform): SelectOption[] => [
    { value: NOT_ASSIGNED, label: 'Not assigned' },
    ...optionsOf(p).map((r) => ({ value: r.id, label: r.name, textValue: r.name })),
  ];

  const removed = platforms.filter((p) => (savedValue.roles[p.id] ?? null) && !(value.roles[p.id] ?? null) && !full);
  const nAssigned = platforms.filter((p) => value.roles[p.id]).length;
  const noRole = !full && nAssigned === 0 && platforms.length > 0;
  const off = readOnly || saving;
  const draft = useDraftSave({ dirty, saving, error, removedCount: removed.length, save: () => onSave(value), discard: onDiscard });

  const setRole = (id: string, role: string) => onChange({ ...value, roles: { ...value.roles, [id]: role === NOT_ASSIGNED ? null : role } });

  const accessChoices: CompanyAccess[] = value.access === 'owner' || savedValue.access === 'owner' ? ['owner', 'admin', 'member'] : ['admin', 'member'];
  const accessLocked = off || !!accessReason || value.access === 'owner';
  const accessHeading = `${uid}-access`;

  return (
    <div ref={ref} className={cn('@container flex min-w-0 flex-col gap-6 [overflow-wrap:anywhere]', className)} {...rest}>
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {readOnly && readOnlyReason ? (
        <p className="flex items-start gap-2 rounded-card bg-raised px-3 py-2 text-small text-text">
          <Lock aria-hidden size={14} className="mt-0.5 shrink-0 text-muted" />
          <span className="min-w-0">{readOnlyReason}</span>
        </p>
      ) : null}

      <section aria-labelledby={`${uid}-roles`} className="min-w-0">
        <h3 ref={draft.heading} tabIndex={-1} id={`${uid}-roles`} className="text-ui font-medium text-text outline-0">
          Roles on each platform
        </h3>
        {rolesIntro ? <p className="m-0 mt-1 text-small text-muted">{rolesIntro}</p> : null}
        {full ? (
          <div className="mt-3 flex items-center gap-3 border-y border-rule py-3 text-small text-muted">
            <span aria-hidden className="flex shrink-0 items-center">
              {platforms.slice(0, 4).map((p, i) => (
                <PlatformLogo key={p.id} decorative name={p.name} size={24} src={p.src} index={p.index} color={p.color} hq={p.hq} initials={p.initials} className={cn(i > 0 && '-ml-1', 'ring-2 ring-surface')} />
              ))}
            </span>
            <span className="min-w-0 text-body text-text">
              {value.access === 'owner' ? 'Owner: ' : 'Admin: '}
              Full access to every platform
              <span className="block text-small text-muted">{platforms.length ? `${subject} can open all ${platforms.length} and change anything in them.` : 'No platforms yet.'}</span>
            </span>
          </div>
        ) : (
          <ul className="mt-3 m-0 flex list-none flex-col p-0">
            {platforms.map((p) => {
              const role = value.roles[p.id] ?? null;
              const about = optionsOf(p).find((r) => r.id === role)?.about;
              const locked = p.locked || readOnly;
              const rid = `${uid}-${p.id}`;
              const line = role ? about : `${subject} can't open ${p.name}.`;
              const describedBy = [line ? `${rid}-about` : null, p.locked && p.reason ? `${rid}-why` : null].filter(Boolean).join(' ') || undefined;
              return (
                <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-x-3 gap-y-1 border-t border-rule py-3 last:border-b [@container_(max-width:519px)]:grid-cols-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <PlatformLogo decorative name={p.name} size={32} src={p.src} index={p.index} color={p.color} hq={p.hq} initials={p.initials} />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-body font-medium text-text">{p.name}</span>
                      <span className="text-small text-muted">{p.kind}</span>
                    </div>
                  </div>
                  <Select
                    size="sm"
                    options={selectOptions(p)}
                    value={role ?? NOT_ASSIGNED}
                    onValueChange={(v) => setRole(p.id, v)}
                    disabled={locked || saving}
                    aria-label={`Role for ${p.name}`}
                    aria-describedby={describedBy}
                  />
                  {line ? (
                    <p id={`${rid}-about`} className="col-span-full m-0 pl-11 text-small text-muted [@container_(max-width:519px)]:pl-0">
                      {line}
                    </p>
                  ) : null}
                  {p.locked && p.reason ? (
                    <p id={`${rid}-why`} className="col-span-full m-0 flex items-start gap-1.5 pl-11 text-small text-text [@container_(max-width:519px)]:pl-0">
                      <Lock aria-hidden size={12} weight="bold" className="mt-1 shrink-0 text-muted" />
                      <span className="min-w-0">{p.reason}</span>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {noRole ? (
          <p className="mt-3 flex items-start gap-2 rounded-card bg-warn-bg px-3 py-2 text-small text-warn-ink">
            <Warning aria-hidden size={14} weight="bold" className="mt-0.5 shrink-0" />
            <span className="min-w-0">With no role anywhere, {subject.toLowerCase() === 'they' ? 'they' : subject} can sign in to the Portal but can't open any platform.</span>
          </p>
        ) : null}
      </section>

      {hideAccess ? null : (
        <section aria-labelledby={accessHeading} className="min-w-0">
          <h3 id={accessHeading} className="text-ui font-medium text-text">
            Portal access
          </h3>
          {accessIntro ? <p className="m-0 mt-1 text-small text-muted">{accessIntro}</p> : null}
          {accessReason ? (
            <p id={`${uid}-access-why`} className="mt-2 flex items-start gap-2 rounded-card bg-raised px-3 py-2 text-small text-text">
              <Lock aria-hidden size={14} className="mt-0.5 shrink-0 text-muted" />
              <span className="min-w-0">{accessReason}</span>
            </p>
          ) : null}
          <RadioGroup.Root
            value={value.access}
            onValueChange={(v) => onChange({ ...value, access: v as CompanyAccess })}
            aria-labelledby={accessHeading}
            aria-describedby={accessReason ? `${uid}-access-why` : undefined}
            className="mt-3 flex flex-col gap-2"
          >
            {accessChoices.map((a) => {
              const choiceOff = accessLocked || a === 'owner';
              const on = value.access === a;
              return (
                <label
                  key={a}
                  className={cn(
                    'flex items-start gap-3 rounded-control border px-3 py-2 max-sm:min-h-11',
                    on ? 'border-accent bg-accent-tint' : 'border-control bg-surface',
                    choiceOff ? 'cursor-not-allowed' : 'cursor-pointer hover:border-muted',
                    '[&:has(:focus-visible)]:outline [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-offset-2 [&:has(:focus-visible)]:outline-accent',
                  )}
                >
                  <RadioGroup.Item
                    value={a}
                    disabled={choiceOff && !on}
                    aria-describedby={`${uid}-${a}-can`}
                    className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-faint bg-surface outline-none data-[state=checked]:border-accent disabled:cursor-not-allowed"
                  >
                    <RadioGroup.Indicator className="block size-2 rounded-full bg-accent" />
                  </RadioGroup.Item>
                  <span className="flex min-w-0 flex-col">
                    <span className={cn('text-body font-medium', choiceOff && !on ? 'text-muted' : 'text-text')}>{copy[a].name}</span>
                    <span id={`${uid}-${a}-can`} className="text-small text-muted">
                      {copy[a].can}
                    </span>
                  </span>
                </label>
              );
            })}
          </RadioGroup.Root>
        </section>
      )}

      <DraftFooter
        draft={draft}
        dirty={dirty}
        saving={saving}
        error={error}
        saveLabel={saveLabel}
        hidden={readOnly}
        confirmTitle={typeof removeConfirm?.title === 'function' ? (removed.length ? removeConfirm.title(removed) : null) : (removeConfirm?.title ?? 'Remove access?')}
        confirmDescription={
          typeof removeConfirm?.description === 'function'
            ? (removed.length ? removeConfirm.description(removed) : null)
            : (removeConfirm?.description ?? `${removed.map((p) => p.name).join(', ')}: ${subject} will no longer be able to open ${removed.length > 1 ? 'them' : 'it'}.`)
        }
        confirmLabel={typeof removeConfirm?.confirmLabel === 'function' ? (removed.length ? removeConfirm.confirmLabel(removed) : 'Save and remove') : (removeConfirm?.confirmLabel ?? 'Save and remove')}
      />
    </div>
  );
});
