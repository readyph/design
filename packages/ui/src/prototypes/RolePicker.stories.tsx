import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PlatformShell } from '../components/PlatformShell';
import { RolePicker } from '../components/RolePicker';
import { eight, platforms, roleOptions, saved, lockedPlatforms } from '../components/RolePicker.data';

/** RDY-282 (C22). Prototype only: not exported from the package. The picker in the real PlatformShell sheet (scrolling), light and dark, desktop and phone. */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Role picker in the sheet',
  parameters: { layout: 'fullscreen' },
};
export default meta;

function Sheet({ many }: { many?: boolean }) {
  const [savedValue, setSaved] = useState(saved);
  const [value, setValue] = useState(saved);
  return (
    <PlatformShell>
      <div className="mx-auto flex max-w-[640px] flex-col gap-4 p-6">
        <h2 className="text-title text-text">Maria Santos</h2>
        <p className="text-ui text-muted">What Maria does in each platform. Scroll the sheet: the dropdowns open upward near the bottom.</p>
        <RolePicker
          value={value}
          savedValue={savedValue}
          platforms={many ? eight : lockedPlatforms}
          roleOptions={roleOptions}
          subject="Maria"
          onChange={setValue}
          onDiscard={() => setValue(savedValue)}
          onSave={setSaved}
        />
      </div>
    </PlatformShell>
  );
}
export const Desktop: StoryObj = { render: () => <Sheet /> };
export const EightPlatforms: StoryObj = { render: () => <Sheet many /> };
export const Phone: StoryObj = { render: () => <Sheet />, parameters: { viewport: { defaultViewport: 'mobile1' } } };
void platforms;
