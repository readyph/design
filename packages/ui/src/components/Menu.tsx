import { type ReactNode } from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { Check } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';
import { Kbd } from './Kbd';
import { useShortcutMode } from '../providers/ShortcutModeProvider';
import { formatShortcut } from '../utils/shortcut';

export interface MenuActionItem {
  type?: 'item';
  label: ReactNode;
  icon?: PhosphorIcon;
  /** Display-only key hint, revealed in shortcut mode. */
  shortcut?: string;
  onSelect?: () => void;
  /** Render the item as a real `<a>` (middle-click, copy-link). Keyboard behaviour is unchanged. */
  href?: string;
  /** Anchor target; `_blank` gets `rel="noopener noreferrer"` unless `rel` is given. Only with `href`. */
  target?: string;
  rel?: string;
  disabled?: boolean;
  danger?: boolean;
  /** Marks the item as the current page: `aria-current="page"`, check icon, primary text. */
  active?: boolean;
  /** Optional trailing content (e.g. a count). Replaced by the check icon when `active`. */
  meta?: ReactNode;
}

export type MenuItem =
  | MenuActionItem
  | { type: 'separator' }
  | { type: 'label'; label: ReactNode };

export interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

/** A dropdown menu (ProfileMenu pattern) built on Radix DropdownMenu. */
export function Menu({ trigger, items, side = 'bottom', align = 'end', className }: MenuProps) {
  const { shortcutMode } = useShortcutMode();
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            'z-popover min-w-48 rounded-md border border-border bg-surface p-1 shadow-lg focus:outline-none',
            'data-[state=open]:animate-[ds-popover-in_120ms_ease] motion-reduce:animate-none',
            className,
          )}
        >
          {items.map((item, i) => {
            if ('type' in item && item.type === 'separator') {
              return <RadixMenu.Separator key={i} className="my-1 h-px bg-border" />;
            }
            if ('type' in item && item.type === 'label') {
              return (
                <RadixMenu.Label key={i} className="px-2 py-1.5 text-xs font-medium text-ink-subtle">
                  {item.label}
                </RadixMenu.Label>
              );
            }
            const it = item as MenuActionItem;
            const content = (
              <>
                {it.icon && <Icon icon={it.icon} size="sm" className="text-ink-subtle" />}
                <span className={cn('flex-1', it.active && 'font-semibold')}>{it.label}</span>
                {it.active ? (
                  <>
                    <Icon icon={Check} size="sm" aria-hidden="true" />
                    <span className="sr-only">(current page)</span>
                  </>
                ) : (
                  it.meta != null && <span className="text-xs text-ink-subtle">{it.meta}</span>
                )}
                {it.shortcut && shortcutMode && (
                  <span className="flex items-center gap-0.5">
                    {formatShortcut(it.shortcut).map((k, j) => (
                      <Kbd key={j} size="sm">
                        {k}
                      </Kbd>
                    ))}
                  </span>
                )}
              </>
            );
            const itemClass = cn(
              'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
              'data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-800',
              'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
              it.danger
                ? 'text-error-fg data-[highlighted]:bg-error/10 data-[highlighted]:text-error-fg'
                : it.active
                  ? 'text-primary-700 [[data-theme=dark]_&]:text-primary-900'
                  : 'text-ink',
              focusRing,
            );
            if (it.href !== undefined) {
              return (
                <RadixMenu.Item key={i} asChild disabled={it.disabled} onSelect={it.onSelect}>
                  <a
                    href={it.disabled ? undefined : it.href}
                    target={it.target}
                    rel={it.rel ?? (it.target === '_blank' ? 'noopener noreferrer' : undefined)}
                    aria-current={it.active ? 'page' : undefined}
                    className={itemClass}
                  >
                    {content}
                  </a>
                </RadixMenu.Item>
              );
            }
            return (
              <RadixMenu.Item
                key={i}
                disabled={it.disabled}
                onSelect={it.onSelect}
                aria-current={it.active ? 'page' : undefined}
                className={itemClass}
              >
                {content}
              </RadixMenu.Item>
            );
          })}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
