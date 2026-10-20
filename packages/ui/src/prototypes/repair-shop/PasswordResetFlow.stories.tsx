import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Notice } from '../../components/Notice';
import { Table, type TableColumn } from '../../components/Table';
import { AuthFrame } from '../../patterns/repair-shop/SetPassword';

/**
 * PROTOTYPE (RDY-164, relates to RDY-65) - repair shop password reset journey:
 * forgot form -> email -> existing "Repair shop/Set password" -> success. The link identifies the
 * platform by path (/repair-shop/reset-password); the forgot form sends the platform to the API.
 */
const meta: Meta = {
  title: 'Repair shop/Password reset flow',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function Forgot({ view }: { view: 'form' | 'sent' | 'loading' | 'error' }) {
  return (
    <AuthFrame>
      <Card padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Forgot your password?</h1>
          <p className="text-sm text-ink-muted">Enter your email and we will send a link to reset your repair shop password.</p>
        </div>
        {view === 'error' && <Notice tone="error">We could not send the link. Check your connection and try again.</Notice>}
        {view === 'sent' && (
          <Notice tone="success">If an account exists for ramon@dizonautocare.ph, a reset link is on its way. It works once and expires in 30 minutes.</Notice>
        )}
        <Field label="Email" required>
          <Input type="email" defaultValue={view === 'form' ? '' : 'ramon@dizonautocare.ph'} placeholder="you@shop.ph" disabled={view === 'loading'} />
        </Field>
        <Button fullWidth loading={view === 'loading'} variant={view === 'sent' ? 'secondary' : 'primary'}>
          {view === 'sent' ? 'Send again' : 'Send reset link'}
        </Button>
        <a href="#" className="text-sm text-primary-700">Back to sign in</a>
      </Card>
    </AuthFrame>
  );
}

export const ForgotDefault: Story = { name: '1. Forgot - default', render: () => <Forgot view="form" /> };
export const ForgotLoading: Story = { name: '1. Forgot - sending', render: () => <Forgot view="loading" /> };
export const ForgotSent: Story = { name: '1. Forgot - sent', render: () => <Forgot view="sent" /> };
export const ForgotError: Story = { name: '1. Forgot - error', render: () => <Forgot view="error" /> };

export const Email: Story = {
  name: '2. Email',
  render: () => (
    <div className="ds-root min-h-screen bg-surface-canvas p-6 font-sans text-ink">
      <Card padding="lg" className="mx-auto flex max-w-lg flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-muted">To</dt><dd>ramon@dizonautocare.ph</dd>
          <dt className="text-ink-muted">Subject</dt><dd className="font-semibold">Reset your ReadyPH repair shop password</dd>
        </dl>
        <hr className="border-line" />
        <p>Hi Ramon,</p>
        <p>We received a request to reset the password for your ReadyPH repair shop account.</p>
        <div><Button>Reset password</Button></div>
        <p className="break-all text-sm text-ink-muted">https://app.readyph.com/repair-shop/reset-password?token=...</p>
        <p className="text-sm text-ink-muted">This link works once and expires in 30 minutes. If you did not ask for this, ignore this email; your password stays the same.</p>
      </Card>
    </div>
  ),
};

interface Row { id: string; from: string; link: string; lands: string }
const rows: Row[] = [
  { id: '1', from: 'Repair shop forgot form', link: '/repair-shop/reset-password?token=', lands: 'Repair shop Set password, then repair shop sign-in' },
  { id: '2', from: 'Inventory forgot form', link: '/reset-password?token=', lands: 'Inventory Set password, then Inventory sign-in' },
  { id: '3', from: 'Portal forgot form', link: '/reset-password?token= (Portal host)', lands: 'Portal Set password, then Portal sign-in' },
  { id: '4', from: 'No platform sent (old clients)', link: 'Portal link', lands: 'Portal default, no break' },
  { id: '5', from: 'Link opened with no token / used / expired', link: 'any', lands: 'Invalid-link state with Request a new link to the same platform forgot form' },
];
const cols: TableColumn<Row>[] = [
  { key: 'from', header: 'Requested from', render: (r) => r.from },
  { key: 'link', header: 'Emailed link', render: (r) => <code className="text-sm">{r.link}</code> },
  { key: 'lands', header: 'User lands on', render: (r) => r.lands },
];

export const LinkRouting: Story = {
  name: '3. Link routing',
  render: () => (
    <div className="ds-root min-h-screen bg-surface-canvas p-6 font-sans text-ink">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">How the link identifies the platform</h1>
        <Notice tone="info">The forgot form sends the platform; the API chooses the link base per platform. The token and password stay user-level, so a reset changes the one ReadyPH password everywhere. Steps 4 and 5 (set new password, password updated) are the shipped screens in Repair shop/Set password.</Notice>
        <Table<Row> columns={cols} data={rows} rowKey={(r) => r.id} />
      </div>
    </div>
  ),
};
