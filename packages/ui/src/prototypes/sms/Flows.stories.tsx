import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { ServicesPage } from './Services.page';
import { CustomersPage } from './Customers.page';
import { ServicesPricesPage } from './ServicesPrices.page';
import { linesFromType } from './wizardModel';
import { liveMeta } from './live';

/**
 * TEST-ONLY. Hidden from the sidebar and the docs (tags: !dev, !autodocs, test-only). These keep the scripted click paths that the old per-state stories
 * asserted, so a Storybook test runner can still run them. The live stories (Today, Services, Customers, Settings, New service wizard) are what the owner uses.
 */
const meta: Meta = { ...liveMeta, tags: ['!dev', '!autodocs', 'test-only'], title: 'Prototypes/SMS/Flows (test-only)' };
export default meta;
type Story = StoryObj;
const body = (el: HTMLElement) => within(el.ownerDocument.body);
const lines = () => [...linesFromType('sv01'), ...linesFromType('sv13')];

// ---- Services ----
export const DrillAndReturn: Story = {
  render: () => <ServicesPage />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click((await c.findAllByRole('button', { name: /Open this day/ }))[2]!);
    await expect(c.getByRole('button', { name: 'Back to week' })).toBeTruthy();
    await userEvent.click(c.getByRole('button', { name: 'Back to week' }));
    await expect(c.queryByRole('button', { name: 'Back to week' })).toBeNull();
    await expect((await c.findAllByRole('button', { name: /Open this day/ })).length).toBe(7);
  },
};
export const ListSelectAllLoaded: Story = {
  render: () => <ServicesPage initialTab="list" />,
  play: async ({ canvasElement }) => { await userEvent.click(await within(canvasElement).findByRole('checkbox', { name: /Select all 20 loaded/ })); },
};

// ---- Customers ----
export const LookupToCustomer: Story = {
  render: () => <CustomersPage />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(await c.findByRole('searchbox', { name: 'Search customers' }), 'nbc 4521{enter}');
    await expect(await c.findByRole('heading', { name: 'Maricel Reyes' })).toBeTruthy();
  },
};
export const NoMatchToNewCustomer: Story = {
  render: () => <CustomersPage />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(await c.findByRole('searchbox', { name: 'Search customers' }), 'NBC 9999');
    await userEvent.click(await c.findByRole('button', { name: 'Take in NBC 9999' }));
    await expect(await c.findByRole('form', { name: 'New customer' })).toBeTruthy();
  },
};
export const DuplicatePlate: Story = {
  render: () => <CustomersPage initialCustomer={{ id: 'c03' }} initialDetail={{ kind: 'car', customerId: 'c03' }} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type((await c.findAllByLabelText(/Plate \(required\)/))[0]!, 'nbc 4521');
    await expect((await c.findAllByText(/is already on Maricel Reyes/))[0]).toBeTruthy();
  },
};

// ---- Wizard ----
export const WizardNewCustomerTwoCars: Story = {
  render: () => <ServicesPage initialFlow={{ kind: 'new' }} />,
  play: async ({ canvasElement }) => { const b = body(canvasElement); await userEvent.click(await b.findByRole('button', { name: /add .*new customer|new customer/i })); await expect(await b.findAllByText(/car|vehicle/i)).not.toHaveLength(0); },
};
export const WizardSaveAsQuotation: Story = {
  render: () => <ServicesPage initialTab="list" initialFlow={{ kind: 'new', customerId: 'c01', startStep: 2, initialDraft: { lines: lines(), remarks: 'Valid for 7 days.' } }} />,
  play: async ({ canvasElement }) => { await userEvent.click(await body(canvasElement).findByRole('button', { name: 'Save as quotation' })); },
};
export const WizardScheduleVisible: Story = {
  render: () => <ServicesPage initialFlow={{ kind: 'new', customerId: 'c01', startStep: 2, initialDraft: { lines: lines() } }} />,
  play: async ({ canvasElement }) => { const b = body(canvasElement); await expect(await b.findByText('Schedule and staff')).toBeTruthy(); await expect(b.getByText('Mechanic')).toBeTruthy(); },
};
export const WizardBookDirect: Story = {
  render: () => <ServicesPage initialFlow={{ kind: 'new', customerId: 'c01', startStep: 2, initialDraft: { lines: lines() } }} />,
  play: async ({ canvasElement }) => { await userEvent.click(await body(canvasElement).findByRole('button', { name: 'Book service' })); },
};
export const WizardAddService: Story = {
  render: () => <ServicesPage initialFlow={{ kind: 'new', customerId: 'c01' }} />,
  play: async ({ canvasElement }) => { const b = body(canvasElement); await userEvent.type(await b.findByRole('combobox', { name: 'Add a service' }), 'oil'); await userEvent.click((await b.findAllByRole('option'))[0]!); await expect(b.getByRole('dialog').querySelector('[data-row="total"]')?.textContent).toMatch(/Subtotal/); },
};

// ---- Settings ----
export const SettingsAddInvalid: Story = {
  render: () => <ServicesPricesPage initialForm="new" />,
  play: async ({ canvasElement }) => { const b = body(canvasElement); await userEvent.click(await b.findByRole('button', { name: 'Add service' })); await expect(await b.findByText('Give the service a name.')).toBeInTheDocument(); },
};
export const SettingsRowMenu: Story = {
  render: () => <ServicesPricesPage />,
  play: async ({ canvasElement }) => { await userEvent.click((await within(canvasElement).findAllByRole('button', { name: /^More actions for/ }))[0]!); await body(canvasElement).findByRole('menuitem', { name: 'Deactivate' }); },
};
export const SettingsRowOpensModal: Story = {
  render: () => <ServicesPricesPage />,
  play: async ({ canvasElement }) => { await userEvent.click((await within(canvasElement).findAllByRole('row', { name: /Edit Brake pad replacement, front/ }))[0]!); await waitFor(() => expect(body(canvasElement).getByText('Edit service')).toBeInTheDocument()); },
};
export const SettingsMenuDoesNotDoubleOpen: Story = {
  render: () => <ServicesPricesPage />,
  play: async ({ canvasElement }) => { await userEvent.click((await within(canvasElement).findAllByRole('button', { name: /^More actions for/ }))[1]!); await userEvent.click(await body(canvasElement).findByRole('menuitem', { name: 'Edit' })); },
};
export const SettingsPartPicker: Story = {
  render: () => <ServicesPricesPage initialForm="sv24" />,
  play: async ({ canvasElement }) => { const b = body(canvasElement); await userEvent.click(await b.findByRole('button', { name: 'Add a part from Inventory' })); await userEvent.type(await b.findByRole('combobox'), 'BRK'); },
};
