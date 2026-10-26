import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TryIt, type TryItProps } from './TryIt';
import { Button } from './Button';
import { defaultSwitches, sampleAbouts, sampleAsk, sampleQuestions } from './TryIt.sample';

const meta: Meta<typeof TryIt> = {
  title: 'Components/Overlays/Try it',
  component: TryIt,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Try it tester (C30) on `Modal size="panel"` (720 x 640, full screen on a phone) with the Leda mark in the header well. "About" picker (Any business, The company or a platform; `aboutFixed` on a platform page shows it as text), the customer question picker (long questions wrap in the button and the list), the customer line, Leda\'s answer or refusal with the 16px tile, and one reason line.',
          'It asks on open and on every change, with the switches as they are now (`ask` returns the answer, sync or async). "Thinking…" for at least 0.9s with Aurora on the header mark and the reply tile; the reply is laid out under it, so nothing moves. Focus starts on the question and stays there: if a run ends with focus lost, it returns to the question through `focusIfLost`. Under reduced motion Aurora is a still teal shift and the "Thinking…" text is the cue.',
          '',
          '```tsx',
          "import { TryIt } from '@readyph/ui';",
          '',
          '<TryIt open={open} onOpenChange={setOpen} abouts={abouts} about="auto" aboutFixed',
          '  questions={questions} ask={(about, q) => answerFromTopics(about, q)} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TryIt>;

function Demo(props: Partial<TryItProps>) {
  const [open, setOpen] = useState(true);
  return (
    <main className="min-h-screen bg-surface p-pad text-text">
      <h1 className="text-title">Memory</h1>
      <Button variant="secondary" className="mt-4" onClick={() => setOpen(true)}>Try it</Button>
      <TryIt open={open} onOpenChange={setOpen} abouts={sampleAbouts} questions={sampleQuestions} ask={(a, q) => sampleAsk(a, q, defaultSwitches)} {...props} />
    </main>
  );
}

export const AnyBusiness: Story = { render: () => <Demo about="any" question="prices" /> };
export const FixedToPlatform: Story = { render: () => <Demo about="auto" aboutFixed question="hours" /> };
export const Refusal: Story = { render: () => <Demo about="any" question="stock" /> };
export const BlockedQuestion: Story = { render: () => <Demo about="company" question="pay" /> };
export const LongQuestion: Story = { render: () => <Demo about="parts" question="stock" /> };
export const CouldntLoad: Story = {
  render: () => <Demo about="auto" aboutFixed question="prices" ask={() => Promise.reject(new Error('offline'))} />,
};
