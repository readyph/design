import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { PlatformShell } from '../components/PlatformShell';
import { SheetBar } from '../components/SheetBar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SubpageLane, SubpageTransition, type SubpageDirection } from '../components/SubpageTransition';

/**
 * [For Review] RDY-275 (C15). Prototype only: not exported from the package.
 * Platforms list to a platform page inside PlatformShell. The place column slides from the left, the sheet from the right.
 * The rail, the map stand-in and the status bar never move. Try the Back button, the browser Back/Forward, Esc, and clicking quickly.
 */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Subpage transition',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const platforms = [
  { id: 'cebu', name: 'Cebu Parts Stockroom', kind: 'Inventory', note: 'Offline since Wed 18:05' },
  { id: 'cafe', name: 'Café POS', kind: 'POS', note: 'Slow since 7:40' },
  { id: 'main', name: 'Main Stockroom', kind: 'Inventory', note: 'Running' },
  { id: 'cubao', name: 'Cubao Repair Shop', kind: 'Repair shop', note: 'Setup needed' },
];
const filler = Array.from({ length: 30 }, (_, i) => i + 1);

function Demo() {
  const [view, setView] = useState('list');
  const [dir, setDir] = useState<SubpageDirection>('in');
  const [exits, setExits] = useState(0);
  const depth = useRef(0);

  const go = (next: string) => {
    setDir(next === 'list' ? 'out' : 'in');
    setView(next);
  };
  const open = (id: string) => {
    depth.current += 1;
    window.history.pushState({ rph: depth.current, view: id }, '');
    go(id);
  };
  const back = () => window.history.back();

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = e.state as { rph?: number; view?: string } | null;
      depth.current = s?.rph ?? 0;
      go(s?.view ?? 'list');
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && depth.current > 0) back();
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const p = platforms.find((x) => x.id === view);
  return (
    <SubpageTransition paneKey={view} direction={dir} onExited={() => setExits((n) => n + 1)}>
    <PlatformShell
      detail={view !== 'list'}
      rail={<div data-testid="rail" className="grid h-full place-items-center px-3 text-small text-muted">Rail</div>}
      place={
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div data-testid="map" className="grid h-40 shrink-0 place-items-center rounded-card bg-raised text-muted">Map stand-in (outside every lane)</div>
          <div className="min-h-0 flex-1">
            <SubpageLane from="left" focus={false} aria-label="Place column">
              {p ? (
                <div className="p-pad">
                  <h2 className="m-0 text-ui font-semibold">{p.name}</h2>
                  <p className="text-muted">{p.kind} · {p.note}</p>
                  {filler.slice(0, 10).map((n) => <p key={n} className="m-0 border-b border-rule py-row-y">Facts line {n}</p>)}
                </div>
              ) : (
                <div className="p-pad">
                  <h2 className="m-0 text-ui font-semibold">Platforms</h2>
                  {platforms.map((x) => <button key={x.id} id={`col-open-${x.id}`} type="button" onClick={() => open(x.id)} className="block w-full border-b border-rule py-row-y text-left text-ui hover:bg-raised">{x.name}</button>)}
                </div>
              )}
            </SubpageLane>
          </div>
        </div>
      }
      placeLabel="Platforms"
      sheetBar={
        <SheetBar>
          <div onClickCapture={(e) => { if ((e.target as HTMLElement).closest('a')) { e.preventDefault(); back(); } }}>
            <Breadcrumbs variant="sheet" items={p ? [{ label: 'All platforms', href: '#' }, { label: p.name }] : [{ label: 'All platforms' }]} />
          </div>
        </SheetBar>
      }
      status={<span data-testid="status">All running · {exits} transitions finished</span>}
      sheetLabel="Platforms"
    >
      <SubpageLane from="right" aria-label="Sheet">
        {p ? (
          <div className="p-pad">
            <h1 className="m-0 mb-3 text-ui font-semibold">{p.name}</h1>
            <button type="button" onClick={back} className="mb-3 rounded-control border border-border px-3 py-2 text-ui">Back to all platforms</button>
            {filler.map((n) => <p key={n} className="m-0 border-b border-rule py-row-y">{p.kind} detail row {n}</p>)}
          </div>
        ) : (
          <div className="p-pad">
            <h1 className="m-0 mb-3 text-ui font-semibold">All platforms</h1>
            {platforms.map((x) => (
              <button key={x.id} id={`open-${x.id}`} type="button" onClick={() => open(x.id)} className="flex w-full items-center justify-between border-b border-rule py-row-y text-left text-ui hover:bg-raised">
                <span>{x.name}</span>
                <span className="text-muted">{x.note}</span>
              </button>
            ))}
            {filler.map((n) => <p key={n} className="m-0 border-b border-rule py-row-y text-muted">Activity {n}</p>)}
          </div>
        )}
      </SubpageLane>
    </PlatformShell>
    </SubpageTransition>
  );
}

export const PlatformPages: Story = { render: () => <Demo /> };
