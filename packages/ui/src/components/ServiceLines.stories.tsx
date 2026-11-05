import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LinesTable, ServiceAdder } from './ServiceLines';
import { typeIdFor } from './sms/catalogue';
import { customLine, linesFromType, partLine, type WizardLine } from './sms/wizardModel';

const meta: Meta<typeof LinesTable> = {
  title: 'Components/SMS/Service lines',
  component: LinesTable,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="min-h-[360px] w-[760px] max-w-full"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof LinesTable>;

const byName = (n: string) => linesFromType(typeIdFor(n)!);
const bump = (ls: WizardLine[], i: number, p: Partial<WizardLine>) => ls.map((l, j) => (j === i ? { ...l, ...p } : l));

function Host({ start, readOnly, adder }: { start: WizardLine[]; readOnly?: boolean; adder?: boolean }) {
  const [lines, setLines] = useState(start);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {adder && <ServiceAdder lines={lines} kind="car" onChange={setLines} onFocusLine={setFocusKey} />}
      <LinesTable lines={lines} onChange={setLines} readOnly={readOnly} focusKey={focusKey} totalLabel={readOnly ? 'Total' : 'Subtotal'} empty="Add at least one service." />
    </div>
  );
}

const oil = () => byName('Change oil (Shell Helix 10W-40)');
export const PartsSubLines: S = { name: 'Parts sub-lines', render: () => <Host start={oil()} adder /> };
export const NotEnoughStock: S = { name: 'Not enough stock', render: () => <Host start={bump(byName('Brake pad replacement, front'), 1, { qty: 3 })} /> };
export const OutOnOrder: S = { name: 'Out on order', render: () => <Host start={byName('Timing belt replacement')} /> };
export const CustomPrice: S = { name: 'Custom price', render: () => <Host start={bump(oil(), 0, { price: 600 })} /> };
export const CustomServiceWithPart: S = {
  name: 'Custom service with a part',
  render: () => { const c = customLine('Wiring check', 500); return <Host start={[c, partLine('pr06', c.key)]} />; },
};
export const Empty: S = { render: () => <Host start={[]} adder /> };
export const ReadOnly: S = { name: 'Read only (review)', render: () => <Host start={[...oil(), ...bump(byName('Brake pad replacement, front'), 0, { price: 900 })]} readOnly /> };
