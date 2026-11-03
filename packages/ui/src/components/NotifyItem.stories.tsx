import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle } from '@phosphor-icons/react';
import { NotifyItem } from './NotifyItem';

const meta: Meta<typeof NotifyItem> = {
  title: 'Components/Data/Notify item',
  component: NotifyItem,
  tags: ['autodocs'],
  decorators: [(Story) => <ul className="w-[360px] list-none p-0"><Story /></ul>],
  args: { title: 'JO-0403 Toyota Vios', time: '10:12', detail: 'Ready for pick-up, balance unpaid', marker: <CheckCircle size={20} />, tag: 'Ready', markerTone: 'muted' },
  argTypes: { markerTone: { control: 'inline-radio', options: ['bad', 'warn', 'ok', 'muted'] } },
};
export default meta;
type S = StoryObj<typeof NotifyItem>;

export const Informing: S = {};
export const WaitingForYou: S = { args: { markerTone: 'warn', onOpen: () => {}, ariaLabel: 'Open JO-0403' } };
export const Wrapped: S = { args: { wrap: true, detail: 'Needs two front pads.\nWaiting on the supplier.' } };
export const Dense: S = { args: { dense: true, onOpen: () => {} } };
export const Checklist: S = { args: { dense: true, checked: true, onOpen: () => {} } };
