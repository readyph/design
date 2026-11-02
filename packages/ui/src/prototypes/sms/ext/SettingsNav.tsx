import { CaretRight, type Icon } from '@phosphor-icons/react';
import { cn } from '../../../index';

export interface SettingsSection<Id extends string = string> { id: Id; label: string; hint: string; icon: Icon }

/**
 * Studio-only SettingsNav (NEW): the in-page section menu. `side` = 220px ruled column with the current section marked by an accent edge (same look as the
 * catalogue's old side menu); `list` = the phone's first screen, full-width rows with a hint and a chevron that push the section.
 */
export function SettingsNav<Id extends string>({ sections, current, onSelect, variant = 'side' }: { sections: SettingsSection<Id>[]; current?: Id; onSelect: (id: Id) => void; variant?: 'side' | 'list' }) {
  if (variant === 'list') {
    return (
      <nav aria-label="Settings sections" className="px-4 pb-6 pt-4">
        <h2 className="mb-1 text-[18px] font-semibold">Settings</h2>
        <ul className="border-t border-rule">
          {sections.map((s) => (
            <li key={s.id} className="border-b border-rule">
              <button type="button" onClick={() => onSelect(s.id)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
                <s.icon size={22} aria-hidden className="flex-none text-muted" />
                <span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{s.label}</span><span className="block text-[13px] text-muted">{s.hint}</span></span>
                <CaretRight size={16} aria-hidden className="flex-none text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
  return (
    <nav aria-label="Settings sections" className="w-[220px] flex-none border-r border-rule py-4">
      <p className="px-5 pb-2 text-[12px] font-medium text-muted">Settings</p>
      <ul>
        {sections.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => onSelect(s.id)} aria-current={s.id === current ? 'page' : undefined}
              className={cn('flex min-h-10 w-full items-center border-l-2 px-5 text-left text-[14px] hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent', s.id === current ? 'border-accent bg-raised font-semibold text-text' : 'border-transparent text-text')}>
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
