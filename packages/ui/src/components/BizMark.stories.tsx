import type { Meta, StoryObj } from '@storybook/react';
import { BizMark } from './BizMark';

const meta: Meta<typeof BizMark> = { title: 'Components/Identity/Business mark', component: BizMark, tags: ['autodocs'], args: { size: 28 } };
export default meta;
export const Placeholder: StoryObj<typeof BizMark> = {};
