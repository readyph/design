import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Notifications, type NotificationItem } from './Notifications';

const meta: Meta<typeof Notifications> = {
  title: 'Components/Overlays/Notifications',
  component: Notifications,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof Notifications>;

const items: NotificationItem[] = [
  { id: '1', title: 'New order for ID: MSLES880', time: 'Wednesday 8.30 pm', avatarName: 'Marco Reyes', count: 2, tags: ['New Order'] },
  { id: '2', title: 'Payment successfully verified', body: 'The payment has been confirmed. Proceed with shipping.', time: 'Tuesday 7.30 am', kind: 'payment', tags: ['New Order'] },
  { id: '3', title: 'Your security password has been successfully changed.', time: 'Monday 9.30 am', kind: 'security' },
  { id: '4', title: 'New order for ID: MSLES882', time: 'Sunday 4.30 pm', avatarName: 'Ana Lim', count: 4, tags: ['New Order'] },
  { id: '5', title: 'Reached 230k visitors in May', body: 'You had 230k visits last month, a 3.8% increase from April.', time: 'Monday 9.30 am', kind: 'activity', tags: ['Weekly Update'] },
];

const tabs = ['View All', 'New Order', 'Weekly Update'];

export const Default: Story = {
  render: () => {
    const [tab, setTab] = useState(tabs[0]);
    return <Notifications items={items} tabs={tabs} activeTab={tab} onTabChange={setTab} />;
  },
};
