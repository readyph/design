import { type ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '../utils/cn';

export type TooltipTone = 'inverse' | 'surface';

const toneClasses: Record<TooltipTone, { content: string; arrow: string }> = {
  inverse: { content: 'bg-ink px-2.5 py-1.5 text-xs text-surface shadow-md rounded-base', arrow: 'fill-ink' },
  surface: { content: 'bg-surface p-3 text-ink border border-border shadow-lg rounded-md', arrow: 'fill-surface' },
};

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
  /** `inverse` (default) is the dark compact hint; `surface` is a rich bubble on the surface colour. */
  tone?: TooltipTone;
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
  tone = 'inverse',
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
              'z-tooltip max-w-xs',
              toneClasses[tone].content,
              'data-[state=delayed-open]:animate-[ds-popover-in_120ms_ease] motion-reduce:animate-none',
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow className={toneClasses[tone].arrow} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

export const TooltipProvider = RadixTooltip.Provider;
