import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Barcode, ChatCircleText, PaperPlaneTilt } from '@phosphor-icons/react';
import { StockerFacts, StockerRow, StockerId, StockerStatus } from '../components/StockerRow';
import { BarcodeSheet } from '../components/BarcodeSheet';
import { cn } from '../utils/cn';
import { StockerActs, StockerButton, StockerEmpty, StockerMsg, StockerNoProducts, StockerPageFrame, StockerSection, StockerSkeleton } from './Stocker.frame';
import { stockerData, type Stocker, type StockerParams, type SProduct, type STransferView } from './Stocker.data';
import { BarBody, Lbl, Note, Sb, Selected, StockerDone, StpW, Stepper, Unit, asBarcode, ring, tin, type StockerFlash } from './Stocker.in';

/*
 * RDY-432. Stocker Stock out (4/6 d). Transcribed from inventory-home round-1/final stocker.js 315-446 (outPage 316, sendView 422), 99-101 + 124-133 (row, section, toSend, trSendRow),
 * 159-170 (scanBtn, likely, pickRow, likelyHTML, selected), 172-178 (radioKeys), 179 (stepper), 182-196 (doneView); stocker-out.html; stocker.css 48-57 (.sec .help .note .empty),
 * 110-111 (.lbl .tin), 128-132 + 224 (.sdl), 136-143 (.rs .r .dot .h), 152-157 (.stp-w .un .chips .chip), 180-183 (.bar .sum .bad), 194-199 (.msg), 208 (<=360px); shell.css 306-308 (.chip).
 * The workshop's inline styles (stocker.js 360-376: margin-top 12/24px, .rs margin-top 4 + no top border, mono max-width 220 job input, min-height 0 link, 0 var(--pad) 28px tail) are classes here.
 * GAP: the workshop keeps stock, the transfer record and the Undo snapshot in browser state (R.mvAdd, R.trAdd, R.trSet, R.restore, sessionStorage flash). The stories keep the form live;
 *      the confirm button shows the done screen with the workshop's wording and Undo does nothing.
 * GAP: ?done=1 with no saved flash shows nothing in the workshop; the story shows the "Stock out recorded" done screen for the first product that has stock.
 * GAP: "Transfers to send" sits after <main> in the workshop (stocker.js 389-392, padding 0 var(--pad) 28px); here it is the last block inside the frame's main, so the gap below it is the frame's.
 * GAP: the workshop stepper (.stp, min 0) differs from I9 QuantityStepper (min 1); the local Stepper from Stocker.in.tsx is reused.
 */

const MAXQ = 9999;
const clampQty = (n: number, raw: string) => (raw === '' || !Number.isFinite(n) || n < 1 ? 1 : n > MAXQ ? MAXQ : n);
const isJO = (r: string) => /^JO-\d+$/.test(r || '');

interface Opt { k: string; label: string; help: string }

/** .rs / .r with the .h help line (stocker.css 136-143) and radioKeys (stocker.js 172-178). */
export function Radios({ labelledBy, items, value, onValue, flush }: { labelledBy: string; items: Opt[]; value: string | null; onValue: (k: string) => void; flush?: boolean }) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const n = (i + (/Down|Right/.test(e.key) ? 1 : items.length - 1)) % items.length;
    onValue(items[n].k);
    requestAnimationFrame(() => (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus());
  };
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={cn(flush ? 'mt-1' : 'mt-2 border-t border-border')}>
      {items.map((x, i) => (
        <button key={x.k} type="button" role="radio" aria-checked={value === x.k} tabIndex={value === x.k || (!value && i === 0) ? 0 : -1} onClick={() => onValue(x.k)} onKeyDown={(e) => onKey(e, i)}
          className={cn('grid min-h-[60px] w-full grid-cols-[22px_minmax(0,1fr)] items-start gap-x-3 border-b border-rule py-3 text-left hover:bg-raised', ring)}>
          <span className={cn('relative mt-px h-5 w-5 rounded-full border-2 bg-surface', value === x.k ? 'border-accent after:absolute after:inset-[3px] after:rounded-full after:bg-accent' : 'border-control')} />
          <span>
            <b className="block text-[15px] font-semibold leading-[22px]">{x.label}</b>
            {x.help ? <span className="mt-px block text-[13px] font-normal leading-[19px] text-muted">{x.help}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

/** .help (stocker.css 53). */
export const Help = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cn('mt-2 text-[13px] leading-[19px] text-muted [&_b]:font-semibold [&_b]:text-text', className)}>{children}</p>;

/** .chip (stocker.css 155-157 on shell.css 306-308). */
export function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick}
      className={cn('inline-flex h-[30px] min-h-[var(--tap)] items-center gap-1.5 rounded-[24px] border-[1.5px] bg-surface px-[14px] text-[15px] hover:border-muted hover:bg-raised', pressed ? 'border-accent font-semibold text-accent' : 'border-control font-medium text-text', ring)}>
      {children}
    </button>
  );
}

