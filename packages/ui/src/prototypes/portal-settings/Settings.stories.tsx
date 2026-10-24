import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from '../../components/Notice';
import type { ThemePreference } from '../../utils/themeScript';
import { MISSING_IN_KIT, SettingsPage, type SettingsPageProps } from './Settings';
import { ThemeSeed } from './ThemeSeed';

/**
 * PROTOTYPE (RDY-180, epic RDY-173 features 6 and 7) - Portal Settings on the RDY-175 shell.
 * Each story is the full responsive page at the real viewport; use the viewport toolbar for
 * 1440 / 1024 / 390. Theme comes from the real ThemeProvider (seeded per story), so the toolbar
 * theme is off here (`themeManaged`). Change it live in Account > Appearance or the tenant menu.
 * Leda entry point: Ask Leda in the top bar, context "Settings · <tab>".
 */
type Args = SettingsPageProps & { preference: ThemePreference };

const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

const meta: Meta<Args> = {
  title: 'Prototypes/Portal/[For Review] Settings',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    themeManaged: true,
    viewport: { viewports, defaultViewport: 'w1440' },
  },
  argTypes: {
    preference: { control: 'inline-radio', options: ['system', 'light', 'dark'] },
    tab: { control: 'inline-radio', options: ['company', 'schedule', 'account', 'billing'] },
    role: { control: 'inline-radio', options: ['admin', 'member'] },
    modal: { control: 'inline-radio', options: ['none', 'password', 'plan'] },
    leda: { control: 'inline-radio', options: ['closed', 'empty', 'conversation', 'confirm'] },
  },
  args: { preference: 'light', tab: 'company', role: 'admin', modal: 'none', pending: false, leda: 'closed' },
  render: ({ preference, ...props }) => (
    <ThemeSeed key={`${preference}-${props.tab}-${props.modal}-${props.role}-${props.leda}`} preference={preference}>
      <SettingsPage {...props} />
    </ThemeSeed>
  ),
};
export default meta;
type Story = StoryObj<Args>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });

/* 1440 */
export const Company: Story = { name: '1440 / Company' };
export const CompanyDark: Story = { name: '1440 / Company, dark', args: { preference: 'dark' } };
export const Schedule: Story = { name: '1440 / Schedule', args: { tab: 'schedule' } };
export const Account: Story = { name: '1440 / Account + Appearance', args: { tab: 'account' } };
export const AccountDark: Story = { name: '1440 / Account + Appearance, dark', args: { tab: 'account', preference: 'dark' } };
export const AccountSystem: Story = {
  name: '1440 / Account, System (default)',
  args: { tab: 'account', preference: 'system' },
};
export const ChangePassword: Story = { name: '1440 / Account: change password', args: { tab: 'account', modal: 'password' } };
export const Billing: Story = { name: '1440 / Billing', args: { tab: 'billing' } };
export const BillingPending: Story = { name: '1440 / Billing: request pending', args: { tab: 'billing', pending: true } };
export const BillingRequest: Story = { name: '1440 / Billing: request plan change', args: { tab: 'billing', modal: 'plan' } };
export const BillingDark: Story = { name: '1440 / Billing, dark', args: { tab: 'billing', preference: 'dark' } };
export const WithLeda: Story = { name: '1440 / Ask Leda open', args: { tab: 'schedule', leda: 'empty' } };
export const Member: Story = { name: '1440 / Member: Account only', args: { role: 'member', tab: 'account' } };

/* 1024 */
export const Laptop: Story = { name: '1024 / Company', parameters: at('w1024') };
export const LaptopLeda: Story = {
  name: '1024 / Account, Leda open (sidebar folds)',
  args: { tab: 'account', leda: 'empty' },
  parameters: at('w1024'),
};
export const LaptopDark: Story = { name: '1024 / Billing, dark', args: { tab: 'billing', preference: 'dark' }, parameters: at('w1024') };

/* 390 */
export const Phone: Story = { name: '390 / Company', parameters: at('w390') };
export const PhoneSchedule: Story = { name: '390 / Schedule', args: { tab: 'schedule' }, parameters: at('w390') };
export const PhoneAccountDark: Story = {
  name: '390 / Account + Appearance, dark',
  args: { tab: 'account', preference: 'dark' },
  parameters: at('w390'),
};
export const PhoneBilling: Story = { name: '390 / Billing', args: { tab: 'billing' }, parameters: at('w390') };
export const PhonePassword: Story = {
  name: '390 / Change password',
  args: { tab: 'account', modal: 'password' },
  parameters: at('w390'),
};

/* Notes for Leonardo */
export const KitGaps: Story = {
  name: 'Notes: missing in kit',
  render: () => (
    <ThemeSeed preference="light">
      <div className="ds-root min-h-screen bg-surface p-gutter font-sans text-ink">
        <Notice tone="info" title="Missing in kit (for Leonardo)">
          <ul className="list-disc pl-4">
            {MISSING_IN_KIT.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Notice>
      </div>
    </ThemeSeed>
  ),
};
