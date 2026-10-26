import type { Meta, StoryObj } from '@storybook/react';
import { PlatformShell } from '../components/PlatformShell';
import { OverviewCharts } from '../components/OverviewCharts';
import { autoWorks, cafe, hardware, stockroom } from '../components/OverviewCharts.data';
import { Fact, FactsLine } from '../components/FactsLine';

/** RDY-291 (C31). Prototype only: stories are not exported from the package. The charts in the real PlatformShell sheet. */
const meta: Meta = {
  title: 'Prototypes/Portal/Overview charts',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const facts = <FactsLine aria-label="Key numbers"><Fact value={34}>jobs</Fact><Fact value={2} tone="bad">late</Fact></FactsLine>;
const sheet = (n: 2 | 3 | 4) => (
  <PlatformShell heading="Overview" detail place={<div className="p-3 text-ui text-muted">Map</div>} placeLabel="Platforms">
    <div className="p-pad">
      <h2 className="m-0 mb-4 text-header text-text">Last 7 days</h2>
      <OverviewCharts locale="en-PH" platforms={[{ ...autoWorks, facts }, stockroom, cafe, hardware].slice(0, n)} />
    </div>
  </PlatformShell>
);
export const ThreePlatforms: StoryObj = { render: () => sheet(3) };
export const TwoPlatforms: StoryObj = { render: () => sheet(2) };
export const FourPlatforms: StoryObj = { render: () => sheet(4) };
