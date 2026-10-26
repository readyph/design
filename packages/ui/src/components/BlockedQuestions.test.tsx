// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { BlockedQuestions, normalizeBlockedQuestion, type BlockedQuestionItem, type BlockedQuestionsProps, type BlockedScope } from './BlockedQuestions';
import { Toaster } from './toast/Toaster';
import { clearToasts } from './toast/toastStore';

afterEach(() => {
  cleanup();
  clearToasts();
});

const scopes: BlockedScope[] = [
  { id: 'company', label: 'Every business' },
  { id: 'auto', label: 'Auto Works Quezon City' },
];
const seed: BlockedQuestionItem[] = [
  { id: 'a', question: 'Who is your parts supplier?', scope: 'auto' },
  { id: 'b', question: 'Can I get a discount for my friend?', scope: 'company' },
  { id: 'c', question: 'What is the owner’s phone number?', scope: 'auto' },
];
const replies = { company: 'I can’t help with that.', auto: 'Please ask at the counter.' };
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Harness({ saveMs = 0, ...props }: Partial<BlockedQuestionsProps> & { saveMs?: number }) {
  const [items, setItems] = useState(seed);
  const [rep, setRep] = useState(replies);
  return (
    <>
      <button>Elsewhere</button>
      <BlockedQuestions
        items={items}
        scopes={scopes}
        replies={rep}
        onBlock={async (i) => {
          if (saveMs) await delay(saveMs);
          setItems((x) => [...x, { id: `n${x.length}`, ...i }]);
        }}
        onRemove={async (item, { undo }) => {
          if (saveMs) await delay(saveMs);
          setItems((x) => (undo ? [...x.slice(0, 1), item, ...x.slice(1)] : x.filter((y) => y.id !== item.id)));
        }}
        onEditReply={async (s, t) => {
          if (saveMs) await delay(saveMs);
          setRep((r) => ({ ...r, [s]: t }));
        }}
        onTry={() => {}}
        {...props}
      />
      <Toaster />
    </>
  );
}
const input = () => screen.getByLabelText('A question to block') as HTMLInputElement;

