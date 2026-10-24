import { Sparkle } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';

/**
 * PLACEHOLDER (RDY-18). Leda is undecided: Earvin chooses at the next gate. These slots are inert,
 * connect to nothing and ask for nothing. They only mark where a read-only suggestion could sit.
 */
export function LedaSlot({ variant = 'row' }: { variant?: 'row' | 'panel' }) {
  if (variant === 'panel') {
    return (
      <Notice tone="neutral" icon={Sparkle} title="Leda, pending decision">
        A suggested next step and the reason for it would show here. Not connected yet.
      </Notice>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
      <Icon icon={Sparkle} size="sm" />
      <Badge size="sm" tone="neutral">Leda, pending decision</Badge>
    </span>
  );
}
