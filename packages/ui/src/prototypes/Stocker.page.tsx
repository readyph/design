import { StockerRow } from '../components/StockerRow';
import { StockerEmpty, StockerError, StockerNoProducts, StockerPageFrame, StockerSection, StockerSkeleton } from './Stocker.frame';
import { stockerData, type StockerParams } from './Stocker.data';

/* RDY-429. The frame page: the Stocker frame with the states loading, error, empty, quiet. Body = the "To receive" section of stocker.js 203-208 only;
   Home (RDY-430) replaces it with the whole home view. */
export function StockerFramePage(params: StockerParams) {
  const s = stockerData(params);
  const F = s.flags;
  const dl = s.deliveries(), ts = s.toSend(), tc = s.toCheck();
  const parts = [[dl.length, 'to receive'], [ts.length, 'to send'], [tc.length, 'to check in']].filter(([n]) => n) as [number, string][];
  const lead = F.loading ? '' : parts.length ? <>{parts.map(([n, w], i) => <span key={w}>{i ? ', ' : ''}<b>{n}</b> {w}</span>)}.</> : 'Nothing to receive or send right now.';
  return (
    <StockerPageFrame s={s} page="home" title="What do you want to do?" lead={lead}>
      {F.loading ? <StockerSkeleton n={6} /> : F.empty ? <StockerNoProducts s={s} long /> : (
        <StockerSection id="rcv" title="To receive" help="Orders on their way. Tap one when it arrives." n={F.error ? null : dl.length}>
          {F.error ? <StockerError s={s} /> : dl.length ? dl.map((po) => (
            <StockerRow key={po.no} href={s.href('stocker-in.html', { po: po.no })} what={po.supplierName} where={<><span className="font-mono text-[12px]">{po.no}</span> · {s.when(po)}</>} qty={{ value: s.nLines(po), unit: s.nLines(po) === 1 ? 'product' : 'products' }} go="Receive" />
          )) : <StockerEmpty>No order is on its way.</StockerEmpty>}
        </StockerSection>
      )}
    </StockerPageFrame>
  );
}
