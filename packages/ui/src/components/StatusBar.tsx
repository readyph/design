import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { EnvelopeSimple, Users } from '@phosphor-icons/react';
import { LedaMark } from './Leda';
import { PlatformLogo, type PlatformLogoProps } from './PlatformLogo';
import { ProgressBar } from './ProgressBar';
import { cn } from '../utils/cn';

export type StatusBarHealth = 'ok' | 'warn' | 'bad' | 'err' | 'neutral' | 'accent';

export interface StatusBarPlatform {
  /** Stable key. */
  id: string;
  /** Platform name. Always the accessible name; shown beside the logo when there is room. */
  name: string;
  /** Uploaded logo URL, passed to `PlatformLogo`. */
  logoSrc?: string;
  /** Identity colour (hex or slot 1-8), passed to `PlatformLogo`. Defaults to the platform's position. */
  color?: PlatformLogoProps['color'];
  /** Collision-safe monogram from `platformInitialsFor`. */
  initials?: string;
  /** Health. `ok` (default) is quiet; any other value shows the name and a plain word, and is announced. */
  health?: StatusBarHealth;
  /** Plain word for a non-running health, e.g. "slow". Defaults to the standard word (slow, offline, error, not set up, setting up). */
  healthText?: string;
  /** Selected (filtered or focused) platform. Uses `aria-pressed` on a button and `aria-current` on a link. */
  selected?: boolean;
  /** Makes the item a link (opens the platform). */
  href?: string;
  /** Makes the item a button (filters or focuses the platform), or runs on a link click. */
  onSelect?: () => void;
}

/** A count item (people, invites). Non-interactive unless `href` or `onSelect` is given. */
export interface StatusBarCount {
  count: number;
  href?: string;
  onSelect?: () => void;
}

export interface StatusBarLeda {
  /** Requests used this period. */
  used: number;
  /** Text after the count, e.g. "7 days left" (shown with `ledaFirst`). */
  daysLeft?: string;
  /** Plan limit. */
  max: number;
  /** Warn from this value. Defaults to 80% of `max`. */
  warnAt?: number;
  href?: string;
  onSelect?: () => void;
}

export interface StatusBarProps {
  platforms?: StatusBarPlatform[];
  /** Platforms shown as items before "+N". Default 8. */
  maxPlatforms?: number;
  /** "+N" link for the platforms past `maxPlatforms`. Without `moreHref` or `onMore` it is plain text. */
  moreHref?: string;
  onMore?: () => void;
  people?: StatusBarCount;
  /** Invites waiting. Hidden when `count` is 0. The count stays at narrow widths, the word drops. */
  invites?: StatusBarCount;
  leda?: StatusBarLeda;
  /** Plan name, e.g. "Starter". Shown as "Starter plan". */
  plan?: string;
  /** Makes the plan item a link (Plan and billing). */
  planHref?: string;
  /** Makes the plan item a button, or runs on a link click. */
  onPlanSelect?: () => void;
  /** Workshop shell order (shell.js renderStatus, RDY-364): Leda first, then "N platforms · all running" and a named logo per platform, people with invites pending, plan. Default true; `false` keeps the earlier order. */
  ledaFirst?: boolean;
  /** Last refresh, already formatted, e.g. "9:12 AM". Shown as "Updated 9:12 AM". */
  updatedAt?: string;
  /** Names the list. The `PlatformShell` `status` footer already carries `aria-label="Status"`; set this only outside the shell. */
  'aria-label'?: string;
  /** Merged under the component classes: add colour or margin, it cannot move the layout. */
  className?: string;
}

const healthWord: Record<StatusBarHealth, string> = {
  ok: 'running',
  warn: 'slow',
  bad: 'offline',
  err: 'error',
  neutral: 'not set up',
  accent: 'setting up',
};

const dot: Record<StatusBarHealth, string> = {
  ok: 'bg-ok-dot',
  warn: 'bg-warn-dot',
  bad: 'bg-bad-dot',
  err: 'bg-control',
  neutral: 'bg-faint',
  accent: 'bg-accent',
};

// Full class names so Tailwind can see them. `@max-[Npx]/status:` is a container query on the bar's own width.
const item =
  'inline-flex h-[26px] min-w-0 items-center gap-2 whitespace-nowrap rounded-chip px-[9px] text-small leading-5 text-muted';
const interactive =
  'cursor-pointer hover:bg-frame-hover hover:text-text aria-pressed:bg-frame-active aria-[current=true]:bg-frame-active ' +
  'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-frame forced-colors:outline-0 forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]';
