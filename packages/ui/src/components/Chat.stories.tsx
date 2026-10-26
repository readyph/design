import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Chat, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, type ChatChip, type ChatMessageData } from './Chat';
import { chatSample } from './Chat.sample';

const meta: Meta<typeof Chat> = {
  title: 'Components/Leda/Chat',
  component: Chat,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Leda conversation panel (C8, RDY-268). UPDATE of the `Chat` family: flat Slack-like rows (no bubbles), a block renderer (text, meta, table, figure, refusal, actions, proposal card, chips), a composer with a scope chip, word streaming, Aurora while thinking.',
          '',
          'Parts: `Chat` (region; `variant="overlay"` is the 440px fixed panel, full screen at 640px and below; render it next to `PlatformShell`, not inside the sheet), `ChatHeader`, `ChatThread` (`role="log"`), `ChatMessage`, `ChatBlocks`, `ChatEmpty`, `ChatChips`, `ChatComposer`, `ChatScopeChip`, `usePersistedChat` (sessionStorage `rph-leda-convo-v1`, JSON only).',
          '',
          'Rules. The package owns the surface; the project owns the messages, streaming and what Send does. Esc closes the panel unless a dialog, menu or list above it takes the key. Focus: the composer on open (the panel on a phone), back to the opener when the panel unmounts with focus inside, only if it was lost (`focusIfLost`). Send stays focusable while busy or empty (`aria-disabled`, `aria-busy`). "New conversation" asks first through `ConfirmDialog` and puts focus in the composer after. Reduced motion: no Aurora movement, the reply shows at once, the tagline reads "Thinking…". The thread announces additions politely; streamed words are hidden from assistive tech, which gets the whole reply once.',
          '',
          'API changes from the old `Chat` (for Leonardo): `Chat.Header/Messages/Message/Input/QuickActions` and the `sm/md/lg` sizes are replaced by the parts above; messages are `ChatMessageData` (JSON) instead of children; `LedaWidget` blocks become `table` and `figure` blocks; proposals reuse `LedaProposal` (C9) through `proposal` blocks with `blockId`. New message page scopes use `page_context` slugs (`home`, `platforms`, `platform`, `team`, `memory`, plus `platform_id`), set by the consumer.',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Chat>;

const frame = 'h-[640px] w-[440px] max-w-full';
const noop = () => {};

function Demo({ messages, busy = false, scope = 'About Parts Stockroom' }: { messages: ChatMessageData[]; busy?: boolean; scope?: string }) {
  const [v, setV] = useState('');
  return (
    <div className={`${frame} bg-frame p-2`}>
      <Chat variant="inline">
        <ChatHeader busy={busy} empty={messages.length === 0} onNewConversation={noop} onClose={noop} />
        {messages.length === 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ChatEmpty scope="Parts Stockroom" chips={chatSample.chips} onPick={(c: ChatChip) => setV(c.label)} />
          </div>
        ) : (
          <ChatThread>
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} onChip={(c) => setV(c.label)} />
            ))}
          </ChatThread>
        )}
        <ChatComposer value={v} onChange={setV} onSend={noop} busy={busy} scope={scope} />
      </Chat>
    </div>
  );
}

export const Empty: Story = { render: () => <Demo messages={[]} /> };
export const Conversation: Story = { render: () => <Demo messages={chatSample.thread} /> };
export const Thinking: Story = { render: () => <Demo busy messages={[chatSample.thread[0]!, { id: 't', from: 'leda', name: 'Leda', thinking: true, blocks: [] }]} /> };
export const WithProposal: Story = { render: () => <Demo messages={chatSample.withProposal} /> };
export const LongScopeAndNarrow: Story = {
  render: () => (
    <div className="h-[640px] w-[320px] max-w-full bg-frame p-2">
      <Chat variant="inline">
        <ChatHeader onNewConversation={noop} onClose={noop} empty />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatEmpty scope="Auto Works Repair Shop and Parts" chips={chatSample.chips} />
        </div>
        <ChatComposer value="" onChange={noop} onSend={noop} scope="About Auto Works Repair Shop and Parts" />
      </Chat>
    </div>
  ),
};
