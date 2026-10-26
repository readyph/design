import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OpeningHours, type OpeningHoursProps, type OpeningHoursValue } from './OpeningHours';
import { companyWeek, nowSample, ownValue, publicHolidays, sameValue, todayIso } from './OpeningHours.data';

function Harness(props: Partial<OpeningHoursProps> & { initial?: OpeningHoursValue; bar?: boolean }) {
  const { initial = sameValue, bar, ...rest } = props;
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  return (
    <OpeningHours
      value={value}
      onChange={setValue}
      companyWeek={companyWeek}
      publicHolidays={publicHolidays}
      today={todayIso}
      platformName="Auto Works"
      now={nowSample}
      {...(bar ? { savedValue: saved, onSave: (v: OpeningHoursValue) => setSaved(v), onDiscard: () => setValue(saved) } : {})}
      {...rest}
    />
  );
}

const meta: Meta<typeof OpeningHours> = {
  title: 'Components/Forms/OpeningHours',
  component: OpeningHours,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Opening hours editor (C25). A controlled draft. "Same as company hours" (on by default) shows the week in one line; off gives one row per day (Open/Closed switch, opening and closing dropdowns in 30-minute steps from 5:00 AM to 11:00 PM), "Copy Monday to the other open days", public holidays (the next 5, each switchable to open anyway), one-off closures (date and reason, sorted, removed through the delete confirmation) and the Leda line for "Are you open?". Week rows use 12px padding.',
          '',
          '- **Value:** `{ sameAsCompany, week: Record<mon..sun, { open, from, to }>, holidays: { closed, openOn: string[] }, closures: { id, date, reason? }[] }`. Times are 24h `"HH:MM"`; dates `"YYYY-MM-DD"`.',
          '- **Closing never before opening.** Closing options start after the chosen opening. If opening moves to or past the closing time, closing moves to one hour later (capped at 11:00 PM) and the change is announced.',
          '- **Overnight hours are not supported** (a day ends by 11:00 PM). A venue open past midnight uses two entries on the next day or a closure note; revisit with the API.',
          '- **Closed day:** both dropdowns are disabled and read "Closed", with the reason in their description.',
          '- **Copy Monday** keeps focus on the button and announces which days changed. It is disabled with a visible reason when Monday is closed.',
          '- **Locale and clock** come from props (`locale`, `hour12`, `formatTime`); nothing reads the clock. `today` and `now` are passed in.',
          '- **Draft:** pass `savedValue`, `onSave`, `onDiscard` for one Save and Discard (disabled until the draft differs; after Save or Discard focus moves to the heading, never to the page). Without them the page owns Save (the System tab does: "Save system settings" then a toast with Undo).',
          '- **Leda line:** pass `ledaAnswer` (the real answer from the API) or `now` to build one from the week.',
          '',
          '```tsx',
          '<OpeningHours value={v} onChange={setV} companyWeek={company} publicHolidays={holidays} today="2026-10-22" platformName="Auto Works" now={{ day: "thu", minutes: 552, date: "2026-10-22" }} />',
          '```',
        ].join('\n'),
      },
    },
  },
  render: (args) => <Harness {...args} />,
  decorators: [(Story) => <div className="w-full max-w-[720px] bg-surface p-4"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof OpeningHours>;

export const SameAsCompany: Story = {};
export const OwnHours: Story = { args: { initial: ownValue } as never };
export const WithSaveBar: Story = { args: { initial: ownValue, bar: true } as never };
export const Hour24German: Story = { args: { initial: ownValue, hour12: false, locale: 'de-DE' } as never };
export const NoOpenDays: Story = {
  args: { initial: { ...ownValue, week: Object.fromEntries(Object.entries(ownValue.week).map(([k, d]) => [k, { ...d, open: false }])) as OpeningHoursValue['week'] } } as never,
};
export const ReadOnly: Story = { args: { initial: ownValue, readOnly: true, readOnlyReason: 'Only company admins can change opening hours.' } as never };
export const Phone: Story = {
  args: { initial: ownValue } as never,
  decorators: [(Story) => <div className="w-[320px] max-w-full bg-surface p-3"><Story /></div>],
};
