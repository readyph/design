import { Fragment, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowClockwise, ArrowRight, CaretRight, Package, WarningCircle, X } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { ActionLink } from './ActionLink';
import { Button } from './Button';
import { ButtonLink } from './ButtonLink';
import { QuantityStepper } from './QuantityStepper';
import { Skeleton } from './Skeleton';

/*
 * RDY-392 I8. Transcribed from inventory-home FINAL/cart.css (all) and FINAL/cart.js (groupHTML 26-48, skeleton 49-52, html 53-84, open/close 90-125).
 * Right sheet 440px (full width at 640px and below). Flat and ruled: no cards, no shadow, scrim only.
 */
export interface OrderListLine {
  id: string;
  name: string;
  /** Mono code above the name (cart.js 30: `p.sku || x.p`). */
  sku: string;
  qty: number;
  /** Unit word: `pc` stays `pc`, anything else takes an `s` when the quantity is not 1 ("cartons to order"). */
  unit: string;
  /** Cost each; used only when `money` is on. */
  cost?: number;
}

export interface OrderListGroup {
  /** Supplier id; the key for every event. */
  id: string;
  supplier: string;
  /** Short supplier name used in sentences ("Petron", "Autopro"). */
  shortName: string;
  /** Draft PO number; leave out for a list that is not a PO yet. */
  poNo?: string;
  /** Pass only while the cutoff has not passed. `soon` (60 min or less left) bolds it; `left` is the text "45 min". */
  cutoff?: { at: string; soon?: boolean; left?: string };
  lines: OrderListLine[];
}

export interface OrderListsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: OrderListGroup[];
  /** Manager `confirm_po`: the help text says "mark it sent" instead of "your manager marks it sent". */
  canSend?: boolean;
  /** Manager `valuation`: totals, cost each and amount. Clerks see "pc to order". */
  money?: boolean;
  loading?: boolean;
  /** Error strip with Retry; lists are dimmed and inert, Proceed is off. `lastLoaded` reads "earlier" when left out. */
  error?: { lastLoaded?: string };
  /** Supplier id whose Proceed is running ("Creating..."); every Proceed is disabled meanwhile. */
  busyId?: string;
  /** Open scrolled to and focused on this supplier's list. */
  focusSupplier?: string;
  /** Undo strip text after Remove. */
  undo?: string;
  /** Empty state: on the Products page the action closes the panel instead of linking to it. */
  onProductsPage?: boolean;
  productsHref?: string;
  purchaseOrdersHref: string;
  onQuantityChange: (groupId: string, lineId: string, qty: number) => void;
  onRemove: (groupId: string, lineId: string) => void;
  onUndo?: () => void;
  /** Proceed on a list with no PO. */
  onProceed: (groupId: string) => void;
  /** Open PO on a draft PO. */
  onOpenPo?: (groupId: string) => void;
  onRetry?: () => void;
  /** Money formatter; default is the prototype's peso(n). */
  formatMoney?: (n: number) => string;
}

const peso = (n: number) => '₱' + Math.round(n).toLocaleString('en-PH');
const pl = (n: number, w: string) => `${n} ${n === 1 ? w : w + 's'}`;
const plr = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;
const unitOf = (u: string, n: number) => (u === 'pc' ? 'pc' : n === 1 ? u : u + 's');
const total = (g: OrderListGroup) => g.lines.reduce((s, x) => s + x.qty * (x.cost ?? 0), 0);

const metaCls = 'text-[13px] leading-[19px] text-muted';
const btnPhone = 'max-[640px]:h-11 max-[640px]:w-full';

function Spin() {
  return <span aria-hidden="true" className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none motion-reduce:border-r-current" />;
}

/**
 * Order lists panel (I8, the cart): a modal right sheet with one ruled group per supplier. Groups still to proceed come first,
 * drafts under "Draft POs, not sent". Nothing is sent from here. Native `dialog`: `aria-labelledby`, `aria-describedby`, page behind inert,
 * the title takes focus on open and the opener on close, Tab cycles inside, Esc and a click outside close.
 */
