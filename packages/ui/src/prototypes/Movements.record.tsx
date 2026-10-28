import { isValidElement, useState, type ReactNode } from 'react';
import { RecordMovementForm, type RecordEntry, type RecordPermission, type RecordProduct } from '../components/RecordMovementForm';
import type { MovementsModel } from './Movements.data';

/* RDY-437. Page: Movements 3/6 (c), the Record movement sub-page. Transcribed from inventory-home FINAL movements.js 276-293 (recAside, recordHTML, mountRecord),
   movements.css 291-310 (.recx, .rcaside, .hw, .lt, .lt-n), 318 (.rc-pk .t2: the component), 255 (body.detail.formpage .pane), shell.css 235-247 (.chead, .facts),
   products.css 187-190, 349, 399 (.pdetail), purchase-orders.css 118, 257 (.rcv-h). The form is the I14 component (RDY-389); the page passes props only. */

const nodeText = (n: ReactNode): string => {
  if (n == null || typeof n === 'boolean') return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n);
  if (Array.isArray(n)) return n.map(nodeText).join('');
  return isValidElement(n) ? nodeText((n.props as { children?: ReactNode }).children) : '';
};

const hwLi = 'border-b border-rule py-3.5';

export interface RecordViewProps {
  M: MovementsModel;
  /** The product the page starts with (`&p=<id>`). */
  productId: string | null;
  onCancel: () => void;
  onTransfer: (productId: string) => void;
  onRecord: (entry: RecordEntry, product: RecordProduct) => void;
  /** The reason word of one ledger row, as a node (the page's `whatOf`). */
  whatOf: (row: ReturnType<MovementsModel['ledger']>[number]) => [ReactNode, ReactNode];
}

