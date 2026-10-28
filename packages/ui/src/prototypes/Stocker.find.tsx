import { useState } from 'react';
import { ArrowLineUp, Barcode, Camera, PaperPlaneTilt } from '@phosphor-icons/react';
import { StockerFacts, StockerRow, StockerStatus } from '../components/StockerRow';
import { StockLevelBar } from '../components/StockLevelBar';
import { BarcodeSheet, digitsOf, isCode } from '../components/BarcodeSheet';
import { cn } from '../utils/cn';
import { StockerActs, StockerButton, StockerEmpty, StockerNoProducts, StockerPageFrame, StockerSection, StockerSkeleton } from './Stocker.frame';
import { stockerData, TOPICS, type Stocker, type StockerParams, type SProduct } from './Stocker.data';
import { BarBody, LeadId, Lbl, Sb, Selected, StockerDone, StpW, Stepper, asBarcode, ring, sbBase, tin, type StockerFlash } from './Stocker.in';
import { Chip, Help, Radios } from './Stocker.out';

/*
 * RDY-433. Stocker Find (5/6 e). Transcribed from inventory-home round-1/final stocker.js 218-314 (findPage 219, productView 229, npView 243, askView 283), 50-51 (stHTML, bar2),
 * 99-101 (row, qtyHTML, section), 159-171 (scanBtn, selected), 172-178 (radioKeys), 179 (stepper), 182-196 (doneView), 64-70 (TOPICS), 198-199 (home() hands ?np and ?ask to npView / askView);
 * stocker-find.html; stocker.css 47-53, 93-95 (.va), 105-111 (.tin .lbl), 126-133 + 224 (.sdl), 136-143 (.rs .r), 152-157 (.stp-w .chips .chip), 158-162 (.photo), 180-183 (.bar .sum), 221-223 (.bcf).
 * The workshop's inline styles (stocker.js 229-241: .acts margin-top 24px, .help margin 0; 252-254: .help margin-top 12px; 256, 296-300: .lbl margin-top 16, .acts margin-top 8) are classes here.
 * ?np and ?ask live on stocker.html in the workshop, so StockerHomePage hands them to StockerNpAskPage.
 * GAP: the workshop keeps the told-your-manager records (R.npAdd, saveAsks, flash) and the Undo snapshot in browser state; the stories keep the form live, the send button shows the
 *      done screen with the workshop's wording, Undo does nothing.
 * GAP: need() also blocks a barcode already sent and still open (R.np()); the sample has none, so only the 8-digit rule applies.
 * GAP: the workshop stepper (.stp, min 0) differs from I9 QuantityStepper (min 1); the local Stepper from Stocker.in.tsx is reused.
 * GAP: a product found by the scan sheet opens its product view in place (the workshop navigates to stocker-find.html?p=).
 */

/** a.va (stocker.css 93-94), as a link. */
const vaLink = cn('inline-flex min-h-[var(--tap)] items-center gap-1.5 rounded-[4px] px-1 text-[15px] font-semibold text-accent hover:text-lk-hover', ring);

const FILES = { find: 'stocker-find.html', out: 'stocker-out.html', in: 'stocker-in.html', home: 'stocker.html' };

function Status({ s, p }: { s: Stocker; p: SProduct }) {
  const st = s.stOf(p);
  return st ? <StockerStatus state={st === 'Out of stock' ? 'out' : 'low'} /> : null;
}

