import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { PlatformShell } from '../components/PlatformShell';
import { Queue, type QueueDoneItem, type QueueItem, type QueueSnoozedItem } from '../components/Queue';
import { allPlatforms, done as doneSeed, items as itemSeed, snoozed as snoozedSeed, watching } from '../components/Queue.data';
import { PlatformLogo } from '../components/PlatformLogo';

/** [For Review] RDY-279 (C19). Prototype only: stories are not exported from the package. The Needs you queue in the portal place column (map above it is C16, not built yet). */
const meta: Meta = {
  title: 'Prototypes/Portal/Needs you',
  parameters: { layout: 'fullscreen' },
};
export default meta;

function Home({ phone = false }: { phone?: boolean }) {
  const [open, setOpen] = useState<QueueItem[]>(itemSeed);
  const [snz, setSnz] = useState<QueueSnoozedItem[]>(snoozedSeed);
  const [dn, setDn] = useState<QueueDoneItem[]>(doneSeed);
  const [filter, setFilter] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);
  const move = (id: string) => open.find((i) => i.id === id)!;
  const item = open.find((i) => i.id === shown);
  return (
    <div className={`flex bg-frame ${phone ? 'h-[844px] w-[390px] flex-col' : 'h-screen'}`}>
      <section aria-label="Place" className={`flex min-h-0 flex-col pb-0 pl-1 pr-3 pt-2 ${phone ? 'h-full w-full' : 'w-[420px] shrink-0'}`}>
        <div className="mb-3 shrink-0 rounded-card border border-dashed border-control px-3 py-6 text-center text-ui text-muted">Platform map (C16)</div>
        <Queue
          className="flex-1"
          items={open}
          watching={watching}
          snoozed={snz}
          done={dn}
          platforms={allPlatforms}
          filter={filter}
          onFilterChange={setFilter}
          onOpen={setShown}
          onAction={(id) => {
            const it = move(id);
            setOpen(open.filter((i) => i.id !== id));
            setDn([{ id: it.id, platform: it.platform, source: it.source, title: it.title, at: '9:20' }, ...dn]);
            if (shown === id) setShown(null);
          }}
          onSnooze={(id) => {
            const it = move(id);
            setOpen(open.filter((i) => i.id !== id));
            setSnz([...snz, { id: it.id, platform: it.platform, source: it.source, title: it.title, until: 'Later today · 13:00' }]);
            if (shown === id) setShown(null);
          }}
        />
      </section>
      {phone ? null : (
        <main className="min-w-0 flex-1 p-3 pl-0">
          <div className="h-full rounded-card bg-surface p-pad">
            {item ? (
              <>
                <Breadcrumbs items={[{ label: 'Needs you' }, { label: item.source ?? item.platform.name }]} />
                <h2 className="mt-3 flex items-center gap-2 text-header">
                  <PlatformLogo name={item.platform.name} index={item.platform.index} hq={item.platform.hq} decorative size={24} />
                  {item.title}
                </h2>
                <p className="mt-2 text-body text-muted">{item.detail}</p>
                <Button className="mt-4" onClick={() => setShown(null)}>{item.action}</Button>
              </>
            ) : (
              <EmptyState title="Pick something from Needs you" description="Press j / k to move, Enter to open, s to snooze." />
            )}
          </div>
        </main>
      )}
    </div>
  );
}

type Story = StoryObj;
export const Desktop: Story = { render: () => <Home /> };
export const Phone: Story = { render: () => <Home phone />, parameters: { viewport: { defaultViewport: 'mobile1' } } };

/** The queue in the real PlatformShell place slot (place width follows the viewport: 460 / 400 / 380 / 320; phone below 640). */
export const InShell: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="h-screen">
      <PlatformShell heading={null} placeLabel="Place" place={<Queue items={itemSeed} watching={watching} snoozed={snoozedSeed} done={doneSeed} platforms={allPlatforms} />}>
        <EmptyState title="Pick something from Needs you" description="Press j / k to move, Enter to open, s to snooze." />
      </PlatformShell>
    </div>
  ),
};
