/**
 * PROTOTYPE (RDY-180, epic RDY-173 features 6 and 7) - Portal auth pages: sign in, platform
 * handoff, invite accept, password reset. Replaces the tangerine split layout with one quiet,
 * left-aligned column on the page surface (Slack-like), small radii, 32-36px controls.
 *
 * Auth respects the stored theme: pages sit under the real ThemeProvider, which reads
 * `readyph.theme` (default System). No Leda on these pages (unauthenticated).
 *
 * Built only from @readyph/ui 0.7 components and tokens; gaps are listed in MISSING_IN_KIT.
 * Never export this folder from `src/index.ts`.
 */
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Envelope,
  Lock,
  LockKey,
  Package,
  Prohibit,
  WarningCircle,
  WifiSlash,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ButtonLink } from '../../components/ButtonLink';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { Input } from '../../components/Input';
import { Link } from '../../components/Link';
import { Notice } from '../../components/Notice';
import { Spinner } from '../../components/Spinner';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';

/** For Leonardo: what this prototype previews locally because the kit does not ship it yet. */
export const MISSING_IN_KIT = [
  'AuthLayout: brand header (mark + name, optional right link), one 360px left-aligned column, footer links; Portal keeps its own AuthShell and handoff Frame today (two layouts, both hand-rolled).',
  'BrandMark: the ReadyPH "R" mark (24/28px, rounded-sm, primary) used by auth, the shell rail and emails (previewed with a styled span).',
  'AuthStatus: icon tile (40px, rounded-base, tone tint) + title + message + actions, for handoff states, "check your email", "password updated" and expired links (replaces AuthNotice and handoff Frame).',
  'PasswordInput: Input with a show/hide IconButton inside (Input rightIcon is decorative only) and an optional requirements hint.',
  'Field `labelAction` slot: a right-aligned link in the label row (for "Forgot password?") without nesting a link in the <label>.',
];

const TENANT = 'Acme Motors';

/* ------------------------------------------------------------- layout */

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grid h-7 w-7 place-items-center rounded-sm bg-primary-600 text-sm font-bold text-white"
    >
      R
    </span>
  );
}

