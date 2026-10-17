import type { Meta, StoryObj } from '@storybook/react';
import { RepairShell } from './Shell';
import { JobList } from './JobScreens';
import type { IntakeScenario } from './QuotationIntake';
import { fullscreen, mobile } from './params';

/** PROTOTYPE (RDY-18) - quotation intake drawer, opened over the job list. */
const meta: Meta = { title: 'Prototypes/Repair shop/Quotation intake', tags: ['!autodocs'], parameters: fullscreen };
export default meta;
type Story = StoryObj;

const Page = ({ scenario }: { scenario: IntakeScenario }) => (
  <RepairShell active="jobs"><JobList intake={scenario} /></RepairShell>
);

export const Default: Story = { name: 'Default (blank)', render: () => <Page scenario="blank" /> };
export const ExistingCustomer: Story = { name: 'Existing customer found', render: () => <Page scenario="existing" /> };
export const Validation: Story = { render: () => <Page scenario="validation" /> };
export const Submitting: Story = { render: () => <Page scenario="submitting" /> };
export const ErrorState: Story = { name: 'Error (save failed)', render: () => <Page scenario="error" /> };
export const Success: Story = { render: () => <Page scenario="success" /> };
export const EmptyCatalogue: Story = { name: 'Empty (no active catalogue)', render: () => <Page scenario="no-catalogue" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <Page scenario="blank" /> };
export const MobileValidation: Story = { name: 'Mobile 390 (validation)', parameters: mobile, render: () => <Page scenario="validation" /> };
