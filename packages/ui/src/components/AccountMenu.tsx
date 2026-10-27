import { forwardRef, useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent } from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { CircleHalf, Desktop, Moon, SignOut, Sun, UserGear } from '@phosphor-icons/react';
import { SegmentedControl } from './SegmentedControl';
import { cn, focusRing } from '../utils/cn';

export type ThemeChoice = 'light' | 'dark' | 'system';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Desktop },
];

/** Apply a theme to `<html>`: `data-theme="light|dark"`, or no attribute for System. */
export function applyTheme(theme: ThemeChoice, root: HTMLElement = document.documentElement) {
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function initialsOf(name: string): string {
  const w = name.split(/\s+/).filter(Boolean);
  if (!w.length) return '?';
  return ((w[0][0] ?? '') + (w.length > 1 ? (w[w.length - 1][0] ?? '') : '')).toUpperCase();
}

/** The 36px avatar button (28px initials circle). Spreads Radix trigger props. */
export const AccountButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'> & { name: string; initials?: string }>(
  function AccountButton({ name, initials, className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={`Account menu, ${name}`}
        {...rest}
        className={cn('grid size-9 shrink-0 place-items-center rounded-control', focusRing, className)}
      >
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-full bg-avatar-bg text-[11px] font-semibold text-avatar-text"
        >
          {initials ?? initialsOf(name)}
        </span>
      </button>
    );
  },
);

export interface AccountMenuProps {
  name: string;
  email: string;
  /** Role chip text, e.g. "Owner". */
  role: string;
  /** Initials in the avatar. Default: first and last name initial. */
  initials?: string;
  /** Controlled theme choice. */
  theme?: ThemeChoice;
  /** Uncontrolled initial choice. Default System. */
  defaultTheme?: ThemeChoice;
  onThemeChange?: (theme: ThemeChoice) => void;
  /** Set `data-theme` on `<html>` when the choice changes (default true). Turn off if the app owns theming. */
  applyToDocument?: boolean;
  /** "Account settings" is a real link when given; otherwise a button calling `onSettings`. */
  settingsHref?: string;
  onSettings?: () => void;
  onLogout?: () => void;
  className?: string;
}

const acctRow =
  'flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-chip px-2.5 text-left text-text outline-none data-[highlighted]:bg-frame-hover focus-visible:outline focus-visible:outline-[1.5px] focus-visible:-outline-offset-[1.5px] focus-visible:outline-accent max-sm:h-11';

const itemSelector = '[role="menuitem"]:not([data-disabled]),[role="menuitemradio"][aria-checked="true"]';

/**
 * Account (avatar) menu (C3): 304px translucent menu on Radix DropdownMenu. Header with role chip,
 * "Account settings" (the only way to reach Settings), the theme control (the ONLY one in the app:
 * Light / Dark / System, System = no `data-theme`), and Log out. Desktop opens right of the rail,
 * bottom-aligned with the avatar; phone opens under the top bar, 8px from each edge, 44px rows.
 */