/** likely('out') (stocker.js 161-168). */
function likelyOut(s: Stocker) {
  const out: { p: SProduct; why: string }[] = [], seen = new Set<string>();
  const add = (p: SProduct | undefined, why: string) => { if (p && !seen.has(p.id) && p.onHand > 0) { seen.add(p.id); out.push({ p, why }); } };
  const day = (d: string) => (d === 'today' ? 'today' : 'yesterday');
  if (s.isA) s.d.jobs.forEach((j) => j.needs.forEach((n) => add(s.prod(n.p), `Needed for ${j.jo}`)));
  s.d.movements.filter((m) => m.qty < 0 && m.by === s.d.viewer.id).forEach((m) => add(s.prod(m.p), `You took it out ${day(m.day)}`));
  s.d.movements.filter((m) => m.qty < 0).forEach((m) => add(s.prod(m.p), `Went out ${day(m.day)}`));
  return out.slice(0, 5);
}

function trSendRow(s: Stocker, t: STransferView) {
  return <StockerRow key={t.id} href={s.href('stocker-out.html', { tr: t.id })} what={`${t.id} to ${t.other.short}`} where={`${s.tWhat(t)}${s.canSend(t) ? '' : `. ${s.Mgr} approves it first.`}`} go={s.canSend(t) ? 'Send' : 'Open'} />;
}

/** sendView (stocker.js 422-446): send a transfer document. */
function SendView({ s, id }: { s: Stocker; id: string }) {
  const t = s.transfers().find((x) => x.id === id);
  const [done, setDone] = useState(false);
  const back = { href: s.href('stocker-out.html'), label: 'Stock out' };
  if (!t || !t.out) {
    return (
      <StockerPageFrame s={s} page="out" title="Transfer" back={back}>
        <StockerEmpty>That transfer is not one to send from here.{t ? ` It comes from ${t.other.name}.` : ''}</StockerEmpty>
        <StockerActs><StockerButton href={s.href('stocker.html')}>Back to Home</StockerButton></StockerActs>
      </StockerPageFrame>
    );
  }
  if (done) {
    const fl: StockerFlash = { title: 'Sent', text: `${t.id} to ${t.other.name}: ${s.tWhat(t)}.`, sub: `${t.other.short} checks it in. Put the paper with the parts.`, again: { href: s.href('stocker-out.html'), label: 'Take out something else' }, undoable: true };
    return <StockerDone s={s} fl={fl} page="out" />;
  }
  const lines = t.lines.map((l) => <StockerRow key={l.p} what={l.product.name} where={<><StockerId>{l.product.sku}</StockerId> · {s.loc(l.product)} · {l.product.onHand} on hand</>} qty={{ value: l.qty, unit: s.unitOf(l.product, l.qty) }} />);
  const status = t.status === 'draft' ? 'Not sent yet' : t.status === 'transit' ? 'On its way' : t.status === 'received' ? 'Checked in' : 'Cancelled';
  const head = <StockerFacts items={[{ label: 'Goes to', value: t.other.name }, ...(t.job ? [{ label: 'For job', value: <StockerId><span className="text-[13px]">{t.job}</span></StockerId> }] : []), { label: 'Status', value: status }]} className="mt-[14px]" />;
  const note = t.note ? <Note>{t.note}</Note> : null;
  const sendable = t.status === 'draft' && s.canSend(t);
  const lead = 'Pick the parts, then mark it sent. Stock leaves when you do.';
  if (t.status !== 'draft') {
    return (
      <StockerPageFrame s={s} page="out" title={`Send ${t.id}?`} back={back} lead={lead}>
        {head}
        <StockerSection id="parts" title="Parts" n={t.lines.length}>{lines}</StockerSection>
        {note}
        <StockerActs><StockerButton href={s.href('stocker.html')}>Back to Home</StockerButton></StockerActs>
      </StockerPageFrame>
    );
  }
  const short = t.lines.filter((l) => l.qty > l.product.onHand);
  const ok = !short.length;
  return (
    <StockerPageFrame s={s} page="out" title={`Send ${t.id}?`} back={back} lead={lead}
      bar={sendable ? (
        <>
          <p role="status" className="mb-2 text-[14px] leading-5 text-text [&_b]:font-semibold [&_.bad]:text-bad">{ok ? <>Stock leaves {s.place(s.HERE).short} when you send it: <b>{s.tWhat(t)}</b>.</> : <span className="bad">There is not enough on hand to send all of it.</span>}</p>
          <Sb primary disabled={!ok} onClick={() => setDone(true)}><PaperPlaneTilt aria-hidden="true" />Mark {t.id} as sent</Sb>
        </>
      ) : undefined}>
      {head}
      <StockerSection id="parts" title="Pick these" help="Take these from the shelf." n={t.lines.length}>{lines}</StockerSection>
      {note}
      {s.canSend(t) ? null : (
        <StockerMsg ask><p><b>{s.Mgr} sends this one.</b></p><Help className="mt-0">Someone asked for it, so your manager approves it first. You can pick the parts now so they are ready.</Help></StockerMsg>
      )}
      {short.length ? (
        <StockerMsg ask><p><b>{short[0].product.name}: only {short[0].product.onHand} on hand.</b></p><Help className="mt-0">The shelf may have more. Tell {s.mgr} the count is different.</Help></StockerMsg>
      ) : null}
    </StockerPageFrame>
  );
}