const dropUpdated = '@max-[960px]/status:hidden';
const dropPlan = '@max-[780px]/status:hidden';
const dropInviteWord = '@max-[780px]/status:hidden';
// Workshop shell breakpoints (viewport, shell.css: hide-mid 1180, hide-tab 960), used with `ledaFirst`.
const wsMid = 'max-[1180px]:hidden';
const wsTab = 'max-[960px]:hidden';

interface ItemProps {
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
  'aria-label'?: string;
  title?: string;
  className?: string;
  children: ReactNode;
}

/** One strip item: a link with `href`, a button with `onSelect`, otherwise plain text. */
function Item({ href, onSelect, selected, 'aria-label': label, title, className, children }: ItemProps) {
  if (href) {
    return (
      <a href={href} title={title} onClick={onSelect} aria-label={label} aria-current={selected ? 'true' : undefined} className={cn(item, interactive, className)}>
        {children}
      </a>
    );
  }
  if (onSelect) {
    return (
      <button type="button" title={title} onClick={onSelect} aria-label={label} aria-pressed={selected === undefined ? undefined : selected} className={cn(item, interactive, className)}>
        {children}
      </button>
    );
  }
  return (
    <span title={title} aria-label={label} role={label ? 'group' : undefined} className={cn(item, className)}>
      {children}
    </span>
  );
}

const Divider = ({ className }: { className?: string }) => <span aria-hidden="true" className={cn('ml-1.5 mr-2 h-3 w-px shrink-0 bg-control', className)} />;

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/**
 * Status bar (C4): the 34px strip across the bottom of the Portal shell, on the frame colour, 12px muted.
 * Drop it into `PlatformShell`'s `status` slot: the shell supplies the `footer` landmark (`aria-label="Status"`),
 * so this renders a plain container and list, never its own `footer`.
 *
 * Items, in order: a logo per platform (name beside it only with 3 or fewer platforms; with 4+ running platforms are logo-only with a title tooltip; a platform that is not
 * running always shows its name and a plain word, "Marikina slow"; 4+ platforms all running add "All running"),
 * people, invites waiting, Leda usage (16px mark + 56px minibar, warn from 80%), plan, "Updated 9:12 AM".
 * Narrow widths (the bar's own width) drop Updated (below 960), then the plan and the invite word together (780); controls are never dropped.
 * Items are plain text unless given `href` (link) or `onSelect` (button). A hidden live region announces health changes only.
 */
