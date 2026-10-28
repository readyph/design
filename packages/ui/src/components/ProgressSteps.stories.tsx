import type { Meta, StoryObj } from '@storybook/react';
import { ProgressSteps, SideSteps } from './ProgressSteps';

const meta: Meta<typeof ProgressSteps> = {
  title: 'Components/Navigation/ProgressSteps',
  component: ProgressSteps,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: 'Progress steps (RDY-394, I10). Step bar and numbered side steps, not interactive. Source: inventory-home round-1/final purchase-orders.css 69-81, order-list.css 128-132.' } } },
};
export default meta;
type Story = StoryObj<typeof ProgressSteps>;

export const Draft: Story = {
  args: {
    steps: [
      { label: 'Drafted', note: 'By Berto', state: 'done' },
      { label: 'Sent', note: 'Not sent. Print it, then mark it sent.', state: 'now' },
      { label: 'Received', note: 'Expected Fri 23 Oct', state: 'next' },
    ],
  },
};
export const DraftClerk: Story = {
  args: {
    steps: [
      { label: 'Drafted', note: 'By Berto', state: 'done' },
      { label: 'Sent', note: 'Not sent. Your manager marks it sent.', state: 'now' },
      { label: 'Received', note: 'Expected Fri 23 Oct', state: 'next' },
    ],
  },
};
export const Late: Story = {
  args: {
    steps: [
      { label: 'Drafted', note: 'By Berto', state: 'done' },
      { label: 'Sent', note: 'Mon 19 Oct, 9:02 AM', state: 'done' },
      { label: 'Received', note: '2 days late. Expected Wed 21 Oct', state: 'now', flag: true },
    ],
  },
};
export const PartIn: Story = {
  args: {
    steps: [
      { label: 'Drafted', note: 'By Berto', state: 'done' },
      { label: 'Sent', note: 'Mon 19 Oct, 9:02 AM', state: 'done' },
      { label: 'Part in', note: 'Rest expected Fri 23 Oct', state: 'now' },
    ],
  },
};
export const Received: Story = {
  args: {
    steps: [
      { label: 'Drafted', note: 'By Berto', state: 'done' },
      { label: 'Sent', note: 'Mon 19 Oct, 9:02 AM', state: 'done' },
      { label: 'Received', note: 'Wed 21 Oct, 10:15', state: 'done' },
    ],
  },
};
export const Cancelled: Story = {
  args: {
    steps: [
      { label: 'Drafted', note: 'By Berto', state: 'done' },
      { label: 'Sent', note: 'Mon 19 Oct, 9:02 AM', state: 'done' },
      { label: 'Cancelled', note: 'Berto, Tue 20 Oct', state: 'off' },
    ],
  },
};
const sideSteps = [
  { title: '1 · Check it', note: 'Change quantities, remove lines, add a note.' },
  { title: '2 · Print it', note: 'Print or save as PDF, then send it your usual way.' },
  { title: '3 · Mark it sent', note: 'Once it has gone. It then counts as on order everywhere.' },
];
/** Host shell: the workshop .sheet sets `container: sheet / inline-size`. Wide (over 1100px) = numbered list down the side. */
export const Side: Story = {
  render: () => (
    <div className="w-[1200px] [container:sheet/inline-size]">
      <div className="w-[320px]">
        <SideSteps aria-label="Send this list" steps={sideSteps} />
      </div>
    </div>
  ),
};
/** Sheet 1100px or narrower: three columns. */
export const SideNarrowSheet: Story = {
  render: () => (
    <div className="w-[1100px] [container:sheet/inline-size]">
      <SideSteps aria-label="Send this list" steps={sideSteps} />
    </div>
  ),
};
