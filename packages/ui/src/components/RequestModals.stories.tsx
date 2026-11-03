import type { Meta, StoryObj } from '@storybook/react';
import { DeclineModal, DismissModal, QuoteModal } from './RequestModals';

const meta: Meta = {
  title: 'Components/Overlays/Request modals',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Quote: S = { render: () => <QuoteModal open problem="Brake pads are worn to the metal." customerAfter="waiting" onClose={() => {}} onSend={() => {}} /> };
export const Decline: S = { render: () => <DeclineModal open partName="Brake pad set, front" onClose={() => {}} onConfirm={() => {}} /> };
export const Dismiss: S = { render: () => <DismissModal open onClose={() => {}} onConfirm={() => {}} /> };
