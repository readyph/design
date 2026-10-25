import type { Meta, StoryObj } from '@storybook/react';
import { FloppyDisk, Plus, ArrowRight, Trash } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Button, variants } from './Button';

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

const lum = (rgb: string) => {
  const c = (rgb.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((n) => Number(n) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** One rendered danger button; reads its computed colour and background after mount. */
function Measured({ name, className }: { name: string; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [m, setM] = useState<[string, string] | null>(null);
  useEffect(() => {
    const read = () => {
      if (!ref.current) return;
      const cs = getComputedStyle(ref.current);
      setM([cs.color, cs.backgroundColor]);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', read);
    return () => { mo.disconnect(); mq.removeEventListener('change', read); };
  }, []);
  const r = m ? ratio(m[0], m[1]) : 0;
  return (
    <tr>
      <td className="pr-4">{name}</td>
      <td className="pr-4"><Button ref={ref} variant="danger" className={className}>Delete</Button></td>
      <td className="pr-4">{m ? `${m[0]} on ${m[1]}` : '...'}</td>
      <td className="pr-4">{m ? `${r.toFixed(2)}:1` : ''}</td>
      <td data-testid="verdict">{m ? (r >= 4.5 ? 'AA pass' : 'AA FAIL') : ''}</td>
    </tr>
  );
}

/**
 * Measured from the rendered danger Button (getComputedStyle), in the active theme: switch light/dark in the
 * toolbar or via `data-theme` and it re-reads. The hover row applies the hover utilities (`hover:` stripped) to the
 * same variant classes, so it reflects the real hover colours. WCAG AA needs 4.5:1.
 */
export const DangerContrast: Story = {
  render: () => {
    const hover = variants.danger.split(' ').filter((c) => c.startsWith('hover:')).map((c) => c.slice(6)).join(' ');
    return (
      <table className="text-small">
        <tbody>
          <Measured name="Rest" />
          <Measured name="Hover" className={hover} />
        </tbody>
      </table>
    );
  },
};