/** productView (stocker.js 229-241). */
function ProductView({ s, id }: { s: Stocker; id: string }) {
  const p = s.prod(id);
  const back = { href: s.href(FILES.find), label: 'Find a product' };
  if (!p) {
    return (
      <StockerPageFrame s={s} page="find" title="Not found" back={back}>
        <StockerEmpty>That product is not here. Go back and search again.</StockerEmpty>
      </StockerPageFrame>
    );
  }
  const coming = s.deliveries().map((po) => ({ po, l: (po.lines as { p: string; out: number }[]).find((l) => l.p === p.id && l.out > 0) })).filter((x) => x.l);
  const exp = p.expires ? `${p.expires.qty} expire ${p.expires.on}` : '';
  const facts = [
    { label: 'On hand', value: <><b>{p.onHand}</b> {s.unitOf(p, p.onHand)} <StockLevelBar variant="stocker" onHand={p.onHand} reorder={p.reorder} /> <Status s={s} p={p} /></> },
    { label: 'Where', value: s.loc(p) },
    ...(p.barcode ? [{ label: 'Barcode', value: <LeadId>{p.barcode}</LeadId> }] : []),
    ...(exp ? [{ label: 'Expires', value: exp }] : []),
  ];
  return (
    <StockerPageFrame s={s} page="find" title={p.name} back={back} lead={<LeadId>{p.sku}</LeadId>}>
      <StockerSection id="shelf" title="On the shelf" help="What the system says is here now.">
        <StockerFacts items={facts} />
      </StockerSection>
      <StockerSection id="coming" title="Coming" help="Orders on their way that include this product.">
        {coming.length ? coming.map((c) => (
          <StockerRow key={c.po.no} href={s.href(FILES.in, { po: c.po.no })} what={<><LeadId>{c.po.no}</LeadId> · {c.po.supplierName}</>} where={s.when(c.po)} qty={{ value: c.l!.out, unit: s.unitOf(p, c.l!.out) }} go="Receive" />
        )) : <StockerEmpty>Nothing on order.</StockerEmpty>}
      </StockerSection>
      <div className="mt-6 grid gap-2">
        {p.onHand > 0 ? <StockerButton primary href={s.href(FILES.out, { p: p.id })}><ArrowLineUp aria-hidden="true" />Take some out</StockerButton> : <Help className="m-0">Nothing on hand, so nothing can be taken out.</Help>}
        <a className={vaLink} href={s.href(FILES.home, { ask: 'count', p: p.id })}>The shelf has a different number? Tell {s.mgr}</a>
      </div>
    </StockerPageFrame>
  );
}