export function OrderListsPanel({
  open,
  onOpenChange,
  groups,
  canSend = false,
  money = false,
  loading = false,
  error,
  busyId,
  focusSupplier,
  undo,
  onProductsPage = false,
  productsHref = '#',
  purchaseOrdersHref,
  onQuantityChange,
  onRemove,
  onUndo,
  onProceed,
  onOpenPo,
  onRetry,
  formatMoney = peso,
}: OrderListsPanelProps) {
  const uid = useId();
  const tId = `${uid}-cartT`;
  const sId = `${uid}-cartS`;
  const dlg = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const from = useRef<HTMLElement | null>(null);
  const nextFocus = useRef<number | null>(null);
  const busy = busyId !== undefined;

  // Groups still to proceed first, drafts after (ORD.carts().concat(ORD.pos())).
  const ls = [...groups.filter((g) => !g.poNo), ...groups.filter((g) => g.poNo)];
  const n = ls.length;
  const nCarts = ls.filter((g) => !g.poNo).length;
  const nPos = n - nCarts;
  const np = ls.reduce((s, l) => s + l.lines.length, 0);
  const summary = (() => {
    const parts: string[] = [];
    if (nCarts) parts.push(plr(nCarts, 'list to proceed', 'lists to proceed'));
    if (nPos) parts.push(plr(nPos, 'draft PO, not sent', 'draft POs, not sent'));
    return parts.length ? parts.join(', ') : 'none open';
  })();
  const sub = loading
    ? 'Loading your order lists.'
    : n
      ? `${summary[0].toUpperCase() + summary.slice(1)}. ${pl(np, 'product')} in all. Nothing is sent from here.`
      : 'Products that need stock wait here, one list for each supplier.';

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      from.current = document.activeElement as HTMLElement | null;
      d.showModal();
      const g = focusSupplier ? d.querySelector<HTMLElement>(`[data-sup="${focusSupplier}"]`) : null;
      if (g) {
        g.scrollIntoView({ block: 'start' });
        const h = g.querySelector<HTMLElement>('h3');
        h?.focus({ preventScroll: true });
      } else title.current?.focus({ preventScroll: true });
    } else if (!open && d.open) {
      d.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // After Remove, focus moves to the next Remove link (cart.js 150).
  useEffect(() => {
    if (nextFocus.current === null) return;
    const all = dlg.current?.querySelectorAll<HTMLElement>('[data-crm]') ?? [];
    const f = all[Math.min(nextFocus.current, all.length - 1)];
    nextFocus.current = null;
    if (f) f.focus({ preventScroll: true });
    else title.current?.focus();
  }, [groups]);

  const onClose = () => {
    const f = from.current;
    from.current = null;
    if (f && f.isConnected) f.focus({ preventScroll: true });
    onOpenChange(false);
  };

  // Tab stays inside; Shift+Tab wraps (cart.js 189-198).
  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== 'Tab') return;
    const d = dlg.current;
    if (!d) return;
    const f = [...d.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])')].filter((x) => !x.closest('[inert]') && x.getClientRects().length);
    if (!f.length) {
      e.preventDefault();
      return;
    }
    const first = f[0];
    const last = f[f.length - 1];
    const a = document.activeElement;
    if (!d.contains(a)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && (a === first || a === title.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && a === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const helpFor = (g: OrderListGroup) =>
    g.poNo
      ? `${g.poNo} is made but not sent. Open it to print${canSend ? ' and mark it sent' : '. Your manager marks it sent'}.`
      : `Proceed makes a purchase order for ${g.shortName}. You print it there${canSend ? ' and mark it sent' : ', then your manager marks it sent'}. Nothing is sent to the supplier.`;

  const go = (g: OrderListGroup) => (g.poNo ? onOpenPo?.(g.id) : onProceed(g.id));

  const group = (g: OrderListGroup, solo: boolean, stale: boolean): ReactNode => {
    const gBusy = busyId === g.id;
    return (
      <section
        key={g.id}
        data-sup={g.id}
        aria-labelledby={`${uid}-cg-${g.id}`}
        className="border-b border-border px-5 pb-[18px] pt-4 last:border-b-0 max-[640px]:px-4 max-[640px]:pb-[14px] max-[640px]:pt-3"
      >
        <div className="flex items-baseline gap-3">
          <h3 id={`${uid}-cg-${g.id}`} className="min-w-0 flex-1 text-[15px] font-semibold leading-[22px] focus:outline-none">
            {g.supplier}
          </h3>
          <span className="flex-none text-[13px] tabular-nums text-muted">
            {money && (
              <>
                <b className="font-semibold text-text">{formatMoney(total(g))}</b>
                {' · '}
              </>
            )}
            {pl(g.lines.length, 'product')}
          </span>
        </div>
        <p className={cn('mt-0.5', metaCls)}>
          {g.poNo ? `${g.poNo} draft, not sent` : 'Not a PO yet'}
          {g.cutoff && (
            <>
              {' · '}
              <span className={g.cutoff.soon ? 'font-medium text-text' : undefined}>
                Order by {g.cutoff.at}
                {g.cutoff.soon ? `, ${g.cutoff.left} left` : ''}
              </span>
            </>
          )}
        </p>
        <ul className="mt-2">
          {g.lines.map((x) => (
            <li key={x.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-[2px] border-t border-rule py-[10px] first:border-t-0">
              <div className="min-w-0">
                <span className="block font-mono text-[13px] leading-4 text-muted">{x.sku}</span>
                <b className="block text-[14px] font-medium leading-5 [overflow-wrap:anywhere]">{x.name}</b>
              </div>
              <QuantityStepper value={x.qty} productName={x.name} onValueChange={(v) => onQuantityChange(g.id, x.id, v)} />
              <div className="col-span-full flex items-center gap-3 text-[13px] leading-5 text-muted">
                <span>
                  {money ? (
                    <>
                      {formatMoney(x.cost ?? 0)} each {'·'} <span className="tabular-nums text-text">{formatMoney(x.qty * (x.cost ?? 0))}</span>
                    </>
                  ) : (
                    `${unitOf(x.unit, x.qty)} to order`
                  )}
                </span>
                <ActionLink
                  data-crm=""
                  className="ml-auto min-h-7 max-[640px]:inline-flex max-[640px]:min-h-11 max-[640px]:items-center max-[640px]:px-2"
                  aria-label={`Remove ${x.name} from the ${g.shortName} order list`}
                  onClick={() => {
                    nextFocus.current = [...(dlg.current?.querySelectorAll('[data-crm]') ?? [])].findIndex((b) => b === document.activeElement);
                    if (nextFocus.current < 0) nextFocus.current = 0;
                    onRemove(g.id, x.id);
                  }}
                >
                  Remove
                </ActionLink>
              </div>
            </li>
          ))}
        </ul>
        {!solo && !stale && !loading && (
          <div className="mt-3 flex items-center gap-3 border-t border-rule pt-3 max-[640px]:mt-1 max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:pt-[10px]">
            <p className={cn('min-w-0 flex-1 max-[640px]:hidden', metaCls)}>{helpFor(g)}</p>
            <Button
              variant={g.poNo ? 'primary' : 'secondary'}
              disabled={busy}
              onClick={() => go(g)}
              rightIcon={gBusy ? undefined : ArrowRight}
              aria-label={g.poNo ? `Open ${g.poNo} for ${g.supplier}` : `Proceed with the ${g.supplier} order list`}
              className={cn('h-9 flex-none', btnPhone)}
            >
              {gBusy ? (
                <>
                  <Spin />
                  Creating…
                </>
              ) : g.poNo ? (
                `Open ${g.poNo}`
              ) : (
                'Proceed'
              )}
            </Button>
          </div>
        )}
      </section>
    );
  };

  const skeleton = (
    <>
      {[0, 1].map((i) => (
        <section key={i} aria-hidden="true" className="border-b border-border px-5 pb-[18px] pt-4 last:border-b-0 max-[640px]:px-4 max-[640px]:pb-[14px] max-[640px]:pt-3">
          <div className="flex items-baseline gap-3">
            <div className="flex-1">
              <Skeleton className="h-[14px] w-[140px] max-w-full" />
            </div>
            <Skeleton className="h-[14px] w-[70px] max-w-full flex-none" />
          </div>
          <ul className="mt-2">
            {[0, 1, 2].map((j) => (
              <li key={j} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-[6px] border-t border-rule py-[10px] first:border-t-0">
                <div className="min-w-0">
                  <Skeleton className="h-[14px] w-[70px] max-w-full" />
                  <div className="h-[6px]" />
                  <Skeleton className="h-[14px] w-[180px] max-w-full" />
                </div>
                <Skeleton className="h-[14px] w-[120px] max-w-full" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );

  const solo = n === 1 && !error;
  const todo = nCarts;
  const sec = 'border-b border-rule px-5 pb-[6px] pt-[10px] text-[13px] font-semibold leading-[19px] text-text';

  let content: ReactNode;
  let foot: ReactNode = null;
  if (loading) content = skeleton;
  else if (!n) {
    content = (
      <div className="px-5 py-7">
        <b className="block text-[15px] font-semibold leading-[22px]">No order lists are open</b>
        <p className="mt-1 text-[13px] leading-5 text-muted">When a product runs low, add it to its supplier&apos;s list on Products. It waits here until you proceed.</p>
        {onProductsPage ? (
          <Button variant="secondary" className="mt-[14px]" onClick={() => dlg.current?.close()}>
            Close
          </Button>
        ) : (
          <ButtonLink variant="secondary" href={productsHref} leftIcon={Package} className="mt-[14px]">
            Go to Products
          </ButtonLink>
        )}
      </div>
    );
  } else {
    content = (
      <>
        {error && (
          <p role="alert" className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-5 py-3 text-[13px] leading-5">
            <WarningCircle size={18} aria-hidden="true" className="text-bad" />
            <span className="min-w-0 flex-[1_1_200px]">
              Purchase orders did not load, so this is the list from {error.lastLoaded || 'earlier'}. Nothing can be changed or sent on to a PO until it loads.
            </span>
            <Button variant="secondary" leftIcon={ArrowClockwise} onClick={onRetry}>
              Retry
            </Button>
          </p>
        )}
        <div className={error ? 'opacity-[.72]' : undefined} {...(error ? { inert: '' } : {})}>
          {ls.map((l, i) => {
            const mixed = nCarts > 0 && nPos > 0;
            const first = i === 0 || !!ls[i - 1].poNo !== !!l.poNo;
            return (
              <Fragment key={l.id}>
                {mixed && first && <h3 className={sec}>{l.poNo ? `Draft POs, not sent (${nPos})` : `Still to proceed (${nCarts})`}</h3>}
                {group(l, solo, !!error)}
              </Fragment>
            );
          })}
        </div>
      </>
    );
    if (solo) {
      const l = ls[0];
      const lBusy = busyId === l.id;
      foot = (
        <>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px] text-muted max-[640px]:mb-0.5">
            <span>{pl(l.lines.length, 'product')}</span>
            {money && (
              <span>
                Total <b className="text-[15px] font-semibold tabular-nums text-text">{formatMoney(total(l))}</b>
              </span>
            )}
          </div>
          <p className={metaCls}>{helpFor(l)}</p>
          <Button variant="primary" disabled={busy} onClick={() => go(l)} rightIcon={lBusy ? undefined : ArrowRight} className="mt-[10px] h-10 w-full text-[14px] max-[640px]:h-12">
            {lBusy ? (
              <>
                <Spin />
                Creating the purchase order…
              </>
            ) : l.poNo ? (
              `Open ${l.poNo}`
            ) : (
              'Proceed'
            )}
          </Button>
        </>
      );
    } else {
      foot = (
        <>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px] text-muted max-[640px]:mb-0.5">
            <span>
              {pl(n, 'list')}, {pl(np, 'product')}
            </span>
            {money && (
              <span>
                Total <b className="text-[15px] font-semibold tabular-nums text-text">{formatMoney(ls.reduce((t, l) => t + total(l), 0))}</b>
              </span>
            )}
          </div>
          <p className={cn(metaCls, 'max-[640px]:mt-0.5')}>
            {error
              ? 'These lists may be out of date. Retry first; nothing can be proceeded until they load.'
              : todo
                ? 'Each supplier gets its own purchase order. Use the Proceed button under each list; scroll for the rest.'
                : 'Open each draft PO to print it.'}
          </p>
        </>
      );
    }
    foot = (
      <>
        {foot}
        <a
          href={purchaseOrdersHref}
          className={cn(
            '-ml-1 mt-[10px] inline-flex min-h-7 items-center gap-1 rounded-[4px] px-1 text-[13px] font-semibold text-accent no-underline max-[640px]:min-h-11',
            solo && 'mt-2',
            focusRing,
          )}
        >
          Open purchase orders
          <CaretRight size={13} aria-hidden="true" />
        </a>
      </>
    );
  }

  return (
    <dialog
      ref={dlg}
      aria-labelledby={tId}
      aria-describedby={sId}
      aria-modal="true"
      onClose={onClose}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === dlg.current) dlg.current?.close();
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-full max-h-none w-[min(440px,100vw)] max-w-none overflow-hidden border-0 border-l border-border bg-surface p-0 text-text backdrop:bg-scrim open:flex open:animate-cart-in open:flex-col motion-reduce:open:animate-none max-[640px]:w-screen max-[640px]:border-l-0"
    >
      <div className="flex flex-none items-start gap-3 border-b border-border pb-3 pl-5 pr-2 pt-4 max-[640px]:pl-4">
        <div className="min-w-0 flex-1">
          <h2 ref={title} id={tId} tabIndex={-1} className="text-[18px] font-semibold leading-6 focus:outline-none">
            Order lists
          </h2>
          <p id={sId} className="mt-0.5 text-[13px] leading-[19px] text-muted">
            {sub}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close order lists"
          onClick={() => dlg.current?.close()}
          className={cn('grid h-11 w-11 flex-none place-items-center rounded-control text-text hover:bg-raised', focusRing)}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {content}
      </div>
      <div
        role="status"
        aria-live="polite"
        className={cn('flex flex-none items-center gap-3 border-t border-border bg-raised px-5 py-[10px] text-[13px] leading-[19px] max-[640px]:px-4', !undo && 'hidden')}
      >
        {undo && (
          <>
            <span className="min-w-0 flex-1">{undo}</span>
            <button type="button" onClick={onUndo} className={cn('min-h-7 flex-none rounded-[4px] px-[6px] font-semibold text-accent max-[640px]:min-h-11 max-[640px]:px-2', focusRing)}>
              Undo
            </button>
          </>
        )}
      </div>
      {foot && <div className="flex-none border-t border-border bg-surface px-5 pb-4 pt-[14px] max-[640px]:px-4 max-[640px]:pb-[calc(14px+env(safe-area-inset-bottom))] max-[640px]:pt-3">{foot}</div>}
    </dialog>
  );
}
