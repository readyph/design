import type { Meta, StoryObj } from '@storybook/react';
import { PlatformShell } from '../components/PlatformShell';
import { SheetBar } from '../components/SheetBar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { TopicDocumentPage, dataTopic } from '../components/TopicDocument.sample';

/** RDY-288 (C28). Prototype only: stories are not exported from the package. A topic's page in the real PlatformShell sheet. */
const meta: Meta = {
  title: 'Prototypes/Portal/Topic document',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Page = (props: Parameters<typeof TopicDocumentPage>[0]) => (
  <PlatformShell
    detail
    sheetBar={<SheetBar><Breadcrumbs variant="sheet" aria-label="Memory" items={[{ label: 'Memory', href: '#memory' }, { label: 'Auto Works', href: '#auto' }, { label: 'Warranty on repairs' }]} /></SheetBar>}
    place={<div className="p-3 text-ui text-muted">Folders</div>}
    placeLabel="Folders"
  >
    <div className="px-pad py-5">
      <TopicDocumentPage {...props} />
    </div>
  </PlatformShell>
);

export const Desktop: StoryObj = { render: () => <Page /> };
export const Phone: StoryObj = { render: () => <Page />, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const DataTopic: StoryObj = { render: () => <Page initial={dataTopic} /> };
export const NewTopic: StoryObj = { render: () => <Page isNew /> };
