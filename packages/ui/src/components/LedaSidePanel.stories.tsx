import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Package } from '@phosphor-icons/react';
import { LedaSidePanel } from './LedaSidePanel';
import { Chat } from './Chat';
import { LedaWidget } from './LedaWidget';
import { Button } from './Button';

type Body = 'empty' | 'conversation' | 'confirm';

const SUGGESTIONS = ['How did Inventory do this week?', 'What needs my attention?', 'Invite a team member'];

function LedaBody({ body }: { body: Body }) {
  if (body === 'empty') {
    return (
      <>
        <div className="flex flex-1 flex-col justify-end gap-4 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-ink">Good morning, Maria</p>
            <p className="text-sm text-ink-muted">Ask about your platforms or tell me what to do. I can see the page you are on.</p>
          </div>
          <LedaWidget.Suggestions items={SUGGESTIONS} />
        </div>
        <Chat.Input placeholder="Ask Leda or tell it what to do…" aria-label="Message Leda" />
      </>
    );
  }
  return (
    <>
      <Chat.Messages aria-live="polite">
        <Chat.Message role="user">How did Inventory do this week?</Chat.Message>
        <div className="flex flex-col gap-2">
          <Chat.Message role="assistant">Sales are up and stock is healthy, except 3 items below reorder point.</Chat.Message>
          <LedaWidget title="Inventory this week" meta="Mon 19 to Sun 25 Oct" icon={Package}>
            <LedaWidget.StatGrid
              columns={2}
              items={[
                { label: 'Sales', value: '₱184K', delta: '+8%', deltaTone: 'success' },
                { label: 'Low stock', value: '3 items', delta: 'Mango boxes out', deltaTone: 'error' },
              ]}
            />
          </LedaWidget>
        </div>
        {body === 'confirm' && (
          <>
            <Chat.Message role="user">Reorder the mango boxes from San Miguel.</Chat.Message>
            <div className="flex flex-col gap-2">
              <Chat.Message role="assistant">Here is the purchase order. Nothing is created until you confirm.</Chat.Message>
              <LedaWidget.Proposal
                title="Create purchase order"
                intent="order"
                summary="Draft PO-1044 to San Miguel Foods."
                changes={[
                  { label: 'Mango boxes', value: '24 boxes', sign: 'in' },
                  { label: 'Estimated total', value: '₱8,640' },
                ]}
                confirmLabel="Create PO"
              />
            </div>
          </>
        )}
      </Chat.Messages>
      <Chat.Input placeholder="Ask Leda or tell it what to do…" aria-label="Message Leda" />
    </>
  );
}

interface HostProps {
  body: Body;
  open: boolean;
  persistKey?: string;
}

/** Stand-in for a Portal page: the size container beside the panel. */
function Host({ body, open: initial, persistKey }: HostProps) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="ds-root flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      <main className="min-w-0 flex-1 overflow-y-auto p-6 [container-type:inline-size]">
        <h1 className="text-lg font-semibold">Page content</h1>
        <p className="mt-1 text-sm text-ink-muted">The panel sits beside this area; lay pages out with container queries.</p>
        <div className="mt-4 grid gap-4 [@container(min-width:40rem)]:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4 text-sm">Card A</div>
          <div className="rounded-lg border border-border bg-surface p-4 text-sm">Card B</div>
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => setOpen(!open)}>
            {open ? 'Hide Leda' : 'Show Leda'}
          </Button>
        </div>
      </main>
      <LedaSidePanel open={open} onOpenChange={setOpen} context="Home" persistKey={persistKey}>
        <LedaBody body={body} />
      </LedaSidePanel>
    </div>
  );
}

const meta: Meta<typeof Host> = {
  title: 'Components/LedaSidePanel',
  component: Host,
  tags: ['autodocs'],
  argTypes: { body: { control: 'inline-radio', options: ['empty', 'conversation', 'confirm'] } },
  args: { body: 'empty', open: true },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'The Leda entry point on every Portal page. Controlled (`open` / `onOpenChange`), presentational; the project owns the chat in `children` and the page `context`.',
          '',
          '- **lg and up (>= 1024px):** open = docked inset card, width token `w-leda-panel` (22.5rem); closed = 40px edge tab "Open Leda".',
          '- **Below lg:** right drawer (full width under 640px, 24rem above); the composer is focused on open and Escape closes it. The breakpoint is decided by a JS media query so a hidden dialog never traps focus.',
          '- `persistKey="readyph.leda_panel"` remembers open/closed on desktop in localStorage (errors ignored).',
          '- Widgets inside the panel (`LedaWidget`, `Proposal`) share one hairline border.',
          '',
          '**Container queries.** Pages beside the panel should lay out against the measured content width, not the viewport. The preset ships `@tailwindcss/container-queries`: mark the content `@container` and use `@lg:grid-cols-2`, or use the arbitrary form `[@container(min-width:60rem)]:grid-cols-3` with `[container-type:inline-size]`.',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Host>;

const viewports = {
  w1440: { name: '1440', styles: { width: '1440px', height: '900px' } },
  w1024: { name: '1024', styles: { width: '1024px', height: '768px' } },
  w390: { name: '390', styles: { width: '390px', height: '844px' } },
};

export const Desktop1440Empty: Story = { parameters: { viewport: { viewports, defaultViewport: 'w1440' } } };
export const Desktop1440Conversation: Story = { args: { body: 'conversation' }, parameters: { viewport: { viewports, defaultViewport: 'w1440' } } };
export const Desktop1440Confirm: Story = { args: { body: 'confirm' }, parameters: { viewport: { viewports, defaultViewport: 'w1440' } } };
export const Desktop1024Open: Story = { args: { body: 'conversation' }, parameters: { viewport: { viewports, defaultViewport: 'w1024' } } };
export const Desktop1024Collapsed: Story = { args: { open: false }, parameters: { viewport: { viewports, defaultViewport: 'w1024' } } };
export const Drawer390Empty: Story = { args: { body: 'empty' }, parameters: { viewport: { viewports, defaultViewport: 'w390' } } };
export const Drawer390Conversation: Story = { args: { body: 'conversation' }, parameters: { viewport: { viewports, defaultViewport: 'w390' } } };
export const Drawer390Confirm: Story = { args: { body: 'confirm' }, parameters: { viewport: { viewports, defaultViewport: 'w390' } } };