export function AccountMenu({
  name,
  email,
  role,
  initials,
  theme,
  defaultTheme = 'system',
  onThemeChange,
  applyToDocument = true,
  settingsHref,
  onSettings,
  onLogout,
  className,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<ThemeChoice>(defaultTheme);
  const current = theme ?? internal;
  const [phone, setPhone] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const openAt = useRef<'first' | 'last'>('first');
  const labelId = useId();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const chooseTheme = useCallback(
    (v: string) => {
      const t = v as ThemeChoice;
      if (theme === undefined) setInternal(t);
      if (applyToDocument) applyTheme(t);
      onThemeChange?.(t);
    },
    [theme, applyToDocument, onThemeChange],
  );

  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      openAt.current = 'last';
      setOpen(true);
    } else if (e.key === 'ArrowDown') {
      openAt.current = 'first';
    } else if (e.key === 'Enter' || e.key === ' ') openAt.current = 'first';
  };

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const list = items();
      (openAt.current === 'last' ? list[list.length - 1] : list[0])?.focus();
      openAt.current = 'first';
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const items = () => Array.from(contentRef.current?.querySelectorAll<HTMLElement>(itemSelector) ?? []);

  // The menu owns the arrow keys (the theme row is a single stop; Left/Right move inside it).
  const onKeyDownCapture = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      setOpen(false);
      return;
    }
    const list = items();
    const active = document.activeElement as HTMLElement | null;
    const i = active ? list.indexOf(active) : -1;
    let target: HTMLElement | undefined;
    if (e.key === 'ArrowDown') target = list[(i + 1) % list.length];
    else if (e.key === 'ArrowUp') target = list[(i - 1 + list.length) % list.length];
    else if (e.key === 'Home') target = list[0];
    else if (e.key === 'End') target = list[list.length - 1];
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && active?.getAttribute('role') === 'menuitemradio') {
      const radios = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
      const n = radios.length;
      const next = radios[(radios.indexOf(active) + (e.key === 'ArrowRight' ? 1 : -1) + n) % n];
      e.preventDefault();
      e.stopPropagation();
      next.focus();
      chooseTheme(THEMES[radios.indexOf(next)].value);
      return;
    } else return;
    e.preventDefault();
    e.stopPropagation();
    target?.focus();
  };

  const row = acctRow;
  const settingsContent = (
    <>
      <UserGear size={16} aria-hidden className="text-muted" />
      <span>Account settings</span>
    </>
  );

  return (
    <RadixMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <RadixMenu.Trigger asChild>
        <AccountButton name={name} initials={initials} onKeyDown={onTriggerKeyDown} />
      </RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          ref={contentRef}
          side={phone ? 'bottom' : 'right'}
          align="end"
          sideOffset={phone ? 4 : 8}
          collisionPadding={8}
          loop
          onKeyDownCapture={onKeyDownCapture}
          className={cn(
            'z-50 w-[304px] rounded-card border border-border bg-overlay p-1 text-[13px] leading-[18px] text-text shadow-float backdrop-blur-[14px] backdrop-saturate-[1.2] focus:outline-none max-sm:w-[calc(100vw-16px)]',
            className,
          )}
        >
          <div className="flex items-center gap-2.5 px-2.5 pb-2.5 pt-2">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-avatar-bg text-[12px] font-semibold text-avatar-text"
            >
              {initials ?? initialsOf(name)}
            </span>
            <div className="flex min-w-0 flex-col">
              <div className="truncate text-[13px] font-semibold leading-[18px]">{name}</div>
              <div className="truncate text-small leading-4 text-muted">{email}</div>
            </div>
            <span className="ml-auto h-[18px] shrink-0 self-start rounded-chip border border-border px-1.5 text-[11px] font-medium leading-4 text-muted">{role}</span>
          </div>
          <RadixMenu.Separator className="-mx-1 my-1 h-px bg-border" />
          {settingsHref !== undefined ? (
            <RadixMenu.Item asChild onSelect={onSettings}>
              <a href={settingsHref} className={row}>
                {settingsContent}
              </a>
            </RadixMenu.Item>
          ) : (
            <RadixMenu.Item onSelect={onSettings} className={row}>
              {settingsContent}
            </RadixMenu.Item>
          )}
          <div className="flex items-center gap-2.5 py-1 pl-2.5 pr-1">
            <CircleHalf size={16} aria-hidden className="shrink-0 text-muted" />
            <span id={labelId} className="flex-1 text-text">
              Theme
            </span>
            <SegmentedControl
              semantics="menu"
              size="menu"
              aria-labelledby={labelId}
              options={THEMES}
              value={current}
              onChange={chooseTheme}
            />
          </div>
          <RadixMenu.Separator className="-mx-1 my-1 h-px bg-border" />
          <RadixMenu.Item onSelect={onLogout} className={acctRow}>
            <SignOut size={16} aria-hidden className="text-muted" />
            <span>Log out</span>
          </RadixMenu.Item>
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