/** findPage (stocker.js 219-228). */
function FindList({ s, onPick }: { s: Stocker; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const F = s.flags;
  const frame = { s, page: 'find' as const, title: 'Find a product', lead: 'See how many are on the shelf and where.' };
  if (F.loading) return <StockerPageFrame {...frame}><StockerSkeleton n={5} /></StockerPageFrame>;
  if (F.empty || !s.d.products.length) return <StockerPageFrame {...frame}><StockerNoProducts s={s} /></StockerPageFrame>;
  const need = s.d.products.filter((p) => p.onHand <= 0).concat(s.d.products.filter((p) => p.onHand > 0 && p.onHand <= p.reorder).sort((a, b) => a.onHand / a.reorder - b.onHand / b.reorder));
  const barcodes = s.d.products.map((x) => asBarcode(s, x));
  return (
    <>
      <StockerPageFrame {...frame}>
        <StockerSection id="look" title="Look up a product" help="Scan the barcode on the box or the shelf label. Or type the barcode, or a name.">
          <StockerActs><Sb primary onClick={() => setOpen(true)}><Barcode aria-hidden="true" />Scan or type a barcode</Sb></StockerActs>
        </StockerSection>
        <StockerSection id="need" title="Needs stock" help="Out of stock and low stock. Tap one to see where it is." n={need.length}>
          {need.length ? need.map((p) => (
            <StockerRow key={p.id} href={s.href(FILES.find, { p: p.id })} what={p.name} where={<>{s.loc(p)} · <Status s={s} p={p} /></>} qty={{ value: p.onHand, unit: s.unitOf(p, p.onHand) }} go />
          )) : <StockerEmpty>Everything is above its reorder level.</StockerEmpty>}
        </StockerSection>
      </StockerPageFrame>
      <BarcodeSheet open={open} onOpenChange={setOpen} ctx="find" products={barcodes} samples={barcodes.slice(0, 3)} manager={s.mgr}
        onFound={(b) => { onPick(b.id); setOpen(false); }} unknown={(code) => ({ label: `Not found: tell ${s.mgr}`, href: s.href(FILES.home, { np: code, from: 'find' }) })} />
    </>
  );
}

/** npView (stocker.js 243-281): a new product to set up. */
function NewProductView({ s, code0, from, page, onPick }: { s: Stocker; code0: string; from: NonNullable<StockerParams['from']>; page: 'home' | 'find'; onPick: (id: string) => void }) {
  const { mgr, Mgr } = s;
  const back = {
    find: { href: s.href(FILES.find), label: 'Find a product' },
    out: { href: s.href(FILES.out), label: 'Stock out' },
    in: { href: s.href(FILES.in, { via: 'other' }), label: 'Stock in' },
    ask: { href: s.href(FILES.home, { ask: 'new' }), label: `Tell ${mgr}` },
  }[from];
  const again = {
    find: { href: s.href(FILES.find), label: 'Find another product' },
    out: { href: s.href(FILES.out), label: 'Take out something else' },
    in: { href: s.href(FILES.in), label: 'Stock in something else' },
    ask: { href: s.href(FILES.home), label: 'Back to Home' },
  }[from];
  const [code, setCode] = useState(digitsOf(code0));
  const [name, setName] = useState('');
  const [qty, setQty] = useState<number | ''>('');
  const [loc, setLoc] = useState('');
  const [photo, setPhoto] = useState('');
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const num = qty === '' ? 0 : Math.max(0, Math.round(+qty) || 0);
  const need = !isCode(code) ? 'Type or scan the barcode, at least 8 digits.' : '';
  const barcodes = s.d.products.map((x) => asBarcode(s, x));
  const frameProps = { s, page, title: 'What is this product?', back, steps: from === 'in' ? { n: 3, of: 3, label: `Tell ${mgr} about it` } : undefined, lead: `We don't have it yet. Tell ${mgr} what you can. They set it up.` };
  if (done) {
    const fl: StockerFlash = { title: `Sent to ${mgr}`, text: `${code} is waiting to be set up.`, sub: `Nothing went into stock. When your manager has set the product up, ${num ? `your count of ${num} goes in` : 'it is ready to use'}.`, again, undoable: true };
    return <StockerDone s={s} fl={fl} page="home" />;
  }
  const sum = need ? <span className="mut">{need}</span> : <><b>Nothing goes into stock yet.</b> {Mgr} sets the product up first{num ? <>, then your count of <b>{num}</b> goes in</> : ''}.</>;
  return (
    <>
      <StockerPageFrame {...frameProps} bar={<BarBody icon={<PaperPlaneTilt aria-hidden="true" />} sum={sum} disabled={!!need} onClick={() => setDone(true)} label={`Send to ${mgr}`} />}>
        <Help className="mt-3">You are not adding stock. A stocker cannot create a product or add stock to one that is not set up.</Help>
        <Lbl htmlFor="np-code">Barcode</Lbl>
        <div className="mt-2 flex items-stretch gap-2">
          <input id="np-code" inputMode="numeric" autoComplete="off" value={code} onChange={(e) => setCode(digitsOf(e.target.value))} placeholder="The 13 digits under the bars" className={cn(tin, 'min-w-0 flex-1 font-mono tracking-[0]')} />
          <Sb className="w-auto flex-none" onClick={() => setOpen(true)}><Barcode aria-hidden="true" />Scan</Sb>
        </div>
        <Lbl htmlFor="np-name">Name <small>(optional)</small></Lbl>
        <input id="np-name" type="text" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="What does the box say?" autoComplete="off" className={cn(tin, 'mt-2')} />
        <h2 className="mt-5 block text-[15px] font-semibold">Photo <small className="text-[13px] font-normal text-muted">(optional)</small></h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input type="file" id="np-photo" accept="image/*" capture="environment" className="peer absolute h-px w-px opacity-0" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(f.name); }} />
          <label htmlFor="np-photo" className={cn(sbBase, 'w-auto cursor-pointer border-[1.5px] border-control bg-surface text-text hover:border-muted peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent')}><Camera aria-hidden="true" />{photo ? 'Take another photo' : 'Take a photo'}</label>
          <span id="np-pn" className="text-[13px] text-muted">{photo ? `${photo} added` : `Helps ${mgr} find the right product.`}</span>
        </div>
        <h2 id="l-q" className="mt-5 block text-[15px] font-semibold">How many did you count? <small className="text-[13px] font-normal text-muted">(optional)</small></h2>
        <StpW><Stepper id="np-qty" value={qty} label="How many you counted" onValue={setQty} /></StpW>
        <h2 id="l-l" className="mt-5 block text-[15px] font-semibold">Which place is it in?</h2>
        <div role="group" aria-labelledby="l-l" className="mt-2 flex flex-wrap gap-2">
          {s.d.locations.map((l) => <Chip key={l.id} pressed={loc === l.name} onClick={() => setLoc(loc === l.name ? '' : l.name)}>{l.name}</Chip>)}
          <Chip pressed={loc === 'Not sure'} onClick={() => setLoc(loc === 'Not sure' ? '' : 'Not sure')}>Not sure</Chip>
        </div>
      </StockerPageFrame>
      <BarcodeSheet open={open} onOpenChange={setOpen} ctx="np" mode="capture" title="Scan or type the barcode" warnKnown names={false} products={barcodes} samples={barcodes.slice(0, 3)} manager={mgr}
        onCode={(c, p) => { setCode(c); setOpen(false); if (p) onPick(p.id); }} />
    </>
  );
}

