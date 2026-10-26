import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PlatformShell } from '../components/PlatformShell';
import { SheetBar } from '../components/SheetBar';
import { Tabs } from '../components/Tabs';
import { TownMap } from '../components/TownMap';
import { three, threeLinks } from '../components/TownMap.data';
import { Live } from '../components/BlockedQuestions.demo';
import { Toaster } from '../components/toast/Toaster';

/** RDY-289. Prototype only: stories are not exported from the package. The platform's Leda & Memory tab in the real PlatformShell. The Memory tab is in [For Review] Memory (RDY-259). */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Blocked questions',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function Tried({ on }: { on: string | null }) {
  return on ? (
    <p role="status" className="mt-3 text-ui text-muted [overflow-wrap:anywhere]">
      Try it (C30, not built yet) would open on: {on}
    </p>
  ) : null;
}

const platformTabs = [
  { value: 'info', label: 'General info' },
  { value: 'leda', label: 'Leda & Memory' },
  { value: 'connections', label: 'Connections' },
];

function PlatformTab() {
  const [tried, setTried] = useState<string | null>(null);
  return (
    <PlatformShell
      detail
      placeLabel="Platforms"
      place={<TownMap platforms={three} links={threeLinks} caption="3 platforms + HQ" />}
      sheetLabel="Auto Works Quezon City"
      sheetBar={
        <SheetBar>
          <Tabs variant="fixed" aria-label="Auto Works Quezon City" items={platformTabs} defaultValue="leda" />
        </SheetBar>
      }
    >
      <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6">
        <h1 className="text-header">Auto Works Quezon City</h1>
        <h2 className="mt-6 text-ui font-semibold">Blocked questions</h2>
        <div className="mt-2">
          <Live scope="autoworks" onTry={(i) => setTried(i.question)} inheritedLink={<a className="text-accent underline" href="#memory">in Memory</a>} />
        </div>
        <Tried on={tried} />
      </div>
      <Toaster />
    </PlatformShell>
  );
}

export const PlatformLedaMemoryTab: Story = { name: 'Platform: Leda & Memory tab', render: () => <PlatformTab /> };
export const PlatformPhone: Story = { name: 'Platform tab on a phone (375)', parameters: { viewport: { defaultViewport: 'mobile1' } }, render: () => <PlatformTab /> };

