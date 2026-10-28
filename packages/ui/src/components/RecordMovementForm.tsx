import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Barcode, Check, ArrowSquareOut, Lock, MagnifyingGlass } from '@phosphor-icons/react';
import { cn, focusForced } from '../utils/cn';
import { ActionLink } from './ActionLink';
import { Button } from './Button';
import { QuantityStepper } from './QuantityStepper';

/*
 * RDY-389 I14. Transcribed from inventory-home FINAL/stock.js 103-244 (STK.record.mount) and FINAL/stock.css 3-110,
 * movements.css 306-307. The product search, "Likely today" list, five reasons, quantity, job order, note, summary and
 * actions are one form. The side note ("how stock moves" + last five movements, movements.js recAside) is a page region.
 */
export type RecordReason = 'sold' | 'used' | 'send' | 'damaged' | 'count';
export type RecordPermission = 'stock_out' | 'transfer' | 'adjust_stock';

export interface RecordProduct {
  id: string;
  name: string;
  sku: string;
  onHand: number;
  /** Reorder level; "It will be low stock (reorder level N)" when the new balance is at or below it. */
  reorder: number;
  /** Unit word ("bottle"); "pc" is never pluralised. */
  unit: string;
  /** Location name shown under the product. */
  location?: string;
}

export interface RecordLikely {
  product: RecordProduct;
  /** "Needed for JO-0413", "Went out today". */
  why?: string;
}

export interface RecordEntry {
  reason: RecordReason;
  /** Movement type the ledger gets: used and sold are both `sold`. */
  type: 'sold' | 'damaged' | 'count';
  /** Signed change in stock. */
  qty: number;
  /** Balance after. */
  after: number;
  /** Reference the ledger shows: "Sold", a JO number, "Kitchen use", or null. */
  ref: string | null;
  note: string;
}

export interface RecordMovementFormProps {
  /** Products the search can find. */
  products: RecordProduct[];
  /** The "Likely today" list shown before anything is typed. */
  likely: RecordLikely[];
  /** The product to start with. A new id here selects that product (for example after a scan). */
  product?: RecordProduct | null;
  /** Products passes the open product and hides the picker. */
  fixed?: boolean;
  /** Permissions of the signed-in role. A reason it cannot use is shown locked. */
  permissions: RecordPermission[];
  /** Tenant A: used asks for a job order number and send reads "another branch". Otherwise "the kitchen" and "the kiosk". */
  jobOrders?: boolean;
  /** Start on this reason (when allowed). */
  initialReason?: RecordReason;
  /** How the manager is named in "Your manager records this". */
  manager?: string;
  /** Short name of this place, used in the transfer summary line. */
  placeName?: string;
  /** Today's job orders that need the product (offered under the job order field). */
  jobsFor?: (productId: string) => string[];
  /** Sentence about the knock-on effect, for example "Low stock 9 to 10." Empty when none. */
  effect?: (productId: string, delta: number) => string;
  onRecord: (entry: RecordEntry, product: RecordProduct) => void;
  onCancel?: () => void;
  /** Start a transfer (reason send). */
  onTransfer?: (product: RecordProduct) => void;
  /** The scan button: the page opens the barcode sheet and passes the found product back through `product`. */
  onScan?: () => void;
  onProductChange?: (product: RecordProduct | null) => void;
  className?: string;
}

const need: Record<RecordReason, RecordPermission> = { sold: 'stock_out', used: 'stock_out', send: 'transfer', damaged: 'adjust_stock', count: 'adjust_stock' };
const isJO = (r: string) => /^JO-\d+/.test(r || '');
const unitOf = (p: RecordProduct | null, n: number) => (p && p.unit === 'pc' ? 'pc' : p ? (n === 1 ? p.unit : p.unit + 's') : '');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* .tin (products.css 126-130) + font mono for the job order (stock.css 39) */
const tin =
  'block w-full h-[34px] px-[10px] border border-control rounded-control bg-surface text-text text-[14px] placeholder:text-muted hover:border-muted outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:border-accent';
/* .fr (products.css 219, stock.css 6-8) */
const fr = 'grid grid-cols-[148px_minmax(0,1fr)] items-center gap-x-4 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-2';
const frStp = 'grid grid-cols-[148px_auto_minmax(0,1fr)] items-center gap-x-4 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-2';
const frTop = 'items-start';
/* .fl (stock.css 9-10, 53) */
const flTop = 'pt-2 text-[13px] text-text max-[640px]:pt-0';
const flMid = 'text-[13px] text-text';
const un = 'ml-[10px] inline text-[13px] text-muted max-[640px]:ml-0 max-[640px]:block';
const align = 'ml-[164px] max-[640px]:ml-0';
const ringIn =
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-3px] focus-visible:outline-accent ' + focusForced;

