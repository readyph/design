import type { Meta, StoryObj } from '@storybook/react';
import { MechMe } from './MechMe';
import { mechanics } from './sms/data';
import { getMech } from './sms/mechModel';

const meta: Meta<typeof MechMe> = {
  title: 'Components/SMS/Mechanic profile',
  component: MechMe,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[375px] max-w-full py-4"><Story /></div>],
  args: { me: mechanics[0], s: getMech(), onSignOut: () => {}, offToday: false },
};
export default meta;
type S = StoryObj<typeof MechMe>;

export const OnShift: S = {};
export const OffToday: S = { args: { offToday: true } };
