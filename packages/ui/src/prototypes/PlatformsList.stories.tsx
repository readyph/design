import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DotsThree, Plus } from '@phosphor-icons/react';
import { List, ListCell, ListHeader, ListHeaderCell, ListMetric, ListMetrics, ListRow } from '../components/List';
import { PlatformLogo } from '../components/PlatformLogo';
import { StatusDot, type StatusTone } from '../components/StatusDot';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { Menu } from '../components/Menu';

/** [For Review] RDY-278 (C18). Prototype only: stories are not exported from the package. Platforms sheet, All platforms list. */
const meta: Meta = {
  title: 'Prototypes/Portal/Platforms list',
  parameters: { layout: 'fullscreen' },
};
export default meta;

interface Row {
  id: string;
  name: string;
  kind: string;
  status: StatusTone;
  health: string;
  metrics: [string, string][];
  none?: string;
  reads?: string;
  action: string;
}
const rows: Row[] = [
  { id: 'cebu', name: 'Cebu Parts Stockroom', kind: 'Inventory · Cebu City', status: 'bad', health: 'Offline since Wed 18:05', metrics: [], none: 'No figures since Wed 18:05', reads: 'Shares Stock with Café POS', action: 'Open' },
  { id: 'cubao', name: 'Cubao Repair Shop', kind: 'Repair shop · Quezon City', status: 'neutral', health: 'Setup needed', metrics: [], none: 'No activity yet', action: 'Finish setup' },
  { id: 'cafe', name: 'Café POS', kind: 'POS · Makati', status: 'warn', health: 'Slow since 7:40', metrics: [['Orders today', '142'], ['Sales', '₱38,420'], ['Open tabs', '6']], reads: 'Reads Stock from Cebu Parts Stockroom, Stockroom', action: 'Open' },
  { id: 'new', name: 'Pasig Loyalty', kind: 'Loyalty · Pasig', status: 'accent', health: 'Setting up', metrics: [], none: 'No activity yet', action: 'No app yet' },
  { id: 'main', name: 'Main Stockroom', kind: 'Inventory · Manila', status: 'ok', health: 'Running', metrics: [['Items', '2,184'], ['Low stock', '12'], ['Moved today', '318']], reads: 'Shares Stock with 2 platforms', action: 'Open' },
];

function PlatformsTable() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [opened, setOpened] = useState('');
  return (
    <div className="p-pad">
      <p className="mb-2 text-ui text-muted" role="status">{opened ? `Opened ${opened}` : 'Click a row, or press j / k and Enter.'}</p>
      <List
        as="table"
        aria-label="All platforms"
        columns="minmax(0,300fr) minmax(0,168fr) minmax(0,244fr) 150px"
        cursorId={cursor}
        onCursorChange={setCursor}
      >
        <ListHeader>
          <ListHeaderCell>Platform</ListHeaderCell>
          <ListHeaderCell>Now</ListHeaderCell>
          <ListHeaderCell>Data links</ListHeaderCell>
          <ListHeaderCell><span className="sr-only">Actions</span></ListHeaderCell>
        </ListHeader>
        {rows.map((r, i) => (
          <ListRow key={r.id} rowId={r.id} label={r.name} onActivate={() => setOpened(r.name)}>
            <ListCell kind="lead" className="flex items-start gap-3">
              <PlatformLogo name={r.name} index={i + 1} size={32} decorative className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-body font-semibold">{r.name}</div>
                <div className="text-ui text-muted">{r.kind}</div>
                <StatusDot status={r.status} label={r.health} className="mt-2" />
              </div>
            </ListCell>
            <ListCell>
              {r.metrics.length ? (
                <ListMetrics aria-label={`${r.name} figures`}>
                  {r.metrics.map(([l, v]) => <ListMetric key={l} label={l} value={v} />)}
                </ListMetrics>
              ) : (
                <span className="text-ui text-muted">{r.none}</span>
              )}
            </ListCell>
            <ListCell className="text-ui">{r.reads ?? <span className="text-muted">No data links</span>}</ListCell>
            <ListCell kind="actions">
              {r.action === 'No app yet' ? (
                <span className="px-1.5 text-small text-muted">No app yet</span>
              ) : (
                <Button variant="secondary" onClick={() => setOpened(r.name)}>{r.action}</Button>
              )}
              <Menu
                trigger={<IconButton icon={DotsThree} label={`More for ${r.name}`} />}
                items={[{ label: 'Connect data' }, { label: 'Disconnect', danger: true }]}
              />
            </ListCell>
          </ListRow>
        ))}
        <ListRow rowId="add" label="Add another platform" onActivate={() => setOpened('Add another platform')}>
          <ListCell kind="lead" className="col-span-full">
            <Button variant="text" leftIcon={Plus} onClick={() => setOpened('Add another platform')}>Add another platform · 7 kinds</Button>
          </ListCell>
        </ListRow>
      </List>
    </div>
  );
}

export const Wide: StoryObj = { render: () => <div className="bg-surface text-text"><PlatformsTable /></div> };
export const Narrow520: StoryObj = {
  name: 'Narrow (520px sheet)',
  render: () => <div className="w-[520px] bg-surface text-text"><PlatformsTable /></div>,
};
