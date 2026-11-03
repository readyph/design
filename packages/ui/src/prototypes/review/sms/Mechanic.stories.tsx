import type { Meta, StoryObj } from '@storybook/react';
import { MechanicPage, type MechanicProps } from './Mechanic.page';
import { mechanics } from '../../../components/sms/data';
import { Remount, control } from '../../../components/sms/live';

/** Live Mechanic app (phone first): My day, Service detail, Request a part, Parts, Me. Every state is a control; use the toolbar Viewport (Small mobile) and Theme. */
const OVERLAYS = ['none', 'service detail open', 'request part open', 'scan sheet', 'pause reason', 'mark-done confirm'] as const;
type Args = {
  /** Short name of an active mechanic. The list follows Settings > Team (a mechanic added there appears here). */
  mechanic: string;
  state: NonNullable<MechanicProps['scenario']>;
  stress: boolean;
  overlay: (typeof OVERLAYS)[number];
};
const idOf = (short: string) => mechanics.find((m) => m.short === short)?.id ?? 'm-jun';

const meta: Meta<Args> = {
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/[For Review] Mechanic',
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'mobile1' }, controls: { sort: 'none' }, docs: { story: { inline: false, iframeHeight: 760 } } },
  argTypes: {
    mechanic: control.select(mechanics.map((m) => m.short), 'Who is signed in. Jun has 5 services and a blocked alternator; Ricky has 1.'),
    state: control.select(['normal', 'no services', 'day off', 'loading', 'all blocked'], 'Data state of the day'),
    stress: control.bool('Many services (8 extra) with long titles', 'Data'),
    overlay: control.select(OVERLAYS, 'Where the app opens. Everything stays clickable from there.', 'Open on load'),
  },
  args: { mechanic: 'Jun', state: 'normal', stress: false, overlay: 'none' },
  render: (a) => <Remount on={a}><MechanicPage mechanicId={idOf(a.mechanic)} scenario={a.state} stress={a.stress} overlay={a.overlay} /></Remount>,
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: 'Mechanic' };
