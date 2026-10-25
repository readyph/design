import type { Meta, StoryObj } from '@storybook/react';
import { Fact, FactsLine } from './FactsLine';

const meta: Meta<typeof FactsLine> = {
  title: 'Components/Data display/Facts line',
  component: FactsLine,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Facts line (C37): a wrapping row of short facts, 13/20 muted with bold values, separated by 3px dots. Each dot sits in a 23px gutter that is clipped by the wrapper, so a wrapped line never starts with a separator.',
          '',
          'Tones colour the bold value: `bad` / `warn` for time left, `ok` for "Leda acts in X", `muted` for "Leda can\'t act in X yet". Renders a `ul` of `li`; add `aria-label` to name it.',
          '',
          '```tsx',
          "import { FactsLine, Fact } from '@readyph/ui';",
          '',
          '<FactsLine aria-label="Case facts">',
          '  <Fact value="Quezon City">Filed in</Fact>',
          '  <Fact tone="bad" value="2 days">Closes in</Fact>',
          '</FactsLine>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof FactsLine>;

export const Playground: Story = {
  render: () => (
    <FactsLine aria-label="Case facts">
      <Fact value="Business permit renewal">Filing</Fact>
      <Fact tone="bad" value="2 days">Closes in</Fact>
      <Fact tone="ok" value="Quezon City">Leda acts in</Fact>
    </FactsLine>
  ),
};

export const Tones: Story = {
  render: () => (
    <FactsLine aria-label="Tones">
      <Fact value="Default">Value in</Fact>
      <Fact tone="bad" value="2 days">Closes in</Fact>
      <Fact tone="warn" value="9 days">Closes in</Fact>
      <Fact tone="ok" value="Quezon City">Leda acts in</Fact>
      <Fact tone="muted" value="Cebu City">{"Leda can't act in"}</Fact>
    </FactsLine>
  ),
};

/** Narrow container forces wrapping; no line starts with a dot. */
export const Wrapping: Story = {
  render: () => (
    <div className="w-[300px] rounded-ctl border border-border bg-surface p-3">
      <FactsLine aria-label="Wrapping facts">
        <Fact value="Business permit renewal">Filing</Fact>
        <Fact tone="bad" value="2 days">Closes in</Fact>
        <Fact tone="ok" value="Quezon City">Leda acts in</Fact>
        <Fact tone="muted" value="Cebu City">{"Leda can't act in"}</Fact>
        <Fact value="12">Documents</Fact>
        <Fact value="Maria Santos">Owner</Fact>
      </FactsLine>
    </div>
  ),
};

export const LongUnbreakable: Story = {
  render: () => (
    <div className="w-[200px] rounded-ctl border border-border bg-surface p-3">
      <FactsLine aria-label="Long value facts">
        <Fact value="Supercalifragilisticexpialidocious-Logistics-Warehouse">Platform</Fact>
        <Fact tone="bad" value="2 days">Closes in</Fact>
      </FactsLine>
    </div>
  ),
};
