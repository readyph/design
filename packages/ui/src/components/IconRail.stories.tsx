import { useEffect, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { BookOpen, FileText, Graph, House, Plus, Users } from '@phosphor-icons/react';
import { AccountMenu } from './AccountMenu';
import { PlatformShell } from './PlatformShell';
import { CountBadge, IconRail, IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from './IconRail';

const meta: Meta<typeof IconRail> = {
  title: 'Components/IconRail',
  component: IconRail,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Icon rail (RDY-262, handover C2): the 52px \`nav\` on the \`--frame\` colour. Stack: \`IconRailMark\` (the "R", 32px, links Home), 36x36 \`IconRailItem\`s (19px icons, 5px radius), "+" add platform, \`IconRailSpacer\`, then \`IconRailFoot\` with the \`AccountMenu\`. **No Settings item**: Settings lives in the avatar menu.

States: default muted, hover \`--frame-hover\`, current \`--frame-active\` + \`aria-current="page"\`, optional count badge (\`99+\` above 99; the accessible name becomes "Team, 3"). The tooltip (right, 12px, ink) shows on hover and on keyboard focus; Esc dismisses. Focus rings use the frame colour as the gap.

**In PlatformShell (RDY-261):** the shell wraps its \`rail\` slot in its own labelled \`nav\`, so pass \`IconRailContent\` (same layout, colour and tooltip timing, no landmark): \`<PlatformShell rail={<IconRailContent>…</IconRailContent>} />\`. Use \`IconRail\` only where there is no shell. \`IconRailItem\` also works alone (it mounts its own tooltip provider when none is above it).

**Phone (RDY-261):** the rail does not render at phone width; the shell swaps in the 60px bottom nav. \`IconRailItem\` (use \`tooltip={false}\`, size via \`className\`) and \`CountBadge\` are reusable there.

\`\`\`tsx
<IconRail>
  <IconRailMark href="/" />
  <IconRailItem icon={House} label="Home" href="/" current />
  <IconRailItem icon={Users} label="Team" href="/team" count={3} />
  <IconRailItem icon={Plus} label="Add a platform" onClick={openMarketplace} className="mt-2" />
  <IconRailSpacer />
  <IconRailFoot><AccountMenu name="Maria Santos" email="maria@santosauto.ph" role="Owner" /></IconRailFoot>
</IconRail>
\`\`\``,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof IconRail>;

function Theme({ theme, children }: { theme?: 'light' | 'dark'; children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    return () => root.removeAttribute('data-theme');
  }, [theme]);
  return <>{children}</>;
}

const Frame = ({ children }: { children: ReactNode }) => (
  <div className="flex h-[560px] w-full bg-frame">
    {children}
    <main className="m-2 ml-0 flex-1 rounded-card border border-border bg-surface p-6 text-ui text-text">
      <h1 className="text-body font-semibold">Home</h1>
      <p className="text-muted">The sheet sits on the surface; the rail sits on the frame.</p>
    </main>
  </div>
);

const FullRail = ({ team = 3 }: { team?: number }) => (
  <IconRail>
    <IconRailMark href="#home" />
    <IconRailItem icon={House} label="Home" href="#home" current />
    <IconRailItem icon={Graph} label="Platforms" href="#platforms" />
    <IconRailItem icon={FileText} label="Reports" href="#reports" />
    <IconRailItem icon={Users} label="Team" href="#team" count={team} />
    <IconRailItem icon={BookOpen} label="Memory" href="#memory" />
    <IconRailItem icon={Plus} label="Add a platform" onClick={() => undefined} className="mt-2" />
    <IconRailSpacer />
    <IconRailFoot>
      <AccountMenu name="Maria Santos" email="maria@santosauto.ph" role="Owner" applyToDocument={false} />
    </IconRailFoot>
  </IconRail>
);

export const Light: Story = {
  render: () => (
    <Theme theme="light">
      <Frame><FullRail /></Frame>
    </Theme>
  ),
};

export const Dark: Story = {
  render: () => (
    <Theme theme="dark">
      <Frame><FullRail /></Frame>
    </Theme>
  ),
};

/** Hover (tooltip to the right) on Platforms. */
export const TooltipOnHover: Story = {
  render: () => (
    <Theme theme="light">
      <Frame><FullRail /></Frame>
    </Theme>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('link', { name: 'Platforms' }));
  },
};

/** Keyboard: Tab to Platforms; the tooltip shows on focus and the ring uses the frame colour. */
export const TooltipOnFocusDark: Story = {
  render: () => (
    <Theme theme="dark">
      <Frame><FullRail /></Frame>
    </Theme>
  ),
  play: async () => {
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
  },
};

const States = ({ theme }: { theme: 'light' | 'dark' }) => (
  <Theme theme={theme}>
    <div className="flex h-[360px] w-full bg-frame">
      <h1 className="sr-only">Item states</h1>
      <IconRail aria-label="Item states">
        <IconRailItem icon={House} label="Default" href="#a" />
        <IconRailItem icon={Graph} label="Current" href="#b" current />
        <IconRailItem icon={Users} label="Count" href="#c" count={4} />
        <IconRailItem icon={FileText} label="Count current" href="#d" count={12} current />
        <IconRailItem icon={BookOpen} label="Count overflow" href="#e" count={240} />
        <IconRailItem icon={Plus} label="Button item" onClick={() => undefined} />
      </IconRail>
      <main className="flex items-start gap-3 p-4">
        <span className="relative inline-block size-9 rounded-control bg-frame-active" aria-hidden>
          <CountBadge count={7} />
        </span>
        <span className="text-small text-muted">CountBadge standalone (phone bottom nav reuses it)</span>
      </main>
    </div>
  </Theme>
);

export const StatesLight: Story = { render: () => <States theme="light" /> };
export const StatesDark: Story = { render: () => <States theme="dark" /> };

/** Avatar menu open from the rail foot: the button holds `--frame-active`. */
export const AccountMenuOpen: Story = {
  render: () => (
    <Theme theme="light">
      <Frame><FullRail /></Frame>
    </Theme>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Account menu/ }));
  },
};

