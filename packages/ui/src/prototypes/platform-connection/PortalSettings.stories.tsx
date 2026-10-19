import type { Meta, StoryObj } from '@storybook/react';
import { mobile } from '../repair-shop/params';
import { SettingsPage } from './PortalSettings';

/** PROTOTYPE (RDY-120) - Portal Settings with real Company fields, a new Account tab and Billing v1 (Plan, Usage, Request plan change). Invoices and Payment method slot in as later cards on the Billing tab; they are not shown now. */
const meta: Meta = { title: 'Portal/Account and billing', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Company: Story = { render: () => <SettingsPage /> };
export const CompanyValidation: Story = { name: 'Company (validation)', render: () => <SettingsPage state="validation" /> };
export const CompanySaved: Story = { name: 'Company (saved)', render: () => <SettingsPage state="saved" /> };
export const CompanyLoading: Story = { name: 'Company (loading)', render: () => <SettingsPage state="loading" /> };
export const CompanyError: Story = { name: 'Company (error)', render: () => <SettingsPage state="error" /> };
export const Account: Story = { render: () => <SettingsPage tab="account" /> };
export const ChangePassword: Story = { name: 'Account (change password)', render: () => <SettingsPage tab="account" modal /> };
export const Billing: Story = { render: () => <SettingsPage tab="billing" /> };
export const BillingAtLimit: Story = { name: 'Billing (at limit)', render: () => <SettingsPage tab="billing" state="limit" /> };
export const RequestPlanChange: Story = { name: 'Billing (request plan change)', render: () => <SettingsPage tab="billing" modal /> };
export const BillingRequested: Story = { name: 'Billing (change requested)', render: () => <SettingsPage tab="billing" state="requested" /> };
export const BillingLoading: Story = { name: 'Billing (loading)', render: () => <SettingsPage tab="billing" state="loading" /> };
export const BillingError: Story = { name: 'Billing (error)', render: () => <SettingsPage tab="billing" state="error" /> };
export const BillingMobile: Story = { name: 'Billing (mobile 390)', parameters: mobile, render: () => <SettingsPage tab="billing" /> };
export const SettingsMobile: Story = { name: 'Company (mobile 390)', parameters: mobile, render: () => <SettingsPage /> };
