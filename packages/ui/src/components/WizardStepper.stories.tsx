import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WizardStepper, type WizardStep } from './WizardStepper';

const steps: WizardStep[] = [{ id: 1, label: 'Services & price' }, { id: 2, label: 'Review & confirm' }];

function Live({ steps: s, start }: { steps: WizardStep[]; start: number }) {
  const [current, setCurrent] = useState(start);
  return <WizardStepper steps={s} current={current} onGo={setCurrent} />;
}

const meta: Meta<typeof WizardStepper> = {
  title: 'Components/SMS/Wizard stepper',
  component: WizardStepper,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[640px] max-w-full"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof WizardStepper>;

export const StepOne: S = { render: () => <Live steps={steps} start={1} /> };
export const StepTwo: S = { render: () => <Live steps={steps} start={2} /> };
export const SecondBlocked: S = { render: () => <Live steps={[steps[0]!, { ...steps[1]!, blocked: 'Pick a customer first.' }]} start={1} /> };