interface Plan {
  send?: boolean;
  err?: string;
  blank?: boolean;
  need?: string;
  type?: 'sold' | 'damaged' | 'count';
  qty: number;
  after: number;
  ref: string | null;
  note: string;
  q?: number;
}
const idle = { qty: 0, after: 0, ref: null, note: '' };

export function RecordMovementForm({
  products,
  likely,
  product = null,
  fixed = false,
  permissions,
  jobOrders = true,
  initialReason,
  manager = 'your manager',
  placeName = 'this stockroom',
  jobsFor,
  effect,
  onRecord,
  onCancel,
  onTransfer,
  onScan,
  onProductChange,
  className,
}: RecordMovementFormProps) {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const Mgr = cap(manager);
  const can = (p: RecordPermission) => permissions.includes(p);

  const REASONS: { k: RecordReason; label: string; help: string }[] = [
    { k: 'sold', label: 'Sold', help: jobOrders ? 'Sold over the counter, without a job order.' : 'Sold over the counter or at the bar.' },
    { k: 'used', label: jobOrders ? 'Used on a job' : 'Used in the kitchen', help: jobOrders ? 'Taken out for a repair job. Add the job order number.' : 'Taken out for the kitchen or the bar.' },
    { k: 'send', label: jobOrders ? 'Sent to another branch' : 'Sent to the kiosk', help: 'Goes out on a transfer document, so the other place can check it in.' },
    { k: 'damaged', label: 'Damaged or lost', help: 'Broken, spoiled or missing. It is written off.' },
    { k: 'count', label: 'Count correction', help: 'The shelf has a different number than the app. You type what you counted.' },
  ];
  const allowed = (k: RecordReason) => can(need[k]);

  const [p, setP] = useState<RecordProduct | null>(product);
  const lastProp = useRef(product?.id ?? null);
  useEffect(() => {
    const next = product?.id ?? null;
    if (next !== lastProp.current) {
      lastProp.current = next;
      setP(product);
      setQ('');
    }
  }, [product]);
  const first = (REASONS.find((r) => allowed(r.k)) || REASONS[0]).k;
  const [reason, setReason] = useState<RecordReason>(initialReason && allowed(initialReason) ? initialReason : first);
  const [qty, setQty] = useState(0);
  const [counted, setCounted] = useState<number | null>(null);
  const [job, setJob] = useState('');
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');
  const [focusTick, setFocusTick] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const reasonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const has = !!p;
  const live = REASONS.filter((r) => allowed(r.k));
  const tab = has && live.some((r) => r.k === reason) ? reason : (live[0] || ({} as { k?: RecordReason })).k;

  const choose = (next: RecordProduct | null) => {
    setP(next);
    lastProp.current = next?.id ?? null;
    onProductChange?.(next);
  };

  // Focus the first entry field after a product or reason choice, except on a phone (stock.js 187-189).
  useEffect(() => {
    if (!focusTick || (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches)) return;
    const el = root.current?.querySelector<HTMLElement>(`[id="${id('n')}"] input, [id="${id('c')}"] input, [id="${id('j')}"]`);
    el?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  const qn = qty === 0 ? null : Math.round(qty);

  function plan(): Plan {
    if (!p) return { ...idle, err: 'Choose a product first.', blank: true };
    const n = p.onHand;
    if (reason === 'send') return { ...idle, send: true };
    if (reason === 'count') {
      const c = counted;
      if (c == null || !(c >= 0)) return { ...idle, blank: true, err: 'Type what you counted on the shelf.' };
      if (c === n) return { ...idle, err: `The app already says ${n}. Nothing to correct.` };
      if (!note.trim()) return { ...idle, need: 'Say why the count is different, so the next person understands.' };
      return { type: 'count', qty: c - n, after: c, ref: null, note: `Count: ${n} → ${c}. ${note.trim()}` };
    }
    if (qn == null) return { ...idle, err: 'Type how many went out.', blank: true };
    if (!(qn >= 1)) return { ...idle, err: 'Use 1 or more.' };
    if (n <= 0) return { ...idle, err: 'Nothing is on hand, so nothing can go out. If the shelf has some, use Count correction.' };
    if (qn > n) return { ...idle, err: `Only ${n} on hand. Use ${n} or fewer.` };
    if (reason === 'used' && jobOrders && !isJO(job.trim().toUpperCase())) return { ...idle, need: 'Add the job order number, for example JO-0412.', q: qn };
    if (reason === 'damaged' && !note.trim()) return { ...idle, need: 'Say what happened, for example “leaking caps”.', q: qn };
    const base = { qty: -qn, after: n - qn, q: qn };
    if (reason === 'sold') return { ...base, type: 'sold', ref: 'Sold', note: note.trim() };
    if (reason === 'used') return { ...base, type: 'sold', ref: jobOrders ? job.trim().toUpperCase() : 'Kitchen use', note: note.trim() };
    return { ...base, type: 'damaged', ref: null, note: note.trim() };
  }
  const pl = plan();
  const planRef = useRef(pl);
  planRef.current = pl;
  const blankErr = pl.blank;

  const commit = () => {
    const cp = planRef.current;
    if (!p || !cp.type) return;
    onRecord({ reason, type: cp.type, qty: cp.qty, after: cp.after, ref: cp.ref, note: cp.note }, p);
  };

  const summary = (): ReactNode => {
    if (!p) return <span className="text-muted">Choose a product to see what happens to its stock.</span>;
    if (pl.send) return <>Sending stock to another place uses a <b className="font-semibold">transfer document</b>, so the other place can check it in. Stock leaves {placeName} when you mark the transfer as sent.</>;
    if (pl.err) return blankErr ? <span className="text-muted">{pl.err}</span> : <span className="font-medium text-bad">{pl.err}</span>;
    if (pl.need) return <span className="text-muted">{pl.need}</span>;
    const n = p.onHand;
    const ef = effect ? effect(p.id, pl.qty) : '';
    const status = pl.after === 0 ? ' It will be out of stock.' : pl.after <= p.reorder ? ` It will be low stock (reorder level ${p.reorder}).` : '';
    return <>Stock goes from <b className="font-semibold">{n}</b> to <b className="font-semibold">{pl.after}</b>.{status}{ef ? ` ${ef}` : ''}</>;
  };

  const hits: RecordLikely[] = (() => {
    const t = q.trim().toLowerCase();
    return t ? products.filter((x) => [x.name, x.sku].some((s) => s.toLowerCase().includes(t))).slice(0, 6).map((x) => ({ product: x })) : likely;
  })();
  const searching = !!q.trim();

  const onKeyReasons = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = (e.target as HTMLElement).closest('[data-reason]') as HTMLElement | null;
    if (!t || !has || !['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    if (!live.length) return;
    const i = Math.max(0, live.findIndex((x) => x.k === t.dataset.reason));
    const last = live.length - 1;
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (i + 1) % live.length : (i + last) % live.length;
    e.preventDefault();
    setReason(live[n].k);
    reasonRefs.current[live[n].k]?.focus({ preventScroll: true });
  };

  const onKeyForm = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (e.key !== 'Enter') return;
    if (t.id === id('q')) {
      if (searching && hits[0]) {
        e.preventDefault();
        choose(hits[0].product);
        setQ('');
        setFocusTick((n) => n + 1);
      }
      return;
    }
    if ((t.matches('input[type="number"]') || t.id === id('j'))) {
      e.preventDefault();
      setTimeout(commit, 0);
    }
  };

  const showQty = has && reason !== 'count' && reason !== 'send';
  const jobs = has && reason === 'used' && jobOrders && jobsFor ? jobsFor(p!.id).slice(0, 4) : [];
  const label =
    reason === 'count' ? 'Save the count' : reason === 'damaged' ? `Write off${pl.q ? ' ' + pl.q : ''}` : reason === 'used' ? `Record${pl.q ? ' ' + pl.q : ''} used` : `Record${pl.q ? ' ' + pl.q : ''} sold`;
  const tf = tin;

  const locOf = (x: RecordProduct) => x.location || '';

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div ref={root} onKeyDown={onKeyForm} className={cn('flex flex-col gap-5', className)}>
      <div className={cn(fr, frTop)}>
        <span id={id('l-p')} className={flTop}>Product</span>
        <div aria-labelledby={id('l-p')} role="group" className="flex min-w-0 items-start gap-4 max-[640px]:flex-col max-[640px]:gap-2">
          {p && fixed ? (
            <div className="min-w-0 pt-[2px]">
              <span className="block text-[14px] font-semibold leading-5">{p.name}</span>
              <span className="mt-[2px] block text-[13px] leading-[18px] text-muted"><span className="text-[12px]">{p.sku}</span> · {p.onHand} on hand</span>
            </div>
          ) : p ? (
            <>
              <div className="min-w-0 pt-[2px]">
                <span className="block text-[14px] font-semibold leading-5">{p.name}</span>
                <span className="mt-[2px] block text-[13px] leading-[18px] text-muted"><span className="text-[12px]">{p.sku}</span> · {p.onHand} on hand · {locOf(p)}</span>
              </div>
              <ActionLink
                onClick={() => {
                  choose(null);
                  setQty(0);
                  setCounted(null);
                  setTimeout(() => root.current?.querySelector<HTMLElement>(`[id="${id('q')}"]`)?.focus(), 0);
                }}
              >
                Change
              </ActionLink>
            </>
          ) : (
            <div className="w-full max-w-[520px]">
              <label className="relative block max-w-none">
                <span className="sr-only">Find a product</span>
                <MagnifyingGlass aria-hidden size={16} className="pointer-events-none absolute left-[10px] top-1/2 -mt-2 text-muted" />
                <input
                  id={id('q')}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Type a product name or code"
                  autoComplete="off"
                  className={cn(tf, 'pl-[34px] pr-11')}
                />
                <button
                  type="button"
                  aria-label="Scan or type a barcode"
                  onClick={onScan}
                  className={cn('absolute right-[2px] top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-control text-accent hover:bg-raised hover:text-lk-hover', 'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', focusForced)}
                >
                  <Barcode aria-hidden size={16} />
                </button>
              </label>
              {searching ? null : <p className="m-0 mt-[14px] text-[12px] text-muted">Likely today</p>}
              <div className={cn('flex flex-col', searching ? 'mt-2' : 'mt-[2px]')}>
                {hits.length ? (
                  hits.map((h, i) => (
                    <button
                      key={h.product.id}
                      type="button"
                      onClick={() => {
                        choose(h.product);
                        setQ('');
                        setFocusTick((n) => n + 1);
                      }}
                      className={cn(
                        'relative -mx-2 grid w-[calc(100%+16px)] cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-none border-t border-rule bg-transparent px-2 py-[10px] text-left text-text min-[641px]:py-[6px]',
                        i === 0 && 'border-t-transparent',
                        ringIn,
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-left text-[14px] font-semibold leading-5">{h.product.name}</span>
                        <span className="mt-[2px] block truncate text-left text-[13px] leading-[18px] text-muted [overflow-wrap:anywhere]">
                          <span className="text-[12px]">{h.product.sku}</span> · {locOf(h.product)}
                          {h.why ? ` · ${h.why}` : ''}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-[3px] whitespace-nowrap text-right tabular-nums min-[641px]:flex-row min-[641px]:items-baseline min-[641px]:gap-1">
                        <b className="text-[14px] font-semibold">{h.product.onHand}</b>
                        <small className="text-[12px] text-muted">on hand</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="m-0 py-[10px] text-[13px] leading-[19px] text-muted">
                    {searching ? `No product matches “${q.trim()}”.` : 'Search by name or code, for example “oil filter”.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={cn(fr, frTop)}>
        <span id={id('l-r')} className={flTop}>What happened</span>
        <div>
          <div
            role="radiogroup"
            aria-label="What happened"
            aria-disabled={has ? undefined : true}
            onKeyDown={onKeyReasons}
            className="-mx-2 flex max-w-[636px] flex-col max-[640px]:mx-0"
          >
            {REASONS.map((r, i) => {
              const ok = allowed(r.k);
              const on = has && reason === r.k;
              const inert = !has || !ok;
              return (
                <button
                  key={r.k}
                  ref={(el) => {
                    reasonRefs.current[r.k] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={has && r.k === tab ? 0 : -1}
                  data-reason={r.k}
                  disabled={!ok}
                  aria-disabled={has ? undefined : true}
                  onClick={() => {
                    if (!ok || !has) return;
                    setReason(r.k);
                    setFocusTick((n) => n + 1);
                  }}
                  className={cn(
                    '-mx-2 grid w-[calc(100%+16px)] grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3 border-b border-rule bg-transparent px-2 py-2 text-left text-text',
                    'max-[640px]:mx-0 max-[640px]:w-full max-[640px]:px-0 max-[640px]:py-[14px]',
                    i === 0 && 'border-t',
                    inert ? 'cursor-default' : 'cursor-pointer hover:bg-raised',
                    ringIn,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'relative mt-[3px] h-4 w-4 rounded-full border-[1.5px] border-control bg-surface',
                      on && 'border-accent after:absolute after:inset-[3px] after:rounded-full after:bg-accent after:content-[""]',
                      inert && 'border-dashed bg-transparent',
                    )}
                  />
                  <span className="min-w-0">
                    <b className={cn('block text-[14px] leading-5', inert ? 'font-medium text-muted' : 'font-semibold')}>{r.label}</b>
                    <span className="mt-[2px] block text-[13px] leading-[19px] text-muted">{ok ? r.help : `${Mgr} records this. ${r.help}`}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {has ? null : <p className="m-0 mt-[10px] text-[13px] leading-[19px] text-muted">Choose a product above, then pick what happened.</p>}
        </div>
      </div>

      {showQty && p ? (
        <div className={frStp}>
          <span className={flMid}>How many went out</span>
          <span id={id('n')} className="block min-w-0">
            <QuantityStepper
              value={qty}
              min={0}
              productName={p.name}
              onValueChange={setQty}
              className="[&_button]:bg-transparent"
            />
          </span>
          <span id={id('un')} className={un}>{unitOf(p, qn || 2)}</span>
        </div>
      ) : null}

      {p && reason === 'count' ? (
        <div className={frStp}>
          <span className={flMid}>Counted on the shelf</span>
          <span id={id('c')} className="block min-w-0">
            <QuantityStepper value={counted ?? 0} min={0} productName={p.name} onValueChange={setCounted} className="[&_button]:bg-transparent" />
          </span>
          <span className={un}>{unitOf(p, 2)}, the app says {p.onHand}</span>
        </div>
      ) : null}

      {p && reason === 'used' && jobOrders ? (
        <div className={cn(fr, frTop)}>
          <label htmlFor={id('j')} className={flTop}>Job order</label>
          <div className="min-w-0">
            <input
              id={id('j')}
              type="text"
              maxLength={12}
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="JO-0412"
              autoComplete="off"
              className={cn(tf, 'max-w-[200px] font-mono max-[640px]:max-w-none')}
            />
            {jobs.length ? (
              <p className="m-0 mt-2 text-[13px] leading-[19px] text-muted">
                Jobs today that need this:{' '}
                {jobs.map((j, i) => (
                  <span key={j}>
                    {i ? ' ' : null}
                    <ActionLink className="font-mono !text-[12px] max-[640px]:min-h-[36px]" onClick={() => setJob(j)}>
                      {j}
                    </ActionLink>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {p && reason !== 'send' ? (
        <div className={cn(fr, frTop)}>
          <label htmlFor={id('note')} className={flTop}>
            Note{reason === 'damaged' || reason === 'count' ? '' : ' (optional)'}
          </label>
          <textarea
            id={id('note')}
            rows={2}
            maxLength={160}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={reason === 'damaged' ? 'For example: leaking caps.' : reason === 'count' ? 'For example: recounted after the weekend.' : 'Anything the next person should know.'}
            className={cn(tin, 'h-auto min-h-16 max-w-[520px] resize-y px-[10px] py-2 text-[14px] leading-5 max-[640px]:max-w-none')}
          />
        </div>
      ) : null}

      {p && !can('adjust_stock') ? (
        <p className={cn('m-0 flex max-w-[520px] gap-2 text-[13px] leading-[19px] text-muted', align)}>
          <Lock aria-hidden size={16} className="mt-px flex-none" />
          <span>{Mgr} records damaged stock and count corrections. Tell {manager} if the shelf is different from the app.</span>
        </p>
      ) : null}

      <p role="status" aria-live="polite" id={id('sum')} className={cn('m-0 max-w-[620px] text-[14px] leading-[21px] text-text', align)}>
        {summary()}
      </p>

      <div className={cn(align, 'max-[640px]:flex max-[640px]:flex-wrap max-[640px]:gap-2')}>
        {p ? (
          pl.send ? (
            <>
              <Button leftIcon={ArrowSquareOut} actionBar className="max-[640px]:h-11 max-[640px]:flex-auto" onClick={() => onTransfer?.(p)}>
                Start a transfer
              </Button>
              <Button variant="text" actionBar className="max-[640px]:flex-auto" onClick={onCancel}>Cancel</Button>
            </>
          ) : (
            <>
              <Button leftIcon={Check} actionBar disabled={!pl.type} aria-describedby={id('sum')} className="disabled:opacity-50 max-[640px]:flex-auto" onClick={commit}>
                {label}
              </Button>
              <Button variant="text" actionBar className="max-[640px]:flex-auto" onClick={onCancel}>Cancel</Button>
            </>
          )
        ) : (
          <Button variant="text" actionBar className="max-[640px]:flex-auto" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </div>
  );
}
