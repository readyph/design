import { Fragment, type ReactNode } from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { Check, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

/** Shared item look (handover C35): 7x10px padding, 4px radius, 13px type. */
const itemBase =
  'flex w-full cursor-pointer select-none items-center gap-2 rounded-chip px-2.5 py-[7px] text-left text-ui outline-none ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50';
const itemTone = 'text-text data-[highlighted]:bg-raised';
const itemDanger = 'text-bad-ink data-[highlighted]:bg-bad-bg';

export interface MenuActionItem {
  type?: 'item';
  label: ReactNode;
  icon?: PhosphorIcon;
  /** Optional right-aligned meta (shortcut hint, count, date). */
  meta?: ReactNode;
  onSelect?: () => void;
  /** Render the item as a real `<a>` (middle-click, copy-link). Keyboard behaviour is unchanged. */
  href?: string;
  /** Anchor target; `_blank` gets `rel="noopener noreferrer"` unless `rel` is given. Only with `href`. */
  target?: string;
  rel?: string;
  disabled?: boolean;
  danger?: boolean;
}

/** A single-choice item (`role="menuitemradio"`) with a check on the chosen one, for filters. */
export interface MenuRadioItem {
  type: 'radio';
  label: ReactNode;
  /** Unique within its run of consecutive radio items. */
  value: string;
  checked?: boolean;
  meta?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

export type MenuItem =
  | MenuActionItem
  | MenuRadioItem
  | { type: 'separator' }
  | { type: 'label'; label: ReactNode };

export interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

const Meta = ({ children }: { children: ReactNode }) => (
  <span className="ml-auto pl-4 text-ui text-muted">{children}</span>
);

/** Consecutive radio items form one group. */
function groupRuns(items: MenuItem[]): (MenuItem | MenuRadioItem[])[] {
  const out: (MenuItem | MenuRadioItem[])[] = [];
  for (const it of items) {
    const last = out[out.length - 1];
    if ('type' in it && it.type === 'radio') {
      if (Array.isArray(last)) last.push(it);
      else out.push([it]);
    } else out.push(it);
  }
  return out;
}

/** A dropdown menu (row menus, filters, snooze) built on Radix DropdownMenu. */
export function Menu({ trigger, items, side = 'bottom', align = 'end', className }: MenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            'z-50 min-w-[200px] rounded-card border border-border bg-surface p-1 shadow-float focus:outline-none',
            className,
          )}
        >
          {groupRuns(items).map((entry, i) => {
            if (Array.isArray(entry)) {
              return (
                <RadixMenu.RadioGroup key={i} value={entry.find((r) => r.checked)?.value ?? ''}>
                  {entry.map((r) => (
                    <RadixMenu.RadioItem
                      key={r.value}
                      value={r.value}
                      disabled={r.disabled}
                      onSelect={r.onSelect}
                      className={cn(itemBase, itemTone)}
                    >
                      <span>{r.label}</span>
                      {r.meta && <Meta>{r.meta}</Meta>}
                      <span className={cn('flex w-4 shrink-0 justify-end text-accent', r.meta ? '' : 'ml-auto')}>
                        <RadixMenu.ItemIndicator>
                          <Check size={14} weight="bold" aria-hidden />
                        </RadixMenu.ItemIndicator>
                      </span>
                    </RadixMenu.RadioItem>
                  ))}
                </RadixMenu.RadioGroup>
              );
            }
            if (entry.type === 'separator') {
              return <RadixMenu.Separator key={i} className="-mx-1 my-1 h-px bg-rule" />;
            }
            if (entry.type === 'label') {
              return (
                <RadixMenu.Label key={i} className="px-2.5 py-1.5 text-small font-medium text-muted">
                  {entry.label}
                </RadixMenu.Label>
              );
            }
            const it = entry as MenuActionItem;
            const Ico = it.icon;
            const content = (
              <Fragment>
                {Ico && <Ico size={16} aria-hidden className={it.danger ? '' : 'text-muted'} />}
                <span>{it.label}</span>
                {it.meta && <Meta>{it.meta}</Meta>}
              </Fragment>
            );
            const cls = cn(itemBase, it.danger ? itemDanger : itemTone);
            if (it.href !== undefined) {
              return (
                <RadixMenu.Item key={i} asChild disabled={it.disabled} onSelect={it.onSelect}>
                  <a
                    href={it.disabled ? undefined : it.href}
                    target={it.target}
                    rel={it.rel ?? (it.target === '_blank' ? 'noopener noreferrer' : undefined)}
                    className={cls}
                  >
                    {content}
                  </a>
                </RadixMenu.Item>
              );
            }
            return (
              <RadixMenu.Item key={i} disabled={it.disabled} onSelect={it.onSelect} className={cls}>
                {content}
              </RadixMenu.Item>
            );
          })}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