/** outPage (stocker.js 316-420). */
function OutForm({ s }: { s: Stocker }) {
  const { isA, mgr, Mgr } = s;
  const REASONS: Opt[] = [
    { k: 'sold', label: 'Sold', help: isA ? 'Sold over the counter, without a job order.' : 'Sold over the counter or at the bar.' },
    { k: 'used', label: isA ? 'Used on a job' : 'Used in the kitchen', help: isA ? 'Taken out for a repair job. You add the job order number.' : 'Taken out for the kitchen or the bar.' },
    { k: 'send', label: 'Distributed', help: `Sent to another ${isA ? 'branch' : 'place'}. This makes a transfer document.` },
    { k: 'damaged', label: 'Damaged or lost', help: `${Mgr} writes this off. You tell ${mgr}.` },
  ];
  const STEP = [null, 'Choose the product', 'Why is it going out?', 'Say how many'];
  const [pid, setPid] = useState<string | null>(s.params.p && s.prod(s.params.p) ? s.params.p : null);
  const [reason, setReason] = useState<string | null>(null);
  const [qty, setQty] = useState<number | ''>('');
  const [job, setJob] = useState('');
  const [to, setTo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const p = pid ? s.prod(pid) ?? null : null;
  const r = REASONS.find((x) => x.k === reason);
  const n = qty === '' ? null : Math.round(+qty);
  const places = s.d.places.filter((x) => x.id !== s.HERE);
  const jobs = p ? s.d.jobs.filter((j) => j.needs.some((x) => x.p === p.id)).slice(0, 4) : [];
  const stepNow = !p ? 1 : !reason ? 2 : 3;
  const barcodes = s.d.products.map((x) => asBarcode(s, x));

  type Plan = { blank?: true; need?: string; ask?: true; err?: string; over?: true; q?: number; qty?: number; after?: number; ok?: true };
  const plan = (): Plan => {
    if (!p) return { blank: true, need: 'Choose a product.' };
    if (!r) return { blank: true, need: 'Choose why it is going out.' };
    if (r.k === 'damaged') return { ask: true };
    if (n == null) return { blank: true, need: 'Type how many are going out.' };
    if (!(n >= 1)) return { err: 'Use 1 or more.' };
    const qn = clampQty(n, String(qty));
    if (qn > p.onHand) return { err: `Only ${p.onHand} on hand. Use ${p.onHand} or fewer.`, over: true };
    if (r.k === 'used' && isA && !isJO(job.trim().toUpperCase())) return { need: 'Add the job order number, for example JO-0412.', q: qn };
    if (r.k === 'send' && !to) return { need: 'Choose where it goes.', q: qn };
    return { q: qn, qty: -qn, after: p.onHand - qn, ok: true };
  };
  const pl = plan();
  const sum = (): ReactNode => {
    if (!p) return <span className="mut">Choose a product to start.</span>;
    if (pl.ask) return <span className="mut">{Mgr} writes off damaged stock.</span>;
    if (pl.err) return <span className="bad">{pl.err}{pl.over ? <> If the shelf has more, <a className="inline-flex min-h-0 items-center gap-1.5 rounded-[4px] px-1 text-[15px] font-semibold text-accent hover:text-lk-hover" href={s.href('stocker.html', { ask: 'count', p: p.id })}>tell {mgr} the count is different</a>.</> : null}</span>;
    if (pl.need) return <span className="mut">{pl.need}</span>;
    const st = pl.after === 0 ? ' It will be out of stock.' : (pl.after as number) <= p.reorder ? ' It will be low stock.' : '';
    return <>{r!.k === 'send' ? <><b>{s.qtyW(p, pl.q as number)}</b> leave for {s.place(to as string).short}. </> : null}Stock goes from <b>{p.onHand}</b> to <b>{pl.after}</b>.{st}</>;
  };
  const label = () => {
    if (!p || !r || r.k === 'damaged') return 'Take out';
    if (r.k === 'send') return pl.q && to ? `Send ${pl.q} to ${s.place(to).short}` : 'Send';
    return pl.q ? `Take out ${s.qtyW(p, pl.q)}` : 'Take out';
  };
  const showBar = !!p && p.onHand > 0 && !(r && r.k === 'damaged');
  const pick = (id: string) => { setPid(id); setReason(null); setQty(''); };
  const change = () => { setPid(null); setReason(null); setQty(''); };
  const onEnter = (e: KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' && (e.target as HTMLElement).matches('#qty,#job') && pl.ok) { e.preventDefault(); setDone(true); } };

  if (done && p && r && pl.ok) {
    const fl: StockerFlash = r.k === 'send'
      ? { title: 'Sent', text: `TR to ${s.place(to as string).name}: ${s.qtyW(p, pl.q as number)}.`, sub: `${p.sku}: ${p.onHand} → ${pl.after}. ${s.place(to as string).short} checks it in. Put the paper with the parts.`, again: { href: s.href('stocker-out.html'), label: 'Take out another' }, undoable: true }
      : { title: 'Stock out recorded', text: `${p.sku}: ${p.onHand} → ${pl.after}.`, sub: `${s.qtyW(p, pl.q as number)} ${r.k === 'sold' ? 'sold' : isA ? 'used on ' + job.trim().toUpperCase() : 'used in the kitchen'}.${pl.after === 0 ? ' It is now out of stock.' : (pl.after as number) <= p.reorder ? ' It is now low stock.' : ''}`, again: { href: s.href('stocker-out.html'), label: 'Take out another' }, undoable: true };
    return <StockerDone s={s} fl={fl} page="out" />;
  }

  const F = s.flags;
  const ts = s.toSend();
  const frameProps = { s, page: 'out' as const, title: 'What are you taking out?', steps: { n: stepNow, of: 3, label: STEP[stepNow] as string } };
  if (F.loading) return <StockerPageFrame {...frameProps} steps={{ n: p ? 2 : 1, of: 3, label: STEP[p ? 2 : 1] as string }}><StockerSkeleton n={5} /></StockerPageFrame>;
  if (F.empty || !s.d.products.length) return <StockerPageFrame {...frameProps} steps={{ n: p ? 2 : 1, of: 3, label: STEP[p ? 2 : 1] as string }}><StockerNoProducts s={s} /></StockerPageFrame>;

  const likely = p ? [] : likelyOut(s);
  return (
    <>
      <StockerPageFrame {...frameProps} bar={showBar ? <BarBody span sum={sum()} disabled={!pl.ok} onClick={() => setDone(true)} label={label()} /> : undefined}>
        <div onKeyDown={onEnter}>
          <StockerSection id="p" title="Product" className="mt-3">
            {p ? <Selected s={s} p={p} onChange={change} /> : (
              <>
                <Help>Scan the barcode on the box or the shelf label, or type it.</Help>
                <div className="mt-2.5 grid gap-2"><Sb primary onClick={() => setOpen(true)}><Barcode aria-hidden="true" />Scan or type a barcode</Sb></div>
                {likely.length ? (
                  <>
                    <Help className="mt-4">Likely today</Help>
                    <div>{likely.map((h) => <StockerRow key={h.p.id} onClick={() => pick(h.p.id)} what={h.p.name} where={<><StockerId>{h.p.sku}</StockerId> · {s.loc(h.p)}{h.why ? ` · ${h.why}` : ''}{s.stOf(h.p) ? <> · <StockerStatus state={s.stOf(h.p) === 'Out of stock' ? 'out' : 'low'} /></> : null}</>} qty={{ value: h.p.onHand, unit: s.unitOf(h.p, h.p.onHand) }} />)}</div>
                  </>
                ) : null}
              </>
            )}
          </StockerSection>
          {p && p.onHand <= 0 ? (
            <StockerMsg ask>
              <p><b>Nothing is on hand</b>, so nothing can go out. If the shelf has some, the count is wrong. Tell {mgr}.</p>
              <StockerActs inMsg><StockerButton href={s.href('stocker.html', { ask: 'count', p: p.id })}>Tell {mgr}</StockerButton></StockerActs>
            </StockerMsg>
          ) : p ? (
            <>
              <StockerSection id="r" title="Why is it going out?" help={`This tells ${mgr} where the stock went.`} className="mt-6">
                <Radios labelledBy="h-r" items={REASONS} value={reason} onValue={setReason} flush />
              </StockerSection>
              {r && r.k === 'damaged' ? (
                <StockerMsg ask>
                  <p><b>{Mgr} writes off damaged or lost stock.</b></p>
                  <Help className="mt-1">Put it aside, away from good stock, then tell {mgr}. The count does not change until they do it.</Help>
                  <StockerActs inMsg><StockerButton primary href={s.href('stocker.html', { ask: 'damaged', p: p.id })}><ChatCircleText aria-hidden="true" />Tell {mgr}</StockerButton></StockerActs>
                </StockerMsg>
              ) : r ? (
                <>
                  <StockerSection id="n" title="How many?" help={`How many leave the shelf now. ${p.onHand} ${s.unitOf(p, p.onHand)} on hand.`} className="mt-6">
                    <StpW><Stepper id="qty" value={qty} label="How many are going out" onValue={setQty} /><Unit id="un">{s.unitOf(p, n || 2)}</Unit></StpW>
                  </StockerSection>
                  {r.k === 'used' && isA ? (
                    <>
                      <Lbl htmlFor="job">Job order</Lbl>
                      <input id="job" type="text" maxLength={12} value={job} onChange={(e) => setJob(e.target.value)} placeholder="JO-0412" autoComplete="off" autoCapitalize="characters" className={cn(tin, 'max-w-[220px] font-mono')} />
                      {jobs.length ? (
                        <>
                          <div role="group" aria-label="Jobs today that need this" className="mt-2 flex flex-wrap gap-2">
                            {jobs.map((j) => <Chip key={j.jo} pressed={job.trim().toUpperCase() === j.jo} onClick={() => setJob(j.jo)}>{j.jo}</Chip>)}
                          </div>
                          <Help>Jobs today that need this. Tap one.</Help>
                        </>
                      ) : null}
                    </>
                  ) : null}
                  {r.k === 'send' ? (
                    <>
                      <h2 id="h-to" className="mt-5 block text-[15px] font-semibold">Where does it go?</h2>
                      <Radios labelledBy="h-to" items={places.map((x) => ({ k: x.id, label: x.name, help: x.addr }))} value={to} onValue={setTo} />
                      <Help>{s.place(s.HERE).short} sends it; the other place checks it in on its own transfer document.</Help>
                    </>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </div>
        {!p && ts.length ? (
          <div className="pb-7">
            <StockerSection id="trs" title="Transfers to send" help="A transfer document someone already made. Pick the parts, then mark it sent." n={ts.length}>{ts.map((t) => trSendRow(s, t))}</StockerSection>
          </div>
        ) : null}
      </StockerPageFrame>
      <BarcodeSheet open={open} onOpenChange={setOpen} ctx="out" products={barcodes} samples={barcodes.slice(0, 3)} manager={s.mgr}
        onFound={(b) => { pick(b.id); setOpen(false); }} unknown={(code) => ({ label: `Tell ${s.mgr} about it`, href: s.href('stocker.html', { np: code, from: 'out' }) })} />
    </>
  );
}

/** Stocker Stock out: the page for stocker-out.html and its ?p, ?tr and ?done params. */
export function StockerOutPage(params: StockerParams) {
  const s = stockerData(params);
  if (params.done) {
    const p = s.d.products.find((x) => x.onHand > 0) as SProduct;
    return <StockerDone s={s} page="out" fl={{ title: 'Stock out recorded', text: `${p.sku}: ${p.onHand} → ${p.onHand - 1}.`, sub: `${s.qtyW(p, 1)} sold.`, again: { href: s.href('stocker-out.html'), label: 'Take out another' }, undoable: true }} />;
  }
  if (params.tr) return <SendView s={s} id={params.tr} />;
  return <OutForm s={s} />;
}
