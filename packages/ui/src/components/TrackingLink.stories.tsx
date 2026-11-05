import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from '../index';
import { TrackingLink } from './TrackingLink';
import { QrStandIn } from './QrStandIn';
import { LiveTrackingLink } from './sms/LiveTrackingLink';
import { jobs } from './sms/data';

const meta: Meta<typeof TrackingLink> = {
  title: 'Components/SMS/TrackingLink',
  component: TrackingLink,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type S = StoryObj<typeof TrackingLink>;

const base = { jobNumber: 'JO-0408', plate: 'NBC 4821', customerName: 'Maria Santos', customerPhone: '0917 555 0142', url: 'https://track.readyph.example/t/abcdefghjkmnpqrstuvwxyz2', expiryDays: 7, onSendSms: () => {}, onRegenerate: () => {} };
/** Props only: url, expiry, customer and the callbacks come from the page. */
export const Default: S = { args: base, render: (args) => <div className="max-w-[360px]"><TrackingLink {...args} /><Toaster /></div> };
/** Bound to the mock token store: Regenerate link swaps the url. */
export const Live: S = { render: () => <div className="max-w-[360px]"><LiveTrackingLink job={jobs[0]} /><Toaster /></div> };
export const QrPreview: StoryObj = { render: () => <QrStandIn value="abcdefghjkmnpqrstuvwxyz2" /> };
/** Real QR passed in: the "Preview only: not scannable" badge is gone (open Show QR). */
export const RealQr: S = { args: { ...base, qr: <img alt="Tracking QR" width={160} height={160} src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Cpath d='M0 0h3v3H0zM5 0h3v3H5zM0 5h3v3H0zM4 4h1v1H4zM6 5h2v1H6zM5 7h3v1H5z'/%3E%3C/svg%3E" /> }, render: (args) => <div className="max-w-[360px]"><TrackingLink {...args} /><Toaster /></div> };
/** No `onSendSms`: Send by SMS is hidden and Copy link and Show QR share the row. */
export const NoSms: S = { args: { ...base, onSendSms: undefined }, render: (args) => <div className="max-w-[360px]"><TrackingLink {...args} /><Toaster /></div> };
