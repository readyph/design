import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from '../index';
import { TrackingLink } from './TrackingLink';
import { QrStandIn } from './QrStandIn';
import { LiveTrackingLink } from './sms/LiveTrackingLink';
import { jobs } from './sms/data';

const meta: Meta<typeof TrackingLink> = {
  title: 'Components/Data/TrackingLink',
  component: TrackingLink,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type S = StoryObj<typeof TrackingLink>;

const base = { jobNumber: 'JO-0408', plate: 'NBC 4821', customerName: 'Maria Santos', customerPhone: '0917 555 0142', url: 'https://track.readyph.example/t/abcdefghjkmnpqrstuvwxyz2', expiryDays: 7, onRegenerate: () => {} };
/** Props only: url, expiry, customer and the callbacks come from the page. */
export const Default: S = { args: base, render: (args) => <div className="max-w-[360px]"><TrackingLink {...args} /><Toaster /></div> };
/** Bound to the mock token store: Regenerate link swaps the url. */
export const Live: S = { render: () => <div className="max-w-[360px]"><LiveTrackingLink job={jobs[0]} /><Toaster /></div> };
export const QrPreview: StoryObj = { render: () => <QrStandIn value="abcdefghjkmnpqrstuvwxyz2" /> };
