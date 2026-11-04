import type { Meta, StoryObj } from '@storybook/react';
import { MechMe } from './MechMe';
import { branch, mechanics } from './sms/data';
import { setPref } from './sms/mechActions';
import { getMech } from './sms/mechModel';

const me = mechanics[0];
const PREFS = [
  { id: 'assigned', label: 'Tell me when I get a new car' },
  { id: 'reply', label: 'Tell me when my manager replies' },
  { id: 'part', label: 'Tell me when a part is ready' },
];
/** The studio state mapped to the host props (a real host passes its own prefs, bay and shift). */
const mine = (off: boolean) => ({ name: me.name, initials: me.initials, id: me.id, subtitle: `${me.bay} · ${branch.name}`, prefs: PREFS.map((p) => ({ ...p, checked: !!getMech().prefs[p.id] })), hoursText: off ? 'Today you are off.' : `Today ${me.shift}.` });

const meta: Meta<typeof MechMe> = {
  title: 'Components/SMS/Mechanic profile',
  component: MechMe,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[375px] max-w-full py-4"><Story /></div>],
  args: { ...mine(false), onPref: setPref, onSignOut: () => {} },
};
export default meta;
type S = StoryObj<typeof MechMe>;

export const OnShift: S = {};
export const OffToday: S = { args: mine(true) };
