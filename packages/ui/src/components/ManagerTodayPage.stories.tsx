import type { Meta, StoryObj } from '@storybook/react';
import { ManagerTodayPage, type ManagerTodayProps } from './ManagerTodayPage';
import { Remount, control, liveMeta } from './sms/live';

/** [For Review] RDY-518. Prototype only: stories are not exported from the package. Live Today page. Click a chip to open the inspector; switch Floor | Status; open the feed tabs and Leda. States are controls (see Docs). */
const OVERLAYS = ['none', 'service open', 'inquiry open', 'Leda panel open', 'phone: updates list', 'phone: parts activity', 'payment page: collect on JO-0403', 'payment page: discount open'] as const;
type Args = {
  state: NonNullable<ManagerTodayProps['state']>;
  inventory: NonNullable<ManagerTodayProps['inventory']>;
  as: NonNullable<ManagerTodayProps['as']>;
  view: 'floor' | 'status';
  feedTab: NonNullable<ManagerTodayProps['initialFeedTab']>;
  panelCollapsed: boolean;
  stress: boolean;
  overlay: (typeof OVERLAYS)[number];
};

const toProps = (a: Args): ManagerTodayProps => {
  const job = a.stress ? 'j0410' : 'j0412';
  return {
    state: a.state, inventory: a.inventory, as: a.as, initialView: a.view,
    initialFeedTab: a.overlay === 'inquiry open' ? 'inquiries' : a.overlay === 'phone: parts activity' ? 'parts' : a.feedTab,
    initialPanelCollapsed: a.panelCollapsed,
    initialSelected: a.overlay === 'service open' ? job : null,
    initialPhoneJob: a.overlay === 'service open' ? job : null,
    initialPhoneLane: a.overlay === 'service open' ? (a.stress ? 'm-arnel' : 'm-jun') : a.stress ? 'm-arnel' : 'counter',
    initialInquiry: a.overlay === 'inquiry open' ? 'iq2' : null,
    initialPaying: a.overlay.startsWith('payment page') ? { jobId: 'j0403', overlay: a.overlay.endsWith('discount open') ? 'discount' as const : 'none' as const } : null,
    ledaOpen: a.overlay === 'Leda panel open',
    initialPhoneView: a.overlay.startsWith('phone:') ? 'updates' : 'floor',
  };
};

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/Today',
  argTypes: {
    state: control.select(['ready', 'loading', 'quiet', 'first-run'], 'Data state'),
    inventory: control.select(['ok', 'slow', 'down'], 'Inventory link (down shows an ErrorBlock in the inspector parts)'),
    as: control.select(['manager', 'mechanic'], 'Role (mechanic is the role-limited stub: Leda refuses, no floor)'),
    view: control.select(['floor', 'status'], 'Sheet-bar Floor | Status'),
    feedTab: control.select(['needs', 'inquiries', 'parts'], 'Right panel tab', 'Layout'),
    panelCollapsed: control.bool('Right panel collapsed to its rail', 'Layout'),
    stress: control.bool('Long titles, long customer name, long model string', 'Data'),
    overlay: control.select(OVERLAYS, 'Open on load: an overlay or panel (phone viewport: use the toolbar Viewport)', 'Open on load'),
  },
  args: { state: 'ready', inventory: 'ok', as: 'manager', view: 'floor', feedTab: 'needs', panelCollapsed: false, stress: false, overlay: 'none' },
  render: (a) => <Remount on={a}><ManagerTodayPage {...toProps(a)} /></Remount>,
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: '[For Review] Today' };