/** Kit gap: AuthLayout. Full-width page; header, one column, footer. */
export function AuthLayout({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  const { resolved } = useTheme();
  return (
    <div data-theme={resolved} className="ds-root flex min-h-screen w-full min-w-0 flex-col bg-surface font-sans text-ink">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-gutter sm:px-6">
        <a href="#sign-in" className="flex items-center gap-2 rounded-sm text-sm font-semibold text-ink">
          <BrandMark />
          ReadyPH
        </a>
        {aside && <div className="min-w-0 text-right text-sm text-ink-muted">{aside}</div>}
      </header>
      <main className="flex flex-1 justify-center px-gutter pb-10 pt-8 sm:pt-20">
        <div className="flex w-full max-w-[22.5rem] flex-col gap-5">{children}</div>
      </main>
      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-gutter py-4 text-xs text-ink-subtle">
        <span>© 2026 ReadyPH</span>
        <Link href="#privacy" tone="muted">
          Privacy
        </Link>
        <Link href="#terms" tone="muted">
          Terms
        </Link>
        <Link href="#help" tone="muted">
          Help
        </Link>
      </footer>
    </div>
  );
}

function Heading({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      {children && <p className="text-sm text-ink-muted">{children}</p>}
    </div>
  );
}

type StatusTone = 'primary' | 'success' | 'error' | 'neutral';

const toneTile: Record<StatusTone, string> = {
  primary: 'bg-tint-blue-bg text-tint-blue-fg',
  success: 'bg-tint-green-bg text-tint-green-fg',
  error: 'bg-error/10 text-error-fg',
  neutral: 'bg-surface-muted text-ink-muted',
};

/** Kit gap: AuthStatus. */
function AuthStatus({
  icon,
  tone = 'primary',
  busy = false,
  title,
  children,
  actions,
}: {
  icon: PhosphorIcon;
  tone?: StatusTone;
  busy?: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className={cn('grid h-10 w-10 place-items-center rounded-base', toneTile[tone])}>
        {busy ? <Spinner size="md" label="Signing you in" /> : <Icon icon={icon} size="md" />}
      </span>
      <div className="flex flex-col gap-1" role="status" aria-live="polite">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="text-sm text-ink-muted">{children}</p>
      </div>
      {actions && <div className="flex flex-col gap-2">{actions}</div>}
    </div>
  );
}

const signUpAside = (
  <>
    <span className="hidden sm:inline">New to ReadyPH? </span>
    <Link href="#sign-up">Create an account</Link>
  </>
);

/* ------------------------------------------------------------ sign in */

export type SignInState = 'default' | 'error' | 'continue';

export function SignInPage({ state = 'default' }: { state?: SignInState }) {
  return (
    <AuthLayout aside={signUpAside}>
      <Heading title={state === 'continue' ? 'Sign in to continue' : 'Sign in to ReadyPH'}>
        {state === 'continue'
          ? `Your session expired. Sign in again to open Inventory for ${TENANT}.`
          : 'Use your work email. One account for Portal, Inventory and Service Management.'}
      </Heading>
      {state === 'error' && <Notice tone="error">Email or password is incorrect.</Notice>}
      <form className="flex flex-col gap-3" noValidate onSubmit={(e) => e.preventDefault()}>
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            inputSize="md"
            defaultValue={state === 'default' ? '' : 'earvin@acmemotors.ph'}
            placeholder="name@company.ph"
            invalid={state === 'error'}
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <Field label="Password">
            <Input type="password" autoComplete="current-password" inputSize="md" invalid={state === 'error'} />
          </Field>
          <Link href="#forgot" className="self-end text-sm">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="md" fullWidth>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

/* ------------------------------------------------------------ handoff */

export type HandoffState = 'opening' | 'expired' | 'no-access' | 'failed';

export function HandoffPage({ state = 'opening' }: { state?: HandoffState }) {
  const back = (
    <ButtonLink href="#platforms" variant="secondary" size="md" fullWidth leftIcon={ArrowLeft}>
      Back to Platforms
    </ButtonLink>
  );
  return (
    <AuthLayout>
      {state === 'opening' && (
        <AuthStatus icon={Package} busy title="Opening Inventory">
          Signing you in to {TENANT}. This takes a second.
        </AuthStatus>
      )}
      {state === 'expired' && (
        <AuthStatus
          icon={Lock}
          tone="neutral"
          title="Your session expired"
          actions={
            <>
              <ButtonLink href="#sign-in" size="md" fullWidth>
                Sign in
              </ButtonLink>
              <Button variant="secondary" size="md" fullWidth>
                Try again
              </Button>
            </>
          }
        >
          Sign in again to continue to Inventory.
        </AuthStatus>
      )}
      {state === 'no-access' && (
        <AuthStatus icon={Prohibit} tone="error" title="You don't have access" actions={back}>
          Your account isn't on Service Management for {TENANT}. Ask an administrator to add you.
        </AuthStatus>
      )}
      {state === 'failed' && (
        <AuthStatus
          icon={WifiSlash}
          tone="error"
          title="Inventory isn't responding"
          actions={
            <>
              <Button size="md" fullWidth>
                Try again
              </Button>
              {back}
            </>
          }
        >
          We couldn't reach it after 3 tries. Its status shows on Platforms; your admins were notified.
        </AuthStatus>
      )}
    </AuthLayout>
  );
}

/* ------------------------------------------------------- invite accept */

export type InviteState = 'form' | 'errors' | 'expired';

export function InviteAcceptPage({ state = 'form' }: { state?: InviteState }) {
  const errors = state === 'errors';
  if (state === 'expired') {
    return (
      <AuthLayout>
        <AuthStatus
          icon={WarningCircle}
          tone="error"
          title="This invite has expired"
          actions={
            <ButtonLink href="#sign-in" variant="secondary" size="md" fullWidth>
              Go to sign in
            </ButtonLink>
          }
        >
          Invites last 7 days. Ask Maria Santos at {TENANT} to send a new one.
        </AuthStatus>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout
      aside={
        <>
          <span className="hidden sm:inline">Have an account? </span>
          <Link href="#sign-in">Sign in</Link>
        </>
      }
    >
      <Heading title={`Join ${TENANT}`} />
      <div className="flex items-center gap-3 rounded-base border border-border bg-surface-subtle p-3">
        <Avatar name="Maria Santos" size="sm" />
        <p className="min-w-0 text-sm text-ink-muted">
          <span className="font-medium text-ink">Maria Santos</span> invited you as a{' '}
          <span className="font-medium text-ink">Member</span> of Portal and Inventory.
        </p>
      </div>
      <form className="flex flex-col gap-3" noValidate onSubmit={(e) => e.preventDefault()}>
        <Field label="Email" hint="From your invite. You sign in with it.">
          <Input type="email" inputSize="md" value="ana@acmemotors.ph" readOnly disabled />
        </Field>
        <Field label="Full name" required error={errors ? 'Enter your full name.' : undefined}>
          <Input autoComplete="name" inputSize="md" defaultValue={errors ? '' : 'Ana Reyes'} />
        </Field>
        <Field
          label="Password"
          required
          hint={errors ? undefined : 'At least 8 characters, with upper and lower case and a number.'}
          error={errors ? 'Use at least 8 characters with an uppercase letter, a lowercase letter and a number.' : undefined}
        >
          <Input type="password" autoComplete="new-password" inputSize="md" defaultValue={errors ? 'short' : ''} />
        </Field>
        <Field label="Confirm password" required error={errors ? 'Passwords do not match.' : undefined}>
          <Input type="password" autoComplete="new-password" inputSize="md" />
        </Field>
        <Button type="submit" size="md" fullWidth>
          Accept and join
        </Button>
        <p className="text-xs text-ink-subtle">
          By joining you agree to the <Link href="#terms">Terms</Link> and <Link href="#privacy">Privacy policy</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}

/* ------------------------------------------------------ password reset */

export type ResetStep = 'request' | 'sent' | 'new' | 'done' | 'expired';

export function PasswordResetPage({ step = 'request' }: { step?: ResetStep }) {
  const backToSignIn = (
    <ButtonLink href="#sign-in" variant="secondary" size="md" fullWidth leftIcon={ArrowLeft}>
      Back to sign in
    </ButtonLink>
  );
  return (
    <AuthLayout aside={step === 'request' ? signUpAside : undefined}>
      {step === 'request' && (
        <>
          <Heading title="Reset your password">
            Enter your work email and we'll send a link to set a new password.
          </Heading>
          <form className="flex flex-col gap-3" noValidate onSubmit={(e) => e.preventDefault()}>
            <Field label="Email">
              <Input type="email" autoComplete="email" inputSize="md" placeholder="name@company.ph" />
            </Field>
            <Button type="submit" size="md" fullWidth>
              Send reset link
            </Button>
            <Link href="#sign-in" icon={ArrowLeft} className="self-start text-sm">
              Back to sign in
            </Link>
          </form>
        </>
      )}
      {step === 'sent' && (
        <AuthStatus
          icon={Envelope}
          title="Check your email"
          actions={
            <>
              {backToSignIn}
              <Button variant="subtle" size="md" fullWidth>
                Resend link
              </Button>
            </>
          }
        >
          If an account exists for earvin@acmemotors.ph, we sent a reset link. It expires in 1 hour.
        </AuthStatus>
      )}
      {step === 'new' && (
        <>
          <span className="grid h-10 w-10 place-items-center rounded-base bg-tint-blue-bg text-tint-blue-fg">
            <Icon icon={LockKey} size="md" />
          </span>
          <Heading title="Set a new password">For earvin@acmemotors.ph. Other sessions are signed out.</Heading>
          <form className="flex flex-col gap-3" noValidate onSubmit={(e) => e.preventDefault()}>
            <Field label="New password" hint="At least 8 characters, with upper and lower case and a number.">
              <Input type="password" autoComplete="new-password" inputSize="md" />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" autoComplete="new-password" inputSize="md" />
            </Field>
            <Button type="submit" size="md" fullWidth>
              Update password
            </Button>
          </form>
        </>
      )}
      {step === 'done' && (
        <AuthStatus
          icon={CheckCircle}
          tone="success"
          title="Password updated"
          actions={
            <ButtonLink href="#sign-in" size="md" fullWidth>
              Continue to sign in
            </ButtonLink>
          }
        >
          Your other sessions were signed out. Sign in with your new password.
        </AuthStatus>
      )}
      {step === 'expired' && (
        <AuthStatus
          icon={WarningCircle}
          tone="error"
          title="This reset link has expired"
          actions={
            <>
              <ButtonLink href="#forgot" size="md" fullWidth>
                Send a new link
              </ButtonLink>
              {backToSignIn}
            </>
          }
        >
          Reset links work once and last 1 hour.
        </AuthStatus>
      )}
    </AuthLayout>
  );
}
