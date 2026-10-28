import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Badge } from './Badge';
import { Button } from './Button';
import { List, ListCell, ListHeaderCell, ListRow } from './List';
import { ListGroup, ListGroups } from './ListGroup';
import { PlatformLogo } from './PlatformLogo';
import { StatusDot } from './StatusDot';

const meta: Meta<typeof ListGroups> = {
  title: 'Components/Data display/List group',
  component: ListGroups,
  parameters: {
    docs: {
      description: {
        component:
          'Titled groups of List rows (RDY-304). Decision: several titled Lists inside one `ListGroups`, not title rows inside one List. Each group is `role="group"` named by its heading and holds a real list; the column header is written once; ONE j / k cursor runs across every group (skips titles and collapsed groups). Used by Team ("Waiting to join", "People", "Suspended"), the queue ("Leda is watching", "Snoozed", "Done today") and the connections editor ("Reads from", "Shares with").',
      },
    },
  },
  decorators: [(Story) => <div className="bg-surface p-pad text-text"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ListGroups>;

const people: Record<string, [string, string, string][]> = {
  wait: [['Marco Reyes', 'marco@autoworks.ph', 'Invite not sent'], ['Lia Santos', 'lia@autoworks.ph', 'Invite expired']],
  people: [['Ana Cruz (you)', 'ana@autoworks.ph', 'Owner'], ['Ben Lim', 'ben@autoworks.ph', 'Manager'], ['Chai Ong', 'chai@autoworks.ph', 'Staff']],
  susp: [['Dino Tan', 'dino@autoworks.ph', 'Suspended']],
};
const cols = 'minmax(0,1fr) 140px 88px';
const header = (
  <>
    <ListHeaderCell>Person</ListHeaderCell>
    <ListHeaderCell>Status</ListHeaderCell>
    <ListHeaderCell className="sr-only">Actions</ListHeaderCell>
  </>
);
const personRow = ([n, e, s]: [string, string, string], dimmed = false) => (
  <ListRow key={n} rowId={n} label={n} dimmed={dimmed} onActivate={() => {}}>
    <ListCell kind="lead">
      <div className="font-medium">{n}</div>
      <div className="text-ui text-muted">{e}</div>
    </ListCell>
    <ListCell kind="body" flush>{s}</ListCell>
    <ListCell kind="actions"><Button variant="secondary">Open</Button></ListCell>
  </ListRow>
);

export const Team: Story = {
  render: () => (
    <ListGroups as="table" columns={cols} header={header} aria-label="Team">
      <ListGroup title="Waiting to join" count={2}>{people.wait.map((p) => personRow(p))}</ListGroup>
      <ListGroup title="People" count={3} actions={<Button variant="text" leftIcon={Plus}>Invite</Button>}>{people.people.map((p) => personRow(p))}</ListGroup>
      <ListGroup title="Suspended" count={1} note="Can't sign in">{people.susp.map((p) => personRow(p, true))}</ListGroup>
    </ListGroups>
  ),
};

const queue = (id: string, t: string, d: string) => (
  <ListRow key={id} rowId={id} label={t} onActivate={() => {}}>
    <ListCell kind="lead"><div className="font-medium">{t}</div><div className="text-ui text-muted">{d}</div></ListCell>
  </ListRow>
);

export const QueueGroups: Story = {
  name: 'Collapsible and empty (queue)',
  render: () => (
    <ListGroups aria-label="Queue">
      <ListGroup title="Leda is watching" count={2} collapsible>
        {queue('w1', 'Vios 11:00 alternator', 'Waiting on supplier')}
        {queue('w2', 'PO-0221', 'Due Thursday')}
      </ListGroup>
      <ListGroup title="Snoozed" count={0} collapsible empty="Nothing snoozed." />
      <ListGroup title="Done today" count={1} collapsible defaultCollapsed>
        {queue('d1', 'VAR-0214', 'Approved 9:10')}
      </ListGroup>
    </ListGroups>
  ),
};

const link = (n: string, d: string, s: 'ok' | 'warn' | 'bad', l: string, i: number) => (
  <ListRow key={n + d} rowId={n + d} label={n}>
    <ListCell kind="lead" className="flex items-center gap-3"><PlatformLogo name={n} index={i} size={32} decorative /><span><span className="block font-medium">{n}</span><span className="block text-ui text-muted">{d}</span></span></ListCell>
    <ListCell flush><StatusDot status={s} label={l} /></ListCell>
    <ListCell kind="actions"><Button variant="text">Remove</Button></ListCell>
  </ListRow>
);

export const Connections: Story = {
  render: () => (
    <ListGroups columns="minmax(0,1fr) 220px 104px" aria-label="Connections">
      <ListGroup title="Reads from" count={2} level={2}>
        {link('Parts Stockroom', 'Stock · products and levels', 'ok', 'Linked', 1)}
        {link('Café POS', 'Customers', 'bad', 'Paused · Café POS is offline', 2)}
      </ListGroup>
      <ListGroup title="Shares with" count={1} level={2} actions={<Badge tone="neutral">Automatic</Badge>}>
        {link('Cubao', 'Catalog', 'warn', 'Slow', 3)}
      </ListGroup>
    </ListGroups>
  ),
};

export const LongTitlesNarrow: Story = {
  name: 'Long titles, narrow container',
  render: () => (
    <div className="w-full max-w-[360px]">
      <ListGroups aria-label="Narrow" columns="minmax(0,1fr) 112px" stackBelow={600} header={<><ListHeaderCell>Name</ListHeaderCell><ListHeaderCell>Status</ListHeaderCell></>}>
        <ListGroup title="Reads_from_Cebu_Parts_Stockroom_Warehouse_Annex_Building_Number_Twelve_Extension" count={1} actions={<Button variant="text" leftIcon={Plus}>Add connection</Button>} note="Newest first">
          <ListRow rowId="a"><ListCell kind="lead">Stock</ListCell><ListCell kind="actions">Open</ListCell><ListCell>Body under the name</ListCell></ListRow>
        </ListGroup>
        <ListGroup title="Short" count={1}>
          <ListRow rowId="b"><ListCell kind="lead">Catalog</ListCell><ListCell kind="actions">Open</ListCell></ListRow>
        </ListGroup>
      </ListGroups>
    </div>
  ),
};

export const WithSecondaryList: Story = {
  name: 'Beside another list (shortcuts off)',
  parameters: { docs: { description: { story: 'The list last focused or pressed keeps j / k, so a side `List` needs no opt-out. `shortcuts={false}` still turns a list off.' } } },
  render: () => (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <ListGroups aria-label="Main">
        <ListGroup title="Main" count={1}>{queue('m1', 'Main row', 'j / k work here')}</ListGroup>
      </ListGroups>
      <List aria-label="Side">{queue('s1', 'Side row', 'ignores j / k')}</List>
    </div>
  ),
};

export const Dark: Story = {
  parameters: { docs: { description: { story: 'Sets `data-theme="dark"` on the document.' } } },
  render: () => {
    useEffect(() => {
      const root = document.documentElement;
      const prev = root.getAttribute('data-theme');
      root.setAttribute('data-theme', 'dark');
      return () => (prev === null ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', prev));
    }, []);
    return (
      <ListGroups as="table" columns={cols} header={header} aria-label="Team dark">
        <ListGroup title="People" count={3} actions={<Button variant="text" leftIcon={Plus}>Invite</Button>}>{people.people.map((p) => personRow(p))}</ListGroup>
        <ListGroup title="Suspended" count={1} collapsible>{people.susp.map((p) => personRow(p, true))}</ListGroup>
      </ListGroups>
    );
  },
};
