import type { Meta, StoryObj } from '@storybook/react';
import { ConnectionsEditor } from './ConnectionsEditor';
import { Demo } from './ConnectionsEditor.demo';
import { LedaNote } from './LedaNote';
import { cebu, cubao, main, optRead, optShare, pasig, readsFrom } from './ConnectionsEditor.sample';

const meta: Meta<typeof ConnectionsEditor> = {
  title: 'Components/Lists/ConnectionsEditor',
  component: ConnectionsEditor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Connections editor (C26): "Reads from" and "Shares with" as two `ListGroup`s (one j / k cursor), one "Add connection" dropdown + button. Rows: logo, name, kind, what it shares in plain words, status (dot **and** words), Remove.',
          'Add and Remove save at once through `onAdd` / `onRemove` with an Undo toast (mount one `Toaster`); Remove asks first. Undo calls the inverse callback with `{ undo: true }` so the page can skip the van. Focus moves to the new row after Add, to the next row (or the Add dropdown when none is left) after Remove.',
          '`onHover(connection | null, direction)` fires on pointer and keyboard focus of a row: the page lights the two buildings and the road. `flashId` flashes one row and focuses its Remove.',
          '',
          '```tsx',
          '<ConnectionsEditor platformId="cafe" platformName="Café POS" reads={reads} shares={shares} available={available}',
          '  onAdd={(o) => save(o.connection)} onRemove={(c, dir) => drop(c.id)} onHover={light} flashId={params.link} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ConnectionsEditor>;

export const Default: Story = { render: () => <Demo /> };
export const MultiSource: Story = { name: 'Two sources (note)', render: () => <Demo r={[readsFrom(cebu), readsFrom(main)]} /> };
export const EmptySource: Story = {
  name: 'Empty source (Add Inventory)',
  render: () => <Demo r={[]} s={[]} a={[optShare(cubao)]} sourceKinds={['Inventory']} onAddKind={() => {}} />,
};
export const LongNamesMany: Story = {
  name: 'Long names, many connections',
  render: () => (
    <Demo
      r={[readsFrom(pasig), readsFrom(cebu), readsFrom(main), readsFrom({ ...cebu, id: 'c2', name: 'Cebu Parts Stockroom North Annex' }), readsFrom({ ...main, id: 'm2', name: 'Manila Stockroom 2' })]}
    />
  ),
};
export const Flashed: Story = { name: 'Deep link (flash + focus)', render: () => <Demo flashId="reads:stock:main" /> };
export const WithLeda: Story = {
  name: 'Leda prefilled choice',
  render: () => <Demo defaultChoice="shares:catalog:pasig" ledaNote={<LedaNote>Pasig Loyalty could use your catalog for rewards. Nothing is shared until you press Add connection.</LedaNote>} />,
};
export const AllConnected: Story = { render: () => <Demo r={[readsFrom(cebu)]} s={[]} a={[optRead(cebu)]} /> };
export const Loading: Story = { render: () => <Demo status="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <Demo status="error" onRetry={() => {}} /> };
