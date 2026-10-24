import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusDot } from '../../components/StatusDot';
import { Switch } from '../../components/Switch';
import { TownScene, connectionsFor, defaultLights, type TownBuilding, type TownLink, type TownRenderStats } from './TownScene';
import { MIXED, MIXED_LINKS, SINGLE, THREE, THREE_LINKS, TWENTY, TWENTY_LINKS } from './town/sample-data';

/**
 * PROTOTYPE (RDY-224) - Lab platform map, town scene (SVG, isometric, flat clay look).
 * Story-only: `src/prototypes` is not exported from the package entry, so none of this ships in `@readyph/ui`.
 *
 * The frame here is a review harness only (page chrome is RDY-225): click a building or its label to toggle
 * its lights, drag the scene or use the rotate buttons, hover or Tab to a building to see what the page
 * bubble will receive. Theme follows the Storybook toolbar.
 */
const meta: Meta = {
  title: 'Prototypes/Portal/Lab Platform Map/Town Scene',
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
  /** Start rotation in quarter turns (90 degrees each). */
  quarterTurns?: number;
  mode?: 'roads' | 'power';
}

function Harness({ buildings, links, allOff, showStats, quarterTurns = 0, mode }: HarnessProps) {
  const [lights, setLights] = useState<Record<string, boolean>>(() =>
    allOff ? Object.fromEntries(buildings.map((b) => [b.id, false])) : defaultLights(buildings),
  );
  const [rotation, setRotation] = useState((quarterTurns * Math.PI) / 2);
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hilite, setHilite] = useState<string | null>(null);
  const [stats, setStats] = useState<TownRenderStats | null>(null);
  const byId = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);
  const conns = useMemo(() => connectionsFor(links, new Set(buildings.map((b) => b.id))), [links, buildings]);
  const allOn = buildings.every((b) => lights[b.id]);
  const h = hovered ? byId.get(hovered.id) : undefined;
  const snap = (d: number) => setRotation((r) => Math.round(r / (Math.PI / 2) + d) * (Math.PI / 2));

  return (
    <div className="ds-root min-h-screen bg-surface-canvas p-4 font-sans text-ink sm:p-6">
      <Card padding="none" className="mx-auto flex max-w-6xl flex-col overflow-hidden">
        <div className="h-[min(78vh,760px)] min-h-[320px]">
          <TownScene
            buildings={buildings}
            links={links}
            lights={lights}
            rotation={rotation}
            onRotationChange={setRotation}
            highlightLink={hilite}
            mode={mode}
            onHover={(id, p) => setHovered(id && p ? { id, ...p } : null)}
            onSelect={(id) => setLights((l) => ({ ...l, [id]: !l[id] }))}
            onRenderStats={showStats ? setStats : undefined}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
            <StatusDot status="active" pulse={false} label="Active" />
            <StatusDot status="degraded" label="Degraded" />
            <StatusDot status="offline" label="Offline" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" leftIcon={ArrowCounterClockwise} onClick={() => snap(-1)}>Rotate left</Button>
            <Button variant="secondary" size="sm" leftIcon={ArrowClockwise} onClick={() => snap(1)}>Rotate right</Button>
            <Switch
              checked={allOn}
              onCheckedChange={(on) => setLights(Object.fromEntries(buildings.map((b) => [b.id, on])))}
              label="All lights"
            />
          </div>
        </div>
        {conns.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-xs text-ink-muted">
            {conns.map((c) => (
              <li key={c.id} onMouseEnter={() => setHilite(c.id)} onMouseLeave={() => setHilite(null)} className="inline-flex items-center gap-2">
                <svg aria-hidden className="h-1.5 w-4" viewBox="0 0 16 6"><rect width="16" height="6" rx="3" fill={c.color} /></svg>
                {byId.get(c.from)?.label} {'↔'} {byId.get(c.to)?.label}
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-border bg-surface-subtle px-4 py-2 text-sm text-ink-muted" aria-live="polite">
          {h ? (
            <>
              <span className="font-semibold text-ink">{h.label}</span> · {h.kind} · {h.status.toLowerCase()} · {h.alerts} alert{h.alerts === 1 ? '' : 's'} · lights {lights[h.id] ? 'on' : 'off'} · onHover point {Math.round(hovered!.x)}, {Math.round(hovered!.y)}
            </>
          ) : (
            'Hover or Tab to a building. Click it to toggle its lights. Drag to rotate.'
          )}
          {stats && ` · build ${stats.buildMs.toFixed(1)} ms, draw ${stats.drawMs.toFixed(1)} ms, ${stats.items} objects`}
        </p>
      </Card>
    </div>
  );
}

const render: Story['render'] = (args) => <Harness {...args} />;

export const MixedTenant: Story = { name: 'Mixed tenant (5)', args: { buildings: MIXED, links: MIXED_LINKS }, render };
export const ThreePlatforms: Story = { name: 'Three platforms', args: { buildings: THREE, links: THREE_LINKS }, render };
export const SinglePlatform: Story = { name: 'Single platform', args: { buildings: SINGLE, links: [] }, render };
export const TwentyBuildings: Story = { name: '20 buildings (layout + perf)', args: { buildings: TWENTY, links: TWENTY_LINKS, showStats: true }, render };
export const AllLightsOff: Story = { name: 'All lights off', args: { buildings: MIXED, links: MIXED_LINKS, allOff: true }, render };
export const Rotated90: Story = { name: 'Rotated 90 degrees', args: { buildings: MIXED, links: MIXED_LINKS, quarterTurns: 1 }, render };
export const PowerMode: Story = { name: 'Power poles mode', args: { buildings: THREE, links: THREE_LINKS, mode: 'power' }, render };
export const LightTheme: Story = { name: 'Light theme', args: { buildings: MIXED, links: MIXED_LINKS }, globals: { theme: 'light' }, render };
export const DarkTheme: Story = { name: 'Dark theme', args: { buildings: MIXED, links: MIXED_LINKS }, globals: { theme: 'dark' }, render };
export const Phone: Story = {
  name: 'Phone (390)',
  args: { buildings: MIXED, links: MIXED_LINKS },
  parameters: { viewport: { viewports: { rs390: { name: 'Mobile 390', styles: { width: '390px', height: '844px' } } }, defaultViewport: 'rs390' } },
  render,
};
