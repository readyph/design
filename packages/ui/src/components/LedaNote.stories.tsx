import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { LedaNote, LedaNoteLink, LedaRefusal } from './LedaNote';
import { Button } from './Button';

const meta: Meta<typeof LedaNote> = {
  title: 'Components/Leda/LedaNote',
  component: LedaNote,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Leda note and refusal (C38, RDY-298). `LedaNote` is a raised box (6px radius, 10x12px padding, 14/20) with the 16px Leda tile, the text and an optional 12px muted `byline` ("Leda, 9:12 AM"). `LedaRefusal` is the same box with a Prohibit icon, a one-line reason and a way out (`action`: `LedaNoteLink` or a secondary `Button`).',
          '',
          'Rules. Max two sentences is writing guidance, not enforced: text is never truncated, it wraps (long unbreakable strings too, down to 320px). Both are `role="note"` with an accessible name (`label`), not `alert` or `status`: they are answers, not interruptions. The tile and the icon are decorative; the text carries the meaning. They sit on `--raised`, so they show on `--frame` and on `--surface` in both themes; text is `--text`, byline `--muted` (never `--faint`). `className` is applied first, so it can add margin or width but cannot change the box layout, colours or padding.',
          '',
          '```tsx',
          "import { LedaNote, LedaRefusal, LedaNoteLink, Button } from '@readyph/ui';",
          '',
          '<LedaNote byline="Leda, 9:12 AM">Parts Stockroom is 3 days behind on the alternator.</LedaNote>',
          '<LedaRefusal action={<LedaNoteLink href="/auto-works">Open Auto Works</LedaNoteLink>}>Leda can\'t write to Repair shop yet.</LedaRefusal>',
          '<LedaRefusal action={<Button variant="secondary">Go to Parts Stockroom</Button>}>Leda can\'t change stock levels here.</LedaRefusal>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof LedaNote>;

const onFrame = (el: ReactNode) => <div className="w-[420px] max-w-full bg-frame p-4">{el}</div>;
const onSurface = (el: ReactNode) => <div className="w-[420px] max-w-full bg-surface p-4">{el}</div>;

const note = <LedaNote byline="Leda, 9:12 AM">The alternator for JO-0412 is out of stock. Parts Stockroom has one on the next delivery.</LedaNote>;
const refusal = (
  <LedaRefusal action={<LedaNoteLink href="#auto-works">Open Auto Works</LedaNoteLink>}>Leda can't write to Repair shop yet.</LedaRefusal>
);

export const Note: Story = { render: () => onFrame(<LedaNote>Two oil filters left. I would reorder before Friday.</LedaNote>) };
export const NoteWithByline: Story = { render: () => onFrame(note) };
export const NoteOnSurface: Story = { render: () => onSurface(note) };
export const Refusal: Story = { render: () => onFrame(refusal) };
export const RefusalOnSurface: Story = { render: () => onSurface(refusal) };
export const RefusalWithButton: Story = {
  render: () => onFrame(<LedaRefusal action={<Button variant="secondary">Go to Parts Stockroom</Button>}>Leda can't change stock levels from here.</LedaRefusal>),
};
export const RefusalWithoutAction: Story = { render: () => onFrame(<LedaRefusal>Leda can't see Payroll.</LedaRefusal>) };

export const NarrowAndLong: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex w-[320px] max-w-full flex-col gap-3 bg-frame p-3">
      <LedaNote byline="Leda, 9:12 AM">Reorder level for AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA is 30. I read it from the stockroom sheet this morning and the supplier lead time is nine days.</LedaNote>
      <LedaRefusal action={<LedaNoteLink href="#auto-works">Open Auto Works</LedaNoteLink>}>Leda can't write to Repair shop yet, and the shop owner has to switch it on first.</LedaRefusal>
      <LedaRefusal action={<Button variant="secondary">Go to Parts Stockroom</Button>}>Leda can't change this.</LedaRefusal>
    </div>
  ),
};
