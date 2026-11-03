import type { Meta, StoryObj } from '@storybook/react';
import { useSmsLeda } from './LedaPanel';

function Demo({ startOpen, scope }: { startOpen?: boolean; scope?: string }) {
  const leda = useSmsLeda({ startOpen, scope });
  return (
    <div className="p-4">
      <button type="button" onClick={leda.openPalette} className="rounded-control border border-control px-3 py-2 text-[14px] text-text">Ask Leda</button>
      {leda.node}
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Components/SMS/Leda panel',
  component: Demo,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="h-[640px]"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof Demo>;

/** The Ask Leda button opens the command palette; Enter on "Ask Leda: ..." opens the conversation panel. */
export const Palette: S = {};
/** The 440px conversation panel, empty with the starter questions. */
export const ConversationOpen: S = { args: { startOpen: true } };
export const ServicesScope: S = { args: { startOpen: true, scope: 'Services' } };
