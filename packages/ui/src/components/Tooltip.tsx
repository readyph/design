import { type ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '../utils/cn';

export interface TooltipProps {
  /** The trigger element. */
  children: ReactNode;
  /** Tooltip content. */
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  /** Delay before showing, ms. */
  delayDuration?: number;
  /** Keep content mounted (controlled open). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * A hover/focus tooltip built on Radix Tooltip. Wrap the whole app once in
 * `<TooltipProvider>` (re-exported) for shared timing, or rely on the built-in
 * provider here.
 */
export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  open,
  onOpenChange,
  className,
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root open={open} onOpenChange={onOpenChange}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              'z-tooltip max-w-xs rounded-base bg-ink px-2.5 py-1.5 text-xs text-surface shadow-md',
              'data-[state=delayed-open]:animate-[ds-popover-in_120ms_ease] motion-reduce:animate-none',
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-ink" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

export const TooltipProvider = RadixTooltip.Provider;
