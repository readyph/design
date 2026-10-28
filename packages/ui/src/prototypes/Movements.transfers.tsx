import { useMemo, type ReactNode } from 'react';
import { ArrowSquareOut, Plus } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { PaperDocument, type PaperLine } from '../components/PaperDocument';
import { PlatformLogo } from '../components/PlatformLogo';
import { ProgressSteps } from '../components/ProgressSteps';
import { TransferDetail } from '../components/TransferDetail';
import { TransferForm, type TransferFormValue } from '../components/TransferForm';
import { TransferList, type TransferActionKind, type TransferFilter, type TransferRowData } from '../components/TransferList';
import type { MovementsModel, TrView } from './Movements.data';

/* RDY-438. Page: Movements 4/6 (d), the Transfers view: list, detail, new transfer and change a draft. Transcribed from inventory-home FINAL movements.js 206-210 (waitNote), 230-260 (tmatches, tcounts, trRow, trResults, transfersHTML),
   296-310 (paperHTML), 311-376 (stepsOf, historyOf, lineIssue, confirmHTML, tdetailHTML), 408-455 (fPlan, otherDrafts, alsoWord, warnHTML, formHTML), movements.css 88-139, 276-289. The list, detail, steps, paper and form are
   the I15 / I10 / I9 components; the page passes props only. */

type Props = { M: MovementsModel; tick: () => void };