export const StatusBar = forwardRef<HTMLDivElement, StatusBarProps>(function StatusBar(
  { platforms = [], maxPlatforms = 8, moreHref, onMore, people, invites, leda, plan, planHref, onPlanSelect, ledaFirst = true, updatedAt, 'aria-label': ariaLabel, className },
  ref,
) {
  const shown = platforms.slice(0, maxPlatforms);
  const rest = platforms.length - shown.length;
  const namesAlways = platforms.length <= 3 || ledaFirst;
  const problems = platforms.filter((p) => p.health && p.health !== 'ok');
  const allRunning = platforms.length > 0 && problems.length === 0;
  const showSummary = allRunning && !namesAlways;
  const portalSummary = ledaFirst && problems.length === 0;
  const words = (p: StatusBarPlatform) => p.healthText ?? healthWord[p.health ?? 'ok'];

  const announce = platforms.length === 0 ? '' : problems.length ? problems.map((p) => `${p.name} ${words(p)}`).join(', ') : 'All platforms running';
  // The live region starts empty and speaks only when the set of non-running platforms changes.
  const healthKey = problems.map((p) => `${p.id}:${p.health}:${words(p)}`).join('|');
  const lastKey = useRef(healthKey);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (lastKey.current !== healthKey) {
      lastKey.current = healthKey;
      setMessage(announce);
    }
  }, [healthKey, announce]);

  const sections: { key: string; cls: string; node: ReactNode }[] = [];

  if (platforms.length > 0 || portalSummary) {
    sections.push({ key: 'platforms', cls: 'flex min-w-0 shrink', node: (
        <ul role="list" aria-label="Platforms" className="flex min-w-0 items-center gap-0.5 overflow-hidden">
          {portalSummary && (
            <li className={cn('flex shrink-0', wsTab)}>
              <Item>
                <span className="tabular-nums">{plural(platforms.length, 'platform', 'platforms')}</span>
                <span>· all running</span>
              </Item>
            </li>
          )}
          {shown.map((p, i) => {
            const bad = !!p.health && p.health !== 'ok';
            return (
              <li key={p.id} className={cn('flex min-w-0', bad && 'shrink-0')}>
                <Item
                  href={p.href}
                  onSelect={p.onSelect}
                  selected={p.selected}
                  aria-label={bad ? `${p.name} ${words(p)}` : p.name}
                  title={`${p.name}: ${words(p)}`}
                  className="min-w-0"
                >
                  <PlatformLogo name={p.name} src={p.logoSrc} color={p.color} initials={p.initials} index={i + 1} decorative />
                  {bad ? (
                    <>
                      <span className={cn('size-[7px] shrink-0 rounded-full', dot[p.health!])} aria-hidden="true" />
                      <span className="max-w-[16ch] truncate text-ui font-medium text-text">{p.name}</span>
                      <span>{words(p)}</span>
                    </>
                  ) : (
                    namesAlways && <span className={cn('max-w-[16ch] truncate', ledaFirst && 'text-ui font-medium text-text', ledaFirst && platforms.length > 3 && wsMid)}>{p.name}</span>
                  )}
                </Item>
              </li>
            );
          })}
          {rest > 0 && (
            <li className="flex shrink-0">
              <Item href={moreHref} onSelect={onMore} aria-label={`${rest} more platform${rest === 1 ? '' : 's'}`}>
                +{rest}
              </Item>
            </li>
          )}
          {showSummary && (
            <li className="flex shrink-0">
              <Item>
                <span className="size-[7px] shrink-0 rounded-full bg-ok-dot" aria-hidden="true" />
                All running
              </Item>
            </li>
          )}
        </ul>
      ) });
  }

  if (people) {
    sections.push({ key: 'people', cls: "flex shrink-0", node: (
        <Item href={people.href} onSelect={people.onSelect} aria-label={plural(people.count, 'person', 'people') + (ledaFirst && invites && invites.count > 0 ? `, ${plural(invites.count, 'invite', 'invites')} pending` : '')}>
          <Users size={14} aria-hidden="true" />
          <span className="tabular-nums">{plural(people.count, 'person', 'people')}</span>
          {ledaFirst && invites && invites.count > 0 ? (
            <span className={cn('tabular-nums', wsMid)}>· {invites.count.toLocaleString('en-US')} {invites.count === 1 ? 'invite' : 'invites'} pending</span>
          ) : null}
        </Item>
      ) });
  }

  if (invites && invites.count > 0 && !(ledaFirst && people)) {
    sections.push({ key: 'invites', cls: "flex shrink-0", node: (
        <Item href={invites.href} onSelect={invites.onSelect} aria-label={`${plural(invites.count, 'invite', 'invites')} waiting`}>
          <EnvelopeSimple size={14} aria-hidden="true" />
          <span className="tabular-nums">{invites.count.toLocaleString('en-US')}</span>
          <span className={dropInviteWord}>{invites.count === 1 ? 'invite' : 'invites'} waiting</span>
        </Item>
      ) });
  }

  if (leda) {
    const warnAt = leda.warnAt ?? leda.max * 0.8;
    const text = `Leda usage, ${leda.used.toLocaleString('en-US')} of ${leda.max.toLocaleString('en-US')}`;
    sections.push({ key: 'leda', cls: "flex shrink-0", node: (
        <Item href={leda.href} onSelect={leda.onSelect}>
          <LedaMark size={16} decorative />
          <span className={cn(ledaFirst && 'text-ui font-medium text-text')}>Leda</span>
          <ProgressBar value={leda.used} max={leda.max} warnAt={warnAt} aria-label={text} />
          <span className="tabular-nums">
            {leda.used.toLocaleString('en-US')} / {leda.max.toLocaleString('en-US')}
          </span>
          {ledaFirst && leda.daysLeft ? <span className={cn('tabular-nums', wsTab)}>{leda.daysLeft}</span> : null}
        </Item>
      ) });
  }

  if (plan) {
    sections.push({ key: 'plan', cls: cn('flex shrink-0', ledaFirst ? wsMid : dropPlan), node: (
        <Item href={planHref} onSelect={onPlanSelect}>{plan} plan</Item>
      ) });
  }

  if (updatedAt) {
    sections.push({ key: 'updated', cls: cn('ml-auto flex shrink-0', ledaFirst ? wsMid : dropUpdated), node: (
        <Item className="tabular-nums">Updated {updatedAt}</Item>
      ) });
  }

  if (ledaFirst) {
    const i = sections.findIndex((x) => x.key === 'leda');
    if (i > 0) sections.unshift(...sections.splice(i, 1));
  }

  return (
    <div ref={ref} className={cn(className, '@container/status flex h-full w-full min-w-0 items-center')}>
      <ul role="list" aria-label={ariaLabel} className="m-0 flex min-w-0 flex-1 list-none items-center gap-0.5 p-0">
        {sections.map((s, i) => (
          <li key={s.key} className={cn('items-center', s.cls)}>
            {i > 0 && s.key !== 'updated' && <Divider />}
            {s.node}
          </li>
        ))}
      </ul>
      <span role="status" aria-live="polite" className="sr-only">
        {message}
      </span>
    </div>
  );
});
