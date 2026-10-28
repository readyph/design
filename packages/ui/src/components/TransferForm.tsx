import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, MagnifyingGlass, Warning } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { QuantityStepper } from './QuantityStepper';
import { Select } from './Select';

/*
 * RDY-398 I15 (form). Transcribed from inventory-home FINAL/movements.css 124-139 (.tform .tf-*), 252, 292-299 (.recx .rcaside .hw), 313-318 (.tl-w),
 * 246-251 (<=640); stock.css 18-22, 42-48, 70-73 (.rc-*); products.css 126-130 (.tin); movements.js 427-452 (fPlan, fSum, warnHTML, fLinesHTML, formHTML),
 * 641-642 and 675-678 (Enter adds the first match, Enter in a quantity returns to search, Escape clears the search).
 * GAP: the line stepper is the shared QuantityStepper (I2); the source .tl-r .stp input is 72px.
 */
export interface TransferProduct {
  id: string;
  name: string;
  sku: string;
  onHand: number;
  /** Unit word ("bottle"); "pc" is never pluralised. */
  unit: string;
  /** Location name shown under a search hit. */
  location?: string;
}
export interface TransferFormLine {
  productId: string;
  qty: number;
}
export interface TransferFormValue {
  to: string;
  job: string;
  note: string;
  lines: TransferFormLine[];
}
export interface TransferFormProps {
  /** Id shown in the heading when changing a draft ("TR-0030"). Empty for a new transfer. */
  editingId?: string;
  /** Short name of this place ("Main"), used in the intro and the next-steps note. */
  hereShort: string;
  /** Full name of this place. */
  hereName: string;
  /** Other places the transfer can go to. */
  places: { id: string; name: string }[];
  /** Products the search can find. */
  products: TransferProduct[];
  initial?: Partial<TransferFormValue>;
  /** Tenant A shows "For job (optional)". */
  jobOrders?: boolean;
  /** Who marks it sent, for the next-steps note: true when this role can. */
  canSend?: boolean;
  managerName?: string;
  /** "TR-0032 also needs 1", for a search hit; empty when none. */
  alsoFor?: (productId: string) => string;
  /** The warning under a line for another open draft that wants the same part; null when none. */
  warningFor?: (productId: string, qty: number) => ReactNode;
  /** Sentence about the knock-on effect, appended to the summary. */
  effect?: (lines: TransferFormLine[]) => string;
  onSave: (value: TransferFormValue) => void;
  /** Called when Cancel is used, or Escape on an empty search after the search was cleared and the form has changes. */
  onCancel: () => void;
  className?: string;
}

