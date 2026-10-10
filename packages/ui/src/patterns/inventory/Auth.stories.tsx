import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode } from 'react';
import { Envelope, Lock, Camera, ArrowsClockwise, WaveTriangle } from '@phosphor-icons/react';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Checkbox } from '../../components/Checkbox';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Icon } from '../../components/Icon';
import { goToStory, routes } from '../nav';

/**
 * Inventory auth — Sign in only. The Inventory platform is staff-facing, so
 * there is no self-signup: staff accounts are provisioned by the owner/admin
 * in the Portal. Pre-login, so this does NOT use the app shell. A split
 * layout: a blue brand panel (hidden on mobile) beside a centered form.
 * Appearance only — the app wires the actual auth calls (02). See 04-Inventory.md.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Inventory/Auth',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const features = [
  { icon: Camera, text: 'Snap a delivery receipt — Leda logs the movements' },
  { icon: ArrowsClockwise, text: 'Stock in and out in seconds' },
  { icon: WaveTriangle, text: 'Ask Leda about any product or order' },
];

/** The shared auth layout: brand panel + a centered form slot. */
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="ds-root flex min-h-screen w-full bg-surface-canvas font-sans text-ink">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white font-bold text-primary-700">R</span>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold">ReadyPH</span>
            <span className="text-xs text-white/70">Inventory</span>
          </div>
        </div>

        <div className="max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight">
            The stockroom, run by talking to it.
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
          <span className="text-base font-semibold text-ink">
            ReadyPH <span className="font-normal text-ink-muted">Inventory</span>
          </span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Sign in -- */

export const SignIn: Story = {
  name: 'Sign in',
  render: () => (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Access your team&apos;s inventory workspace.</p>
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

        <Button type="submit" fullWidth onClick={() => goToStory(routes.inventoryHome)}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Need access? Your owner or admin adds staff from the Portal.
      </p>
    </AuthShell>
  ),
};
