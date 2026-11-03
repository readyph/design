import type { Meta, StoryObj } from '@storybook/react';
import { ServicesPricesPage, type ServicesPricesProps } from './ServicesPricesPage';
import { Remount, control, liveMeta } from './sms/live';

/** [For Review] RDY-524. Prototype only: stories are not exported from the package. Settings > Services & prices catalogue, standalone and embedded in Settings. */
const SCENARIOS: Record<string, ServicesPricesProps> = {
  'Table (default)': {},
  'Filtered to Brakes': { initialCategory: 'Brakes' },
  'Search with no result': { initialQuery: 'turbo' },
  'Show inactive': { initialShowInactive: true },
  'Form: add a service': { initialForm: 'new' },
  'Form: Change oil with 2 linked parts': { initialForm: 'sv01' },
  'Confirm: Deactivate': { initialAsk: 'sv10' },
  'Empty (no services yet)': { state: 'empty' },
  'Loading': { state: 'loading' },
};
type Args = { scenario: string; role: NonNullable<ServicesPricesProps['role']>; stress: boolean; embedded: boolean };

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/Services & prices',
  argTypes: {
    scenario: control.select(Object.keys(SCENARIOS), 'Starting point: filters, forms, confirm, empty, loading', 'State'),
    role: control.select(['manager', 'mechanic'], 'The manager edits prices; a mechanic only reads them', 'Where'),
    stress: control.bool('Long names (very long name, description and many linked parts)', 'Data'),
    embedded: control.bool('Embedded in Settings: only the section, no frame or side menu', 'Layout'),
  },
  args: { scenario: 'Table (default)', role: 'manager', stress: false, embedded: false },
  render: (a) => (
    <Remount on={a}>
      <ServicesPricesPage {...SCENARIOS[a.scenario]} role={a.role} stress={a.stress} embedded={a.embedded} />
    </Remount>
  ),
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: '[For Review] Services & prices' };
