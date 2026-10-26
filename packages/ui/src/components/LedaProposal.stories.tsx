import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ReactNode } from 'react';
import { LedaProposal, type LedaProposalProps } from './LedaProposal';
import { Button } from './Button';
import { Toaster } from './toast/Toaster';
import { toast } from './toast/toastStore';

const meta: Meta<typeof LedaProposal> = {
  title: 'Components/Leda/LedaProposal',
  component: LedaProposal,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Leda proposal / confirm card (C9, RDY-269). A raised box listing exactly what Leda will change, right above Confirm. Nothing is written until `onConfirm`.',
          '',
          'States: `waiting` -> `writing` (Aurora on the mark, `aria-busy`, "Writing…") -> `done` (green result line, optional next action) or `discarded`. Undo from the toast returns it to `waiting`. A card made on another page shows "Open {page} to confirm" (`openPage`).',
          '',
          'Rules. Discard is one click, no dialog: show `toast.undo` and set `state` back to `waiting` on Undo. While writing, Confirm and Discard are `aria-disabled` (not `disabled`) so focus stays on Confirm. After Confirm or Discard here, focus moves to the result line; other state changes are announced once in a polite live region. Notes and warnings carry spoken prefixes ("Note:", "Warning:"), so no meaning is colour alone. Built for 440px (the Leda overlay) and phone; works to 320px. `className` is applied first: margin and width only.',
          '',
          '```tsx',
          '<LedaProposal id="CMD-RL" title="Raise oil filter reorder level to 30" writes={["Oil filter reorder level: 20 to 30"]}',
          '  state={state} onConfirm={() => setState("writing")} onDiscard={() => setState("discarded")} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof LedaProposal>;

const frame = (el: ReactNode, w = 408) => <div className="bg-frame p-4" style={{ width: w + 32, maxWidth: '100%' }}>{el}</div>;
const surface = (el: ReactNode, w = 408) => <div className="bg-surface p-4" style={{ width: w + 32, maxWidth: '100%' }}>{el}</div>;

const base: LedaProposalProps = {
  id: 'CMD-RL',
  title: 'Raise oil filter reorder level to 30',
  writes: ['Oil filter (OF-114) reorder level: 20 to 30', 'Parts Stockroom shows a low-stock flag at 30'],
  notes: ['Nothing is ordered yet.'],
  cannot: "Leda can't change the supplier.",
};

const po: LedaProposalProps = {
  id: 'PO-0187',
  title: 'Rush purchase order for the Dela Cruz alternator',
  confirmLabel: 'Confirm rush PO',
  lines: [
    { label: 'Alternator 90A', detail: '2 x PHP 4,200', value: 'PHP 8,400' },
    { label: 'Drive belt', detail: '2 x PHP 650', value: 'PHP 1,300' },
    { label: 'Rush fee', value: 'PHP 500' },
    { label: 'Total', value: 'PHP 10,200', total: true },
  ],
  writes: ['Creates PO-0187 for Metro Auto Parts', 'Moves JO-0412 to Waiting on parts'],
  writesHeading: 'Confirm creates',
  warning: 'Rush delivery cannot be cancelled after the supplier confirms.',
  extra: <Button variant="secondary" actionBar className="focus-visible:ring-offset-raised">Change it first</Button>,
};

export const Waiting: Story = { render: () => frame(<LedaProposal {...base} />) };
export const WaitingOnSurface: Story = { render: () => surface(<LedaProposal {...base} />) };
export const WithLinesAndWarning: Story = { render: () => frame(<LedaProposal {...po} />) };
export const WithLinesOnSurface: Story = { render: () => surface(<LedaProposal {...po} />) };
export const Writing: Story = { render: () => frame(<LedaProposal {...po} state="writing" />) };
export const Done: Story = {
  render: () => frame(<LedaProposal {...base} state="done" after="Reorder level is now 30." doneAt="9:12 AM" doneAction={<Button variant="secondary" actionBar className="focus-visible:ring-offset-raised">See it in Memory</Button>} />),
};
export const DoneOnSurface: Story = { render: () => surface(<LedaProposal {...base} state="done" after="Reorder level is now 30." doneAt="9:12 AM" />) };
export const Discarded: Story = { render: () => frame(<LedaProposal {...base} state="discarded" />) };
export const DiscardedOnSurface: Story = { render: () => surface(<LedaProposal {...base} state="discarded" />) };
export const OnAnotherPage: Story = { render: () => frame(<LedaProposal {...base} openPage="Parts Stockroom" openHref="#parts" />) };
export const OnAnotherPageButton: Story = { render: () => frame(<LedaProposal {...base} openPage="Parts Stockroom" onOpenPage={() => undefined} />) };

export const Interactive: Story = {
  render: () => {
    const [state, setState] = useState<LedaProposalProps['state']>('waiting');
    return (
      <>
        {frame(
          <LedaProposal
            {...po}
            state={state}
            after="PO-0187 sent to Metro Auto Parts."
            doneAt="9:12 AM"
            onConfirm={() => {
              setState('writing');
              setTimeout(() => {
                setState('done');
                toast.undo('Purchase order created.', () => setState('waiting'), { leda: true });
              }, 1500);
            }}
            onDiscard={() => {
              setState('discarded');
              toast.undo('Draft discarded.', () => setState('waiting'));
            }}
          />,
        )}
        <Toaster />
      </>
    );
  },
};

const long = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export const Narrow320: Story = {
  render: () =>
    frame(
      <LedaProposal
        id="CMD-RL-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        title={`Raise the reorder level of ${long} to 30 for the whole shop`}
        lines={[
          { label: `Item ${long}`, detail: `Unit ${long}`, value: `PHP ${long}` },
          { label: 'Total', value: 'PHP 1,234,567.00', total: true },
        ]}
        writes={[`Reorder level of ${long}: 20 to 30`]}
        notes={['Noel Cruz is notified by email.']}
        warning={`This affects ${long} everywhere.`}
        confirmLabel="Confirm the reorder level change for every branch"
        extra={<Button variant="secondary" actionBar>Change it first</Button>}
      />,
      272,
    ),
};
