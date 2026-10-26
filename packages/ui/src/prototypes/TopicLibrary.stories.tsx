import type { Meta, StoryObj } from '@storybook/react';
import { PlatformShell } from '../components/PlatformShell';
import { SheetBar } from '../components/SheetBar';
import { TopicLibraryPage } from '../components/TopicLibrary.sample';

/** [For Review] RDY-287 (C27). Prototype only: stories are not exported from the package. Memory, Topics tab, in the real PlatformShell sheet. */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Topic library',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Page = (props: Parameters<typeof TopicLibraryPage>[0]) => (
  <PlatformShell detail sheetBar={<SheetBar><span className="text-ui font-medium">Memory</span></SheetBar>} place={<div className="p-3 text-ui text-muted">Folders</div>} placeLabel="Folders">
    <div className="px-pad py-5">
      <h1 className="text-title">What customers&rsquo; Leda knows</h1>
      <p className="mb-4 mt-1 text-ui text-muted">Off means Leda never uses it for customers.</p>
      <TopicLibraryPage {...props} />
    </div>
  </PlatformShell>
);

export const Desktop: StoryObj = { render: () => <Page /> };
export const Phone: StoryObj = { render: () => <Page />, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const ReadOnly: StoryObj = { render: () => <Page readOnly /> };
export const Loading: StoryObj = { render: () => <Page loading /> };
