import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TryIt } from '../components/TryIt';
import { defaultSwitches, sampleAbouts, sampleAsk, sampleQuestions } from '../components/TryIt.sample';
import { PlatformShell } from '../components/PlatformShell';
import { Button } from '../components/Button';
import { Switch } from '../components/Switch';

/** RDY-290 (C30). Prototype only: stories are not exported from the package. Try it in the real PlatformShell. */
const meta: Meta = {
  title: 'Prototypes/Portal/Try it',
  parameters: { layout: 'fullscreen' },
};
export default meta;

function Page({ fixed }: { fixed: boolean }) {
  const [open, setOpen] = useState(false);
  const [sw, setSw] = useState(defaultSwitches);
  return (
    <PlatformShell place={<div className="px-3 text-ui text-muted">Memory</div>} placeLabel="Memory" detail sheetLabel="Leda & Memory">
      <div className="mx-auto w-full max-w-[720px] px-4 py-6">
        <p className="text-body text-muted">Off means Leda can't answer any customer question that needs that topic.</p>
        <Button variant="secondary" className="mt-3" onClick={() => setOpen(true)}>Try it</Button>
        <ul className="mt-4 divide-y divide-rule">
          {(['prices', 'hours', 'stock', 'book'] as const).map((k) => (
            <li key={k} className="flex items-center justify-between gap-3 py-3 text-body">
              <span>{{ prices: 'Services and prices', hours: 'Opening hours', stock: 'Parts in stock', book: 'Take bookings' }[k]}</span>
              <Switch aria-label={k} checked={sw[k]} onCheckedChange={(v) => setSw({ ...sw, [k]: v })} />
            </li>
          ))}
        </ul>
        <TryIt
          open={open}
          onOpenChange={setOpen}
          abouts={sampleAbouts}
          about={fixed ? 'auto' : undefined}
          aboutFixed={fixed}
          questions={sampleQuestions}
          ask={(a, q) => sampleAsk(a, q, sw)}
        />
      </div>
    </PlatformShell>
  );
}

export const InMemory: StoryObj = { render: () => <Page fixed={false} /> };
export const OnPlatformPage: StoryObj = { render: () => <Page fixed /> };
