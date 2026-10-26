// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { TopicLibrary, topicMatcher, useTopicLayout, type TopicLibraryProps } from './TopicLibrary';
import { TopicLibraryPage, countTopics, sampleTopics } from './TopicLibrary.sample';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

const lib = (props: Partial<TopicLibraryProps> = {}) => render(<TopicLibrary topics={sampleTopics} counts={countTopics(sampleTopics)} {...props} />);

describe('rows', () => {
  it('links the title, names the switch by the topic, and the row is not a label', () => {
    lib();
    const row = screen.getByRole('link', { name: /Services and prices/ }).closest('li') as HTMLElement;
    const sw = within(row).getByRole('switch', { name: "Customers' Leda can use Services and prices" });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(row.querySelector('label')).toBeNull();
    expect(within(row).getByText('On')).toBeTruthy();
  });

  it('names the lock icon', () => {
    lib();
    expect(screen.getByRole('link', { name: /Payment details.*off by default/ })).toBeTruthy();
  });

  it('emits onToggle from the switch only, not from a row click', () => {
    const onToggle = vi.fn();
    lib({ onToggle });
    const row = screen.getAllByRole('link', { name: /Opening hours/ })[0].closest('li') as HTMLElement;
    fireEvent.click(row);
    expect(onToggle).not.toHaveBeenCalled();
    fireEvent.click(within(row).getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 't2' }), false);
  });
});

describe('search', () => {
  it('debounces, marks matches safely and escapes the pattern', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    const { rerender } = lib({ onQueryChange });
    fireEvent.change(screen.getByLabelText('Search every folder'), { target: { value: 'warr' } });
    expect(onQueryChange).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(onQueryChange).toHaveBeenCalledWith('warr');
    rerender(<TopicLibrary topics={[sampleTopics[3]]} counts={countTopics(sampleTopics)} query="warr" />);
    expect(document.querySelector('mark')?.textContent).toBe('Warr');
    expect(screen.getByText(/1 topic matches/)).toBeTruthy();
    expect('abc'.match(topicMatcher('a.c')!)).toBeNull();
    expect(() => topicMatcher('(*[')).not.toThrow();
  });

  it('does not take j / k from the search box', () => {
    lib();
    const input = screen.getByLabelText('Search every folder');
    input.focus();
    fireEvent.keyDown(input, { key: 'j' });
    expect(document.querySelector('[data-current="true"]')).toBeNull();
  });
});

describe('cursor', () => {
  it('moves with j / k, survives a list to grid change, never takes /', () => {
    const counts = countTopics(sampleTopics);
    const { rerender } = lib();
    fireEvent.keyDown(document.body, { key: 'j' });
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(document.querySelector('[data-current="true"]')?.getAttribute('data-row-id')).toBe('t2');
    rerender(<TopicLibrary topics={sampleTopics} counts={counts} layout="grid" />);
    expect(document.querySelector('[data-current="true"]')?.getAttribute('data-row-id')).toBe('t2');
    expect(fireEvent.keyDown(document.body, { key: '/' })).toBe(true);
  });
});

describe('states', () => {
  it('empty folder, no match, empty filter, loading, error', () => {
    const c = countTopics([]);
    const { rerender } = render(<TopicLibrary topics={[]} counts={c} folderLabel="Auto Works" onNew={() => {}} />);
    expect(screen.getByText('No topics in Auto Works yet')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'New topic' }).length).toBeGreaterThan(0);
    rerender(<TopicLibrary topics={[]} counts={c} query="zzz" filter="on" />);
    expect(screen.getByText('No topics match “zzz” in on')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Clear search' }).length).toBeGreaterThan(0);
    rerender(<TopicLibrary topics={[]} counts={c} filter="off" />);
    expect(screen.getByText('Nothing is off in any folder')).toBeTruthy();
    rerender(<TopicLibrary topics={[]} counts={c} loading />);
    expect(screen.getByText('Loading topics')).toBeTruthy();
    rerender(<TopicLibrary topics={[]} counts={c} error />);
    expect(screen.getByRole('alert').textContent).toContain('topics');
  });

  it('read only: switches disabled, reason shown, no bulk or new', () => {
    lib({ readOnly: true, onToggleAll: () => {}, onNew: () => {} });
    for (const s of screen.getAllByRole('switch')) expect((s as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Only owners, admins and managers/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Turn all/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'New topic' })).toBeNull();
  });

  it('Turn all label follows allOn and emits the asked state', () => {
    const onToggleAll = vi.fn();
    const counts = countTopics(sampleTopics);
    const { rerender } = lib({ onToggleAll });
    fireEvent.click(screen.getByRole('button', { name: 'Turn all on' }));
    expect(onToggleAll).toHaveBeenCalledWith(true);
    rerender(<TopicLibrary topics={sampleTopics} counts={counts} onToggleAll={onToggleAll} allOn />);
    expect(screen.getByRole('button', { name: 'Turn all off' })).toBeTruthy();
  });
});

