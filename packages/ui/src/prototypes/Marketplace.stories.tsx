import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Marketplace } from '../components/Marketplace';
import { sampleCatalog } from '../components/Marketplace.sample';
import { Button } from '../components/Button';
import { LedaNote } from '../components/LedaNote';

/** [For Review] RDY-280. Prototype only: stories are not exported from the package. */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Marketplace',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function Page({ leda = false }: { leda?: boolean }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  return (
    <main className="min-h-screen bg-surface p-pad text-text">
      <h1 className="text-title">Platforms</h1>
      <p className="mt-2 text-body text-muted">Add another platform from the catalog; you set it up right after.</p>
      <Button className="mt-4" variant="secondary" onClick={() => setOpen(true)}>Add another platform · 7 kinds</Button>
      {done && <p role="status" className="mt-4 text-ui text-muted">Opening onboarding for {done}.</p>}
      <Marketplace
        open={open}
        onOpenChange={setOpen}
        items={sampleCatalog}
        defaultPicked={leda ? 'pos' : null}
        ledaNote={
          leda ? (
            <LedaNote>
              Picked from “Add a POS for the parts counter”. Nothing is added until you press Install and name it.
            </LedaNote>
          ) : undefined
        }
        onInstall={(item) => {
          setDone(item.name);
          setOpen(false);
        }}
      />
    </main>
  );
}

export const FromAddPlatform: Story = { name: 'Entry: Add another platform', render: () => <Page /> };
export const FromLeda: Story = { name: 'Entry: Leda prefilled (POS)', render: () => <Page leda /> };
