import type { Meta, StoryObj } from '@storybook/react';
import { PlatformsPage } from './PortalPlatforms';

/** PROTOTYPE (RDY-120) - Platforms launch. Open is a real link to the handoff (opening) page; Finish setup (branch with no data) and Connect data (linked branch) open the Connect data panel for the clicked branch. Add platform opens the add flow. View activity is removed until an activity feed exists. */
const meta: Meta = { title: 'Portal/Platform launch', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'Default (Open, Connect data)', render: () => <PlatformsPage /> };
export const Unreachable: Story = { name: 'App unreachable', render: () => <PlatformsPage launch="unreachable" /> };
export const ConnectData: Story = { name: 'Connect data panel', render: () => <PlatformsPage connectOpen /> };
export const Loading: Story = { render: () => <PlatformsPage state="loading" /> };
export const Empty: Story = { render: () => <PlatformsPage state="empty" /> };
export const ErrorState: Story = { name: 'Error', render: () => <PlatformsPage state="error" /> };
