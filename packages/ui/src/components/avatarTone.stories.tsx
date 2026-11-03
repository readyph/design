import type { Meta, StoryObj } from '@storybook/react';
import { PersonAvatar } from './avatarTone';

const meta: Meta<typeof PersonAvatar> = {
  title: 'Components/Data/Person avatar',
  component: PersonAvatar,
  tags: ['autodocs'],
  args: { personId: 'm-jun', name: 'Jun Reyes', size: 32 },
};
export default meta;
type S = StoryObj<typeof PersonAvatar>;

export const Default: S = {};
export const Mechanics: S = {
  render: () => (
    <div className="flex gap-2">
      {[['m-jun', 'Jun Reyes'], ['m-arnel', 'Arnel Cruz'], ['m-paolo', 'Paolo Lim'], ['m-ricky', 'Ricky Tan']].map(([id, name]) => <PersonAvatar key={id} personId={id} name={name} />)}
    </div>
  ),
};
