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

/**
 * Parts for this service as a checklist TABLE (Part | Qty | Stock | Have it) with the library Checkbox (16px) in each row, so the mechanic confirms
 * they have everything before starting. "x of y parts ready" counts parts the stockroom issued plus the ones ticked. "Request more parts" opens Need a part.
 */
export function MechParts({ job, s, readOnly, onRequest }: { job: Job; s: MechState; readOnly: boolean; onRequest: (productId?: string) => void }) {
  const parts = servicePartsOf(job, s.have[job.id]);
  const ready = parts.filter((p) => p.ready).length;
  const asked = s.requests.filter((r) => r.jobId === job.id);
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
              const pr = productOf(p.productId);
              const issued = p.issued >= p.qty;
              const st = stockShort(p.productId);
              return (
                <tr key={p.productId} className="h-11 border-b border-rule last:border-b-0">
                  <th scope="row" className="py-1.5 pr-2 text-[14px] font-normal leading-5">{shortName(pr)}</th>
                  <td className="px-2 py-1.5 text-right tabular-nums">{p.qty}</td>
                  <td className="px-2 py-1.5">{issued ? <Badge tone="ok">Taken</Badge> : <Badge tone={st.tone === 'ok' ? 'ok' : st.tone === 'warn' ? 'warn' : 'bad'}>{st.text}</Badge>}</td>
                  <td className="py-1.5 pl-3"><span className="flex justify-center"><Checkbox aria-label={`${shortName(pr)}, have it`} checked={p.ready} disabled={readOnly || issued} onChange={() => toggleHave(job.id, p.productId)} /></span></td>
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
            const ok = r.status === 'Ready at stockroom';
            return <NotifyItem key={r.id} marker={<Package size={20} />} markerTone={ok ? 'ok' : 'muted'} title={`${shortName(productOf(r.productId))} x${r.qty}`} time={agoWord(r.at)} detail={r.note} tag={requestWord(r.status)} tagTone={ok ? 'ok' : 'neutral'} />;
          })}</ul>
        </div>
      )}
    </MechSection>
  );
}