const ShellRail = () => (
  <IconRailContent>
    <IconRailMark href="#home" />
    <IconRailItem icon={House} label="Home" href="#home" current />
    <IconRailItem icon={Graph} label="Platforms" href="#platforms" />
    <IconRailItem icon={Users} label="Team" href="#team" count={3} />
    <IconRailItem icon={Plus} label="Add a platform" onClick={() => undefined} className="mt-2" />
    <IconRailSpacer />
    <IconRailFoot>
      <AccountMenu name="Maria Santos" email="maria@santosauto.ph" role="Owner" applyToDocument={false} />
    </IconRailFoot>
  </IconRailContent>
);

const phoneTabs = [
  [House, 'Home', '#home', 0],
  [Graph, 'Platforms', '#platforms', 0],
  [FileText, 'Reports', '#reports', 0],
  [Users, 'Team', '#team', 3],
] as const;

/** Phone bottom nav (60px): the same item with `tooltip={false}`, stretched to fill each tab. */
const ShellPhoneNav = () => (
  <div className="flex h-[60px] w-full items-center justify-around px-2">
    {phoneTabs.map(([Ic, label, href, count], i) => (
      <IconRailItem key={label} icon={Ic} label={label} href={href} count={count} current={i === 0} tooltip={false} className="h-11 w-14" />
    ))}
  </div>
);

const shellPage = (
  <div className="p-pad text-ui">
    <h1 className="m-0 text-body font-semibold">Home</h1>
    <p className="text-muted">The rail sits in the shell's labelled nav slot.</p>
  </div>
);

/** The rail in the real PlatformShell `rail` slot: exactly one navigation landmark at desktop width. */
export const InShellRailSlot: Story = {
  render: () => (
    <Theme theme="light">
      <PlatformShell rail={<ShellRail />} phoneNav={<ShellPhoneNav />} status={<span>All running</span>}>
        {shellPage}
      </PlatformShell>
    </Theme>
  ),
};

/** Same shell at phone width: the rail hides and the bottom nav reuses `IconRailItem` + `CountBadge`. */
export const InShellPhoneNav: Story = {
  ...InShellRailSlot,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
