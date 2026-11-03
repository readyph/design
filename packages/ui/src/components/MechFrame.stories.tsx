import type { Meta, StoryObj } from '@storybook/react';
import { MechFrame, MechStatus, MechSection, CheckMark } from './MechFrame';
import { mechanics } from './sms/data';

const me = mechanics[0];
const meta: Meta<typeof MechFrame> = {
  title: 'Components/SMS/Mechanic frame',
  component: MechFrame,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Services',
    me,
    onProfile: () => {},
    crumbs: [{ label: 'Services' }],
    children: (
      <>
        <MechSection title="Now" count={1}>
          <p className="px-4">Brake pads and rotor check.</p>
        </MechSection>
        <MechSection title="Status" hint="today">
          <div className="flex items-center gap-2 px-4"><CheckMark on={false} /><CheckMark on /><MechStatus word="Working" /></div>
        </MechSection>
      </>
    ),
  },
};
export default meta;
type S = StoryObj<typeof MechFrame>;

export const Root: S = {};
export const Pushed: S = { args: { crumbs: [{ label: 'Services', onClick: () => {} }, { label: 'Brake pads and rotor check' }] } };
export const ProfileActive: S = { args: { profileActive: true, crumbs: [{ label: 'Services', onClick: () => {} }, { label: 'Profile' }] } };
export const WithBar: S = { args: { bar: <p className="text-center">Pinned action bar</p>, snack: 'Request sent' } };
export const Flush: S = { args: { flush: true } };
export const Statuses: S = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <MechStatus word="To do" /><MechStatus word="Working" /><MechStatus word="Waiting for part" /><MechStatus word="Done" />
    </div>
  ),
};
