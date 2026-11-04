import { Package } from '@phosphor-icons/react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { productOf, type Job } from './sms/data';
import { toggleHave } from './sms/mechActions';
import { agoWord, requestWord, servicePartsOf, shortName, stockWord, type MechState } from './sms/mechModel';
import { MechSection } from './MechFrame';
import { NotifyItem } from './NotifyItem';

const stockShort = (productId: string) => { const w = stockWord(productOf(productId)); return { text: w.word.startsWith('In stock') ? 'In stock' : w.word.startsWith('Low') ? 'Low stock' : w.word.includes('on order') ? 'On order' : 'Out of stock', tone: w.tone }; };

/** One row of the parts checklist. `taken` = the stockroom already issued it (shown "Taken", box locked). */
export interface MechPartRow { id: string; name: string; qty: number; stock: { text: string; tone: 'ok' | 'warn' | 'bad' }; taken?: boolean; ready: boolean }
/** One part request already made for this service. */
export interface MechPartRequest { id: string; title: string; time: string; detail?: string; tag: string; ready?: boolean }

/**
 * Parts for this service as a checklist TABLE (Part | Qty | Stock | Have it) from any data, with the library Checkbox (16px) in each row, so the mechanic confirms
 * they have everything before starting. "x of y parts ready" counts rows with `ready`. "Request more parts" opens Need a part.
 */
export function MechParts({ parts, requests = [], readOnly, onToggle, onRequest }: { parts: MechPartRow[]; requests?: MechPartRequest[]; readOnly: boolean; onToggle: (id: string) => void; onRequest: (productId?: string) => void }) {
  const ready = parts.filter((p) => p.ready).length;
  const asked = requests;
  return (
    <MechSection title="Parts for this service" hint={parts.length ? <span aria-live="polite">{ready} of {parts.length} parts ready</span> : undefined}>
      {parts.length ? (
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-rule text-[12px] font-medium text-muted">
              <th scope="col" className="py-2 pr-2 font-medium">Part</th>
              <th scope="col" className="w-10 px-2 py-2 text-right font-medium">Qty</th>
              <th scope="col" className="px-2 py-2 font-medium">Stock</th>
              <th scope="col" className="w-16 py-2 pl-3 text-center font-medium">Have it</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => {
              return (
                <tr key={p.id} className="h-11 border-b border-rule last:border-b-0">
                  <th scope="row" className="py-1.5 pr-2 text-[14px] font-normal leading-5">{p.name}</th>
                  <td className="px-2 py-1.5 text-right tabular-nums">{p.qty}</td>
                  <td className="px-2 py-1.5">{p.taken ? <Badge tone="ok">Taken</Badge> : <Badge tone={p.stock.tone}>{p.stock.text}</Badge>}</td>
                  <td className="py-1.5 pl-3"><span className="flex justify-center"><Checkbox aria-label={`${p.name}, have it`} checked={p.ready} disabled={readOnly || p.taken} onChange={() => onToggle(p.id)} /></span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : <p className="py-2 text-[14px] text-muted">No parts are listed for this service.</p>}
      {parts.length > 0 && ready < parts.length && !readOnly && <p className="pt-2 text-[13px] text-muted">Tick each part you have before you start.</p>}
      {!readOnly && <div className="pt-3"><Button variant="secondary" fullWidth leftIcon={Package} onClick={() => onRequest()}>Request more parts</Button></div>}
      {asked.length > 0 && (
        <div role="group" aria-label="Requests for this service" className="mt-4">
          <h3 className="pb-1 text-[13px] font-semibold">Requests for this service</h3>
          <ul className="-mx-4">{asked.map((r) => {
            return <NotifyItem key={r.id} marker={<Package size={20} />} markerTone={r.ready ? 'ok' : 'muted'} title={r.title} time={r.time} detail={r.detail} tag={r.tag} tagTone={r.ready ? 'ok' : 'neutral'} />;
          })}</ul>
        </div>
      )}
    </MechSection>
  );
}

/** The prototype adapter: MechParts fed from the sample job and the sample mechanic state (what the Storybook prototypes use). */
export function MechPartsSample({ job, s, readOnly, onRequest }: { job: Job; s: MechState; readOnly: boolean; onRequest: (productId?: string) => void }) {
  const parts: MechPartRow[] = servicePartsOf(job, s.have[job.id]).map((p) => ({ id: p.productId, name: shortName(productOf(p.productId)), qty: p.qty, stock: stockShort(p.productId), taken: p.issued >= p.qty, ready: p.ready }));
  const requests: MechPartRequest[] = s.requests.filter((r) => r.jobId === job.id).map((r) => ({ id: r.id, title: `${shortName(productOf(r.productId))} x${r.qty}`, time: agoWord(r.at), detail: r.note, tag: requestWord(r.status), ready: r.status === 'Ready at stockroom' }));
  return <MechParts parts={parts} requests={requests} readOnly={readOnly} onToggle={(id) => toggleHave(job.id, id)} onRequest={onRequest} />;
}