describe('page', () => {
  it('saves a switch at once', () => {
    render(<TopicLibraryPage />);
    const sw = screen.getAllByRole('switch')[0];
    expect(sw.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sw);
    expect(screen.getAllByRole('switch')[0].getAttribute('aria-checked')).toBe('false');
  });
});

describe('useTopicLayout', () => {
  it('reads and writes localStorage, and survives it throwing', () => {
    window.localStorage.setItem('k', 'grid');
    const a = renderHook(() => useTopicLayout('k'));
    expect(a.result.current[0]).toBe('grid');
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const b = renderHook(() => useTopicLayout('k'));
    expect(b.result.current[0]).toBe('list');
    act(() => b.result.current[1]('grid'));
    expect(b.result.current[0]).toBe('grid');
    get.mockRestore();
    set.mockRestore();
  });
});

describe('focus after a save removes the row', () => {
  const on = sampleTopics.filter((t) => t.on);
  const counts = countTopics(sampleTopics);
  const setup = () => {
    const outside = document.createElement('input');
    document.body.appendChild(outside);
    const view = render(<TopicLibrary topics={on} counts={counts} filter="on" />);
    return { outside, view };
  };

  it('does not pull focus back from an outside input (async save)', () => {
    const { outside, view } = setup();
    fireEvent.click(screen.getAllByRole('switch')[1]); // user toggles, save is pending
    outside.focus(); // user clicks into another field meanwhile
    view.rerender(<TopicLibrary topics={on.filter((t) => t.id !== on[1].id)} counts={counts} filter="on" />);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('moves focus to the next switch when the focused row vanished', () => {
    const { outside, view } = setup();
    const sw = screen.getAllByRole('switch')[1];
    sw.focus();
    fireEvent.click(sw);
    view.rerender(<TopicLibrary topics={on.filter((t) => t.id !== on[1].id)} counts={counts} filter="on" />);
    expect(document.activeElement?.getAttribute('role')).toBe('switch');
    expect(document.activeElement?.getAttribute('aria-label')).toContain(on[2].title);
    outside.remove();
  });

  it('does not pull focus from another control inside the library (shared focusIfLost)', () => {
    const { outside, view } = setup();
    fireEvent.click(screen.getAllByRole('switch')[1]);
    const search = screen.getByLabelText('Search every folder');
    search.focus();
    view.rerender(<TopicLibrary topics={on.filter((t) => t.id !== on[1].id)} counts={counts} filter="on" />);
    expect(document.activeElement).toBe(search);
    outside.remove();
  });

  it('ignores a stale toggle on a later, unrelated change', () => {
    const { outside, view } = setup();
    fireEvent.click(screen.getAllByRole('switch')[0]); // row stays shown
    view.rerender(<TopicLibrary topics={[...on]} counts={counts} filter="on" />);
    expect(document.activeElement).toBe(document.body);
    view.rerender(<TopicLibrary topics={on.slice(2)} counts={counts} filter="on" />);
    expect(document.activeElement).toBe(document.body);
    outside.remove();
  });
});

describe('IME', () => {
  it('Escape and Enter do nothing while composing', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    lib({ onQueryChange, query: 'x' });
    const input = screen.getByLabelText('Search every folder') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true });
    expect(input.value).toBe('x');
    expect(onQueryChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
  });
});
