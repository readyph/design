import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DashboardShell } from './DashboardShell';
import { ConnectionsOverview } from './ConnectionsOverview';
import { PlatformDetailModal } from './PlatformDetail';
import { OVERVIEWS, type DetailState, type PlatformOverview } from './platformDetail.data';

/**
 * RDY-215 (epic RDY-212): live platform detail modal on the RDY-213 shell. Click any node in the
 * connections diagram or a platform tile in the rail to open it. Flat: key numbers are one divided
 * row, lists are divided rows, no cards. Centred over the content area beside the fixed Leda column;
 * full-screen sheet on phones.
 *
 * Leda entry points: "Ask Leda about this platform" (closes the modal, opens the Leda column with
 * the question drafted and the platform as silent context), Leda's rows in Recent activity.
 */
interface DemoProps {
  /** Overview to open on mount (OVERVIEWS key); omit to start on Home and click a node. */
  initialId?: string;
  /** Force a data state (loading, restricted); default follows platform health. */
  state?: DetailState;
  ledaOpen?: boolean;
}

/** aria-label prefixes of map nodes and rail tiles -> overview id. */
const OPENERS: [string, string][] = [
  ['Makati branch', 'st-makati'],
  ['BGC branch', 'st-bgc'],
  ['Cebu branch', 'st-cebu'],
  ['Central stock', 'inv-central'],
  ['Davao stock', 'inv-davao'],
  ['Inventory', 'inventory'],
  ['Repair shop', 'sms'],
];

/** Write into the Leda composer the way a LedaSidePanel `prefill` API would (kit gap). */
function prefillLeda(text: string) {
  const el = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message Leda"]');
  if (!el) return;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(el, text);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.focus();
}

function Demo({ initialId, state, ledaOpen = true }: DemoProps) {
  const [overview, setOverview] = useState<PlatformOverview | null>(initialId ? OVERVIEWS[initialId] : null);
  const [open, setOpen] = useState(Boolean(initialId));
  const [docked, setDocked] = useState(ledaOpen);
  const [drawer, setDrawer] = useState(false);
  const [shellKey, setShellKey] = useState(0);
  const draft = useRef<string | null>(null);

  // Opening: capture clicks on the existing shell/map buttons instead of editing shared files.
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    const label = (e.target as HTMLElement).closest('button[aria-label]')?.getAttribute('aria-label') ?? '';
    const hit = OPENERS.find(([name]) => label.startsWith(`${name},`));
    if (!hit) return;
    setDocked(Boolean(document.querySelector('aside[aria-label="Leda panel"]')));
    setOverview(OVERVIEWS[hit[1]]);
    setOpen(true);
  };

  const askLeda = (o: PlatformOverview) => {
    setOpen(false);
    draft.current = `What needs my attention on ${o.label} today?`;
    if (window.matchMedia?.('(min-width: 1024px)').matches) setDocked(true);
    else setDrawer(true);
    setShellKey((k) => k + 1);
  };

  useEffect(() => {
    if (!draft.current) return;
    const text = draft.current;
    draft.current = null;
    // After the dialog's close animation returns focus, so the composer keeps it.
    const t = window.setTimeout(() => prefillLeda(text), 220);
    return () => window.clearTimeout(t);
  }, [shellKey]);

  return (
    <div className="contents" onClickCapture={onClickCapture}>
      <DashboardShell key={shellKey} active="home" ledaOpen={docked} ledaDrawerOpen={drawer}>
        <ConnectionsOverview />
      </DashboardShell>
      <PlatformDetailModal overview={overview} open={open} onOpenChange={setOpen} state={state} ledaDocked={docked} onAskLeda={askLeda} />
    </div>
  );
}

const viewports = {
  desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' } },
  laptop1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' } },
  phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } },
};

const meta: Meta<DemoProps> = {
  title: 'Prototypes/Portal/[For Review] PlatformDetail',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'desktop1440' } },
  args: { initialId: 'inv-central', ledaOpen: true },
  argTypes: {
    initialId: { control: 'select', options: [undefined, ...Object.keys(OVERVIEWS)] },
    state: { control: 'select', options: [undefined, 'ready', 'loading', 'degraded', 'offline', 'restricted'] },
  },
  render: (args) => <Demo key={JSON.stringify(args)} {...args} />,
};
export default meta;
type Story = StoryObj<DemoProps>;

const at = (vp: keyof typeof viewports, theme: 'light' | 'dark') => ({
  parameters: { viewport: { viewports, defaultViewport: vp } },
  globals: { theme },
});

/** Clicks the modal's Leda action (portalled, so search the document). */
const askLeda: Story['play'] = async () => {
  await new Promise((r) => setTimeout(r, 300));
  const btn = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.includes('Ask Leda about this platform'));
  btn?.click();
};

// Desktop 1440
export const Home: Story = { name: '1440 · Home, click a platform', args: { initialId: undefined }, ...at('desktop1440', 'dark') };
export const Inventory: Story = { name: '1440 · Inventory, live', ...at('desktop1440', 'dark') };
export const InventoryLight: Story = { name: '1440 · Inventory, light', ...at('desktop1440', 'light') };
export const SmsBranch: Story = { name: '1440 · SMS branch, live', args: { initialId: 'st-makati' }, ...at('desktop1440', 'dark') };
export const SmsBranchLight: Story = { name: '1440 · SMS branch, light', args: { initialId: 'st-makati' }, ...at('desktop1440', 'light') };
export const Loading: Story = { name: '1440 · Loading', args: { state: 'loading' }, ...at('desktop1440', 'dark') };
export const Degraded: Story = { name: '1440 · Degraded (provider failed)', args: { initialId: 'inv-davao' }, ...at('desktop1440', 'dark') };
export const Offline: Story = { name: '1440 · Offline', args: { initialId: 'st-cebu' }, ...at('desktop1440', 'light') };
export const Restricted: Story = { name: '1440 · Permission-limited', args: { state: 'restricted' }, ...at('desktop1440', 'dark') };
export const EmptyLists: Story = { name: '1440 · Empty lists', args: { initialId: 'st-bgc' }, ...at('desktop1440', 'light') };
export const LedaCollapsed: Story = { name: '1440 · Leda collapsed', args: { ledaOpen: false }, ...at('desktop1440', 'dark') };
export const AskLeda: Story = { name: '1440 · Ask Leda (prefilled)', play: askLeda, ...at('desktop1440', 'dark') };

// Laptop 1024 (content area 584px beside the 24rem Leda column)
export const Laptop: Story = { name: '1024 · SMS, Leda open', args: { initialId: 'sms' }, ...at('laptop1024', 'dark') };
export const LaptopLight: Story = { name: '1024 · Inventory, light', ...at('laptop1024', 'light') };

// Phone 390 (full-screen sheet)
export const Phone: Story = { name: '390 · Sheet', ...at('phone390', 'dark') };
export const PhoneDegraded: Story = { name: '390 · Degraded, light', args: { initialId: 'inv-davao' }, ...at('phone390', 'light') };
export const PhoneRestricted: Story = { name: '390 · Permission-limited', args: { state: 'restricted' }, ...at('phone390', 'dark') };
export const PhoneAskLeda: Story = { name: '390 · Ask Leda (drawer)', play: askLeda, ...at('phone390', 'dark') };
