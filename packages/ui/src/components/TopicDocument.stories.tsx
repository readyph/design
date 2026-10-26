import type { Meta, StoryObj } from '@storybook/react';
import { TopicDocument } from './TopicDocument';
import { TopicDocumentPage, dataTopic, lockedTopic } from './TopicDocument.sample';

const meta: Meta = {
  title: 'Components/Data display/Topic document',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Topic document page (C28): one topic as a page. Source line, title (24/32), switch (C36), paragraph 16/27 in a 680px measure, "Questions this helps answer" with a link that opens Try it, "last changed".',
          '',
          '- **Custom topics** are in-place document fields (title, body min 190px, grows, not resizable) with a bar: "Unsaved changes", characters left in memory, Delete (C12), Discard, Save. The save shortcut (Cmd/Ctrl+S) works while there is unsaved text. **Data topics** are read only with "Comes from {origin} data · edit it in {where}"; company topics point to Settings.',
          '- The component keeps only the draft text. The page saves (`onSave` may be async and may return `{ error, field }`), checks the title is unique and the memory room, saves the switch with `toast.undo`, and goes back after Delete with `toast.undo`.',
          '- Save and Discard use `aria-disabled` (never `disabled`) and Save is `aria-busy` while saving, so focus stays put. After a refused save focus moves to the field only if it was still on the bar or lost (`focusIfLost`); the result is also announced in a polite live region.',
          '- Leaving with unsaved text: `onDirtyChange` drives `useUnsavedGuard(dirty)` (reload, close tab) and `UnsavedLeaveDialog` (back, folder, Esc, browser Back).',
          '- A deleted topic closes its dialog; the page then decides where focus goes (the library heading). Nothing moves focus on a timer.',
          '',
          '```tsx',
          '<TopicDocument topic={topic} room={{ max: 16000, others }} onSave={save} onDelete={remove} onToggle={toggle}',
          '  onTry={openTryIt} onDirtyChange={setDirty} edit={{ href, label: "Auto Works" }} origin="Auto Works" />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const Wrap = ({ children }: { children: React.ReactNode }) => <main className="min-h-screen bg-surface p-pad text-text">{children}</main>;

export const CustomTopic: Story = { render: () => <Wrap><TopicDocumentPage /></Wrap> };
export const DataTopic: Story = { render: () => <Wrap><TopicDocumentPage initial={dataTopic} /></Wrap> };
export const SensitiveOff: Story = { render: () => <Wrap><TopicDocumentPage initial={lockedTopic} /></Wrap> };
export const NewTopic: Story = { render: () => <Wrap><TopicDocumentPage isNew /></Wrap> };
export const ReadOnlyCustom: Story = { render: () => <Wrap><TopicDocumentPage readOnly /></Wrap> };
export const SlowSave: Story = { render: () => <Wrap><TopicDocumentPage delay={5000} /></Wrap> };
export const Loading: Story = { render: () => <Wrap><TopicDocument loading /></Wrap> };
export const LoadFailed: Story = { render: () => <Wrap><TopicDocument error onRetry={() => {}} /></Wrap> };
export const Gone: Story = { render: () => <Wrap><TopicDocument missing onBack={() => {}} /></Wrap> };
