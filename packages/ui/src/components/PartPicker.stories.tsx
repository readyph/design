import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { PartPicker } from './PartPicker';

const meta: Meta<typeof PartPicker> = {
  title: 'Components/SMS/Part picker',
  component: PartPicker,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="h-[420px] w-[520px] max-w-full"><Story /></div>],
  args: { onPick: () => {} },
};
export default meta;
type S = StoryObj<typeof PartPicker>;

export const Closed: S = {};
export const Searching: S = {
  play: async ({ canvasElement }) => { await userEvent.type(within(canvasElement).getByRole('combobox'), 'oil'); },
};
export const Excluding: S = { name: 'With parts already added', args: { exclude: ['pr01', 'pr02'] } };
export const NoMatch: S = {
  play: async ({ canvasElement }) => { await userEvent.type(within(canvasElement).getByRole('combobox'), 'zzzz'); },
};
export const InventorySlow: S = { args: { status: 'slow', search: () => [] } };
export const InventoryDown: S = { name: 'Inventory not answering', args: { status: 'down', search: () => [] } };
