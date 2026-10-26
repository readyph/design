import type { Meta, StoryObj } from '@storybook/react';
import { MemoryPage } from './MemoryPage';

/**
 * RDY-259 (handover 2.5). Prototype only: stories are not exported from the package.
 * Portal Memory in the real PlatformShell: Topics, Blocked questions and Customer requests tabs, a topic's page, and Try it as a modal.
 */
const meta: Meta<typeof MemoryPage> = {
  title: 'Prototypes/Portal/Memory',
  component: MemoryPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof MemoryPage>;

const phone = { viewport: { defaultViewport: 'mobile1' } };

export const Topics: Story = {};
export const BlockedQuestions: Story = { args: { initialTab: 'blocked' } };
export const CustomerRequests: Story = { args: { initialTab: 'requests' } };
export const TopicPage: Story = { args: { openTopic: true } };
export const TryIt: Story = { args: { tryOpen: true } };
export const Loading: Story = { args: { state: 'loading' } };
export const ErrorState: Story = { name: 'Error', args: { state: 'error' } };
export const Empty: Story = { args: { state: 'empty' } };
export const Full: Story = { args: { state: 'full' } };
export const ReadOnly: Story = { args: { readOnly: true } };
export const PhoneFolders: Story = { name: 'Phone: folders', parameters: phone };
export const PhoneRequests: Story = { name: 'Phone: requests', args: { initialTab: 'requests', startDetail: true }, parameters: phone };
export const PhoneTopics: Story = { name: 'Phone: topics', args: { startDetail: true }, parameters: phone };
