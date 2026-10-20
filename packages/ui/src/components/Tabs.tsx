import { forwardRef, useCallback, useEffect, useRef, type ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: PhosphorIcon;
  disabled?: boolean;
  /** Optional trailing count/badge. */
  badge?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: 'underline' | 'pill';
  /** Tab panels, usually `<TabPanel>` children. */
  children?: ReactNode;
  className?: string;
}

const CONTROLS_KEY = 'tabControls';

/**
 * Radix always sets `aria-controls` on a trigger, even when no `TabPanel` is
 * rendered for it (tabs used purely as navigation). A dangling reference is an
 * invalid ARIA value, so drop it while the panel is absent and restore it when
 * the panel mounts.
 */
function syncControls(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => {
    const id = tab.getAttribute('aria-controls') ?? tab.dataset[CONTROLS_KEY];
    if (!id) return;
    tab.dataset[CONTROLS_KEY] = id;
    const present = tab.ownerDocument.getElementById(id) !== null;
    if (present && tab.getAttribute('aria-controls') !== id) tab.setAttribute('aria-controls', id);
    if (!present && tab.hasAttribute('aria-controls')) tab.removeAttribute('aria-controls');
  });
}

/** Keyboard-navigable tabs (arrow keys, Home/End) built on Radix Tabs. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { items, value, defaultValue, onValueChange, variant = 'underline', children, className },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    syncControls(root);
    const observer = new MutationObserver(() => syncControls(root));
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected', 'id'] });
    return () => observer.disconnect();
  }, []);
  return (
    <RadixTabs.Root
      ref={setRefs}
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      className={cn('flex flex-col gap-4', className)}
    >
      <RadixTabs.List
        className={cn('flex items-center gap-1 overflow-x-auto', variant === 'underline' && 'border-b border-border-strong')}
        aria-label="Tabs"
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink-muted transition-colors duration-DEFAULT disabled:cursor-not-allowed disabled:opacity-50',
              focusRing,
              variant === 'underline' &&
                '-mb-px border-b-2 border-transparent px-3 py-2 hover:text-ink data-[state=active]:border-primary-500 data-[state=active]:text-ink',
              variant === 'pill' &&
                'rounded-full px-3 py-1.5 hover:bg-surface-muted hover:text-ink data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 [[data-theme=dark]_&]:data-[state=active]:text-primary-900',
            )}
          >
            {item.icon && <Icon icon={item.icon} size="sm" />}
            {item.label}
            {item.badge != null && <span className="text-xs text-ink-subtle">{item.badge}</span>}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
});

export interface TabPanelProps {
  value: string;
  children?: ReactNode;
  className?: string;
}

/** Panel for a `Tabs` value. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, children, className },
  ref,
) {
  return (
    <RadixTabs.Content ref={ref} value={value} className={cn(focusRing, 'rounded-sm', className)}>
      {children}
    </RadixTabs.Content>
  );
});
