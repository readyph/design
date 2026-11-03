import type { Meta, StoryObj } from '@storybook/react';
import { PartChip } from './PartChip';
import { branch, products, stockState } from './sms/data';
import { todayEnv } from './sms/floorModel';

const meta: Meta<typeof PartChip> = {
  title: 'Components/Data/Part chip',
  component: PartChip,
  tags: ['autodocs'],
  args: { product: products[0], env: todayEnv, inventoryName: branch.inventory.platform, onResolve: () => {} },
};
export default meta;
type S = StoryObj<typeof PartChip>;

const of = (st: 'in' | 'low' | 'out' | 'on_order') => products.find((p) => stockState(p) === st) ?? products[0];

export const InStock: S = { args: { product: of('in') } };
export const Low: S = { args: { product: of('low') } };
export const Out: S = { args: { product: of('out') } };
export const OnOrder: S = { args: { product: of('on_order') } };
export const ReadOnly: S = { args: { product: of('out'), readOnly: true } };
export const Stale: S = { args: { staleSince: '09:40' } };
