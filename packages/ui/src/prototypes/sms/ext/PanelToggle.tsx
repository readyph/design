import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Minus, Plus } from '@phosphor-icons/react';
import { cn } from '../../../index';

export interface PanelToggleProps {
  /** `hide` shows a minus (panel is open), `show` a plus (panel is collapsed). */
  mode: 'hide' | 'show';
  onClick: () => void;
  /** Adds context to the aria-label, e.g. "3 need you". */
  hint?: string;
  tooltipSide?: 'left' | 'bottom';
  className?: string;
}

/**
 * Studio-only PanelToggle (NEW): icon-only ghost control, no fill (hover changes the icon colour only), same 20px regular icon in both states,
 * with a Radix tooltip ("Hide" / "Show"). The library has no standalone Tooltip, so this uses the same Radix primitive IconRail uses.
 */
export function PanelToggle({ mode, onClick, hint, tooltipSide = 'left', className }: PanelToggleProps) {
  const label = mode === 'hide' ? 'Hide' : 'Show';
  const Icon = mode === 'hide' ? Minus : Plus;
  return (
    <RadixTooltip.Provider delayDuration={200} skipDelayDuration={400}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <button
            type="button" onClick={onClick} aria-expanded={mode === 'hide'}
            aria-label={`${label} the side panel${hint ? `, ${hint}` : ''}`}
            className={cn('inline-flex size-8 items-center justify-center bg-transparent text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent', className)}
          >
            <Icon size={20} weight="regular" aria-hidden />
          </button>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content side={tooltipSide} sideOffset={8} collisionPadding={8} className="z-50 select-none whitespace-nowrap rounded-chip bg-text px-2 py-1 text-small text-surface">
            {label}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
