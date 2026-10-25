import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LedaMark, LedaThinking, LedaWordmark } from './Leda';

const meta: Meta<typeof LedaMark> = {
  title: 'Components/Leda mark',
  component: LedaMark,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof LedaMark>;

export const Rest: Story = {
  render: () => (
    <div className="flex items-end gap-6 text-text">
      <LedaMark size={16} />
      <LedaMark size={24} />
      <LedaMark size={48} />
      <LedaMark size={96} />
      <LedaMark size={16} tile />
      <LedaMark size={48} tile />
      <LedaMark size={96} tile />
    </div>
  ),
};

export const Wordmark: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-text">
      <LedaWordmark height={24} />
      <LedaWordmark height={48} />
      <span className="text-ld-deep"><LedaWordmark mono height={32} /></span>
    </div>
  ),
};

export const Aurora: Story = {
  name: 'Thinking (Aurora)',
  render: () => {
    const [on, setOn] = useState(true);
    return (
      <div className="flex flex-col gap-4 text-text">
        <button type="button" className="self-start rounded-ctl border border-border px-3 py-1 text-ui" onClick={() => setOn(!on)}>
          {on ? 'Answer arrives (settle 300 ms)' : 'Start thinking'}
        </button>
        <div className="flex items-center gap-6">
          <LedaThinking thinking={on} size={24} />
          <LedaThinking thinking={on} size={40} tile />
          <LedaThinking thinking={on} size={96} />
          <LedaThinking thinking={on} size={96} tile />
        </div>
        <p className="text-small text-muted">Reduced motion: no movement. Aurora (thinking) shows a still teal shift and a "Thinking…" label in a reserved slot; Glint and Scan stay still with no tint. Replay Glint/Scan with `once` and a changing `key`.</p>
      </div>
    );
  },
};

export const Glint: Story = {
  name: 'Glint (Home overview, 88 px)',
  render: () => (
    <div className="flex items-center gap-8 text-text">
      <LedaMark size={88} effect="glint" active />
      <LedaMark size={88} effect="glint" active tile />
      <LedaMark size={88} effect="glint" active once />
    </div>
  ),
};

export const Scan: Story = {
  name: 'Scan (Ask Leda bars)',
  render: () => (
    <div className="flex items-center gap-8 text-text">
      <LedaMark size={24} effect="scan" active />
      <LedaMark size={88} effect="scan" active />
      <LedaMark size={88} effect="scan" active tile />
    </div>
  ),
};
