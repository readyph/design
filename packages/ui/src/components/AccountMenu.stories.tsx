import { useEffect, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { AccountMenu } from './AccountMenu';

const meta: Meta<typeof AccountMenu> = {
  title: 'Components/AccountMenu',
  component: AccountMenu,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Account (avatar) menu (RDY-263, handover C3), built on \`Menu\` item styles and \`SegmentedControl\` (\`semantics="menu"\`). 304px, \`bg-overlay\` + 14px blur, header with role chip, **Account settings** (the only way into Settings), **Theme** Light / Dark / System (the only theme control; sets \`data-theme\` on \`<html>\`, System removes it) and **Log out**.

Desktop opens right of the rail, bottom-aligned with the avatar. Phone (<640px) opens under the top bar, 8px from each edge, 44px rows. Keyboard: Enter/Space/click opens on Account settings; ArrowUp on the button opens on Log out; Up/Down move and wrap (the theme row is one stop); Left/Right change theme; Home/End; Esc closes and returns focus; Tab closes.

\`\`\`tsx
<AccountMenu name="Maria Santos" email="maria@santosauto.ph" role="Owner" settingsHref="/settings" onLogout={logout} />
\`\`\``,
      },
    },
  },
  args: { name: 'Maria Santos', email: 'maria@santosauto.ph', role: 'Owner' },
};
export default meta;
type Story = StoryObj<typeof AccountMenu>;

/** The menu is portaled, so the theme goes on documentElement. */
function Theme({ theme, children }: { theme?: 'light' | 'dark'; children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    return () => root.removeAttribute('data-theme');
  }, [theme]);
  return <>{children}</>;
}

const open = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: /Account menu/ }));
};

/** Rail foot: avatar bottom-left, content behind the menu. */
const RailFrame = ({ children, busy = false }: { children: ReactNode; busy?: boolean }) => (
  <div className="flex h-[560px] w-full bg-bg">
    <div className="flex w-[52px] shrink-0 flex-col items-center justify-end border-r border-border bg-surface pb-2">{children}</div>
    {busy ? (
      <div className="grid flex-1 grid-cols-4 grid-rows-4" aria-hidden>
        {['bg-accent', 'bg-bad-dot', 'bg-ok-dot', 'bg-warn-dot', 'bg-text', 'bg-accent-tint', 'bg-raised-2', 'bg-surface'].flatMap((c, i) => [c, i % 2 ? 'bg-accent' : 'bg-bad-dot']).map((c, i) => (
          <div key={i} className={c} />
        ))}
      </div>
    ) : (
    <div className="flex-1 p-6 text-ui text-text">
      <h2 className="text-body font-semibold">Home</h2>
      <p className="text-muted">Page content sits behind the translucent menu, so the blur has something to work on.</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {['Cubao Parts Counter', 'Auto Works', 'Books'].map((t) => (
          <div key={t} className="rounded-card bg-accent-tint p-4 text-ui font-medium text-text">{t}</div>
        ))}
      </div>
    </div>
    )}
  </div>
);

export const Closed: Story = {
  render: (a) => (
    <Theme>
      <RailFrame><AccountMenu {...a} /></RailFrame>
    </Theme>
  ),
};

export const OpenLight: Story = {
  render: (a) => (
    <Theme theme="light">
      <RailFrame><AccountMenu {...a} defaultTheme="light" /></RailFrame>
    </Theme>
  ),
  play: open,
};

export const OpenDark: Story = {
  render: (a) => (
    <Theme theme="dark">
      <RailFrame><AccountMenu {...a} defaultTheme="dark" /></RailFrame>
    </Theme>
  ),
  play: open,
};

export const OpenOverBusyBackground: Story = {
  render: (a) => (
    <Theme theme="light">
      <RailFrame busy>
        <AccountMenu {...a} defaultTheme="light" />
      </RailFrame>
    </Theme>
  ),
  play: open,
};

const PhoneBar = ({ children }: { children: ReactNode }) => (
  <div className="h-[640px] w-full bg-bg">
    <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-3 text-ui font-semibold text-text">
      <span>ReadyPH</span>
      {children}
    </div>
    <div className="p-4 text-ui text-muted">Phone page content.</div>
  </div>
);

export const OpenPhoneLight: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (a) => (
    <Theme theme="light">
      <PhoneBar><AccountMenu {...a} defaultTheme="light" /></PhoneBar>
    </Theme>
  ),
  play: open,
};

export const OpenPhoneDark: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (a) => (
    <Theme theme="dark">
      <PhoneBar><AccountMenu {...a} defaultTheme="dark" /></PhoneBar>
    </Theme>
  ),
  play: open,
};

export const LongNames: Story = {
  args: { name: 'Maria Cristina Santos-Villanueva', email: 'maria.cristina.santos-villanueva@santosautoworks.com.ph' },
  render: (a) => (
    <Theme theme="light">
      <RailFrame><AccountMenu {...a} defaultTheme="light" /></RailFrame>
    </Theme>
  ),
  play: open,
};
