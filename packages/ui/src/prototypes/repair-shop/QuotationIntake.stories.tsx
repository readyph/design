import type { Meta, StoryObj } from '@storybook/react';
import { RepairFlow } from './Flow';
import type { IntakeScenario } from './QuotationIntake';
import { mobile } from './params';

/** PROTOTYPE (RDY-18) - quotation intake drawer on one screen, opened from the Today header. Success is a toast and the job detail, not a success screen. */
const meta: Meta = { title: 'Repair shop/Quotation intake', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

const Page = ({ scenario }: { scenario: IntakeScenario }) => <RepairFlow intake={scenario} />;

export const Default: Story = { name: 'Default (blank)', render: () => <Page scenario="blank" /> };
export const MoreOptions: Story = { name: 'More options open', render: () => <Page scenario="more-options" /> };
export const ExistingCustomer: Story = { name: 'Existing customer picked', render: () => <Page scenario="existing" /> };
export const Validation: Story = { render: () => <Page scenario="validation" /> };
export const Submitting: Story = { render: () => <Page scenario="submitting" /> };
export const ErrorState: Story = { name: 'Error (save failed)', render: () => <Page scenario="error" /> };
export const EmptyCatalogue: Story = { name: 'Empty (no active catalogue)', render: () => <Page scenario="no-catalogue" /> };
/** Sends the prefilled quotation: the drawer closes, a toast shows and the new job's detail opens with its next action. */
export const SendLandsOnDetail: Story = {
  name: 'Send for confirmation (toast, lands on detail)',
  render: () => <Page scenario="existing" />,
  play: async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await wait(800);
    Array.from(document.querySelectorAll<HTMLElement>('button')).find((b) => b.textContent?.trim() === 'Send for confirmation')?.click();
  },
};
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <Page scenario="blank" /> };
export const MobileValidation: Story = { name: 'Mobile 390 (validation)', parameters: mobile, render: () => <Page scenario="validation" /> };
