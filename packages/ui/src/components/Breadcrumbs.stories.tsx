import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';
import { PlatformLogo } from './PlatformLogo';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Components/Navigation/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Back link and breadcrumb (C42). One `nav` landmark; the last item is the current page (`aria-current="page"`).',
          '',
          '- `trail` (default): plain crumbs, 12/16 muted, optional `logo` per crumb.',
          '- `sheet`: sheet bar. Bordered link-style back control ("← Team") then "/ {item}" in text colour, 600.',
          '- `phone`: top bar. Plain "‹ Team" back link.',
          '',
          'Back links are plain text, never filled or pill. Back, Esc and browser Back return with the slide out (wired by the page). Long labels truncate; full text is in the tooltip.',
          '',
          '```tsx',
          '<Breadcrumbs aria-label="Breadcrumb 1" variant="sheet" items={[{ label: "Team", href: "/team" }, { label: "Ana Reyes" }]} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

const panel = (el: React.ReactNode, w = 'w-full max-w-xl') => (
  <div className={`${w} rounded-card border border-border bg-surface p-pad`}>{el}</div>
);

export const Trail: Story = {
  render: () =>
    panel(
      <Breadcrumbs aria-label="Breadcrumb 2"
        items={[
          { label: 'All platforms', href: '#' },
          { label: 'Barangay Clearance', href: '#', logo: <PlatformLogo decorative name="Barangay Clearance" index={2} /> },
          { label: 'Cases' },
        ]}
      />,
    ),
};

export const Sheet: Story = {
  render: () =>
    panel(
      <div className="flex flex-col gap-4">
        <Breadcrumbs aria-label="Breadcrumb 3" variant="sheet" items={[{ label: 'Team', href: '#' }, { label: 'Ana Reyes' }]} />
        <Breadcrumbs aria-label="Breadcrumb 4" variant="sheet" items={[{ label: 'All platforms', href: '#' }, { label: 'Barangay Clearance' }]} />
        <Breadcrumbs aria-label="Breadcrumb 5" variant="sheet" items={[{ label: 'Memory', href: '#' }, { label: 'Business permit renewal rules' }]} />
      </div>,
    ),
};

export const Phone: Story = {
  render: () => panel(<Breadcrumbs aria-label="Breadcrumb 6" variant="phone" items={[{ label: 'Team', href: '#' }, { label: 'Ana Reyes' }]} />, 'w-full max-w-[375px]'),
};

export const LongNames: Story = {
  render: () =>
    panel(
      <div className="flex flex-col gap-4">
        <Breadcrumbs aria-label="Breadcrumb 7"
          variant="sheet"
          items={[{ label: 'Quezon City Business Permits and Licensing Office', href: '#' }, { label: 'An exceptionally long case title that must truncate rather than wrap or overflow the bar' }]}
        />
        <Breadcrumbs aria-label="Breadcrumb 8"
          items={[
            { label: 'All platforms', href: '#' },
            { label: 'Quezon City Business Permits and Licensing Office', href: '#', logo: <PlatformLogo decorative name="Quezon City" index={1} /> },
            { label: 'An exceptionally long case title that must truncate rather than overflow' },
          ]}
        />
      </div>,
      'w-full max-w-80',
    ),
};

/** 320px is the place column width below 960px: the trail stays on one line, ancestors truncate first. */
export const TrailNarrow320: Story = {
  render: () =>
    panel(
      <Breadcrumbs aria-label="Breadcrumb 9"
        items={[
          { label: 'All platforms', href: '#' },
          { label: 'Quezon City Business Permits and Licensing Office', href: '#', logo: <PlatformLogo decorative name="Quezon City" index={1} /> },
          { label: 'An exceptionally long case title that must truncate rather than overflow' },
        ]}
      />,
      'w-full max-w-[320px]',
    ),
};