/** askView (stocker.js 283-314): tell your manager. */
function AskView({ s, page }: { s: Stocker; page: 'home' | 'find' }) {
  const { mgr, Mgr } = s;
  const topics = TOPICS(Mgr);
  const topicOf = (k?: string | null) => topics.find((t) => t.k === k);
  const [pid, setPid] = useState<string | null>(s.params.p && s.prod(s.params.p) ? s.params.p : null);
  const [topic, setTopic] = useState<string | null>(topicOf(s.params.ask) ? (s.params.ask as string) : null);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const p = pid ? s.prod(pid) : undefined;
  const need = !topic ? 'Choose what it is about.' : topic === 'other' && !note.trim() ? 'Write a few words.' : '';
  const barcodes = s.d.products.map((x) => asBarcode(s, x));
  if (done) {
    const fl: StockerFlash = { title: 'Sent to your manager', text: `You told ${mgr}: ${(topicOf(topic)?.label ?? '').toLowerCase()}.`, sub: 'Stock did not change. It shows on Home until your manager has dealt with it.', undoable: true };
    return <StockerDone s={s} fl={fl} page="home" />;
  }
  return (
    <>
      <StockerPageFrame s={s} page={page} title={`What do you want to tell ${mgr}?`} back={{ href: s.href(FILES.home), label: 'Home' }} lead={`${Mgr} decides. Nothing in stock changes until they do it.`}
        bar={<BarBody icon={<PaperPlaneTilt aria-hidden="true" />} sum={<span className="mut">{need || `${Mgr} will see this.`}</span>} disabled={!!need} onClick={() => setDone(true)} label={`Tell ${mgr}`} />}>
        <h2 id="l-t" className="mt-4 block text-[15px] font-semibold">What is it about?</h2>
        <Radios labelledBy="l-t" items={topics} value={topic} onValue={setTopic} />
        <h2 className="mt-5 block text-[15px] font-semibold">Which product? <small className="text-[13px] font-normal text-muted">(if it is about one)</small></h2>
        {p ? <Selected s={s} p={p} onChange={() => setPid(null)} /> : <div className="mt-2 grid gap-2"><Sb onClick={() => setOpen(true)}><Barcode aria-hidden="true" />Scan or type a barcode</Sb></div>}
        <Lbl htmlFor="note">Note <small>{topic === 'other' ? '' : '(optional)'}</small></Lbl>
        <textarea id="note" maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} placeholder={topic === 'damaged' ? 'For example: two caps leaking.' : topic === 'count' ? 'For example: shelf has 6, app says 4.' : 'Anything that helps.'} className={cn(tin, 'mt-2 min-h-[88px] resize-y py-[10px] font-[inherit] leading-[22px]')} />
      </StockerPageFrame>
      <BarcodeSheet open={open} onOpenChange={setOpen} ctx="ask" products={barcodes} samples={barcodes.slice(0, 3)} manager={mgr}
        onFound={(b) => { setPid(b.id); setOpen(false); }} unknown={(code) => ({ label: `Tell ${mgr} about it`, href: s.href(FILES.home, { np: code, from: 'ask' }) })} />
    </>
  );
}

/** stocker.html ?np and ?ask (stocker.js 198-199): the views Home hands over. */
export function StockerNpAskPage(params: StockerParams) {
  const s = stockerData(params);
  const [pid, setPid] = useState<string | null>(null);
  if (pid) return <ProductView s={s} id={pid} />;
  if (params.np != null) return <NewProductView s={s} code0={params.np} from={params.from && ['find', 'out', 'in', 'ask'].includes(params.from) ? params.from : 'find'} page="home" onPick={setPid} />;
  return <AskView s={s} page="home" />;
}

/** Stocker Find: the page for stocker-find.html and its ?p param. */
export function StockerFindPage(params: StockerParams) {
  const s = stockerData(params);
  const [pid, setPid] = useState<string | null>(params.p ?? null);
  if (pid) return <ProductView s={s} id={pid} />;
  return <FindList s={s} onPick={setPid} />;
}
