import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { Page } from './Page';
import { Table, type TableColumn } from '../../components/Table';

/**
 * PROTOTYPE (RDY-18) - access screens, plus a feature map that mirrors the spike ticket
 * (area -> proposed epic -> shared API coverage). Source of truth for planning is the ticket.
 */
const meta: Meta = {
  title: 'Repair shop/Access and feature map',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function AuthFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="ds-root grid min-h-screen place-items-center bg-surface-canvas p-6 font-sans text-ink">
      <Card padding="lg" className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1"><h1 className="text-xl font-semibold">{title}</h1><p className="text-sm text-ink-muted">{description}</p></div>
        {children}
      </Card>
    </div>
  );
}

function Login({ mode = 'default' }: { mode?: 'default' | 'error' | 'loading' | 'validation' }) {
  const [email, setEmail] = useState(mode === 'error' ? 'staff@example.com' : '');
  const [pw, setPw] = useState(mode === 'error' ? 'wrong' : '');
  const [tried, setTried] = useState(mode === 'validation');
  return (
    <AuthFrame title="Log in" description="Sign in with your ReadyPH account.">
      {mode === 'error' && <Notice tone="error">Invalid email or password. Please try again.</Notice>}
      <Field label="Email" required error={tried && !email ? 'Enter your email.' : undefined}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /></Field>
      <Field label="Password" required error={tried && !pw ? 'Enter your password.' : undefined}><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" /></Field>
      <Button fullWidth loading={mode === 'loading'} onClick={() => setTried(true)}>Log in</Button>
      <div className="text-center text-sm text-primary-700">Forgot password?</div>
      <Notice tone="neutral">After login the user lands in their role area: staff on Today, mechanics on their tickets. Their branch platform is shown in the header.</Notice>
    </AuthFrame>
  );
}

export const LoginDefault: Story = { name: 'Login - default', render: () => <Login /> };
export const LoginValidation: Story = { name: 'Login - empty submit', render: () => <Login mode="validation" /> };
export const LoginBadCredentials: Story = { name: 'Login - invalid credentials', render: () => <Login mode="error" /> };
export const LoginLoading: Story = { name: 'Login - signing in', render: () => <Login mode="loading" /> };

export const ForgotPassword: Story = {
  name: 'Forgot password - sent',
  render: () => (
    <AuthFrame title="Forgot password" description="Enter your email and we will send you a link to reset your password.">
      <Field label="Email"><Input defaultValue="staff@example.com" /></Field>
      <Notice tone="success">If that account exists, a reset link is on its way.</Notice>
      <Button fullWidth variant="secondary">Send reset link</Button>
      <div className="text-center text-sm text-primary-700">Back to login</div>
    </AuthFrame>
  ),
};

export const ResetPasswordInvalidToken: Story = {
  name: 'Reset password - invalid or expired link',
  render: () => (
    <AuthFrame title="Reset password" description="This link is no longer valid.">
      <Notice tone="error">The reset link is invalid or has expired. Request a new one.</Notice>
      <Button fullWidth>Request a new link</Button>
    </AuthFrame>
  ),
};

export const NotFound: Story = {
  name: 'Page not found (also shown for areas the role cannot reach)',
  render: () => (
    <AuthFrame title="Page not found" description="Sorry, the page you are looking for does not exist.">
      <Button fullWidth>Go to home</Button>
    </AuthFrame>
  ),
};

// ------------------------------------------------------------- feature map

type Cover = 'shared' | 'partial' | 'new' | 'unverified';
interface Area { epic: string; features: string; endpoints: string; shared: string; cover: Cover }

const AREAS: Area[] = [
  { epic: '1. Access, session and branch', features: 'Login, forgot/reset password, refresh, logout, role area split, branch as its own platform', endpoints: 'auth/login|logout|token/refresh|password/*, users/me, users/me/branches, users/me/change-branch', shared: 'auth/*, users/me exist; branch does not', cover: 'partial' },
  { epic: '2. Service catalogue', features: 'List, search, sort, add/edit, activate, scope-of-work categories', endpoints: 'services, services/{id}, services/categories', shared: 'None', cover: 'new' },
  { epic: '3. Parts catalogue', features: 'List, add/edit, images, units, brand, category, stock + minimum', endpoints: 'products, products/categories, products/units, companies/brands, inventory/stats', shared: 'inventory/products, categories, summary (no brand, units, multi-image)', cover: 'partial' },
  { epic: '4. Customers and vehicles', features: 'List, add/edit/soft-delete customer, vehicles CRUD', endpoints: 'customers, customers/{id}, customers/{id}/vehicles', shared: 'None', cover: 'new' },
  { epic: '5. Job pipeline', features: 'Status tabs with counts, search, sort, pager', endpoints: 'jobs, jobs/stats', shared: 'None', cover: 'new' },
  { epic: '6. Quotation intake', features: 'Customer lookup, plate pick, services and parts, attachments, pre-approved', endpoints: 'customers?search, services, products, jobs (POST)', shared: 'None', cover: 'new' },
  { epic: '7. Job detail', features: 'Status change, due date, services checklist + assignment, parts used, totals', endpoints: 'jobs/{id}, change-status, services/{id}/assign, staff/jobs/services, staff/jobs/products, companies/members', shared: 'memberships (for assignees)', cover: 'new' },
  { epic: '8. Collaboration and audit', features: 'Activity history, per-service comments + files, job attachments', endpoints: 'jobs/{id}/histories, staff/jobs/services/{id}/histories, staff/jobs/{id}/attachments', shared: 'None (core has audit module)', cover: 'new' },
  { epic: '9. Payment and invoice', features: 'Payment type, downpayment, mode, invoice PDF', endpoints: 'jobs/{id}/download-invoice', shared: 'None', cover: 'new' },
  { epic: '10. Mechanic workspace', features: 'Tickets list/detail, status, history, attachments (not seen live)', endpoints: 'mechanic jobs/stats, mechanic jobs/services/{id}', shared: 'None', cover: 'unverified' },
];

const coverTone: Record<Cover, 'success' | 'warning' | 'neutral' | 'info'> = { shared: 'success', partial: 'warning', new: 'neutral', unverified: 'info' };
const coverLabel: Record<Cover, string> = { shared: 'Shared API', partial: 'Partial', new: 'New backend', unverified: 'Not verified' };

export const FeatureMap: Story = {
  name: 'Feature map (areas to epics, API coverage)',
  render: () => {
    const cols: TableColumn<Area>[] = [
      { key: 'epic', header: 'Proposed epic', render: (a) => <span className="font-medium">{a.epic}</span> },
      { key: 'features', header: 'Features', render: (a) => a.features },
      { key: 'endpoints', header: 'Source app endpoints (/api/...)', render: (a) => <span className="text-xs text-ink-muted">{a.endpoints}</span> },
      { key: 'shared', header: 'Shared API (/api/v1)', render: (a) => <span className="text-xs">{a.shared}</span> },
      { key: 'cover', header: 'Backend', render: (a) => <Badge tone={coverTone[a.cover]}>{coverLabel[a.cover]}</Badge> },
    ];
    return (
      <div className="ds-root min-h-screen bg-surface-canvas p-6 font-sans text-ink">
        <Page>
          <PageHeader className="pb-0" title="Repair shop platform: feature map" description="The source app runs on its own API; almost nothing maps onto the shared /api/v1 yet." />
          <Card padding="none"><Table columns={cols} data={AREAS} rowKey={(a) => a.epic} /></Card>
        </Page>
      </div>
    );
  },
};
