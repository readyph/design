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
 * Portal auth — Sign in & Sign up. Pre-login, so these do NOT use the app shell
 * (no rail/sidebar). A split layout: a tangerine brand panel (hidden on mobile)
 * beside a centered form. Appearance only — the app wires the actual auth calls
 * (02). See 03-Portal.md. Mock data.
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
          <Link href="#" className="text-sm">Forgot password?</Link>
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
