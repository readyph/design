import { type ReactNode } from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
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
  disabled?: boolean;
  danger?: boolean;
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
            return (
              <RadixMenu.Item
                key={i}
                disabled={it.disabled}
                onSelect={it.onSelect}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
                  'data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  it.danger
                    ? 'text-error data-[highlighted]:bg-error/10 data-[highlighted]:text-error'
                    : 'text-ink',
                  focusRing,
                )}
              >
                {it.icon && <Icon icon={it.icon} size="sm" className="text-ink-subtle" />}
                <span className="flex-1">{it.label}</span>
                {it.shortcut && shortcutMode && (
                  <span className="flex items-center gap-0.5">
                    {formatShortcut(it.shortcut).map((k, j) => (
                      <Kbd key={j} size="sm">
                        {k}
                      </Kbd>
                    ))}
                  </span>
                )}
              </RadixMenu.Item>
            );
          })}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
