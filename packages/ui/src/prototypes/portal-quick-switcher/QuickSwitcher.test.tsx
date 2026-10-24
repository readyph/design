import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { buildSections, QuickSwitcher } from './QuickSwitcher';

describe('quick switcher prototype', () => {
  it('shows recent and suggested for an empty query', () => {
    expect(buildSections('', ['t-ana'], false).map((s) => s.key)).toEqual(['recent', 'suggested']);
  });

  it('hides remote groups while loading', () => {
    const keys = buildSections('in', [], true).map((s) => s.key);
    expect(keys).not.toContain('team');
    expect(keys).toContain('pages');
  });

  it('highlights Ask Leda when nothing matches and sends the query', () => {
    const onAskLeda = vi.fn();
    render(
      <QuickSwitcher
        open
        onOpenChange={() => {}}
        query="zzz nothing"
        onQueryChange={() => {}}
        onSelectItem={() => {}}
        onAskLeda={onAskLeda}
      />,
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(onAskLeda).toHaveBeenCalledWith('zzz nothing');
  });

  it('keeps Ask Leda as the last option and wraps with arrow keys', () => {
    const onAskLeda = vi.fn();
    render(
      <QuickSwitcher
        open
        onOpenChange={() => {}}
        query="ana"
        onQueryChange={() => {}}
        onSelectItem={() => {}}
        onAskLeda={onAskLeda}
      />,
    );
    const options = screen.getAllByRole('option');
    expect(options[options.length - 1]).toHaveTextContent('Ask Leda');
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowUp' });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(onAskLeda).toHaveBeenCalledWith('ana');
  });
});
