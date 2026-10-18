import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle, Eye, EyeSlash, Lock, WarningOctagon } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { IconButton } from '../../components/IconButton';
import { Icon } from '../../components/Icon';
import { Input } from '../../components/Input';
import { Link } from '../../components/Link';
import { Notice } from '../../components/Notice';

export const MIN_LENGTH = 8;
export const ACCOUNT_EMAIL = 'ramon@dizonautocare.ph';

/** Light mode gets a hairline so the card separates from the canvas; dark is unchanged. */
const CARD = 'flex flex-col gap-4 border border-border [[data-theme=dark]_&]:border-transparent';

export type SetPasswordView = 'form' | 'success' | 'invalid';

export interface SetPasswordProps {
  view?: SetPasswordView;
  /** Starting values and whether errors already show (blur/submit has happened). */
  initial?: { password?: string; confirm?: string; touched?: boolean };
  /** Submit is in flight: fields and button disabled, button busy. */
  loading?: boolean;
  onContinue?: () => void;
  onRequestLink?: () => void;
  onBackToSignIn?: () => void;
}

export function passwordError(password: string): string | undefined {
  if (!password) return 'Enter a new password.';
  if (password.length < MIN_LENGTH) return `Use at least ${MIN_LENGTH} characters.`;
  return undefined;
}

export function confirmError(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Confirm your new password.';
  if (confirm !== password) return "Passwords don't match.";
  return undefined;
}

/** Pre-login surface: no app shell. One column, left-aligned, grouped on a Card. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="ds-root min-h-screen w-full bg-surface-canvas font-sans text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 sm:px-6 sm:py-12">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 font-bold text-white">R</span>
          <span className="text-base font-semibold text-ink">ReadyPH</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function PasswordInput({
  shown,
  onToggle,
  toggleTabStop = true,
  ...rest
}: { shown: boolean; onToggle: () => void; toggleTabStop?: boolean } & React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input type={shown ? 'text' : 'password'} leftIcon={Lock} className="pr-12" autoComplete="new-password" {...rest} />
      <IconButton
        icon={shown ? EyeSlash : Eye}
        label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        size="sm"
        disabled={rest.disabled}
        tabIndex={toggleTabStop ? undefined : -1}
        onClick={onToggle}
        className="absolute right-1 top-1/2 -translate-y-1/2"
      />
    </div>
  );
}

/** Set-new-password form, success, and invalid/expired-link states. Appearance only; the app wires the call. */
export function SetPassword({ view: initialView = 'form', initial, loading = false, onContinue, onRequestLink, onBackToSignIn }: SetPasswordProps) {
  const [view, setView] = useState<SetPasswordView>(initialView);
  const [password, setPassword] = useState(initial?.password ?? '');
  const [confirm, setConfirm] = useState(initial?.confirm ?? '');
  const [touched, setTouched] = useState({ password: !!initial?.touched, confirm: !!initial?.touched });
  const [shown, setShown] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const pwError = touched.password ? passwordError(password) : undefined;
  const cfError = touched.confirm ? confirmError(password, confirm) : undefined;

  // Focus the heading when the success / invalid state appears.
  useEffect(() => {
    if (view !== 'form') headingRef.current?.focus();
  }, [view]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setTouched({ password: true, confirm: true });
    if (passwordError(password)) return passwordRef.current?.focus();
    if (confirmError(password, confirm)) return confirmRef.current?.focus();
    setView('success');
  }

  if (view === 'invalid') {
    return (
      <AuthFrame>
        <Card className={CARD}>
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">This link can&apos;t be used</h1>
          <Notice tone="error" icon={WarningOctagon}>
            It is invalid or has expired. Reset links work once and expire after 30 minutes. If you asked for another link, only the newest one works.
          </Notice>
          <Button fullWidth onClick={onRequestLink}>Request a new link</Button>
          <Link href="#" className="text-sm" onClick={(e) => { e.preventDefault(); onBackToSignIn?.(); }}>Back to sign in</Link>
        </Card>
      </AuthFrame>
    );
  }

  if (view === 'success') {
    return (
      <AuthFrame>
        <Card className={CARD}>
          <div className="flex items-center gap-3">
            <Icon icon={CheckCircle} size="lg" weight="fill" className="text-success" />
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">Password updated</h1>
          </div>
          <p className="text-sm text-ink-muted">
            Your password for {ACCOUNT_EMAIL} has been changed. Sign in with your new password to continue.
          </p>
          <Button fullWidth onClick={onContinue}>Continue to sign in</Button>
        </Card>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <Card className={CARD}>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink">Set a new password</h1>
          <p className="text-sm text-ink-muted">
            Choose a new password for <span className="font-medium text-ink">{ACCOUNT_EMAIL}</span>.
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={submit} noValidate aria-busy={loading || undefined}>
          <Field label="New password" hint={`At least ${MIN_LENGTH} characters.`} error={pwError}>
            <PasswordInput
              ref={passwordRef}
              shown={shown}
              onToggle={() => setShown((s) => !s)}
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            />
          </Field>
          <Field label="Confirm new password" error={cfError}>
            <PasswordInput
              ref={confirmRef}
              shown={shown}
              toggleTabStop={false}
              onToggle={() => setShown((s) => !s)}
              value={confirm}
              disabled={loading}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            />
          </Field>
          <Button type="submit" fullWidth loading={loading}>Update password</Button>
        </form>
        <Link href="#" className="text-sm" onClick={(e) => { e.preventDefault(); onBackToSignIn?.(); }}>Cancel and back to sign in</Link>
      </Card>
    </AuthFrame>
  );
}