export function RecordView({ M, productId, onCancel, onTransfer, onRecord, whatOf }: RecordViewProps) {
  const { D, can, isA, num, who, hm12, STK } = M;
  const d = D as unknown as {
    viewer: { short: string }; roleLabel: string; now: { date: string; time: string; hm: string }; business: { platform: string };
    jobs: { jo: string; needs: { p: string }[] }[];
  };
  const [pid, setPid] = useState<string | null>(productId);
  const products: RecordProduct[] = D.products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, onHand: p.onHand, reorder: p.reorder, unit: p.unit, location: M.loc(p.loc as string) }));
  const byId = (id: string) => products.find((x) => x.id === id);
  /* stock.js 124-130: the parts booked jobs need, then what went out lately (first five with stock) */
  const likely = (() => {
    const out: { product: RecordProduct; why: string }[] = [], seen = new Set<string>();
    const add = (p: RecordProduct | undefined, why: string) => { if (p && !seen.has(p.id) && p.onHand > 0) { seen.add(p.id); out.push({ product: p, why }); } };
    if (isA) d.jobs.forEach((j) => j.needs.forEach((n) => add(byId(n.p), `Needed for ${j.jo}`)));
    D.movements.filter((m) => m.qty < 0).forEach((m) => add(byId(m.p), `Went out ${m.day === 'today' ? 'today' : 'yesterday'}`));
    return out.slice(0, 5);
  })();
  const permissions = (['stock_out', 'transfer', 'adjust_stock'] as RecordPermission[]).filter((x) => can(x));
  const signed = (n: number) => (n > 0 ? '+' : '−') + num(Math.abs(n));

  /* movements.js 276-281 recAside */
  const p = pid ? M.prod(pid) : undefined;
  const aside = !p ? (
    <>
      <h2 className="border-b border-border pb-2 text-[13px] font-semibold">How stock moves</h2>
      <ul className="m-0 list-none p-0">
        <li className={hwLi}><b className="block text-[14px] font-semibold leading-5">Stock in</b><span className="mt-0.5 block text-[13px] leading-[19px] text-muted">Receive a purchase order, or check in a transfer. That is the only way stock comes in.</span></li>
        <li className={hwLi}><b className="block text-[14px] font-semibold leading-5">Stock out</b><span className="mt-0.5 block text-[13px] leading-[19px] text-muted">Record it here with a reason: sold, used {isA ? 'on a job' : 'in the kitchen'}, sent to another place, or damaged.</span></li>
        <li className={hwLi}><b className="block text-[14px] font-semibold leading-5">A different count</b><span className="mt-0.5 block text-[13px] leading-[19px] text-muted">If the shelf and the app disagree, {can('adjust_stock') ? 'make a count correction' : `${M.Mgr()} makes a count correction`}.</span></li>
      </ul>
    </>
  ) : (
    <>
      <h2 className="border-b border-border pb-2 text-[13px] font-semibold">Latest for {p.sku}</h2>
      <ul className="m-0 list-none p-0">
        {STK.productRows(p).slice(0, 5).map((r) => {
          const w = nodeText(whatOf({ ...r, day: r.day as string, product: p } as never)[0]);
          return (
            <li key={r.id} className="flex justify-between gap-4 border-b border-rule py-3">
              <span><b className="block text-[14px] font-medium leading-5">{w}</b><span className="mt-0.5 block text-[13px] leading-[18px] text-muted">{r.day === 'today' ? 'Today' : r.day === 'yesterday' ? 'Yesterday' : r.day}, {hm12(r.at)} · {who(r.by)}</span></span>
              <span className="text-right tabular-nums"><b className="block text-[14px] font-semibold leading-5">{signed(r.qty)}</b><span className="mt-0.5 block text-[13px] leading-[18px] text-muted">{num(r.after)} left</span></span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[13px] leading-[19px] text-muted">{p.onHand} on hand now. Reorder level {p.reorder}.</p>
    </>
  );

  return (
    <div className="min-w-0 px-pad pb-12 pt-6 max-[640px]:px-4 max-[640px]:pb-10 max-[640px]:pt-4">
      <div className="flex items-center gap-4 max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-start max-[640px]:gap-x-3 max-[640px]:gap-y-2">
        <h1 className="m-0 text-[22px] font-semibold leading-7 tracking-[-0.01em]">Record movement</h1>
      </div>
      <div className="-ml-[23px] mt-3 flex flex-wrap items-center gap-y-1 [clip-path:inset(-6px_-6px_-6px_23px)] text-[13px] leading-5 text-muted">
        {[`${d.viewer.short}, ${d.roleLabel.toLowerCase()}`, `${d.now.date}, ${d.now.time}`].map((f) => (
          <span key={f} className="inline-flex items-center gap-1.5 whitespace-nowrap before:ml-[10px] before:mr-1 before:h-[3px] before:w-[3px] before:flex-none before:rounded-full before:bg-control before:content-['']">{f}</span>
        ))}
      </div>
      <p className="mt-5 max-w-[720px] text-[14px] leading-[21px] text-muted max-[640px]:mt-3">Stock comes <b className="font-semibold">in</b> on an order or a transfer. Record stock going <b className="font-semibold">out</b> here, or fix a count. You confirm first.</p>
      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-x-14 max-[1099px]:grid-cols-[minmax(0,1fr)]">
        <div className="min-w-0 pt-4">
          <RecordMovementForm
            product={p ? byId(p.id) : null}
            products={products}
            likely={likely}
            permissions={permissions}
            jobOrders={isA}
            placeName={d.business.platform}
            jobsFor={(id) => d.jobs.filter((j) => j.needs.some((n) => n.p === id)).slice(0, 4).map((j) => j.jo)}
            effect={(id, delta) => STK.effectText({ [id]: delta })}
            onProductChange={(x) => setPid(x ? x.id : null)}
            onCancel={onCancel}
            onTransfer={(x) => onTransfer(x.id)}
            onRecord={onRecord}
          />
        </div>
        <aside aria-label="About this product" className="min-w-0 pt-5 max-[1099px]:max-w-[520px] max-[1099px]:pt-8 max-[640px]:pt-7 print:hidden">{aside}</aside>
      </div>
    </div>
  );
}
