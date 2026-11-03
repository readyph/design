import type { Meta, StoryObj } from '@storybook/react';
import { PanelToggle } from './PanelToggle';

const meta: Meta<typeof PanelToggle> = {
  title: 'Components/Actions/Panel toggle',
  component: PanelToggle,
  tags: ['autodocs'],
  args: { mode: 'hide', onClick: () => {} },
  argTypes: { mode: { control: 'inline-radio', options: ['hide', 'show'] }, tooltipSide: { control: 'inline-radio', options: ['left', 'bottom'] } },
};
export default meta;
type S = StoryObj<typeof PanelToggle>;

/** Panel is open: a minus. */
export const Hide: S = {};
/** Panel is collapsed: a plus, with the count as context in the label. */
export const Show: S = { args: { mode: 'show', hint: '3 need you' } };
