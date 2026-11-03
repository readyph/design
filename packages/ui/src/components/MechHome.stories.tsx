import type { Meta, StoryObj } from '@storybook/react';
import { MechHome } from './MechHome';
import { mechanics } from './sms/data';
import { dayOf, getMech, poolFor, type MechScenario } from './sms/mechModel';

const me = mechanics[0];
const s = getMech();
const build = (scenario: MechScenario, stress = false) => ({ me, s, scenario, pool: poolFor(s, me, stress, scenario), day: dayOf(s, me, scenario, stress), onOpen: () => {} });

const meta: Meta<typeof MechHome> = {
  title: 'Components/SMS/Mechanic home',
  component: MechHome,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'mobile1' } },
  args: build('normal'),
};
export default meta;
type S = StoryObj<typeof MechHome>;

/** Day schedule with the blue now line at 10:20, cards by time, Currently working on pill and Finished today. */
export const Normal: S = {};
export const NoServices: S = { args: build('no services') };
export const DayOff: S = { args: build('day off') };
export const Loading: S = { args: build('loading') };
export const AllBlocked: S = { args: build('all blocked') };
export const Stress: S = { args: build('normal', true) };
