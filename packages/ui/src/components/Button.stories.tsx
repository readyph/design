import type { Meta, StoryObj } from '@storybook/react';
import { FloppyDisk, Plus, ArrowRight, Trash } from '@phosphor-icons/react';
import { Button } from './Button';
import { surfaces, status } from '../tokens/colors';

const colors = { ...surfaces, ...status };

const meta: Meta<typeof Button> = {
  title: 'Components/Actions/Button',
  component: Button,
  args: { children: 'Button', variant: 'primary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'text', 'danger'] },
    leftIcon: { table: { disable: true } },
    rightIcon: { table: { disable: true } },
  },
  parameters: { docs: { description: { component: 'C33. 32px tall (40 phone, 44 in phone action bars), 5px radius, 13px / 500. No pill, no sharp buttons. `text` replaces the legacy `subtle`; the `size` prop is gone.' } } },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="text">Text</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button leftIcon={Plus}>New item</Button>
      <Button variant="secondary" leftIcon={FloppyDisk}>Save</Button>
      <Button rightIcon={ArrowRight}>Continue</Button>
      <Button variant="danger" leftIcon={Trash}>Delete</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <Button variant="secondary" disabled>Disabled</Button>
      <Button variant="text" loading>Loading</Button>
    </div>
  ),
};

export const ActionBar: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="secondary" actionBar fullWidth>Cancel</Button>
      <Button actionBar fullWidth>Save</Button>
    </div>
  ),
};

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Danger ink (`--bad-on`) against `--bad` (rest) and `--bad-dot` (hover), computed from the tokens. WCAG AA needs 4.5:1. */
export const DangerContrast: Story = {
  render: () => {
    const rows = [
      ['Light rest', colors['bad-on'][0], colors['bad'][0]],
      ['Light hover', colors['bad-on'][0], colors['bad-dot'][0]],
      ['Dark rest', colors['bad-on'][1], colors['bad'][1]],
      ['Dark hover', colors['bad-on'][1], colors['bad-dot'][1]],
    ] as const;
    return (
      <table className="text-small">
        <tbody>
          {rows.map(([name, fg, bg]) => {
            const r = ratio(fg, bg);
            return (
              <tr key={name}>
                <td className="pr-4">{name}</td>
                <td className="pr-4">{fg} on {bg}</td>
                <td className="pr-4">{r.toFixed(2)}:1</td>
                <td>{r >= 4.5 ? 'AA pass' : 'AA FAIL'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  },
};
