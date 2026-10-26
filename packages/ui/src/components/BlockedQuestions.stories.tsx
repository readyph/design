import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BlockedQuestions } from './BlockedQuestions';
import { Live } from './BlockedQuestions.demo';
import { Toaster } from './toast/Toaster';
import { items as sampleItems, longItems, longScopes, manyItems, replies as sampleReplies } from './BlockedQuestions.data';

const meta: Meta<typeof BlockedQuestions> = {
  title: 'Components/Data display/Blocked questions',
  component: BlockedQuestions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Blocked questions list (C29, new). The reply Leda gives (the company\'s and one per platform, each with an inline **Edit reply**), ruled rows (question, tag "Every business" or the platform, **Try**, **Remove**) and the form that adds one. Used on the platform Leda & Memory tab (`scope` set) and the Memory Blocked questions tab (all scopes, with a **Blocked for** list).',
          '',
          '**Built on** `List` (C18, own `j` / `k` cursor: keep `shortcuts` on for one list per page), `Select` (C14), `Button`, `Badge`, `ConfirmDialog` (C12), `toast.undo` (render one `Toaster`), `EmptyState`, `Skeleton`, `ErrorBlock`.',
          '',
          '**Focus is never taken.** After async work focus moves only when it was lost (nothing focused, body, a removed element, or the control that started the action); if the person went elsewhere it stays and the result is announced in the polite status region. Block: focus stays in the input, which is cleared (unless they typed more meanwhile) and the result announced. Remove: next row, else previous, else the input. Undo: the restored row. Edit reply: the field on open, the Edit button on close. The rule lives in one internal function, `focusIfLost`, to be swapped for the shared helper (RDY-269) once merged.',
          '',
          '**Duplicates** are refused case-insensitively, ignoring extra spaces, quotes and a closing `?`, against the same scope and against every-business. The message is `role="alert"`, linked with `aria-describedby` and `aria-invalid` on the input.',
          '',
          '**API note for Leonardo.** `items: {id, question, scope}[]`, `scopes: {id, label, icon?}[]` (the company first; `everyScope`, default `company`), `replies: Record<scopeId, string>`, `scope` (fixed scope for a platform tab; hides the dropdown and tags, adds the "N more questions are blocked for every business" line, `inheritedLink` for "in Memory"), `onBlock({question, scope})`, `onRemove(item, {undo})` (called with `undo: false` after the confirm, and `undo: true` when Undo is chosen: put the item back), `onTry(item)` (opens the Try-it tester C30), `onEditReply(scope, text)`. Handlers may return promises; rejecting with an `Error` shows its message. `readOnly` + `readOnlyNote`, `status` (`ready | loading | error`, `onRetry`), `maxLength` (160), `replyMaxLength` (400), `maxItems` (200), `intro`, `shortcuts`. The caller owns the data and the ids; the component never changes `items`.',
          '',
          'Prototype: `blockedSection`, `replies`, `addBlocked`, `removeBlocked` in `round-2/final/memory.js` and `platform.js`. Stories for the page compositions are under Prototypes / Portal.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[760px]">
        <Story />
        <Toaster />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof BlockedQuestions>;

export const MemoryTab: Story = { name: 'Memory tab (all scopes)', render: () => <Live /> };
export const PlatformTab: Story = {
  name: 'Platform tab (fixed scope)',
  render: () => <Live scope="autoworks" inheritedLink={<a className="text-accent underline" href="#memory">in Memory</a>} />,
};
export const Empty: Story = { render: () => <Live initial={[]} /> };
export const ReadOnly: Story = { render: () => <Live readOnly readOnlyNote="Ask an owner, admin or manager to change this." /> };
export const Loading: Story = { render: () => <Live status="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <Live status="error" onRetry={() => {}} /> };
export const LongAndUnbreakable: Story = { name: 'Long and unbreakable strings', render: () => <Live initial={longItems} defaultBlockScope="autoworks" /> };
export const LongScopeNames: Story = {
  render: () => (
    <BlockedQuestions
      items={[{ id: 'a', question: 'Who is your parts supplier?', scope: 'autoworks' }, ...sampleItems.slice(1)]}
      scopes={longScopes}
      replies={{ ...sampleReplies }}
      defaultBlockScope="autoworks"
      onBlock={() => {}}
      onRemove={() => {}}
      onTry={() => {}}
      onEditReply={() => {}}
    />
  ),
};
export const ManyItems: Story = { name: 'Many items (60)', render: () => <Live initial={manyItems} /> };
export const AtLimit: Story = { name: 'At the limit', render: () => <Live initial={sampleItems} maxItems={5} /> };
export const SlowSaves: Story = { name: 'Slow saves (2 s)', render: () => <Live ms={2000} /> };
export const Phone: Story = {
  name: 'Phone (375)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <Live initial={longItems} defaultBlockScope="autoworks" />,
};

function ForceDark({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'dark');
    return () => (prev === null ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', prev));
  }, []);
  return <>{children}</>;
}
export const Dark: Story = {
  parameters: { docs: { description: { story: 'Sets `data-theme="dark"` on the document.' } } },
  render: () => (
    <ForceDark>
      <Live />
    </ForceDark>
  ),
};