const firstBlock = (head: string, body: string, actions?: ReactNode, steps?: [string, string][]) => (
  <div className="py-10">
    <p className="text-[16px]"><b className="font-semibold">{head}</b></p>
    <p className="mt-1.5 max-w-[560px] text-[14px] leading-[21px] text-muted">{body}</p>
    {steps ? <ol className="m-0 mt-6 grid max-w-[760px] list-none grid-cols-3 gap-6 p-0 max-[640px]:grid-cols-1 max-[640px]:gap-4">{steps.map(([b, s]) => <li key={b} className="flex flex-col gap-1 border-t border-border pt-3"><b className="text-[14px] font-semibold">{b}</b><span className="text-[13px] leading-[19px] text-muted">{s}</span></li>)}</ol> : null}
    {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
  </div>
);

/** movements.js 206-210 waitNote */
export function waitNote(M: MovementsModel, t: TrView): string {
  const { can, place, mgr, canSend, tWhen } = M;
  if (t.status === 'draft') return t.out ? (canSend(t) ? (t.request ? `Requested by ${place(t.to).short}` : 'Not sent yet') : `Waiting for a manager · ${mgr()}`) : 'Draft';
  if (t.status === 'transit') return `Sent ${tWhen(t)}`;
  void can;
  return '';
}

/** movements.js 232-241 trRow data */
function rowOf(M: MovementsModel, t: TrView): TransferRowData {
  const { who, place, HERE, tWhen, gotT, qtyWords, namesOf, can, canSend } = M;
  const w = t.status === 'received' ? (t.short ? gotT(t) : 'All in') : t.status === 'transit' ? 'On its way' : '';
  const sub = t.status === 'draft' ? waitNote(M, t) : t.status === 'transit' ? `Sent ${tWhen(t)}` : t.status === 'received' ? `Received ${tWhen(t)}` : `By ${who((t.cancelled as { by?: string } | undefined)?.by as string)}`;
  const action: TransferActionKind = t.status === 'draft' && t.out && canSend(t) ? 'send' : t.status === 'transit' && !t.out && can('receive') ? 'receive' : t.status === 'draft' ? 'open' : 'view';
  return {
    id: t.id, status: t.status, out: t.out, otherName: t.other.name, hereShort: place(HERE).short, job: t.job || undefined, statusNote: w || sub,
    items: qtyWords(t), itemNames: namesOf(t), when: tWhen(t),
    who: who((t.status === 'received' ? t.receivedBy : t.status === 'transit' ? t.sentBy : t.createdBy) as string), action,
  };
}

export interface TransfersListProps extends Props {
  filter: TransferFilter;
  onFilter: (f: TransferFilter) => void;
  onOpen: (id: string, kind: TransferActionKind | 'name') => void;
  onNew: () => void;
  loading?: boolean;
}

/** movements.js 255-260 transfersHTML (live branch) and 243-253 */
export function TransfersList({ M, filter, onFilter, onOpen, onNew, loading }: TransfersListProps) {
  const { can, needsMe } = M;
  const all = M.trs();
  const counts = { all: all.length } as Record<TransferFilter, number>;
  (['draft', 'transit', 'received', 'cancelled'] as const).forEach((k) => { counts[k] = all.filter((t) => t.status === k).length; });
  const sorted = all.slice().sort((a, b) => (needsMe(b) ? 1 : 0) - (needsMe(a) ? 1 : 0) || +b.id.slice(3) - +a.id.slice(3));
  const rows = useMemo(() => sorted.map((t) => rowOf(M, t)), [sorted, M]);
  if (!loading && !all.length) {
    return firstBlock('No transfers yet', 'When stock goes to another place, make one transfer document. It is a stock out here when you mark it sent, and a stock in there when they check it in. You print it for the driver to carry.',
      can('transfer') ? <Button variant="primary" leftIcon={Plus} onClick={onNew}>New transfer</Button> : null,
      [['1 · Make the draft', 'Choose where it goes and what.'], ['2 · Print and send', 'Mark it sent. Stock leaves here.'], ['3 · They check it in', 'Stock goes into their place.']]);
  }
  return (
    <div className="flex flex-col gap-3">
      {can('transfer') && !loading ? <div className="hidden max-[640px]:block"><Button variant="secondary" leftIcon={ArrowSquareOut} onClick={onNew}>New transfer</Button></div> : null}
      <TransferList transfers={rows} filter={filter} counts={counts} onFilterChange={onFilter} onOpen={onOpen} onNew={can('transfer') ? onNew : undefined} loading={loading} />
    </div>
  );
}

export interface TransferDetailViewProps extends Props {
  t: TrView;
  confirming: boolean;
  disabled?: boolean;
  onAskSend: () => void;
  onNotYet: () => void;
  onSend: () => void;
  onChange: () => void;
  onCancelDraft: () => void;
  onReceive: () => void;
  onPrint: () => void;
}

/** movements.js 311-376 */
export function TransferDetailView({ M, t, confirming, disabled, onAskSend, onNotYet, onSend, onChange, onCancelDraft, onReceive, onPrint }: TransferDetailViewProps) {
  const { D, can, canSend, who, fmtAt, place, HERE, mgr, Mgr, qtyWords, gotT, person, unitOf, STK, num } = M;
  const d = D as unknown as { business: { company: string; platform: string; place: string; key: string }; now: { date: string; time: string }; viewer: { id: string } };
  void num;
  const name = (id: string | undefined) => who(id as string);
  /* stepsOf 311-318 */
  const sent = t.sentAt ? `${name(t.sentBy)}, ${fmtAt(t.sentAt)}` : t.out ? (canSend(t) ? 'Not sent. Print it, then mark it sent.' : `Not sent. ${Mgr()} sends it.`) : 'Not sent yet';
  const steps = t.status === 'cancelled'
    ? [{ label: 'Drafted', note: `${name(t.createdBy)}, ${fmtAt(t.createdAt)}`, state: 'done' as const }, { label: 'Cancelled', note: t.cancelled ? `${name((t.cancelled as { by?: string }).by)}, ${fmtAt(t.cancelled.at)}` : '', state: 'off' as const }]
    : [
      { label: 'Drafted', note: `${name(t.createdBy)}, ${fmtAt(t.createdAt)}`, state: 'done' as const },
      { label: 'Sent', note: sent, state: t.status === 'draft' ? ('now' as const) : ('done' as const) },
      { label: 'Received', note: t.status === 'received' ? `${name(t.receivedBy)}, ${fmtAt(t.receivedAt)}${t.short ? `. ${gotT(t)}` : ''}` : t.status === 'transit' ? (t.out ? `${t.other.short} checks it in` : 'Waiting for you to check it in') : `${t.other.short} checks it in`, state: t.status === 'received' ? ('done' as const) : t.status === 'transit' ? ('now' as const) : ('next' as const) },
    ];
  /* historyOf 319-327 */
  const w = (id: string | undefined) => (id && (person(id) || id === 'leda') ? who(id) : '');
  const ev: { at: string; who?: string; what: string; extra?: string }[] = [{ who: w(t.createdBy), what: t.request ? `Drafted from a request by ${t.other.short}` : t.out ? 'Drafted the transfer' : `Drafted at ${t.other.name}`, at: t.createdAt }];
  if (t.sentAt) ev.push({ who: w(t.sentBy), what: t.out ? `Marked sent to ${t.other.name}${t.legacy ? '' : `. ${qtyWords(t)} left ${place(HERE).short}`}` : `Sent from ${t.other.name}`, at: t.sentAt });
  if (t.status === 'received') ev.push({ who: w(t.receivedBy), what: t.out ? `Checked in at ${t.other.name}` : `Checked in. ${t.short ? gotT(t) : `${qtyWords(t)} went into stock`}`, at: t.receivedAt as string, extra: t.receivedNote ? `“${t.receivedNote as string}”` : '' });
  if (t.cancelled) ev.push({ who: w((t.cancelled as { by?: string }).by), what: 'Cancelled the draft', at: t.cancelled.at });
  const history = ev.reverse().map((e) => ({ ...e, at: fmtAt(e.at), who: e.who || undefined, extra: e.extra || undefined }));
  /* lineIssue 328-330, confirmHTML 331-341 */
  const issue = t.lines.map((l) => (l.product.onHand < l.qty ? `Only ${l.product.onHand} ${l.product.name} on hand now, the draft has ${l.qty}.` : '')).find(Boolean) || '';
  const ch: Record<string, number> = {}; t.lines.forEach((l) => { ch[l.p] = -l.qty; });
  const one = t.lines.length === 1 ? t.lines[0] : null, ef = STK.effectText(ch);
  const confirmText = `${one ? `${one.product.sku} goes from ${one.product.onHand} to ${one.product.onHand - one.qty} here.` : `${qtyWords(t)} leave ${place(HERE).short}.`} ${t.other.short} checks it in on their side, and then it is stock there.${ef ? ` ${ef}` : ''}`;
  /* tdetailHTML 356-365 */
  const facts: ReactNode[] = [<>From <b>{place(t.from).name}</b></>, <>To <b>{place(t.to).name}</b></>, qtyWords(t), ...(t.job ? [<>For <b className="font-mono text-[13px]">{t.job}</b></>] : [])];
  const note = t.status === 'transit' && t.out ? { tone: 'transit' as const, title: `On its way to ${t.other.short}.`, text: `They check it in on their own screen; this page updates when they do. Stock already left ${place(HERE).short}.` }
    : t.status === 'received' && t.short ? { tone: 'short' as const, title: `${gotT(t)}.`, text: 'Only what arrived went into stock.' } : undefined;
  /* paperHTML 296-310 */
  const from = place(t.from), to = place(t.to), co = d.business;
  const lines: PaperLine[] = t.lines.map((l) => ({ id: l.p, code: l.product.sku, product: l.product.name, quantity: l.qty, unit: unitOf(l.product, l.qty), counted: t.status === 'received' ? (l.got != null ? l.got : l.qty) : undefined }));
  const tone = { draft: 'neutral', transit: 'accent', received: 'ok', cancelled: 'neutral' } as const;
  void tone;
  const paper = (
    <PaperDocument
      kind="transfer"
      label={`Stock transfer ${t.id}`}
      logo={<PlatformLogo name={co.platform} size={28} decorative />}
      company={co.company}
      companyLine={`${co.platform} · ${co.place}`}
      title="Stock transfer"
      number={t.id}
      meta={[
        { label: 'Date', value: (t.sentAt || t.createdAt || '').replace(/ \d{1,2}:\d{2}$/, '') },
        { label: 'Status', value: M.TST[t.status], only: 'screen' },
        { label: 'Prepared by', value: who(t.createdBy) },
        ...(t.job ? [{ label: 'For job', value: <span className="font-mono text-[13px]">{t.job}</span> }] : []),
        { label: 'Items', value: qtyWords(t), only: 'print' },
      ]}
      parties={[{ heading: 'From', name: from.name, lines: [from.addr] }, { heading: 'To', name: to.name, lines: [to.addr] }]}
      lines={lines}
      quantityLabel="Sent"
      countedLabel="Counted on arrival"
      note={{ label: 'Note', text: t.note || '' }}
      signatures={['Prepared by (name, signature)', 'Carried by (name, signature)', 'Received by (name, signature, date)']}
      footer={`${co.company} · ${t.id} · printed ${d.now.date}, ${d.now.time}`}
    />
  );
  return (
    <TransferDetail
      id={t.id} out={t.out} otherName={t.other.name} status={t.status} facts={facts}
      steps={<ProgressSteps aria-label="Where this transfer is" steps={steps} />}
      paper={paper} history={history} note={note}
      can={{ send: canSend(t), receive: can('receive'), change: (can('transfer') && !t.request) || can('approve_transfer') }}
      otherShort={t.other.short} hereShort={place(HERE).short} managerName={Mgr()}
      confirming={confirming} confirmText={confirmText} issue={issue || undefined} disabled={disabled}
      onAskSend={onAskSend} onSend={onSend} onNotYet={onNotYet} onPrint={onPrint} onReceive={onReceive} onChange={onChange} onCancelDraft={onCancelDraft}
    />
  );
  void mgr;
}

export interface TransferFormViewProps extends Props {
  editing: TrView | null;
  productId?: string | null;
  onSave: (v: TransferFormValue) => void;
  onCancel: () => void;
}

/** movements.js 400-455 */
export function TransferFormView({ M, editing, productId, onSave, onCancel }: TransferFormViewProps) {
  const { D, isA, place, HERE, PLACES, Mgr, canSend, loc, STK } = M;
  const prods = D.products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, onHand: p.onHand, unit: p.unit, location: loc(p.loc as string) }));
  const drafts = (pid: string) => M.trs().filter((t) => t.status === 'draft' && t.out && !(editing && editing.id === t.id)).map((t) => ({ t, l: t.lines.find((x) => x.p === pid) })).filter((x) => x.l);
  const initial: Partial<TransferFormValue> = editing
    ? { to: editing.to, job: editing.job, note: editing.note, lines: editing.lines.map((l) => ({ productId: l.p, qty: l.qty })) }
    : { to: (PLACES.find((x) => !x.here) || { id: '' }).id, lines: productId && M.prod(productId) ? [{ productId, qty: Math.min(1, (M.prod(productId) as { onHand: number }).onHand) || 1 }] : [] };
  return (
    <TransferForm
      editingId={editing?.id}
      hereShort={place(HERE).short} hereName={place(HERE).name}
      places={PLACES.filter((x) => !x.here).map((x) => ({ id: x.id, name: x.name }))}
      products={prods} initial={initial} jobOrders={isA}
      canSend={canSend({ request: false })} managerName={Mgr()}
      alsoFor={(pid) => { const o = drafts(pid); return o.length ? `${o.map((x) => x.t.id).join(' and ')} also ${o.length === 1 ? 'needs' : 'need'} ${o.reduce((s, x) => s + (x.l as { qty: number }).qty, 0)}` : ''; }}
      warningFor={(pid, qty) => {
        const o = drafts(pid); if (!o.length) return null;
        const pr = M.prod(pid) as { onHand: number };
        const need = o.reduce((s, x) => s + (x.l as { qty: number }).qty, 0), jobs = [...new Set(o.map((x) => x.t.job).filter(Boolean))], hasJob = jobs.length ? ` for ${jobs.join(' and ')}` : '', clash = qty + need > pr.onHand;
        return <><b>{o.map((x) => x.t.id).join(' and ')}</b> {o.length === 1 ? 'is a draft' : 'are drafts'}{hasJob} and {o.length === 1 ? 'also needs' : 'also need'} {need} of this part.{clash ? ` Only ${pr.onHand} on hand here, so both cannot go.` : ''}</>;
      }}
      effect={(lines) => { const ch: Record<string, number> = {}; lines.forEach((l) => { ch[l.productId] = -l.qty; }); return STK.effectText(ch); }}
      onSave={onSave} onCancel={onCancel}
    />
  );
}
