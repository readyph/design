import { X } from '@phosphor-icons/react';
import { peso, productOf } from '../data';
import type { ServicePart } from '../catalogue';
import { PartPicker, PartStock } from './PartPicker';

const qtyIn = 'h-9 w-16 rounded-control border border-control bg-surface px-2 text-right text-[14px] tabular-nums text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:h-11';

/**
 * Studio-only ServicePartsEditor (NEW): the "Parts used" list of one catalogue service. The search field (leading magnifier, full width of the column, same height as the form fields) sits above
 * the table, so field and table share the same left and right edges. Each row: Inventory product, unit and stock word, default quantity, cost, remove. Zero parts is fine (labour-only service).
 */
export function ServicePartsEditor({ parts, onChange }: { parts: ServicePart[]; onChange: (p: ServicePart[]) => void }) {
  const set = (id: string, qty: number) => onChange(parts.map((p) => (p.productId === id ? { ...p, qty: Math.max(1, Math.min(99, qty || 1)) } : p)));
  return (
    <div>
      <PartPicker label="Add a part from Inventory" exclude={parts.map((p) => p.productId)} onPick={(id) => onChange([...parts, { productId: id, qty: 1 }])} />
      {parts.length === 0 ? (
        <p className="mt-1 rounded-control border border-dashed border-control px-3 py-4 text-[13px] text-muted">No parts. This service is labour only. Search above if the shop usually fits a part.</p>
      ) : (
        <ul aria-label="Parts used" className="mt-1 divide-y divide-rule border-y border-rule">
          {parts.map((lp) => {
            const pr = productOf(lp.productId);
            return (
              <li key={lp.productId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <div className="min-w-0 basis-[200px] flex-1 max-[640px]:basis-full">
                  <p className="break-words text-[14px] text-text">{pr.name}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted"><span>{pr.sku}</span><span>{peso(pr.price)} / {pr.unit}</span><PartStock product={pr} /></p>
                </div>
                <label className="flex flex-none items-center gap-1.5 text-[12px] text-muted">Qty
                  <input inputMode="numeric" aria-label={`Default quantity of ${pr.name}`} value={lp.qty} onChange={(e) => set(lp.productId, Number(e.target.value.replace(/\D/g, '')))} className={qtyIn} />
                  <span className="w-9 truncate">{pr.unit}</span>
                </label>
                <span className="w-24 flex-none text-right text-[14px] tabular-nums max-[640px]:ml-auto" aria-label={`Cost ${peso(pr.price * lp.qty)}`}>{peso(pr.price * lp.qty)}</span>
                <button type="button" aria-label={`Remove ${pr.name}`} onClick={() => onChange(parts.filter((p) => p.productId !== lp.productId))} className="inline-flex size-8 flex-none items-center justify-center rounded-control text-muted hover:bg-raised hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:size-11"><X size={16} aria-hidden /></button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
