import type { Meta, StoryObj } from '@storybook/react';
import { ReceiveForm, type ReceiveFormProps } from './ReceiveForm';

const lines: ReceiveFormProps['lines'] = [
  { id: 'b01', name: 'Engine oil 5W-30 1L', sku: 'OIL-5W30', location: 'Aisle 2', unit: 'bottle', onHand: 4, reorder: 6, ordered: 9, stillDue: 9, cost: 310 },
  { id: 'b02', name: 'Brake fluid DOT 4 500ml', sku: 'BRK-DOT4', location: 'Aisle 2', unit: 'bottle', onHand: 12, reorder: 8, ordered: 6, stillDue: 6, cost: 215 },
  { id: 'b03', name: 'Oil filter, small', sku: 'FLT-OIL-S', location: 'Aisle 5', unit: 'pc', onHand: 0, reorder: 5, ordered: 10, stillDue: 10, cost: 120 },
];
const stock = lines.map((l) => ({ id: l.id, onHand: l.onHand, reorder: l.reorder }));
const people = [
  { id: 'berto', name: 'Berto' },
  { id: 'ana', name: 'Ana' },
  { id: 'jomar', name: 'Jomar' },
];
const base: ReceiveFormProps = { poNo: 'PO-0221', lines, stock, people, viewerId: 'ana', canCloseShort: true, managerName: 'Berto' };

const meta: Meta<typeof ReceiveForm> = {
  title: 'Components/Forms/ReceiveForm',
  component: ReceiveForm,
  tags: ['autodocs'],
  args: base,
  decorators: [(Story) => <div className="bg-surface px-pad py-5"><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Receive form (RDY-395, I11): count what arrived against the order, the one number rule, summary and Confirm/Cancel. Source: inventory-home FINAL/purchase-orders.css 120-181, 259-285, 295-320, purchase-orders.js 395-476, receiving.js 71-95.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ReceiveForm>;

/** Types into a count field the way a person does: value, then blur. */
function typeInto(root: HTMLElement, label: string, value: string) {
  const el = root.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
  if (!el) return;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.focus();
  el.blur();
}

export const AllDue: Story = {};
export const Clerk: Story = { args: { canCloseShort: false, lines: lines.map(({ cost: _c, ...l }) => l) } };
export const OneLineDone: Story = {
  args: { lines: lines.map((l, i) => (i === 1 ? { ...l, stillDue: 0 } : l)) },
};
export const Short: Story = {
  play: ({ canvasElement }) => typeInto(canvasElement, 'Quantity of Engine oil 5W-30 1L', '6'),
};
export const ShortClerk: Story = {
  args: { canCloseShort: false },
  play: ({ canvasElement }) => typeInto(canvasElement, 'Quantity of Engine oil 5W-30 1L', '6'),
};
export const Extra: Story = {
  play: ({ canvasElement }) => typeInto(canvasElement, 'Quantity of Oil filter, small', '12'),
};
export const NothingCounted: Story = {
  play: ({ canvasElement }) => {
    ['Engine oil 5W-30 1L', 'Brake fluid DOT 4 500ml', 'Oil filter, small'].forEach((n) => typeInto(canvasElement, `Quantity of ${n}`, '0'));
  },
};