describe('BlockedQuestions', () => {
  it('lists rows with tags, Try and Remove, and the replies above', () => {
    render(<Harness />);
    const list = screen.getByRole('list', { name: 'Blocked questions, 3' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getAllByText('Every business')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Try it: Who is your parts supplier?' })).toBeTruthy();
    expect(screen.getByText('“I can’t help with that.”')).toBeTruthy();
    expect(screen.getByText('At Auto Works Quezon City, Leda replies')).toBeTruthy();
  });

  it('Block with Enter: input is cleared and keeps focus, result is announced', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(input());
    await u.keyboard('What are your margins?{Enter}');
    expect(await screen.findByRole('button', { name: /Remove blocked question: What are your margins\?/ })).toBeTruthy();
    expect(input().value).toBe('');
    expect(document.activeElement).toBe(input());
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Blocked “What are your margins?” for every business.')).toBe(true);
  });

  it('refuses duplicates case-insensitively, also against every-business, and associates the message', async () => {
    const u = userEvent.setup();
    const onBlock = vi.fn();
    render(<Harness onBlock={onBlock} />);
    await u.click(input());
    await u.keyboard('  CAN I GET A   discount for my friend  {Enter}');
    const err = screen.getByRole('alert');
    expect(err.textContent).toBe('That question is already blocked for every business.');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe(err.id);
    expect(onBlock).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input());
    await u.keyboard('x');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('normalizes for the duplicate check', () => {
    expect(normalizeBlockedQuestion('  Who’s   YOUR supplier ?? ')).toBe(normalizeBlockedQuestion('whos your supplier'));
  });

  it('typing j and k in the input or the Blocked-for list never moves the cursor', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(input());
    await u.keyboard('jk');
    expect(input().value).toBe('jk');
    expect(document.querySelector('[data-current="true"]')).toBeNull();
    screen.getByRole('combobox', { name: 'Blocked for' }).focus();
    await u.keyboard('j');
    expect(document.querySelector('[data-current="true"]')).toBeNull();
    (document.activeElement as HTMLElement).blur();
    await u.keyboard('j');
    expect(document.querySelector('[data-current="true"]')).toBeTruthy();
  });

  it('Remove asks first; after removing, focus goes to the next row, then the previous, then the input', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(screen.getByRole('button', { name: /Remove blocked question: Who is your parts/ }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /Remove blocked question: Can I get a discount/ })));
    // last row -> previous
    await u.click(screen.getByRole('button', { name: /Remove blocked question: What is the owner/ }));
    await u.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /Remove blocked question: Can I get a discount/ })));
    // only row -> the input
    await u.click(screen.getByRole('button', { name: /Remove blocked question: Can I get a discount/ }));
    await u.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(document.activeElement).toBe(input()));
  });

  it('Cancel on the confirm removes nothing and returns focus to Remove', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    const b = screen.getByRole('button', { name: /Remove blocked question: Who is your parts/ });
    await u.click(b);
    await u.keyboard('{Enter}'); // focus starts on Cancel
    await waitFor(() => expect(document.activeElement).toBe(b));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('Undo restores the row and focuses it when focus was lost', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(screen.getByRole('button', { name: /Remove blocked question: Who is your parts/ }));
    await u.click(screen.getByRole('button', { name: 'Remove' }));
    const undo = await screen.findByRole('button', { name: 'Undo' });
    await u.click(undo);
    const back = await screen.findByRole('button', { name: /Remove blocked question: Who is your parts/ });
    await waitFor(() => expect(document.activeElement).toBe(back));
  });

  it('a slow remove does not steal focus from where the person went', async () => {
    const u = userEvent.setup();
    render(<Harness saveMs={80} />);
    await u.click(screen.getByRole('button', { name: /Remove blocked question: Who is your parts/ }));
    await u.click(screen.getByRole('button', { name: 'Remove' }));
    await u.click(input());
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2), { timeout: 1000 });
    expect(document.activeElement).toBe(input());
    expect(screen.getAllByRole('status').some((s) => s.textContent?.startsWith('Removed:'))).toBe(true);
  });

  it('a slow Block keeps what the person typed meanwhile and does not move focus', async () => {
    const u = userEvent.setup();
    render(<Harness saveMs={60} />);
    await u.click(input());
    await u.keyboard('First one{Enter}');
    await u.keyboard('second');
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(4), { timeout: 1000 });
    expect(input().value).toBe('First onesecond'); // not cleared: it is no longer what was sent
    expect(document.activeElement).toBe(input());
  });

  it('Edit reply: focus to the field, Esc cancels back to the button, Save returns to the button', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    const edit = screen.getByRole('button', { name: 'Edit reply, for the company and every business' });
    await u.click(edit);
    const area = screen.getByLabelText('Leda replies, for the company and every business');
    expect(document.activeElement).toBe(area);
    await u.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit reply, for the company and every business' })));
    await u.click(screen.getByRole('button', { name: 'Edit reply, for the company and every business' }));
    await u.clear(screen.getByLabelText('Leda replies, for the company and every business'));
    await u.keyboard('Sorry, no.');
    await u.click(screen.getByRole('button', { name: 'Save reply' }));
    expect(await screen.findByText('“Sorry, no.”')).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit reply, for the company and every business' })));
  });

  it('Edit reply: an empty reply is refused and associated; a slow save leaves focus where the person is', async () => {
    const u = userEvent.setup();
    render(<Harness saveMs={80} />);
    await u.click(screen.getByRole('button', { name: 'Edit reply, for the company and every business' }));
    const area = screen.getByLabelText('Leda replies, for the company and every business');
    await u.clear(area);
    await u.click(screen.getByRole('button', { name: 'Save reply' }));
    expect(area.getAttribute('aria-invalid')).toBe('true');
    expect(area.getAttribute('aria-describedby')).toContain(screen.getByRole('alert').id);
    await u.type(area, 'Ok then');
    await u.click(screen.getByRole('button', { name: 'Save reply' }));
    await u.click(input());
    await waitFor(() => expect(screen.getByText('“Ok then”')).toBeTruthy(), { timeout: 1000 });
    expect(document.activeElement).toBe(input());
  });

  it('platform tab: fixed scope, no Blocked for, no tags, a note for every-business ones', () => {
    render(<Harness scope="auto" inheritedLink={<a href="#m">in Memory</a>} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/1 more question is blocked for every business/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'in Memory' })).toBeTruthy();
    expect(screen.queryByText('Leda replies')).toBeNull();
  });

  it('empty, read-only, loading and error states', async () => {
    const { rerender } = render(<BlockedQuestions items={[]} scopes={scopes} replies={replies} />);
    expect(screen.getByText('No blocked questions')).toBeTruthy();
    rerender(<BlockedQuestions items={seed} scopes={scopes} replies={replies} readOnly readOnlyNote="Ask an owner." onTry={() => {}} />);
    expect(screen.queryByRole('button', { name: /Remove blocked/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Edit reply/ })).toBeNull();
    expect(screen.queryByLabelText('A question to block')).toBeNull();
    expect(screen.getByText('Ask an owner.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Try it: Who/ })).toBeTruthy();
    rerender(<BlockedQuestions items={[]} scopes={scopes} replies={replies} status="loading" />);
    expect(screen.getByRole('status', { name: 'Loading blocked questions' })).toBeTruthy();
    const onRetry = vi.fn();
    rerender(<BlockedQuestions items={[]} scopes={scopes} replies={replies} status="error" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('a rejected block shows the message and keeps the text', async () => {
    const u = userEvent.setup();
    render(<BlockedQuestions items={[]} scopes={scopes} replies={{}} onBlock={() => Promise.reject(new Error('The memory is full.'))} />);
    await u.click(input());
    await u.keyboard('Anything{Enter}');
    expect((await screen.findByRole('alert')).textContent).toBe('The memory is full.');
    expect(input().value).toBe('Anything');
    expect(document.activeElement).toBe(input());
    await act(async () => {});
  });

  it('blocking the question that reaches the limit keeps the input mounted and focused', async () => {
    const u = userEvent.setup();
    render(<Harness maxItems={4} />);
    await u.click(input());
    await u.keyboard('One more{Enter}');
    await screen.findByRole('button', { name: /Remove blocked question: One more/ });
    expect(document.activeElement).toBe(input());
    expect(screen.getByText(/You can block up to 4 questions/)).toBeTruthy();
    expect(input().getAttribute('aria-describedby')).toBeTruthy();
    await u.keyboard('Another{Enter}');
    expect(screen.getByRole('alert').textContent).toMatch(/up to 4 questions/);
    expect(document.activeElement).toBe(input());
  });

  it('refuses blocking for every business what a platform already blocks, naming where', async () => {
    const u = userEvent.setup();
    const onBlock = vi.fn();
    render(<Harness onBlock={onBlock} />);
    await u.click(input());
    await u.keyboard('who is your PARTS supplier{Enter}');
    expect(screen.getByRole('alert').textContent).toBe('That question is already blocked at Auto Works Quezon City. Remove it there first to block it for every business.');
    expect(onBlock).not.toHaveBeenCalled();
  });

  it('a remove that fails later does not wipe the pending move of a newer Undo', async () => {
    const u = userEvent.setup();
    let rejectFirst: (e: Error) => void = () => {};
    function H() {
      const [items, setItems] = useState(seed);
      return (
        <>
          <BlockedQuestions
            items={items}
            scopes={scopes}
            replies={replies}
            onRemove={(item, { undo }) => {
              if (undo) {
                setItems((x) => [item, ...x]);
                return;
              }
              if (item.id === 'a') {
                setItems((x) => x.filter((y) => y.id !== 'a'));
                return;
              }
              return new Promise<void>((_, rej) => (rejectFirst = rej));
            }}
          />
          <Toaster />
        </>
      );
    }
    render(<H />);
    // remove b (slow, will fail), then remove a (fast) and Undo it, then let b fail
    await u.click(screen.getByRole('button', { name: /Remove blocked question: Can I get a discount/ }));
    await u.click(screen.getByRole('button', { name: 'Remove' }));
    await u.click(screen.getByRole('button', { name: /Remove blocked question: Who is your parts/ }));
    await u.click(screen.getByRole('button', { name: 'Remove' }));
    await u.click(await screen.findByRole('button', { name: 'Undo' }));
    const back = await screen.findByRole('button', { name: /Remove blocked question: Who is your parts/ });
    await waitFor(() => expect(document.activeElement).toBe(back));
    await u.click(screen.getByRole('button', { name: /Remove blocked question: What is the owner/ }));
    const here = document.activeElement;
    await act(async () => rejectFirst(new Error('no')));
    expect(document.activeElement).toBe(here); // the old failure moves nothing
  });

  it('a pending remove disarms when the parent keeps the item', async () => {
    const u = userEvent.setup();
    function H() {
      const [items, setItems] = useState(seed);
      return (
        <>
          <button onClick={() => setItems((x) => x.filter((y) => y.id !== 'a'))}>Parent removes a</button>
          <BlockedQuestions items={items} scopes={scopes} replies={replies} onRemove={() => {}} />
        </>
      );
    }
    render(<H />);
    await u.click(screen.getByRole('button', { name: /Remove blocked question: Who is your parts/ }));
    await u.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await act(async () => {});
    const other = screen.getByRole('button', { name: 'Parent removes a' });
    other.focus();
    await u.click(other); // later, unrelated removal of the same row must not pull focus
    expect(document.activeElement).toBe(other);
  });

  it('Esc during a reply save that later fails still tells the person', async () => {
    const u = userEvent.setup();
    render(<Harness onEditReply={() => delay(40).then(() => Promise.reject(new Error('Saving failed.')))} />);
    await u.click(screen.getByRole('button', { name: 'Edit reply, for the company and every business' }));
    await u.keyboard('x');
    await u.click(screen.getByRole('button', { name: 'Save reply' }));
    await u.keyboard('{Escape}');
    expect(screen.queryByLabelText('Leda replies, for the company and every business')).toBeNull();
    expect(await screen.findByText(/Reply not saved\. Saving failed\./)).toBeTruthy();
  });

  it('caps the question length and keeps long strings inside the row', () => {
    const long = 'x'.repeat(160);
    render(<BlockedQuestions items={[{ id: 'l', question: long, scope: 'company' }]} scopes={scopes} replies={{}} onRemove={() => {}} />);
    expect(input().maxLength).toBe(160);
    expect(screen.getByText(`“${long}”`).className).toContain('overflow-wrap:anywhere');
  });
});