const unitOf = (p: TransferProduct, n: number) => (p.unit === 'pc' ? 'pc' : n === 1 ? p.unit : p.unit + 's');
const num = (n: number) => n.toLocaleString('en-US');
const plr = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;
function unitWords(items: { p: TransferProduct; qty: number }[]) {
  const g = new Map<string, number>();
  items.forEach(({ p, qty }) => g.set(p.unit, (g.get(p.unit) || 0) + qty));
  const parts = [...g].map(([u, n]) => `${num(n)} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`);
  return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
const isJO = (s: string) => /^JO-\d+/.test(s);

/* .tin (products.css 126-130) */
const tin =
  'block w-full h-[34px] px-[10px] border border-control rounded-control bg-surface text-text text-[14px] placeholder:text-muted hover:border-muted outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:border-accent';
/* .tform .rc-f .fr (movements.css 139, 252) */
const fr = 'grid grid-cols-[148px_minmax(0,1fr)] gap-x-4 items-center max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-2';
const frTop = 'items-start';
const fl = 'text-[13px] text-text';
const flTop = 'pt-2 max-[640px]:pt-0';
const t1 = 'block text-[14px] leading-5 font-medium';
const t2 = 'block mt-0.5 text-[13px] leading-[18px] text-muted';
const ring = 'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/** Transfer form (I15): To, optional job, products with a search, note for the driver, summary and Create draft / Save changes. */
export function TransferForm({
  editingId,
  hereShort,
  hereName,
  places,
  products,
  initial,
  jobOrders = true,
  canSend = true,
  managerName = 'Your manager',
  alsoFor,
  warningFor,
  effect,
  onSave,
  onCancel,
  className,
}: TransferFormProps) {
  const uid = useId();
  const [to, setTo] = useState(initial?.to ?? '');
  const [job, setJob] = useState(initial?.job ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [lines, setLines] = useState<TransferFormLine[]>(initial?.lines ?? []);
  const [q, setQ] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const qtyRefs = useRef<Record<string, HTMLElement | null>>({});
  const prod = (id: string) => products.find((p) => p.id === id);
  const ls = lines.map((l) => ({ ...l, p: prod(l.productId)! })).filter((l) => l.p);

  const term = q.trim().toLowerCase();
  const have = new Set(lines.map((l) => l.productId));
  const hits = term ? products.filter((p) => !have.has(p.id) && [p.name, p.sku].some((s) => s.toLowerCase().includes(term))).slice(0, 6) : [];

  let plan: { ok?: true; err?: string; blank?: boolean } = { ok: true };
  const bad = ls.find((l) => !(l.qty >= 1));
  const over = ls.find((l) => l.qty > l.p.onHand);
  if (!to) plan = { err: 'Choose where it goes.' };
  else if (!ls.length) plan = { blank: true, err: 'Add at least one product.' };
  else if (bad) plan = { err: `Use 1 or more of ${bad.p.name}.` };
  else if (over) plan = { err: `Only ${over.p.onHand} ${over.p.name} on hand. Use ${over.p.onHand} or fewer.` };
  else if (job.trim() && !isJO(job.trim().toUpperCase())) plan = { err: 'A job order looks like JO-0412. Leave it empty if there is none.' };

  const toName = places.find((x) => x.id === to)?.name ?? '';
  const ef = plan.ok && effect ? effect(lines) : '';

  const add = (p: TransferProduct) => {
    setLines((a) => [...a, { productId: p.id, qty: Math.min(1, p.onHand) || 1 }]);
    setQ('');
    if (typeof window !== 'undefined' && !window.matchMedia?.('(max-width: 640px)').matches) {
      setTimeout(() => qtyRefs.current[p.id]?.querySelector('input')?.focus({ preventScroll: true }), 0);
    }
  };
  const remove = (id: string) => {
    setLines((a) => a.filter((l) => l.productId !== id));
    setTimeout(() => (document.querySelector<HTMLElement>(`[data-tf-remove]`) ?? search.current)?.focus({ preventScroll: true }), 0);
  };
  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hits[0] && term) {
      e.preventDefault();
      add(hits[0]);
    } else if (e.key === 'Escape' && q) {
      e.preventDefault();
      e.stopPropagation();
      setQ('');
    }
  };

  return (
    <div className={cn('', className)}>
      <h1 className="mt-2 text-[length:var(--fs-case)] leading-7 font-semibold tracking-[-0.01em]">
        {editingId ? <>Change <span className="text-[12px]">{editingId}</span></> : 'New transfer'}
      </h1>
      <p className="mt-5 max-w-[720px] text-[14px] leading-[21px] text-muted">
        One document for both places. Stock leaves {hereShort} when you mark it sent, and goes into the other place when they check it in. Nothing moves while it is a draft.
      </p>
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)_320px] items-start gap-x-14 max-[1099px]:grid-cols-[minmax(0,1fr)] max-[1099px]:gap-y-8">
        <div className="min-w-0 max-w-[860px]">
          <div className="flex flex-col gap-4">
            <div className={fr}>
              <span className={fl}>From</span>
              <span className="text-[14px]"><b className="font-semibold">{hereName}</b> · this stockroom</span>
            </div>
            <div className={fr}>
              <span className={fl} id={`${uid}-to-l`}>To</span>
              <Select id={`${uid}-to`} aria-labelledby={`${uid}-to-l`} size="sm" value={to} onValueChange={(v: string) => setTo(v)} options={places.map((x) => ({ value: x.id, label: x.name }))} />
            </div>
            {jobOrders && (
              <div className={fr}>
                <label className={fl} htmlFor={`${uid}-job`}>For job (optional)</label>
                <input id={`${uid}-job`} type="text" maxLength={12} value={job} onChange={(e) => setJob(e.target.value)} placeholder="JO-0412" autoComplete="off" className={cn(tin, 'max-w-[200px] font-mono max-[640px]:max-w-none')} />
              </div>
            )}
            <div className={cn(fr, frTop)}>
              <span className={cn(fl, flTop)} id={`${uid}-ls-l`}>Products</span>
              <div className="min-w-0 max-w-[620px]" aria-labelledby={`${uid}-ls-l`} role="group">
                <div className="flex flex-col border-t border-rule">
                  {ls.length ? (
                    ls.map((l) => (
                      <div key={l.productId} data-line={l.productId} className="grid grid-cols-[minmax(0,1fr)_auto_56px_auto] items-center gap-x-4 border-b border-rule py-3 max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-y-[10px]">
                        <span className="min-w-0">
                          <span className={t1}>{l.p.name}</span>
                          <span className={t2}><span className="text-[12px]">{l.p.sku}</span> · {l.p.onHand} on hand here</span>
                        </span>
                        <span ref={(el) => { qtyRefs.current[l.productId] = el; }} className="max-[640px]:col-start-1 max-[640px]:row-start-2">
                          <QuantityStepper value={l.qty} min={1} max={l.p.onHand} productName={l.p.name} onValueChange={(n: number) => setLines((a) => a.map((x) => (x.productId === l.productId ? { ...x, qty: n } : x)))} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); search.current?.focus(); } }} />
                        </span>
                        <span className="text-[13px] text-muted max-[640px]:col-start-1 max-[640px]:row-start-3">{unitOf(l.p, l.qty)}</span>
                        <button type="button" data-tf-remove aria-label={`Remove ${l.p.name}`} onClick={() => remove(l.productId)} className={cn('inline-flex h-6 cursor-pointer items-center justify-self-end rounded-[4px] px-1 text-[12px] font-semibold text-accent hover:text-lk-hover max-[640px]:col-start-2 max-[640px]:row-[1/3] max-[640px]:min-h-11 max-[640px]:self-center', ring)}>
                          Remove
                        </button>
                        {warningFor?.(l.productId, l.qty) ? (
                          <p className="col-span-full m-0 flex gap-2 text-[13px] leading-[19px] text-text [&_b]:font-semibold">
                            <Warning aria-hidden size={16} className="mt-px flex-none text-muted" />
                            <span>{warningFor(l.productId, l.qty)}</span>
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="border-b border-rule py-[14px] text-[13px] leading-[19px] text-muted">No product yet.</p>
                  )}
                </div>
                <div className="mt-4">
                  <label className="relative mt-2 block">
                    <span className="sr-only">Add a product</span>
                    <MagnifyingGlass aria-hidden size={16} className="pointer-events-none absolute left-2.5 top-1/2 -mt-2 text-muted" />
                    <input ref={search} type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onSearchKey} placeholder="Add a product: type a name or code" autoComplete="off" className={cn(tin, 'pl-[34px]')} />
                  </label>
                  <div className="mt-2">
                    {hits.length ? (
                      hits.map((p) => (
                        <button key={p.id} type="button" onClick={() => add(p)} className={cn('grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-rule bg-transparent px-2 py-[10px] text-left hover:bg-raised', ring)}>
                          <span className="min-w-0">
                            <span className="block text-[14px] leading-5 font-semibold">{p.name}</span>
                            <span className="mt-0.5 block text-[13px] leading-[18px] text-muted [overflow-wrap:anywhere]">
                              <span className="text-[12px]">{p.sku}</span>
                              {p.location ? ` · ${p.location}` : ''}
                              {alsoFor?.(p.id) ? ` · ${alsoFor(p.id)}` : ''}
                            </span>
                          </span>
                          <span className="text-right"><b className="text-[14px] font-semibold">{p.onHand}</b> <small className="text-[12px] text-muted">on hand</small></span>
                        </button>
                      ))
                    ) : term ? (
                      <p className="py-[10px] text-[13px] leading-[19px] text-muted">No other product matches “{q.trim()}”.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className={cn(fr, frTop)}>
              <label className={cn(fl, flTop)} htmlFor={`${uid}-note`}>Note for the driver</label>
              <textarea id={`${uid}-note`} rows={2} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: for the car waiting at the branch." className={cn(tin, 'h-auto min-h-16 max-w-[520px] resize-y px-[10px] py-2 font-[inherit] leading-5')} />
            </div>
            <p role="status" aria-live="polite" className="m-0 text-[14px] leading-5 [&_b]:font-semibold">
              {plan.err ? (
                <span className={plan.blank ? 'text-muted' : 'font-medium text-bad'}>{plan.err}</span>
              ) : (
                <>
                  <b>{plr(ls.length, 'product', 'products')}: {unitWords(ls)}</b> for {toName}. Nothing leaves stock while it is a draft; it does when you mark it sent.{ef ? ` ${ef}` : ''}
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" leftIcon={Check} disabled={!plan.ok} onClick={() => onSave({ to, job: job.trim().toUpperCase(), note: note.trim(), lines })}>
                {editingId ? 'Save changes' : 'Create draft'}
              </Button>
              <Button variant="text" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        </div>
        <aside aria-label="What happens next" className="min-w-0 pt-5">
          <h2 className="mb-0 border-b border-border pb-2 text-[13px] font-semibold">What happens next</h2>
          <ol className="m-0 list-none p-0 [&_b]:block [&_b]:text-[14px] [&_b]:leading-5 [&_b]:font-semibold [&_li]:border-b [&_li]:border-rule [&_li]:py-[14px] [&_li>span]:mt-0.5 [&_li>span]:block [&_li>span]:text-[13px] [&_li>span]:leading-[19px] [&_li>span]:text-muted">
            <li><b>Draft</b><span>You are here. Check the products, print the paper for the driver.</span></li>
            <li><b>Marked sent</b><span>Stock leaves {hereShort}. {canSend ? 'You mark it sent when the driver takes it.' : `${managerName} marks it sent.`}</span></li>
            <li><b>Checked in</b><span>The other place counts what arrived. Only that goes into their stock.</span></li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
