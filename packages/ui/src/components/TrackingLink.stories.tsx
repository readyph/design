import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from '../index';
import { TrackingLink } from './TrackingLink';
import { QrStandIn } from './QrStandIn';
import { jobs } from './sms/data';

const meta: Meta<typeof TrackingLink> = {
  title: 'Components/Data/TrackingLink',
  component: TrackingLink,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type S = StoryObj<typeof TrackingLink>;

export const Default: S = { render: () => <div className="max-w-[360px]"><TrackingLink job={jobs[0]} /><Toaster /></div> };
export const QrPreview: StoryObj = { render: () => <QrStandIn value="abcdefghjkmnpqrstuvwxyz2" /> };
