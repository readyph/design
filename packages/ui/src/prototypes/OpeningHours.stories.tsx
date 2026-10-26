import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OpeningHours, type OpeningHoursValue } from '../components/OpeningHours';
import { companyWeek, nowSample, ownValue, publicHolidays, sameValue, todayIso } from '../components/OpeningHours.data';
import { PlatformShell } from '../components/PlatformShell';
import { Toaster } from '../components/toast/Toaster';
import { toast } from '../components/toast/toastStore';

/** RDY-285 (C25). Prototype only: stories are not exported from the package. The editor in the real PlatformShell sheet, System tab. */
const meta: Meta = {
  title: 'Prototypes/Portal/Opening hours',
  parameters: { layout: 'fullscreen' },
};
export default meta;

function SystemTab({ initial }: { initial: OpeningHoursValue }) {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-6">
      <OpeningHours
        value={value}
        onChange={setValue}
        companyWeek={companyWeek}
        publicHolidays={publicHolidays}
        today={todayIso}
        now={nowSample}
        platformName="Auto Works"
        savedValue={saved}
        onDiscard={() => setValue(saved)}
        onSave={(v) => {
          const before = saved;
          setSaved(v);
          toast.undo('System settings saved.', () => {
            setSaved(before);
            setValue(before);
          });
        }}
      />
    </div>
  );
}

const shell = (initial: OpeningHoursValue) => (
  <>
    <PlatformShell place={<div className="px-3 text-ui text-muted">Auto Works</div>} placeLabel="Auto Works" detail sheetLabel="System">
      <SystemTab initial={initial} />
    </PlatformShell>
    <Toaster />
  </>
);

export const OwnHoursInSheet: StoryObj = { render: () => shell(ownValue) };
export const SameAsCompanyInSheet: StoryObj = { render: () => shell(sameValue) };
