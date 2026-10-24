import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Chat } from './Chat';
import { Button } from './Button';

const meta: Meta<typeof Chat> = {
  title: 'Components/Chat',
  component: Chat,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'fill'] },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Presentational AI-chat shell (for Leda) in three sizes. Compose it from `Chat.Header`, `Chat.Messages` + `Chat.Message`, and `Chat.Input`. The package renders the surface only — the project owns the messages, streaming, and what sending does (wire `onSubmit` to your backend).',
          '',
          '```tsx',
          "import { Chat } from '@readyph/ui';",
          '',
          'function LedaChat() {',
          '  const [messages, setMessages] = useState([]);',
          '  const send = (text: string) => {',
          '    // project owns this: call the backend / stream the reply',
          '  };',
          '  return (',
          '    <Chat size="md">',
          '      <Chat.Header title="Leda" subtitle="Your assistant" onClose={close} />',
          '      <Chat.Messages>',
          '        {messages.map((m) => (',
          '          <Chat.Message key={m.id} role={m.role}>{m.text}</Chat.Message>',
          '        ))}',
          '      </Chat.Messages>',
          '      <Chat.Input placeholder="Message Leda…" onSubmit={send} />',
          '    </Chat>',
          '  );',
          '}',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Chat>;

function Demo({ size }: { size: 'sm' | 'md' | 'lg' }) {
  return (
    <Chat size={size}>
      <Chat.Header title="Leda" subtitle="Inventory assistant" onClose={() => {}} />
      <Chat.Messages>
        <Chat.Message role="assistant">Hi Maria — how can I help with your inventory today?</Chat.Message>
        <Chat.Message role="user">Which products are low on stock?</Chat.Message>
        <Chat.Message role="assistant">
          3 products are below their reorder point: Tangerine crate, Mango box, and Calamansi pack.
        </Chat.Message>
      </Chat.Messages>
      <Chat.Input placeholder="Message Leda…" />
    </Chat>
  );
}

export const Small: Story = { render: () => <Demo size="sm" /> };
export const Medium: Story = { render: () => <Demo size="md" /> };
export const Large: Story = { render: () => <Demo size="lg" /> };

export const Streaming: Story = {
  render: () => (
    <Chat size="md">
      <Chat.Header title="Leda" />
      <Chat.Messages>
        <Chat.Message role="user">Draft a reorder summary.</Chat.Message>
        <Chat.Message role="assistant" streaming>
          Sure — pulling the numbers
        </Chat.Message>
      </Chat.Messages>
      <Chat.Input placeholder="Message Leda…" busy />
    </Chat>
  ),
};

export const QuickActions: Story = {
  name: 'With quick actions',
  render: () => (
    <Chat size="md">
      <Chat.Header title="Leda" />
      <Chat.Messages>
        <Chat.Message role="assistant">What would you like to do?</Chat.Message>
      </Chat.Messages>
      <Chat.QuickActions>
        <Button size="sm" variant="secondary">Low stock</Button>
        <Button size="sm" variant="secondary">Today&apos;s orders</Button>
        <Button size="sm" variant="secondary">Sales report</Button>
      </Chat.QuickActions>
      <Chat.Input placeholder="Message Leda…" />
    </Chat>
  ),
};

export const Interactive: Story = {
  name: 'Interactive (project-owned send)',
  render: function InteractiveExample() {
    const [messages, setMessages] = useState<{ id: number; role: 'user' | 'assistant'; text: string }[]>([
      { id: 0, role: 'assistant', text: 'Ask me anything about your inventory.' },
    ]);
    const [draft, setDraft] = useState('');
    const send = (text: string) => {
      const id = messages.length;
      setMessages((prev) => [
        ...prev,
        { id, role: 'user', text },
        { id: id + 1, role: 'assistant', text: `You said: “${text}”. (The project wires the real reply.)` },
      ]);
      setDraft('');
    };
    return (
      <Chat size="md">
        <Chat.Header title="Leda" subtitle="Demo" />
        <Chat.Messages>
          {messages.map((m) => (
            <Chat.Message key={m.id} role={m.role}>
              {m.text}
            </Chat.Message>
          ))}
        </Chat.Messages>
        <Chat.Input
          placeholder="Message Leda…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onSubmit={send}
        />
      </Chat>
    );
  },
};
