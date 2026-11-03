import { ArrowsLeftRight, ClipboardText, Hash, PencilSimple, Table, Wrench } from '@phosphor-icons/react';
import { useLedaPanel } from '../LedaPanel';
import type { ChatMessageData } from '../Chat';
import type { CommandPaletteGroup } from '../CommandPalette';
import { jobs, ledaChips, ledaProposals, manager, peso, jobBalance, customerOf } from './data';

function reply(q: string, ctx: { proposal: (id: string) => ChatMessageData['blocks'] }): ChatMessageData['blocks'] {
  const t = q.toLowerCase();
  const chips = [{ id: 'f1', label: 'Who still owes us money?' }, { id: 'f2', label: 'What is Jun working on?' }];
  if (t.includes('12:00') || t.includes('finish'))
    return [
      { type: 'text', text: 'JO-0413 (11:30) and JO-0408 (12:00) are on track. JO-0410 is already past its 10:00 time. JO-0412 cannot finish until the alternator arrives.', stream: true },
      { type: 'meta', text: 'Read from Services and Parts Stockroom, 10:20' },
      { type: 'chips', chips },
    ];
  if (t.includes('jun'))
    return [
      { type: 'text', text: 'Jun has 5 active services. JO-0413 and JO-0408 are in progress, JO-0415 and JO-0417 are to-do, and JO-0412 is on hold for the alternator.', stream: true },
      { type: 'meta', text: 'Read from Services, 10:20' },
      { type: 'chips', chips: [{ id: 'f3', label: 'Move JO-0417 from Jun to Ricky' }] },
    ];
  if (t.includes('owe') || t.includes('money')) {
    const rows = jobs.filter((j) => j.status === 'FOR_PICKUP' && jobBalance(j) > 0).map((j) => ({ svc: j.number, customer: customerOf(j).name, balance: peso(jobBalance(j)) }));
    return [
      { type: 'text', text: `${rows.length} cars are ready and not fully paid.`, stream: true },
      { type: 'table', caption: 'Unpaid at pick-up', columns: [{ key: 'svc', label: 'Service' }, { key: 'customer', label: 'Customer' }, { key: 'balance', label: 'Balance', align: 'right' }], rows },
      { type: 'meta', text: 'Read from Services, 10:20' },
    ];
  }
  if (t.includes('ranger') || t.includes('pad'))
    return [
      { type: 'text', text: 'Bendix front pads: 2 here, 0 at Main warehouse. PO-0233 brings 6 on Wed 14:00. Two quotes already need them.', stream: true },
      { type: 'meta', text: 'Read from Parts Stockroom, 10:18' },
      { type: 'chips', chips: [{ id: 'f4', label: 'Add Bendix front pads to the order list' }] },
    ];
  if (t.includes('alternator') || t.includes('0412') || t.includes('transfer'))
    return ctx.proposal('lp1');
  if (t.includes('ricky') || t.includes('0417') || t.includes('move'))
    return ctx.proposal('lp2');
  if (t.includes('remind') || t.includes('quote'))
    return ctx.proposal('lp3');
  if (t.includes('order list'))
    return ctx.proposal('lp4');
  if (t.includes('pay') || t.includes('refund'))
    return [{ type: 'refusal', text: "Leda can't record payments or refunds. That stays with you at the counter.", actions: [{ id: 'go', label: 'Open the Counter lane', href: '#counter' }] }];
  return [{ type: 'text', text: "Sorry, I can't answer that in this prototype.", stream: true }, { type: 'chips', chips: ledaChips.slice(0, 2).map((c, i) => ({ id: `u${i}`, label: c })) }];
}

const PALETTE: CommandPaletteGroup[] = [
  { id: 'ask', label: 'Ask Leda', items: [
    { id: `ask:${ledaChips[0]}`, label: ledaChips[0]!, icon: Hash }, { id: `ask:${ledaChips[1]}`, label: ledaChips[1]!, icon: Hash },
    { id: `ask:${ledaChips[2]}`, label: ledaChips[2]!, icon: Table }, { id: `ask:${ledaChips[3]}`, label: ledaChips[3]!, icon: Hash },
  ] },
  { id: 'do', label: 'Tell Leda to do', items: [
    { id: 'ask:Get the alternator for JO-0412', label: 'Get the alternator for JO-0412', icon: ArrowsLeftRight, meta: 'you confirm' },
    { id: 'ask:Move JO-0417 from Jun to Ricky', label: 'Move JO-0417 from Jun to Ricky', icon: PencilSimple, meta: 'you confirm' },
    { id: 'ask:Remind customers about their quotes', label: 'Remind customers about their quotes', icon: PencilSimple, meta: 'you confirm' },
    { id: 'ask:Record a payment', label: 'Record a payment', icon: PencilSimple, refused: true, meta: 'you do this' },
  ] },
  { id: 'go', label: 'Go to', items: [
    { id: 'nav:today', label: 'Today', icon: Wrench },
    { id: 'nav:services', label: 'Services', icon: ClipboardText, meta: 'all service orders' },
  ] },
];


/**
 * The Portal's Leda behaviour on SMS, bound to the mock data: `useLedaPanel` with the workshop's answers, palette and proposals.
 * Page-specific answers (Services: filter the list) come in `handle`; return null to fall through to the shared replies.
 */
export function useSmsLeda({ onConfirmed, startOpen = false, scope = 'Today', handle, chips = ledaChips }: {
  onConfirmed?: (proposalId: string) => void; startOpen?: boolean;
  scope?: string;
  handle?: (q: string) => ChatMessageData['blocks'] | null;
  chips?: string[];
} = {}) {
  return useLedaPanel({
    person: manager, proposals: ledaProposals, palette: PALETTE, onConfirmed, startOpen, scope, chips, clock: () => '10:20 AM', storageKey: 'rph-sms-leda-v1',
    answer: (q, ctx) => handle?.(q) ?? reply(q, ctx),
  });
}
