import type { Meta, StoryObj } from '@storybook/react';
import { HomeTimelinePanel } from './InventoryHome.timeline';
import { HomeZones } from './InventoryHome.zones';
import { HomeCaseView, HomeVerticalTimeline } from './InventoryHome.case';
import { InventoryHomePage } from './InventoryHome.page';

/**
 * [For Review] RDY-422 Inventory Home 2/5 (b). Prototype only: stories are not exported from the package.
 * The timeline panel (To do by, Stock in, Stock out, Expiring, Stock left with the runway) composed from I6 Day timeline and I5 Stock runway.
 * Source: inventory-home FINAL home.js 131-447, home.html CSS. Data: InventoryHome.data.ts. Later slices append to this file.
 */
const meta: Meta<typeof HomeTimelinePanel> = {
  title: 'Prototypes/Inventory/[For Review] Home',
  component: HomeTimelinePanel,
  parameters: { layout: 'padded' },
  argTypes: {
    tenant: { control: 'inline-radio', options: ['a', 'b'] },
    role: { control: 'inline-radio', options: ['manager', 'clerk', 'owner'] },
    state: { control: 'inline-radio', options: ['live', 'quiet', 'loading', 'error', 'empty', 'degraded'] },
    view: { control: 'inline-radio', options: ['today', 'week'] },
  },
};
export default meta;
type Story = StoryObj<typeof HomeTimelinePanel>;

export const TimelineToday: Story = { name: 'Timeline, Today', args: { tenant: 'a' } };
export const TimelineThisWeek: Story = { name: 'Timeline, This week', args: { tenant: 'a', view: 'week' } };
export const RunwayToday: Story = { name: 'Runway, Today (tenant B, milk)', args: { tenant: 'b' } };
export const RunwayThisWeek: Story = { name: 'Runway, This week (tenant B, milk)', args: { tenant: 'b', view: 'week' } };
export const ErrorLane: Story = { name: 'Error lane (?state=error)', args: { tenant: 'a', state: 'error' } };
export const EmptyFirstRun: Story = { name: 'Empty first run (?state=empty)', args: { tenant: 'a', state: 'empty' } };
export const Loading: Story = { name: 'Loading', args: { tenant: 'a', state: 'loading' } };

/* RDY-423 Inventory Home 3/5 (c): the zones. Source: home.js 448-577, home.html CSS. */
type ZonesStory = StoryObj<typeof HomeZones>;
const zonesRender = (args: React.ComponentProps<typeof HomeZones>) => <HomeZones {...args} />;
export const ZonesLive: ZonesStory = { name: 'Zones, live', render: zonesRender, args: { tenant: 'a' } };
export const ZonesQuiet: ZonesStory = { name: 'Zones, quiet (?state=quiet)', render: zonesRender, args: { tenant: 'a', state: 'quiet' } };
export const ZonesLoading: ZonesStory = { name: 'Zones, loading', render: zonesRender, args: { tenant: 'a', state: 'loading' } };
export const ZonesError: ZonesStory = { name: 'Zones, error (?state=error)', render: zonesRender, args: { tenant: 'a', state: 'error' } };
export const ZonesEmpty: ZonesStory = { name: 'Zones, empty (?state=empty)', render: zonesRender, args: { tenant: 'a', state: 'empty' } };
export const ZonesClerk: ZonesStory = { name: 'Zones, clerk (?role=clerk)', render: zonesRender, args: { tenant: 'a', role: 'clerk' } };
export const ZonesOwner: ZonesStory = { name: 'Zones, owner (?role=owner)', render: zonesRender, args: { tenant: 'a', role: 'owner' } };

