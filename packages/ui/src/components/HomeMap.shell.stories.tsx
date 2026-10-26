import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PlatformShell } from './PlatformShell';
import { TownMap } from './TownMap';
import { eight, eightLinks, three, threeLinks } from './TownMap.data';

/** [For Review] RDY-276 (C16). Prototype only: not exported from the package. The map at the top of Home's place column, real PlatformShell. */
const meta: Meta = {
  title: 'Components/Data display/Platform map in the Home shell',
  parameters: { layout: 'fullscreen' },
};
export default meta;

function Home({ many }: { many?: boolean }) {
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  return (
    <PlatformShell
      heading="Platforms"
      placeLabel="Platforms"
      place={
        <TownMap
          platforms={many ? eight : three}
          links={many ? eightLinks : threeLinks}
          caption={many ? '8 platforms + HQ' : '3 platforms + HQ'}
          selected={sel}
          highlight={hover ? [hover] : null}
          onSelect={setSel}
          onHover={setHover}
        />
      }
    >
      <div className="p-6 text-body text-muted">{sel ? `Filtered to ${sel}` : 'Home sheet'}</div>
    </PlatformShell>
  );
}
export const ThreePlatforms: StoryObj = { render: () => <Home /> };
export const EightPlatforms: StoryObj = { render: () => <Home many /> };
