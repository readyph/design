import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../../components/Card';
import { StatusDot } from '../../components/StatusDot';
import { Switch } from '../../components/Switch';
import { TownScene, type TownBuilding, type TownLink, type TownRenderStats } from './TownScene';
import { defaultLights } from './layout';
import { MIXED, MIXED_LINKS, SINGLE, TWENTY, TWENTY_LINKS } from './town-data';

/**
 * PROTOTYPE (RDY-224) - Lab platform map, town scene and building art (Zdog).
 * Story-only: `zdog` is a devDependency and `src/prototypes` is not exported
 * from the package entry, so none of this ships in `@readyph/ui`.
 *
 * The frame here is a review harness only (page chrome is RDY-225): click a
 * building to toggle its lights, use the switch for all lights, hover or Tab to
 * a building to see what the page bubble will receive.
 */
const meta: Meta = {
  title: 'Prototypes/Portal/Lab Platform Map/[For Review] Town Scene',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<HarnessProps>;

interface HarnessProps {
  buildings: TownBuilding[];
  links: TownLink[];
  allOff?: boolean;
  showStats?: boolean;
}

function Harness({ buildings, links, allOff, showStats }: HarnessProps) {
  const [lights, setLights] = useState<Record<string, boolean>>(() =>
    allOff ? Object.fromEntries(buildings.map((b) => [b.id, false])) : defaultLights(buildings),
  );
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const [stats, setStats] = useState<TownRenderStats | null>(null);
  const byId = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);
  const allOn = buildings.every((b) => lights[b.id]);
  const h = hovered ? byId.get(hovered.id) : undefined;

  return (
    <div className="ds-root min-h-screen bg-surface-canvas p-4 font-sans text-ink sm:p-6">
      <Card padding="none" className="mx-auto flex max-w-5xl flex-col overflow-hidden">
        <TownScene
          buildings={buildings}
          links={links}
          lights={lights}
          onHover={(id, p) => setHovered(id && p ? { id, ...p } : null)}
          onSelect={(id) => setLights((l) => ({ ...l, [id]: !l[id] }))}
          onRenderStats={showStats ? setStats : undefined}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
            <StatusDot status="active" pulse={false} label="Active" />
            <StatusDot status="degraded" label="Degraded" />
            <StatusDot status="offline" label="Offline" />
          </div>
          <Switch
            label="All lights"
            checked={allOn}
            onCheckedChange={(on) => setLights(Object.fromEntries(buildings.map((b) => [b.id, on])))}
          />
        </div>
        <p className="min-h-10 border-t border-border bg-surface-subtle px-4 py-2.5 text-sm text-ink-muted" aria-live="polite">
          {h ? (
            <>
              <span className="font-semibold text-ink">{h.label}</span> · {h.kind} · {h.status.toLowerCase()}
              {h.alerts > 0 ? ` · ${h.alerts} alert${h.alerts === 1 ? '' : 's'}` : ''} · lights {lights[h.id] ? 'on' : 'off'} · onHover point {Math.round(hovered!.x)}, {Math.round(hovered!.y)}
            </>
          ) : (
            'Hover or Tab to a building. Click it to toggle its lights.'
          )}
          {showStats && stats ? ` · build ${stats.buildMs.toFixed(1)} ms, draw ${stats.drawMs.toFixed(1)} ms, ${stats.items} items` : ''}
        </p>
      </Card>
    </div>
  );
}

const render: Story['render'] = (args) => <Harness {...args} />;

export const MixedTenant: Story = {
  name: 'Mixed tenant',
  args: { buildings: MIXED, links: MIXED_LINKS },
  render,
};

export const SinglePlatform: Story = {
  name: 'Single platform',
  args: { buildings: SINGLE, links: [] },
  render,
};

export const TwentyBuildings: Story = {
  name: '20 buildings (layout + perf)',
  args: { buildings: TWENTY, links: TWENTY_LINKS, showStats: true },
  render,
};

export const AllLightsOff: Story = {
  name: 'All lights off',
  args: { buildings: MIXED, links: MIXED_LINKS, allOff: true },
  render,
};

export const LightTheme: Story = {
  name: 'Light theme',
  args: { buildings: MIXED, links: MIXED_LINKS },
  globals: { theme: 'light' },
  render,
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  args: { buildings: MIXED, links: MIXED_LINKS },
  globals: { theme: 'dark' },
  render,
};

export const Phone: Story = {
  name: 'Phone (390)',
  args: { buildings: MIXED, links: MIXED_LINKS },
  parameters: {
    viewport: {
      viewports: { rs390: { name: 'Mobile 390', styles: { width: '390px', height: '844px' } } },
      defaultViewport: 'rs390',
    },
  },
  render,
};
