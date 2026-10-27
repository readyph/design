import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from './Notice';
import { Button } from './Button';

const meta: Meta<typeof Notice> = {
  title: 'Components/Feedback/Notice',
  component: Notice,
  tags: ['autodocs'],
  args: { tone: 'info', title: 'Heads up', children: 'Your changes apply to every branch.' },
  parameters: { docs: { description: { component: 'Inline notice (RDY-314). Tones info, ok, warn, bad. `warn` and `bad` use `role="alert"`, the others `role="status"`. The action is a real button or link.' } } },
};
export default meta;
type Story = StoryObj<typeof Notice>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex w-full max-w-[var(--place)] flex-col gap-3">
      <Notice tone="info" title="Info">A neutral note.</Notice>
      <Notice tone="ok" title="Saved">Settings were saved.</Notice>
      <Notice tone="warn" title="Check this">Stock count is out of date.</Notice>
      <Notice tone="bad" title="Could not save" action={<Button variant="secondary">Retry</Button>}>The server did not respond.</Notice>
      <Notice tone="info">Text only, no title.</Notice>
    </div>
  ),
};
