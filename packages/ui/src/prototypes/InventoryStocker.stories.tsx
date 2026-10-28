import type { Meta, StoryObj } from '@storybook/react';
import { StockerFramePage } from './Stocker.page';
import { StockerHomePage } from './Stocker.home';

/**
 * [For Review] RDY-429, Stocker 1/6 (a). Prototype only: stories are not exported from the package. Stocker (handover 2.7): the shared frame, tabs, steps and states.
 * Source: inventory-home FINAL stocker.html, stocker.css, stocker.js 1-195. Data: Stocker.data.ts (dumped from data.js, receiving.js).
 * Later slices (b) to (f) append their stories to this file.
 */
const meta: Meta<typeof StockerFramePage> = { title: 'Prototypes/Inventory/Stocker', component: StockerFramePage, parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'mobile1' } } };
export default meta;
type Story = StoryObj<typeof StockerFramePage>;
const small = { viewport: { defaultViewport: 'mobile2' } };

export const Frame: Story = { name: '[For Review] Stocker frame (390)' };
export const FrameSmall: Story = { name: '[For Review] Stocker frame (360)', parameters: small };
export const Loading: Story = { name: '[For Review] Stocker loading (?state=loading)', args: { state: 'loading' } };
export const ErrorState: Story = { name: '[For Review] Stocker error (?state=error)', args: { state: 'error' } };
export const Empty: Story = { name: '[For Review] Stocker empty (?state=empty)', args: { state: 'empty' } };
export const Quiet: Story = { name: '[For Review] Stocker quiet (?state=quiet)', args: { state: 'quiet' } };
export const TenantB: Story = { name: '[For Review] Stocker frame (tenant B)', args: { tenant: 'b' } };

/* RDY-430, Stocker 2/6 (b): Home (stocker.js 196-217). */
const homeMeta = { component: StockerHomePage };
type HomeStory = StoryObj<typeof StockerHomePage>;
export const Home: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home', render: (a) => <StockerHomePage {...a} /> };
export const HomeSmall: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home (360)', parameters: small, render: (a) => <StockerHomePage {...a} /> };
export const HomeLoading: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home loading (?state=loading)', args: { state: 'loading' }, render: (a) => <StockerHomePage {...a} /> };
export const HomeError: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home error (?state=error)', args: { state: 'error' }, render: (a) => <StockerHomePage {...a} /> };
export const HomeEmpty: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home empty (?state=empty)', args: { state: 'empty' }, render: (a) => <StockerHomePage {...a} /> };
export const HomeQuiet: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home quiet (?state=quiet)', args: { state: 'quiet' }, render: (a) => <StockerHomePage {...a} /> };
export const HomeTenantB: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home (tenant B)', args: { tenant: 'b' }, render: (a) => <StockerHomePage {...a} /> };
