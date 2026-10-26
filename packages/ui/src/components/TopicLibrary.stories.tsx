import type { Meta, StoryObj } from '@storybook/react';
import { TopicLibraryPage, manyTopics } from './TopicLibrary.sample';

const meta: Meta = {
  title: 'Components/Data display/Topic library',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Topic library (C27): what customers\' Leda knows, as a list (default) or a grid. Toolbar: search, Turn all on / off, New topic, business filter (C14), filters with counts (C39), list / grid toggle. List: ruled square rows (C18) with title link, two lines, folder, source, lock icon for off-by-default topics, switch (C36). Grid: flat tiles on `--raised`, 6px radius, no shadow.',
          '',
          '- The component only emits. The page filters `topics`, saves a switch (`onToggle`) then calls `toast.undo`, and asks before a bulk change (`onToggleAll`) with a `ConfirmDialog`.',
          '- The switch is its own control inside a row that links to the topic: the row is not a label. Its name is "Customers\' Leda can use {title}"; the On / Off word beside it means state is never colour alone.',
          '- One j / k / Enter cursor for rows or tiles (kept across a list / grid change). `/` is not registered: the Ask Leda bar owns it. The search box ignores j / k.',
          '- Search is debounced 200ms (Enter at once, Esc clears); matches are marked with React text nodes and an escaped matcher, never HTML.',
          '- `useTopicLayout()` keeps the choice in `localStorage` (`rph-mem-layout`) inside try/catch, read after mount.',
          '- 200+ topics: rows are memoised and the page handlers are stable; no windowing (out of scope, 240 renders in one pass).',
          '',
          '```tsx',
          'const [layout, setLayout] = useTopicLayout();',
          '<TopicLibrary topics={shown} counts={counts} filter={filter} onFilterChange={setFilter}',
          '  businesses={options} business={b} onBusinessChange={setB} query={q} onQueryChange={setQ}',
          '  layout={layout} onLayoutChange={setLayout} onToggle={save} onToggleAll={askFirst} allOn={allOn} onNew={add} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const Wrap = ({ children }: { children: React.ReactNode }) => <main className="min-h-screen bg-surface p-pad text-text"><h1 className="mb-4 text-title">What customers&rsquo; Leda knows</h1>{children}</main>;

export const Default: Story = { render: () => <Wrap><TopicLibraryPage /></Wrap> };
export const ReadOnly: Story = { render: () => <Wrap><TopicLibraryPage readOnly /></Wrap> };
export const Loading: Story = { render: () => <Wrap><TopicLibraryPage loading /></Wrap> };
export const LoadFailed: Story = { render: () => <Wrap><TopicLibraryPage error onRetry={() => {}} /></Wrap> };
export const EmptyFolder: Story = { render: () => <Wrap><TopicLibraryPage initial={[]} emptyHeadingLevel={2} /></Wrap> };
export const TwoHundredForty: Story = { name: '240 topics', render: () => <Wrap><TopicLibraryPage initial={manyTopics} /></Wrap> };