/* RDY-424 Inventory Home 4/5 (d): the case, phone and role variants. Source: home.js 578-612, 640-692, 727-744; home.html 299-333, 346-407. */
type CaseStory = StoryObj<typeof HomeCaseView>;
const caseRender = (args: React.ComponentProps<typeof HomeCaseView>) => <HomeCaseView {...args} />;
const phone = { viewport: { defaultViewport: 'mobile1' }, layout: 'fullscreen' };
export const CaseReorderN1: CaseStory = { name: 'Case open, n1 reorder oil filters', render: caseRender, parameters: { layout: 'fullscreen' }, args: { tenant: 'a', open: 'n1' } };
export const CaseVarianceN2: CaseStory = { name: 'Case open, n2 short delivery (Dispute / Accept)', render: caseRender, parameters: { layout: 'fullscreen' }, args: { tenant: 'a', open: 'n2' } };
export const CaseTransferN3: CaseStory = { name: 'Case open, n3 alternator transfer', render: caseRender, parameters: { layout: 'fullscreen' }, args: { tenant: 'a', open: 'n3' } };
export const CaseAfterConfirm: CaseStory = { name: 'Case, after Confirm (n1)', render: caseRender, parameters: { layout: 'fullscreen' }, args: { tenant: 'a', open: 'n1', afterConfirm: true } };
export const CaseClerk: CaseStory = { name: 'Case, clerk (Waiting for your manager)', render: caseRender, parameters: { layout: 'fullscreen' }, args: { tenant: 'a', open: 'n1', role: 'clerk' } };
export const CaseOwner: CaseStory = { name: 'Case, owner (?role=owner)', render: caseRender, parameters: { layout: 'fullscreen' }, args: { tenant: 'a', open: 'n1', role: 'owner' } };
export const CaseTenantB: CaseStory = { name: 'Case, tenant B (fresh milk reorder)', render: caseRender, parameters: { layout: 'fullscreen' }, args: { tenant: 'b', open: 'n1' } };
export const CasePhone: CaseStory = { name: 'Case, phone 390 (step line, sticky Confirm)', render: caseRender, parameters: phone, args: { tenant: 'a', open: 'n1' } };
export const VerticalTimelinePhone: StoryObj<typeof HomeVerticalTimeline> = { name: 'Vertical timeline, phone 390', render: (a) => <HomeVerticalTimeline {...a} />, parameters: { viewport: { defaultViewport: 'mobile1' } }, args: { tenant: 'a' } };
export const VerticalTimelineExpanded: StoryObj<typeof HomeVerticalTimeline> = { name: 'Vertical timeline, Earlier today open, Show less', render: (a) => <HomeVerticalTimeline {...a} />, parameters: { viewport: { defaultViewport: 'mobile1' } }, args: { tenant: 'a', earlier: true, all: true } };

/* RDY-403 Inventory Home 5/5 (e): the assembled page. Source: home.js 628-640, 694-722; home.html CSS. */
type PageStory = StoryObj<typeof InventoryHomePage>;
const pageRender = (args: React.ComponentProps<typeof InventoryHomePage>) => <InventoryHomePage {...args} />;
const full = { layout: 'fullscreen' };
export const PageLive: PageStory = { name: 'Page, live', render: pageRender, parameters: full, args: { tenant: 'a' } };
export const PageQuiet: PageStory = { name: 'Page, quiet (?state=quiet)', render: pageRender, parameters: full, args: { tenant: 'a', state: 'quiet' } };
export const PageLoading: PageStory = { name: 'Page, loading', render: pageRender, parameters: full, args: { tenant: 'a', state: 'loading' } };
export const PageError: PageStory = { name: 'Page, error (?state=error)', render: pageRender, parameters: full, args: { tenant: 'a', state: 'error' } };
export const PageEmpty: PageStory = { name: 'Page, empty first run (?state=empty)', render: pageRender, parameters: full, args: { tenant: 'a', state: 'empty' } };
export const PageDegraded: PageStory = { name: 'Page, degraded (?state=degraded)', render: pageRender, parameters: full, args: { tenant: 'a', state: 'degraded' } };
export const PageThisWeek: PageStory = { name: 'Page, This week (?view=week)', render: pageRender, parameters: full, args: { tenant: 'a', view: 'week' } };
export const PageClerk: PageStory = { name: 'Page, clerk (?role=clerk)', render: pageRender, parameters: full, args: { tenant: 'a', role: 'clerk' } };
export const PageOwner: PageStory = { name: 'Page, owner (?role=owner)', render: pageRender, parameters: full, args: { tenant: 'a', role: 'owner' } };
export const PageTenantB: PageStory = { name: 'Page, tenant B', render: pageRender, parameters: full, args: { tenant: 'b' } };
export const PageTenantBWeek: PageStory = { name: 'Page, tenant B, This week', render: pageRender, parameters: full, args: { tenant: 'b', view: 'week' } };
export const PagePhone: PageStory = { name: 'Page, phone 390', render: pageRender, parameters: { ...phone }, args: { tenant: 'a' } };
