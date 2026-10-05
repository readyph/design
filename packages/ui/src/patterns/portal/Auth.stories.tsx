import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode } from 'react';
import {
  Envelope,
  Lock,
  User,
  Buildings,
  GoogleLogo,
  Sparkle,
  ChartLineUp,
  Package,
  ArrowLeft,
  PaperPlaneTilt,
  CheckCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Checkbox } from '../../components/Checkbox';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Divider } from '../../components/Divider';
import { Icon } from '../../components/Icon';
import { goToStory, routes } from '../nav';

/**
 * Portal auth — Sign in, Sign up, and the full forgot-password flow. Pre-login,
 * so these do NOT use the app shell (no rail/sidebar). A split layout: a
 * tangerine brand panel (hidden on mobile) beside a centered form. Appearance
 * only — the app wires the actual auth calls (02). The reset-token rules
 * (single active token, one-time use, 30-min expiry, no user enumeration) live
 * in 03-Portal.md §9. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Auth',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const features = [
  { icon: ChartLineUp, text: 'A live command center for every platform' },
  { icon: Sparkle, text: 'Leda, your AI assistant — just ask' },
  { icon: Package, text: 'Inventory, orders and more in one place' },
];

/** The shared auth layout: brand panel + a centered form slot. */
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="ds-root flex min-h-screen w-full bg-surface font-sans text-ink">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white font-bold text-primary-700">R</span>
          <span className="text-lg font-semibold">ReadyPH</span>
        </div>

        <div className="max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight">
            Run your whole business by talking to it.
          </h2>
          <ul className="mt-8 space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <Icon icon={f.icon} size="md" weight="fill" className="text-white/90" />
                <span className="text-sm text-white/90">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/70">© 2026 ReadyPH. All rights reserved.</p>
      </div>

      {/* Form side */}
      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-10 lg:w-1/2">
        {/* compact mark for mobile (brand panel is hidden) */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 font-bold text-white">R</span>
          <span className="text-base font-semibold text-ink">ReadyPH</span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

function GoogleButton() {
  return (
    <Button variant="secondary" fullWidth leftIcon={GoogleLogo}>
      Continue with Google
    </Button>
  );
}

/** A "back to sign in" link used across the reset flow. */
function BackToSignIn({ label = 'Back to sign in' }: { label?: string }) {
  return (
    <p className="mt-8 text-center text-sm">
      <Link
        href="#"
        icon={ArrowLeft}
        onClick={(e) => {
          e.preventDefault();
          goToStory('portal-auth--sign-in');
        }}
      >
        {label}
      </Link>
    </p>
  );
}

/**
 * A centered notice screen (big icon + title + message + actions). Used for the
 * "check your email", "password updated" and "link expired" states.
 */
function AuthNotice({
  icon,
  tone = 'primary',
  title,
  children,
  actions,
}: {
  icon: typeof Envelope;
  tone?: 'primary' | 'success' | 'error';
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const toneRing =
    tone === 'success'
      ? 'bg-success-50 text-success-600'
      : tone === 'error'
        ? 'bg-error-50 text-error-600'
        : 'bg-primary-50 text-primary-600';
  return (
    <div className="text-center">
      <span className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full ${toneRing}`}>
        <Icon icon={icon} size="lg" weight="fill" />
      </span>
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <div className="mt-2 text-sm text-ink-muted">{children}</div>
      {actions ? <div className="mt-6 space-y-3 text-left">{actions}</div> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- Sign in -- */

export const SignIn: Story = {
  name: 'Sign in',
  render: () => (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to your ReadyPH account.</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Email">
          <Input type="email" leftIcon={Envelope} placeholder="you@company.com" autoComplete="email" />
        </Field>

        <Field label="Password">
          <Input type="password" leftIcon={Lock} placeholder="••••••••" autoComplete="current-password" />
        </Field>

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" defaultChecked />
          <Link
            href="#"
            className="text-sm"
            onClick={(e) => {
              e.preventDefault();
              goToStory(routes.portalForgot);
            }}
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth onClick={() => goToStory(routes.portalHome)}>
          Sign in
        </Button>
      </form>

      <div className="my-6">
        <Divider label="or" />
      </div>
      <GoogleButton />

      <p className="mt-8 text-center text-sm text-ink-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goToStory('portal-auth--sign-up');
          }}
        >
          Sign up
        </Link>
      </p>
    </AuthShell>
  ),
};

/* ----------------------------------------------------------------- Sign up -- */

export const SignUp: Story = {
  name: 'Sign up',
  render: () => (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">Set up your company and start in minutes.</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Full name">
          <Input leftIcon={User} placeholder="Maria Santos" autoComplete="name" />
        </Field>

        <Field label="Work email">
          <Input type="email" leftIcon={Envelope} placeholder="you@company.com" autoComplete="email" />
        </Field>

        <Field label="Company name" hint="This becomes your workspace.">
          <Input leftIcon={Buildings} placeholder="Sunrise Groceries" />
        </Field>

        <Field label="Password" hint="At least 8 characters.">
          <Input type="password" leftIcon={Lock} placeholder="••••••••" autoComplete="new-password" />
        </Field>

        <Checkbox
          label={
            <span>
              I agree to the <Link href="#">Terms</Link> and <Link href="#">Privacy Policy</Link>.
            </span>
          }
        />

        <Button type="submit" fullWidth onClick={() => goToStory(routes.portalHome)}>
          Create account
        </Button>
      </form>

      <div className="my-6">
        <Divider label="or" />
      </div>
      <GoogleButton />

      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goToStory('portal-auth--sign-in');
          }}
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  ),
};

/* ------------------------------------------------- Forgot password (step 1) -- */
/* Enter email → the app issues a single-use reset token and emails the link.   */

export const ForgotPassword: Story = {
  name: 'Forgot password',
  render: () => (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter your account email and we&apos;ll send a link to set a new password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Email">
          <Input type="email" leftIcon={Envelope} placeholder="you@company.com" autoComplete="email" />
        </Field>

        <Button type="submit" fullWidth onClick={() => goToStory(routes.portalForgotSent)}>
          Send reset link
        </Button>
      </form>

      <BackToSignIn />
    </AuthShell>
  ),
};

/* ------------------------------------------------- Forgot password (step 2) -- */
/* Confirmation. Wording is deliberately the same whether or not the email is   */
/* registered — no account enumeration (see 03-Portal.md §9).                   */

export const ForgotPasswordSent: Story = {
  name: 'Forgot password · sent',
  render: () => (
    <AuthShell>
      <AuthNotice
        icon={PaperPlaneTilt}
        title="Check your email"
        actions={
          <>
            <BackToSignIn />
            <p className="text-center text-sm text-ink-muted">
              Didn&apos;t get it?{' '}
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goToStory(routes.portalForgot);
                }}
              >
                Try again
              </Link>
            </p>
          </>
        }
      >
        If an account exists for that email, we&apos;ve sent a link to reset your
        password. The link works once and expires in 30 minutes.
      </AuthNotice>
    </AuthShell>
  ),
};

/* --------------------------------------------------- Reset password (step 3) -- */
/* The unique per-token page reached from the email link. New + confirm.        */

export const ResetPassword: Story = {
  name: 'Reset password',
  render: () => (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Set a new password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Choose a new password for <span className="font-medium text-ink">maria@sunrise.ph</span>.
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="New password" hint="At least 8 characters.">
          <Input type="password" leftIcon={Lock} placeholder="••••••••" autoComplete="new-password" />
        </Field>

        <Field label="Confirm password">
          <Input type="password" leftIcon={Lock} placeholder="••••••••" autoComplete="new-password" />
        </Field>

        <Button type="submit" fullWidth onClick={() => goToStory(routes.portalResetDone)}>
          Reset password
        </Button>
      </form>

      <BackToSignIn label="Cancel" />
    </AuthShell>
  ),
};

/* --------------------------------------------------- Reset password (done) --- */

export const ResetPasswordDone: Story = {
  name: 'Reset password · done',
  render: () => (
    <AuthShell>
      <AuthNotice
        icon={CheckCircle}
        tone="success"
        title="Password updated"
        actions={
          <Button
            fullWidth
            onClick={() => goToStory('portal-auth--sign-in')}
          >
            Sign in
          </Button>
        }
      >
        Your password has been changed. For your security we&apos;ve signed out any
        other sessions — sign in again to continue.
      </AuthNotice>
    </AuthShell>
  ),
};

/* ---------------------------------------------- Reset link expired / invalid - */
/* Shown when the token is expired, already used, or was superseded by a newer  */
/* request. One active token at a time (see 03-Portal.md §9).                    */

export const ResetLinkExpired: Story = {
  name: 'Reset link expired',
  render: () => (
    <AuthShell>
      <AuthNotice
        icon={WarningCircle}
        tone="error"
        title="This link is no longer valid"
        actions={
          <>
            <Button
              fullWidth
              onClick={() => goToStory(routes.portalForgot)}
            >
              Request a new link
            </Button>
            <BackToSignIn />
          </>
        }
      >
        Reset links expire after 30 minutes and can only be used once. If you
        requested another link, only the most recent one works.
      </AuthNotice>
    </AuthShell>
  ),
};
