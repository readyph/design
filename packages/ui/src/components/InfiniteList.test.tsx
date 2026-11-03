import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InfiniteSentinel, ListEnd, ResultCount } from './InfiniteList';
import { SearchBox, ToggleChip } from './ServicesControls';

describe('InfiniteList', () => {
  it('falls back to a Load more button without IntersectionObserver', () => {
    const f = vi.fn();
    render(<InfiniteSentinel hasMore loading={false} onLoadMore={f} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(f).toHaveBeenCalled();
  });
  it('renders nothing when there is no more', () => {
    const { container } = render(<InfiniteSentinel hasMore={false} loading={false} onLoadMore={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
  it('shows the end and the counter', () => {
    render(<><ListEnd total={5} /><ResultCount shown={2} total={5} /></>);
    expect(screen.getByText(/End of list/)).toBeTruthy();
    expect(screen.getByText(/scroll for more/)).toBeTruthy();
  });
  it('ToggleChip toggles and SearchBox clears', () => {
    const t = vi.fn(); const c = vi.fn();
    render(<><ToggleChip pressed={false} onChange={t}>Chip</ToggleChip><SearchBox value="x" onChange={c} /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Chip' }));
    expect(t).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(c).toHaveBeenCalledWith('');
  });
});
