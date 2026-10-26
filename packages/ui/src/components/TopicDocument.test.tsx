// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { TopicDocument } from './TopicDocument';
import { TopicDocumentPage, customTopic, dataTopic, lockedTopic } from './TopicDocument.sample';
import * as stories from './TopicDocument.stories';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const title = () => screen.getByLabelText('Title') as HTMLInputElement;
const body = () => screen.getByLabelText('What Leda should know') as HTMLTextAreaElement;
const save = () => screen.getByRole('button', { name: /^Save$|Add topic/ });
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

describe('layout and read only', () => {
  it('shows a data topic read only with the link to where it is edited, and the questions', () => {
    const onTry = vi.fn();
    render(<TopicDocument topic={dataTopic} origin="Auto Works" edit={{ href: '#aw', label: 'Auto Works' }} onTry={onTry} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Services and prices' })).toBeTruthy();
    expect(screen.queryByLabelText('Title')).toBeNull();
    expect(screen.getByRole('link', { name: 'Auto Works' }).getAttribute('href')).toBe('#aw');
    expect(screen.getByRole('heading', { level: 2, name: 'Questions this helps answer' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /See what Leda says to/ }));
    expect(onTry).toHaveBeenCalledWith('How much is an oil change?');
  });

  it('shows at most three questions and names the lock on a sensitive topic', () => {
    render(<TopicDocument topic={{ ...lockedTopic, questions: ['a', 'b', 'c', 'd'] }} origin="x" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText(/Off by default. Customers would see what you pay/)).toBeTruthy();
  });

  it('read only custom topic has no fields and says who can change it; the switch is disabled', () => {
    render(<TopicDocument topic={customTopic} readOnly />);
    expect(screen.queryByLabelText('Title')).toBeNull();
    expect(screen.getByText(/Only owners, admins and managers can change it/)).toBeTruthy();
    expect(screen.getByRole('switch').hasAttribute('disabled')).toBe(true);
  });

  it('the switch emits onToggle', () => {
    const onToggle = vi.fn();
    render(<TopicDocument topic={dataTopic} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('loading, error and gone states', () => {
    const onRetry = vi.fn();
    const onBack = vi.fn();
    const { rerender } = render(<TopicDocument loading />);
    expect(screen.getByRole('status').textContent).toBe('Loading topic');
    rerender(<TopicDocument error onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(onRetry).toHaveBeenCalled();
    rerender(<TopicDocument missing onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Memory' }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('editing', () => {
  it('is dirty only once text changes, tells the page, and Discard restores and focuses the title', () => {
    const onDirtyChange = vi.fn();
    render(<TopicDocument topic={customTopic} onSave={vi.fn()} onDirtyChange={onDirtyChange} />);
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(save().getAttribute('aria-disabled')).toBe('true');
    type(body(), 'Changed');
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    const discard = screen.getByRole('button', { name: 'Discard' });
    discard.focus();
    fireEvent.click(discard);
    expect(body().value).toBe(customTopic.body);
    expect(document.activeElement).toBe(title());
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it('counts characters left in memory and refuses to save when over', () => {
    const onSave = vi.fn();
    render(<TopicDocument topic={customTopic} room={{ max: 200, others: 100 }} onSave={onSave} />);
    type(body(), 'x'.repeat(150));
    expect(screen.getByText(/characters over the memory room/)).toBeTruthy();
    fireEvent.click(save());
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('The memory is full. Shorten or delete entries first.');
    expect(body().getAttribute('aria-invalid')).toBe('true');
  });

  it('requires a title and a paragraph', () => {
    render(<TopicDocument isNew onSave={vi.fn()} />);
    type(body(), 'Something');
    fireEvent.click(save());
    expect(screen.getByRole('alert').textContent).toContain('Write a title.');
    expect(document.activeElement).toBe(title());
  });

  it('Save stays focusable and busy while saving, ignores clicks, and the shortcut saves', async () => {
    let finish: () => void = () => {};
    const onSave = vi.fn(() => new Promise<void>((r) => (finish = r)));
    render(<TopicDocument topic={customTopic} onSave={onSave} />);
    type(title(), 'Warranty');
    const btn = save();
    btn.focus();
    fireEvent.click(btn);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(btn.hasAttribute('disabled')).toBe(false);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(document.activeElement).toBe(btn);
    fireEvent.click(btn);
    fireEvent.keyDown(window, { key: 's', metaKey: true });
    expect(onSave).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(btn.getAttribute('aria-busy')).toBeNull();
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(document.activeElement).toBe(btn);
    type(title(), 'Warranty 2');
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(onSave).toHaveBeenCalledTimes(2);
    await act(async () => finish());
  });

  it('a refused save moves focus to the field only if focus was on the bar; not when the user went elsewhere', async () => {
    let finish: (v: { error: string; field: 'title' }) => void = () => {};
    const onSave = vi.fn(() => new Promise<{ error: string; field: 'title' }>((r) => (finish = r)));
    render(<><TopicDocument topic={customTopic} onSave={onSave} /><button>elsewhere</button></>);
    type(body(), 'one');
    save().focus();
    fireEvent.click(save());
    await act(async () => finish({ error: 'A memory with this title already exists.', field: 'title' }));
    expect(document.activeElement).toBe(title());
    expect(title().getAttribute('aria-describedby')).toBeTruthy();

    type(body(), 'two');
    save().focus();
    fireEvent.click(save());
    const other = screen.getByRole('button', { name: 'elsewhere' });
    other.focus();
    await act(async () => finish({ error: 'A memory with this title already exists.', field: 'title' }));
    expect(document.activeElement).toBe(other);
  });

  it('a throwing save shows an error and stays usable', async () => {
    render(<TopicDocument topic={customTopic} onSave={() => Promise.reject(new Error('x'))} />);
    type(body(), 'one');
    fireEvent.click(save());
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Couldn’t save'));
    expect(save().getAttribute('aria-busy')).toBeNull();
  });

  it('a new topic shows the folder picker and Add topic emits the folder', async () => {
    const onSave = vi.fn();
    render(<TopicDocument isNew folders={[{ value: 'a', label: 'Auto' }]} folder="a" onSave={onSave} />);
    expect(screen.getByText('Folder')).toBeTruthy();
    type(title(), 'Parking');
    type(body(), 'Free behind the building.');
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Add topic' })));
    expect(onSave).toHaveBeenCalledWith({ title: 'Parking', body: 'Free behind the building.', folder: 'a' });
  });

  it('a saved value that changes under a clean draft replaces it; a dirty draft keeps the words', () => {
    const { rerender } = render(<TopicDocument topic={customTopic} onSave={vi.fn()} />);
    rerender(<TopicDocument topic={{ ...customTopic, body: 'Server text' }} onSave={vi.fn()} />);
    expect(body().value).toBe('Server text');
    type(body(), 'Mine');
    rerender(<TopicDocument topic={{ ...customTopic, body: 'Server text 2' }} onSave={vi.fn()} />);
    expect(body().value).toBe('Mine');
  });
});

describe('delete', () => {
  it('asks first with focus on Cancel, then deletes and closes', async () => {
    const onDelete = vi.fn();
    render(<TopicDocument topic={customTopic} onSave={vi.fn()} onDelete={onDelete} />);
    const del = screen.getByRole('button', { name: 'Delete' });
    del.focus();
    fireEvent.click(del);
    const dialog = await screen.findByRole('alertdialog');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete topic' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalled());
    await waitFor(() => expect(dialog.isConnected).toBe(false));
  });

  it('Cancel keeps the topic and returns focus to Delete', async () => {
    const onDelete = vi.fn();
    render(<TopicDocument topic={customTopic} onSave={vi.fn()} onDelete={onDelete} />);
    const del = screen.getByRole('button', { name: 'Delete' });
    del.focus();
    fireEvent.click(del);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(document.activeElement).toBe(del));
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe('page', () => {
  it('refuses a duplicate title (case-insensitive) and saves a unique one with Saved announced', async () => {
    vi.useFakeTimers();
    render(<TopicDocumentPage delay={10} />);
    type(title(), 'WHERE TO PARK');
    fireEvent.click(save());
    await act(async () => void vi.advanceTimersByTime(20));
    expect(screen.getByRole('alert').textContent).toContain('A memory with this title already exists.');
    type(title(), 'Warranty and returns');
    fireEvent.click(save());
    await act(async () => void vi.advanceTimersByTime(20));
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the edit conflict message', async () => {
    vi.useFakeTimers();
    render(<TopicDocumentPage delay={10} />);
    type(title(), 'Conflict');
    fireEvent.click(save());
    await act(async () => void vi.advanceTimersByTime(20));
    expect(screen.getByRole('alert').textContent).toContain('This memory was changed by someone else. Reload and try again.');
  });

  it('warns the browser before unload while dirty', () => {
    render(<TopicDocumentPage />);
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    type(body(), 'edited');
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });
});

describe('axe', () => {
  const shown = Object.entries(stories).filter(([k]) => k !== 'default');
  for (const [name, story] of shown) {
    it(`has no axe violations (${name})`, async () => {
      const S = story as unknown as { render: () => JSX.Element };
      const { container } = render(S.render());
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
      expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
    });
  }
});
