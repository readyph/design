import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from '../../components/Notice';
import type { ThemePreference } from '../../utils/themeScript';
import { ThemeSeed } from '../portal-settings/ThemeSeed';
import {
  HandoffPage,
  InviteAcceptPage,
  MISSING_IN_KIT,
  PasswordResetPage,
  SignInPage,
  type HandoffState,
  type InviteState,
  type ResetStep,
  type SignInState,
} from './Auth';

/**
 * PROTOTYPE (RDY-180, epic RDY-173 features 6 and 7) - Portal auth pages. Each story is the full
 * page at the real viewport (1440 / 1024 / 390 in the viewport toolbar). Auth respects the stored
 * theme: the real ThemeProvider reads `readyph.theme` (seeded per story; default System), so the
 * toolbar theme is off here. No Leda on auth pages (unauthenticated).
 */
type Page = 'sign-in' | 'handoff' | 'invite' | 'reset';
type Args = {
  page: Page;
  preference: ThemePreference;
  signIn?: SignInState;
  handoff?: HandoffState;
  invite?: InviteState;
  reset?: ResetStep;
};

const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

function render({ page, preference, signIn, handoff, invite, reset }: Args) {
  const body =
    page === 'sign-in' ? (
      <SignInPage state={signIn} />
    ) : page === 'handoff' ? (
      <HandoffPage state={handoff} />
    ) : page === 'invite' ? (
      <InviteAcceptPage state={invite} />
    ) : (
      <PasswordResetPage step={reset} />
    );
  return (
    <ThemeSeed key={`${preference}-${page}-${signIn}-${handoff}-${invite}-${reset}`} preference={preference}>
      {body}
    </ThemeSeed>
  );
}

const meta: Meta<Args> = {
  title: 'Prototypes/Portal/[For Review] Auth',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    themeManaged: true,
    viewport: { viewports, defaultViewport: 'w1440' },
  },
  argTypes: {
    page: { control: 'inline-radio', options: ['sign-in', 'handoff', 'invite', 'reset'] },
    preference: { control: 'inline-radio', options: ['system', 'light', 'dark'] },
    signIn: { control: 'inline-radio', options: ['default', 'error', 'continue'] },
    handoff: { control: 'inline-radio', options: ['opening', 'expired', 'no-access', 'failed'] },
    invite: { control: 'inline-radio', options: ['form', 'errors', 'expired'] },
    reset: { control: 'inline-radio', options: ['request', 'sent', 'new', 'done', 'expired'] },
  },
  args: { page: 'sign-in', preference: 'light', signIn: 'default', handoff: 'opening', invite: 'form', reset: 'request' },
  render,
};
export default meta;
type Story = StoryObj<Args>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });
const dark = { preference: 'dark' as const };

/* Sign in */
export const SignIn: Story = { name: 'Sign in / 1440' };
export const SignInDark: Story = { name: 'Sign in / 1440, dark', args: dark };
export const SignInSystem: Story = { name: 'Sign in / 1440, System (default)', args: { preference: 'system' } };
export const SignInError: Story = { name: 'Sign in / wrong password', args: { signIn: 'error' } };
export const SignInContinue: Story = { name: 'Sign in / continue after expiry', args: { signIn: 'continue' } };
export const SignInLaptop: Story = { name: 'Sign in / 1024', parameters: at('w1024') };
export const SignInPhone: Story = { name: 'Sign in / 390', parameters: at('w390') };
export const SignInPhoneDark: Story = { name: 'Sign in / 390, dark', args: dark, parameters: at('w390') };

/* Handoff */
const handoff = (state: HandoffState) => ({ page: 'handoff' as const, handoff: state });
export const HandoffOpening: Story = { name: 'Handoff / opening', args: handoff('opening') };
export const HandoffExpired: Story = { name: 'Handoff / session expired', args: handoff('expired') };
export const HandoffNoAccess: Story = { name: 'Handoff / no access', args: handoff('no-access') };
export const HandoffFailed: Story = { name: 'Handoff / not responding', args: handoff('failed') };
export const HandoffDark: Story = { name: 'Handoff / not responding, dark', args: { ...handoff('failed'), ...dark } };
export const HandoffPhone: Story = { name: 'Handoff / 390, expired', args: handoff('expired'), parameters: at('w390') };

/* Invite accept */
const invite = (state: InviteState) => ({ page: 'invite' as const, invite: state });
export const Invite: Story = { name: 'Invite / accept', args: invite('form') };
export const InviteErrors: Story = { name: 'Invite / validation errors', args: invite('errors') };
export const InviteExpired: Story = { name: 'Invite / expired', args: invite('expired') };
export const InviteDark: Story = { name: 'Invite / accept, dark', args: { ...invite('form'), ...dark } };
export const InviteLaptop: Story = { name: 'Invite / 1024', args: invite('form'), parameters: at('w1024') };
export const InvitePhone: Story = { name: 'Invite / 390', args: invite('form'), parameters: at('w390') };

/* Password reset */
const reset = (step: ResetStep) => ({ page: 'reset' as const, reset: step });
export const ResetRequest: Story = { name: 'Reset / request link', args: reset('request') };
export const ResetSent: Story = { name: 'Reset / check email', args: reset('sent') };
export const ResetNew: Story = { name: 'Reset / set new password', args: reset('new') };
export const ResetDone: Story = { name: 'Reset / updated', args: reset('done') };
export const ResetExpired: Story = { name: 'Reset / link expired', args: reset('expired') };
export const ResetDark: Story = { name: 'Reset / set new password, dark', args: { ...reset('new'), ...dark } };
export const ResetPhone: Story = { name: 'Reset / 390, request', args: reset('request'), parameters: at('w390') };
export const ResetPhoneDark: Story = { name: 'Reset / 390, expired, dark', args: { ...reset('expired'), ...dark }, parameters: at('w390') };

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
