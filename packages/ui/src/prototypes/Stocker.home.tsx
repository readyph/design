import { useState } from 'react';
import { ChatCircleText } from '@phosphor-icons/react';
import { StockerRow, StockerId } from '../components/StockerRow';
import { StockerActs, StockerButton, StockerEmpty, StockerError, StockerNoProducts, StockerPageFrame, StockerSection, StockerSkeleton } from './Stocker.frame';
import { stockerData, type Stocker, type StockerParams } from './Stocker.data';

/*
 * RDY-430. Stocker Home (2/6 b). Transcribed from inventory-home round-1/final stocker.js 196-217 (home()), 99-100 (row, qtyHTML), 118-146 (poRow, trSendRow, trCheckRow, activity, told).
 * GAP: told() (notes, new products, short-delivery notes) reads browser-only state (asks, R.np, R.toldOf); the sample has none, so "Sent to your manager" never shows here.
 * GAP: the "Show N older" button (.va, stocker.css 93-94) has no I-component; built locally with the same values.
 */

const usedRef = (r?: string | null) => /^(JO-\d+|Morning bar|Kitchen prep|Kitchen use)/.test(r || '');

function activity(s: Stocker) {
  const reason = (m: Stocker['d']['movements'][number]) =>
    m.type === 'received' ? (m.ref === 'No order' ? 'Stock in, no order' : m.ref === 'New product' ? 'Stock in, new product' : 'Stock in')
      : m.type === 'transfer' ? (m.qty < 0 ? 'Sent' : 'Checked in')
        : m.type === 'damaged' ? 'Damaged'
          : m.type === 'count' ? 'Count correction'
            : usedRef(m.ref) ? (s.isA ? 'Used on a job' : 'Used in the kitchen') : 'Sold';
  return s.d.movements.filter((m) => m.by === s.d.viewer.id && s.prod(m.p)).map((m) => {
    const p = s.prod(m.p)!;
    return {
      key: m.id,
      what: p.name,
      where: `${reason(m)}${m.ref && m.ref !== 'Sold' && m.ref !== 'No order' && m.ref !== 'New product' ? ' · ' + m.ref : ''} · ${m.day === 'today' ? s.hm12(m.at) : `Yesterday, ${s.hm12(m.at)}`}`,
      qty: { value: (m.qty > 0 ? '+' : '−') + Math.abs(m.qty), unit: s.unitOf(p, Math.abs(m.qty)) },
    };
  });
}

function Activity({ s }: { s: Stocker }) {
  const [all, setAll] = useState(false);
  const act = activity(s);
  const shown = all ? act : act.slice(0, 5);
  return (
    <>
      <div id="act">{shown.map((a) => <StockerRow key={a.key} what={a.what} where={a.where} qty={a.qty} />)}</div>
      {!all && act.length > shown.length ? (
        <button type="button" aria-expanded="false" onClick={() => setAll(true)} className="inline-flex min-h-[var(--tap)] items-center gap-1.5 rounded-[4px] px-1 text-[15px] font-semibold text-accent hover:text-lk-hover">
          Show {act.length - shown.length} older
        </button>
      ) : null}
    </>
  );
}

export function StockerHomePage(params: StockerParams) {
  const s = stockerData(params);
  const F = s.flags;
  const dl = s.deliveries(), ts = s.toSend(), tc = s.toCheck();
  const parts = [[dl.length, 'to receive'], [ts.length, 'to send'], [tc.length, 'to check in']].filter(([n]) => n) as [number, string][];
  const lead = F.loading ? '' : parts.length ? <>{parts.map(([n, w], i) => <span key={w}>{i ? ', ' : ''}<b>{n}</b> {w}</span>)}.</> : 'Nothing to receive or send right now.';
  const err = F.error;
  const actN = activity(s).length;
  return (
    <StockerPageFrame s={s} page="home" title="What do you want to do?" lead={lead}>
      {F.loading ? <StockerSkeleton n={6} /> : F.empty || !s.d.products.length ? <StockerNoProducts s={s} long /> : (
        <>
          <StockerSection id="rcv" title="To receive" help="Orders on their way. Tap one when it arrives." n={err ? null : dl.length}>
            {err ? <StockerError s={s} /> : dl.length ? dl.map((po) => (
              <StockerRow key={po.no} href={s.href('stocker-in.html', { po: po.no })} what={po.supplierName} where={<><StockerId>{po.no}</StockerId> · {s.when(po)}</>} qty={{ value: s.nLines(po), unit: s.nLines(po) === 1 ? 'product' : 'products' }} go="Receive" />
            )) : <StockerEmpty>No order is on its way.</StockerEmpty>}
          </StockerSection>
          <StockerSection id="snd" title="To send" help="Transfer papers for stock leaving here. Pick the parts, then send." n={ts.length}>
            {ts.length ? ts.map((t) => (
              <StockerRow key={t.id} href={s.href('stocker-out.html', { tr: t.id })} what={`${t.id} to ${t.other.short}`} where={`${s.tWhat(t)}${s.canSend(t) ? '' : `. ${s.Mgr} approves it first.`}`} go={s.canSend(t) ? 'Send' : 'Open'} />
            )) : <StockerEmpty>Nothing to send.</StockerEmpty>}
          </StockerSection>
          <StockerSection id="chk" title="To check in" help="Stock another place sent here. Count it when it arrives." n={tc.length}>
            {tc.length ? tc.map((t) => (
              <StockerRow key={t.id} href={s.href('stocker-in.html', { tr: t.id })} what={`${t.id} from ${t.other.short}`} where={s.tWhat(t)} go="Check in" />
            )) : <StockerEmpty>Nothing to check in.</StockerEmpty>}
          </StockerSection>
          <StockerSection id="act" title="Your activity" help={`What you took in or out. ${s.Mgr} sees all of it.`} n={actN}>
            {actN ? <Activity s={s} /> : <StockerEmpty>Nothing yet.</StockerEmpty>}
          </StockerSection>
          <StockerSection id="ask" title={`Tell ${s.mgr}`} help="Damaged stock, a count that is wrong, or something we need more of? You do not fix these. Tell your manager.">
            <StockerActs>
              <StockerButton href={s.href('stocker.html', { ask: 'new' })}><ChatCircleText aria-hidden="true" />Tell {s.mgr}</StockerButton>
            </StockerActs>
          </StockerSection>
        </>
      )}
    </StockerPageFrame>
  );
}
