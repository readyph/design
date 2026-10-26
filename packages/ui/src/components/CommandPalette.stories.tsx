import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { ChatCircleText, Gear, House, Package, Plus, Users } from '@phosphor-icons/react';
import { CommandPalette, type CommandPaletteGroup, type CommandPaletteProps } from './CommandPalette';
import { PlatformLogo } from './PlatformLogo';
import { Button } from './Button';

const groups: CommandPaletteGroup[] = [
  {
    id: 'ask',
    label: 'Ask Leda',
    items: [
      { id: 'a1', label: 'What needs my attention today?', leda: true },
      { id: 'a2', label: 'Which items are running low?', leda: true },
    ],
  },
  {
    id: 'do',
    label: 'Tell Leda to do',
    items: [
      { id: 'd1', label: 'Raise the oil filter reorder level to 30', icon: Plus, meta: 'Draft' },
      { id: 'd2', label: 'Delete all supplier records', refused: true, meta: 'Not allowed' },
    ],
  },
  {
    id: 'platforms',
    label: 'Platforms',
    items: [
      { id: 'p1', label: 'Stockroom', leading: <PlatformLogo name="Stockroom" size={16} decorative />, meta: 'Platform' },
      { id: 'p2', label: 'Marikina Branch', leading: <PlatformLogo name="Marikina Branch" size={16} decorative />, meta: 'Platform' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [{ id: 'u1', label: 'Noel Cruz', icon: Users, meta: 'Owner' }],
  },
  {
    id: 'go',
    label: 'Go to',
    items: [
      { id: 'g1', label: 'Home', icon: House, meta: 'Go' },
      { id: 'g2', label: 'Platforms', icon: Package, meta: 'Go' },
      { id: 'g3', label: 'Settings', icon: Gear, keywords: ['system'], meta: 'Go' },
      { id: 'g4', label: 'Leda memory', icon: ChatCircleText, meta: 'Go' },
    ],
  },
];

/** Page content behind the scrim so the translucent panel is judged over real, varied backdrops. */
function Backdrop() {
  return (
    <div className="grid gap-3 bg-frame p-6" aria-hidden>
      <div className="h-24 rounded-card bg-accent" />
      <div className="h-24 rounded-card bg-surface" />
      <div className="h-24 rounded-card bg-raised-2" />
    </div>
  );
}

function Harness(props: Partial<CommandPaletteProps>) {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState('');
  return (
    <div className="min-h-[640px]">
      <div className="p-4">
        <Button onClick={() => setOpen(true)}>Open palette</Button>
        <p className="mt-2 text-small text-muted">{last ? `Ran: ${last}` : 'Nothing run yet'}</p>
      </div>
      <Backdrop />
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        onSelect={(i) => setLast(i.label)}
        onAsk={(q) => setLast(`Ask Leda: ${q}`)}
        onOpenConversation={() => setLast('conversation')}
        {...props}
      />
    </div>
  );
}

const meta: Meta<typeof CommandPalette> = {
  title: 'Components/Overlays/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Command palette (C7, NEW; not the reverted RDY-176/199 one). Scrim, a 640px `--overlay` panel 72px from the top with a 20px blur, a 48px input row with Leda\'s mark, and a list of at most 460px / 60vh with group headers. The selected row is `--accent-tint`. Phone: full screen, 44px rows.',
          '',
          '**Who owns the shortcut:** `AskLedaBar` (one per page) owns Cmd/Ctrl+K and "/" and ignores "/" while typing in a field. The palette registers no global keys. The page wires them together:',
          '',
          '```tsx',
          'const [open, setOpen] = useState(false);',
          '// Cmd/Ctrl+K TOGGLES; click and "/" only open. The bar keeps firing its keys while `paused`, so it can close the palette.',
          '<AskLedaBar onOpen={(src) => setOpen((o) => (src === \'shortcut\' ? !o : true))} paused={open} />',
          '<CommandPalette open={open} onOpenChange={setOpen} groups={groups} onSelect={run} onAsk={askLeda}',
          '  conversationMessages={thread.length} onOpenConversation={openPanel} />',
          '```',
          '',
          '- `groups`: `{ id, label, items: { id, label, icon | leading | leda | refused, meta, keywords, disabled, keepOpen }[] }[]`. The palette filters them by the typed text (every word in label, keywords or meta); `filter={false}` shows them as given.',
          '- With text and `onAsk`, a first "Ask" group offers `Ask Leda: "text"` (Enter). With no text and `conversationMessages > 0`, a "Leda" group offers "Open your conversation with Leda (N messages)".',
          '- `onSelect(item, group)` runs after the palette asks to close. `query` / `onQueryChange` control the text (uncontrolled text resets on open).',
          '- Keys: arrows move (wrapping), Enter runs (ignored during IME composition), Esc closes (one press, text and all), Tab stays in the dialog. Focus returns to the opener (or `returnFocusRef`).',
          '- **One bar per page keeps `shortcuts` on.** Home has two bars (the 320px sheet bar and the overview bar): give one `shortcuts={false}`, otherwise both listeners fire and cancel each other out (open then close). See the "Wiring (Cmd+K toggles)" story.',
          '- Pass `paused` to `AskLedaBar` while open so the halo and Scan stop. Leda\'s Aurora plays in the input row only while `loading`.',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof CommandPalette>;

export const Empty: Story = { name: 'Empty text', render: () => <Harness /> };
export const WithConversation: Story = { name: 'Empty text, open thread', render: () => <Harness conversationMessages={6} /> };
export const Typing: Story = { name: 'With text (Ask row first)', render: () => <Harness defaultQuery="stock" /> };
export const PageObjectMatch: Story = { name: 'Type-ahead by keyword ("system")', render: () => <Harness defaultQuery="system" /> };
export const NoMatch: Story = { name: 'No match, no Ask row', render: () => <Harness defaultQuery="zzzz" onAsk={undefined} /> };
export const Loading: Story = { name: 'Loading (Aurora)', render: () => <Harness defaultQuery="supplier" loading filter={false} groups={[]} /> };
export const Phone: Story = {
  name: 'Phone (full screen)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <Harness conversationMessages={2} />,
};

/** Stand-in for the page's single shortcut owner (`AskLedaBar` with `shortcuts` on). Cmd/Ctrl+K toggles, "/" opens. */
function Wired() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <main className="min-h-[640px] p-4">
      <h1 className="sr-only">Command palette wiring</h1>
      <p className="text-small text-muted">Press Cmd/Ctrl+K: it opens the palette, and pressing it again closes it. Only one listener is mounted per page.</p>
      <Backdrop />
      <CommandPalette open={open} onOpenChange={setOpen} groups={groups} onSelect={() => {}} onAsk={() => {}} />
    </main>
  );
}
export const Wiring: Story = { name: 'Wiring (Cmd+K toggles)', render: () => <Wired /> };
