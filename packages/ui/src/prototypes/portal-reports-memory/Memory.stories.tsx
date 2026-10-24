import type { Meta, StoryObj } from '@storybook/react';
import { MemoryPage, type MemoryPageProps } from './Memory';

/**
 * PROTOTYPE (RDY-179) - Portal Memory on the RDY-175 shell. Full shell at the real viewport.
 * >= 1280: list | 28rem pane. < 1280: list, then the memory or editor replaces it (back arrow).
 * Delete asks first. Missing-in-kit notes live in the Reports story group.
 */
const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

const meta: Meta<MemoryPageProps> = {
  title: 'Prototypes/Portal/[For Review] Memory',
  component: MemoryPage,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'w1440' } },
  globals: { theme: 'light' },
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    state: { control: 'inline-radio', options: ['ready', 'loading', 'error', 'empty'] },
    mode: { control: 'inline-radio', options: ['view', 'edit', 'create'] },
    memoryId: { control: 'select', options: [undefined, 'hours', 'returns', 'branches', 'warranty', 'delivery', 'tone'] },
    leda: { control: 'inline-radio', options: ['closed', 'empty', 'conversation', 'confirm'] },
  },
  args: { theme: 'light', state: 'ready', mode: 'view' },
};
export default meta;
type Story = StoryObj<MemoryPageProps>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });
const darkGlobals = { globals: { theme: 'dark' } };

/* 1440 (split) */
export const Split: Story = { name: '1440 / List + memory' };
export const SplitDark: Story = { name: '1440 / List + memory, dark', args: { theme: 'dark' }, ...darkGlobals };
export const Edit: Story = { name: '1440 / Edit', args: { memoryId: 'returns', mode: 'edit' } };
export const Create: Story = { name: '1440 / New memory', args: { mode: 'create' } };
export const CreateDark: Story = { name: '1440 / New memory, dark', args: { mode: 'create', theme: 'dark' }, ...darkGlobals };
export const DeleteConfirm: Story = { name: '1440 / Delete confirm', args: { memoryId: 'warranty', confirmDelete: true } };
export const DeleteConfirmDark: Story = {
  name: '1440 / Delete confirm, dark',
  args: { memoryId: 'warranty', confirmDelete: true, theme: 'dark' },
  ...darkGlobals,
};
export const WithLeda: Story = { name: '1440 / Leda panel open', args: { leda: 'conversation' } };

/* States */
export const Empty: Story = { name: 'State / No memory yet', args: { state: 'empty' } };
export const EmptyDark: Story = { name: 'State / No memory yet, dark', args: { state: 'empty', theme: 'dark' }, ...darkGlobals };
export const NoResults: Story = { name: 'State / No matches', args: { query: 'payroll' } };
export const Loading: Story = { name: 'State / Loading', args: { state: 'loading' } };
export const ErrorState: Story = { name: 'State / Error', args: { state: 'error' } };

/* 1024 (single view) */
export const Laptop: Story = { name: '1024 / List', parameters: at('w1024') };
export const LaptopView: Story = { name: '1024 / Memory', args: { memoryId: 'hours' }, parameters: at('w1024') };
export const LaptopEditDark: Story = {
  name: '1024 / Edit, dark',
  args: { memoryId: 'hours', mode: 'edit', theme: 'dark' },
  ...darkGlobals,
  parameters: at('w1024'),
};

/* 390 */
export const Phone: Story = { name: '390 / List', parameters: at('w390') };
export const PhoneDark: Story = { name: '390 / List, dark', args: { theme: 'dark' }, ...darkGlobals, parameters: at('w390') };
export const PhoneView: Story = { name: '390 / Memory', args: { memoryId: 'branches' }, parameters: at('w390') };
export const PhoneEdit: Story = { name: '390 / Edit', args: { memoryId: 'returns', mode: 'edit' }, parameters: at('w390') };
export const PhoneDelete: Story = {
  name: '390 / Delete confirm, dark',
  args: { memoryId: 'warranty', confirmDelete: true, theme: 'dark' },
  ...darkGlobals,
  parameters: at('w390'),
};
