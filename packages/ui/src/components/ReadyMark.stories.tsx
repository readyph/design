import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { ReadyLogo, ReadyMark } from './ReadyMark';

const meta: Meta<typeof ReadyMark> = {
  title: 'Foundations/Brand',
  component: ReadyMark,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `The Ready brand (RDY-363, \`workshop/prototypes/ready-logo/decision.md\`): the diving falcon, pose A, flat triangles in three tones (lit, mid, deep), the horizontal lockup and the swoop-assemble animation. The brand name is exactly **Ready**. The tones are the \`--rd-*\` tokens (vermilion, a brand tone: never use it for status or alerts) and follow light and dark with the page. Pose B, the R-incorporated versions and the shine animation are not used. Trademark: **no search has been done yet** and decision.md says one is needed before public use. Leda has its own mark and is unchanged.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ReadyMark>;

const Panel = ({ title, className, children }: { title: string; className: string; children: ReactNode }) => (
  <figure className={`m-0 flex flex-col gap-3 rounded-card border border-border p-5 ${className}`}>
    <figcaption className={className.includes('#16110F') ? 'text-small text-white/80' : className.includes('bg-white') ? 'text-small text-[#4b5563]' : 'text-small text-muted'}>{title}</figcaption>
    <div className="flex flex-wrap items-end gap-6">{children}</div>
  </figure>
);

export const Marks: Story = {
  name: 'Mark',
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Panel title="Colour, light tones" className="bg-white">
        <ReadyMark scheme="light" size={96} />
        <ReadyMark scheme="light" size={64} />
      </Panel>
      <Panel title="Colour, on-dark tones" className="bg-[#16110F]">
        <ReadyMark scheme="dark" size={96} />
        <ReadyMark scheme="dark" size={64} />
      </Panel>
      <Panel title="One colour, black" className="bg-white">
        <ReadyMark tone="black" size={96} />
        <ReadyMark tone="black" size={64} />
      </Panel>
      <Panel title="One colour, white" className="bg-[#16110F]">
        <ReadyMark tone="white" size={96} />
        <ReadyMark tone="white" size={64} />
      </Panel>
    </div>
  ),
};

export const SmallCuts: Story = {
  name: 'Sizes and small cuts',
  parameters: { docs: { description: { story: 'At 32px and below the small cut is used automatically (no cheek facets, a bigger eye). At 16px the beak hook and eye are lost, so it reads as a red bird in a dive: the favicon is the weak spot. The rail, the app icon and anything 24px and up carry the identity.' } } },
  render: () => (
    <div className="flex flex-wrap items-end gap-6 text-text">
      {[16, 24, 32, 48, 64, 128].map((n) => (
        <figure key={n} className="m-0 flex flex-col items-center gap-2">
          <ReadyMark size={n} />
          <figcaption className="text-small text-muted">{n}{n <= 32 ? ' small' : ''}</figcaption>
        </figure>
      ))}
      <figure className="m-0 flex flex-col items-center gap-2">
        <ReadyMark size={48} cut="full" />
        <figcaption className="text-small text-muted">48 full cut</figcaption>
      </figure>
    </div>
  ),
};

export const AppTile: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <ReadyMark tone="tile" size={128} />
      <ReadyMark tone="tile" size={64} />
      <ReadyMark tone="tile" size={32} />
    </div>
  ),
};

export const Lockup: Story = {
  parameters: { docs: { description: { story: 'The horizontal lockup. The tagline "Are you ready?" belongs on this lockup only and is optional: the mark and the wordmark work without it. The tagline is live text; outline it in any kit.' } } },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title="Colour" className="bg-white"><ReadyLogo scheme="light" size={64} /></Panel>
        <Panel title="Colour, on dark" className="bg-[#16110F]"><ReadyLogo scheme="dark" size={64} /></Panel>
        <Panel title="With tagline" className="bg-white"><ReadyLogo scheme="light" size={64} tagline /></Panel>
        <Panel title="With tagline, on dark" className="bg-[#16110F]"><ReadyLogo scheme="dark" size={64} tagline /></Panel>
        <Panel title="Black" className="bg-white"><ReadyLogo tone="black" size={48} /></Panel>
        <Panel title="White" className="bg-[#16110F]"><ReadyLogo tone="white" size={48} /></Panel>
      </div>
      <div className="flex items-center gap-6 text-text">
        <ReadyLogo size={24} />
        <ReadyLogo size={32} />
        <ReadyLogo size={48} />
      </div>
    </div>
  ),
};

export const Animation: Story = {
  name: 'Animation (swoop-assemble)',
  parameters: {
    docs: { description: { story: 'Swoop-assemble: the facets fly in along the dive one by one, head first, 70 ms apart (1.32 s), then swap back to the static paths, so the rest frame is the static mark. It plays once, never loops. In the icon rail it plays on mount and on hover or keyboard focus. The designer found the facets look like confetti at 24 to 32px; it is the owner\'s choice for the rail. With `prefers-reduced-motion` it is a 400 ms fade.' } },
  },
  render: () => {
    const [run, setRun] = useState(1);
    return (
      <div className="flex flex-col gap-4 text-text">
        <div className="flex items-center gap-3">
          <Button onClick={() => setRun((n) => n + 1)}>Replay</Button>
          <p className="m-0 text-small text-muted">Reduced motion: the animation becomes a 400 ms fade (set it in the operating system or the browser's rendering tools to see it).</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel title="256px, light" className="bg-white"><ReadyMark scheme="light" size={256} animate={run} /></Panel>
          <Panel title="256px, dark" className="bg-[#16110F]"><ReadyMark scheme="dark" size={256} animate={run} /></Panel>
          <Panel title="Rail size, 28px (light, dark) and 64px" className="bg-frame">
            <ReadyMark size={28} animate={run} />
            <ReadyMark scheme="dark" size={28} animate={run} />
            <ReadyMark size={64} animate={run} />
          </Panel>
        </div>
      </div>
    );
  },
};
