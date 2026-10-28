import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CameraSlash, MagnifyingGlass, PaperPlaneTilt, X } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

/*
 * RDY-390 I16. Transcribed from inventory-home FINAL/barcode.css (all) and FINAL/barcode.js (BARCODE.open, lookup, digitsOf, isCode).
 * Bottom sheet below 700px, centred dialog from 700px. Flat and ruled; 44px targets (--bt), main action 52px (--bb).
 */
export interface BarcodeProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  unit: string;
  onHand: number;
  /** Location name shown under the product in a name search result. */
  location?: string;
}

export type BarcodeCtx = 'find' | 'out' | 'in' | 'ask' | 'np' | 'search';
export type BarcodeUnknown = { label: string; href: string };

/** digitsOf (barcode.js 21): strips spaces and hyphens. */
export const digitsOf = (t: unknown): string => String(t || '').replace(/[\s-]/g, '');
/** isCode (barcode.js 22): 8 to 14 digits. */
export const isCode = (t: unknown): boolean => /^\d{8,14}$/.test(digitsOf(t));

const mkEan = (pre: string, n: number) => {
  const d = pre + String(n).padStart(12 - pre.length, '0');
  const s = [...d].reduce((a, c, i) => a + +c * (i % 2 ? 3 : 1), 0);
  return d + ((10 - (s % 10)) % 10);
};
/** A sample barcode no product has (barcode.js 24-25). */
export const UNKNOWN_BARCODE = mkEan('480555', 31415);

const canScan = () => typeof window !== 'undefined' && 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
const unitOf = (p: BarcodeProduct, n: number) => (p.unit === 'pc' ? 'pc' : n === 1 ? p.unit : p.unit + 's');

export interface BarcodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Default "Scan or type the barcode". */
  title?: string;
  /** Decides the words of the unknown-barcode state. */
  ctx?: BarcodeCtx;
  /** product (default): a known or picked product goes to onFound; an unknown barcode shows the unknown state. capture: any code goes to onCode. */
  mode?: 'product' | 'capture';
  products: BarcodeProduct[];
  /** The three products listed under "Pretend you scanned one"; the unknown sample is always added. */
  samples: BarcodeProduct[];
  onFound?: (product: BarcodeProduct, code: string) => void;
  onCode?: (code: string, product: BarcodeProduct | null) => void;
  /** The one action offered when the barcode is unknown. */
  unknown?: BarcodeUnknown | ((code: string) => BarcodeUnknown | null) | null;
  /** Field also finds by name or code. Default true in product mode, false in capture mode. */
  names?: boolean;
  /** The word used in the unknown-barcode state. Default "your manager". */
  manager?: string;
  /** Capture mode: a known code shows "This barcode is already a product." instead of finishing. */
  warnKnown?: boolean;
  /** True when this code was already reported (replaces the prototype's RCV.np lookup). */
  alreadyRequested?: (code: string) => boolean;
  /** Initial text of the field. */
  value?: string;
}

const ring =
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent forced-colors:focus-visible:outline-[Highlight]';
const btn =
  'inline-flex items-center justify-center gap-2 min-h-[var(--bb)] px-[18px] rounded-[8px] text-[16px] font-semibold whitespace-nowrap no-underline cursor-pointer ';
const btnMain = btn + 'bg-accent text-accent-ink hover:bg-accent-hover';
const btnSec = btn + 'bg-surface text-text border-[1.5px] border-control hover:border-muted hover:bg-surface';
const id = 'font-mono text-[13px]';
const help = 'mt-1 text-[13px] leading-[19px] text-muted';
const sec = 'mt-[18px]';
const h3 = 'text-[15px] leading-[22px] font-semibold';

/**
 * Barcode sheet (I16): one modal for every place a barcode is scanned or typed. Native `dialog`, `aria-labelledby`, the h2 takes focus,
 * results are `aria-live="polite"`, closing stops the camera tracks and returns focus, a backdrop click closes.
 */
export function BarcodeSheet(props: BarcodeSheetProps) {
  const { open, onOpenChange, title, ctx = 'find', mode = 'product', products, samples, unknown = null, manager, warnKnown, alreadyRequested, value } = props;
  const cap = mode === 'capture';
  const names = props.names != null ? props.names : !cap;
  const uid = useId();
  const tId = `${uid}-t`, hsId = `${uid}-hs`, htId = `${uid}-ht`, hpId = `${uid}-hp`, qhId = `${uid}-qh`, cmId = `${uid}-cm`;

  const dlg = useRef<HTMLDialogElement>(null);
  const h2 = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const from = useRef<HTMLElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const latest = useRef<(raw: string) => void>(() => {});

  const [q, setQ] = useState(value || '');
  const [unk, setUnk] = useState<string | null>(null);
  const [known, setKnown] = useState<BarcodeProduct | null>(null);
  const [cam, setCam] = useState<string>(() => 'Opening the camera…');
  const scan = canScan();

  const byCode = (c: string) => products.find((p) => p.barcode && p.barcode === digitsOf(c)) || null;
  const search = (t: string, n = 6) => {
    const w = t.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return w.length ? products.filter((x) => w.every((k) => `${x.name} ${x.sku}`.toLowerCase().includes(k))).slice(0, n) : [];
  };

  const stopCam = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (stream.current) {
      stream.current.getTracks().forEach((t) => t.stop());
      stream.current = null;
    }
  }, []);

  const finish = (p: BarcodeProduct | null, code: string) => {
    dlg.current?.close();
    if (cap) props.onCode?.(code, p || null);
    else if (props.onFound && p) props.onFound(p, code);
  };

  const resolve = (raw: string) => {
    const code = digitsOf(raw);
    const p = byCode(code);
    stopCam();
    setQ(code);
    setUnk(null);
    setKnown(null);
    if (cap) {
      if (p && warnKnown) {
        setKnown(p);
        return;
      }
      finish(p, code);
      return;
    }
    if (p) {
      finish(p, code);
      return;
    }
    setUnk(code);
  };
  latest.current = resolve;

  // Open / close the native dialog; reset state, focus the h2, start the camera.
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      from.current = document.activeElement as HTMLElement | null;
      setQ(value || '');
      setUnk(null);
      setKnown(null);
      setCam(canScan() ? 'Opening the camera…' : 'Type the barcode below instead.');
      d.showModal();
      h2.current?.focus({ preventScroll: true });
      void startCam();
    } else if (!open && d.open) {
      d.close();
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => stopCam(), [stopCam]);

  async function startCam() {
    const v = video.current;
    if (!v || !canScan()) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.current = s;
      v.srcObject = s;
      await v.play();
      const Det = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      const det = new Det({ formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'] });
      setCam('Point the camera at the bars. Hold still.');
      timer.current = setInterval(async () => {
        try {
          const r = await det.detect(v);
          if (r.length) {
            stopCam();
            latest.current(r[0].rawValue);
          }
        } catch {
          /* keep scanning */
        }
      }, 350);
    } catch {
      setCam('The camera did not open. Type the barcode instead.');
    }
  }

  const onClose = () => {
    stopCam();
    const f = from.current;
    from.current = null;
    if (f && f.isConnected && f.focus) f.focus({ preventScroll: true });
    onOpenChange(false);
  };

  const pick = (p: BarcodeProduct) => {
    stopCam();
    finish(p, p.barcode || '');
  };

  const again = () => {
    setQ('');
    setUnk(null);
    setKnown(null);
    input.current?.focus();
  };

  const findNow = () => {
    const t = q.trim();
    if (!t) {
      input.current?.focus();
      return;
    }
    if (/^[\d\s-]+$/.test(t)) {
      if (isCode(t)) resolve(t);
      return;
    }
    const first = search(t)[0];
    if (first) pick(first);
  };

  const onInput = (v: string) => {
    setQ(v);
    setUnk(null);
    setKnown(null);
    const c = digitsOf(v);
    if (/^\d+$/.test(c) && c.length >= 13) resolve(c);
  };

  const unknownOf = (code: string): BarcodeUnknown | null => {
    const u = typeof unknown === 'function' ? unknown(code) : unknown;
    return u || null;
  };

  function results(): ReactNode {
    if (unk) {
      const code = unk;
      const mg = manager || 'your manager';
      const dup = !!alreadyRequested && alreadyRequested(code);
      const u = unknownOf(code);
      const why =
        ({
          find: 'You can only look up products that are set up.',
          out: 'Only products that are set up can go out.',
          in: 'Stock can only go into products that are set up.',
          ask: 'This barcode is not on any product yet.',
          np: 'This barcode is not on any product yet.',
        } as Record<string, string>)[ctx] || 'This barcode is not on any product yet.';
      return (
        <div className={msg} role="alert">
          <p>
            <b>We don't have this product yet.</b>
          </p>
          <p className="text-[14px]">
            Barcode <span className={id}>{code}</span>
          </p>
          <p className={help}>
            {why}{' '}
            {dup ? `You already told ${mg} about this one. They have not set it up yet.` : `Tell ${mg}. They set it up, and then your count goes into stock.`}
          </p>
          <div className="mt-[10px] grid gap-2">
            {u && !dup ? (
              <a className={cn(btnMain, ring)} href={u.href}>
                <PaperPlaneTilt size={20} aria-hidden="true" />
                {u.label}
              </a>
            ) : null}
            <button type="button" className={cn(btnSec, ring)} onClick={again}>
              Try another barcode
            </button>
          </div>
        </div>
      );
    }
    if (known) {
      return (
        <div className={msg} role="status">
          <p>
            <b>This barcode is already a product.</b>
          </p>
          <p>
            {known.name} · <span className={id}>{known.barcode}</span>
          </p>
          <div className="mt-[10px] grid gap-2">
            <button type="button" className={cn(btnMain, ring)} onClick={() => pick(known)}>
              Use this product
            </button>
            <button type="button" className={cn(btnSec, ring)} onClick={again}>
              Try another barcode
            </button>
          </div>
        </div>
      );
    }
    const t = q.trim();
    if (!t) return null;
    if (/^[\d\s-]+$/.test(t)) {
      const c = digitsOf(t);
      return isCode(c) ? null : <p className={empty}>{c.length} {c.length === 1 ? 'digit' : 'digits'} so far. A barcode has 13. Keep typing.</p>;
    }
    if (props.names === false || (props.names == null && cap)) return <p className={empty}>Type digits only. A barcode is a number.</p>;
    const hits = search(t);
    return hits.length ? (
      hits.map((p) => (
        <button key={p.id} type="button" className={cn('group/hit grid w-full min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-t border-rule py-2 text-left', ring)} onClick={() => pick(p)}>
          <span>
            <span className="block text-[15px] leading-[21px] font-semibold group-hover/hit:text-lk-hover">{p.name}</span>
            <span className="block text-[13px] leading-[19px] text-muted">
              <span className={id}>{p.sku}</span> · {p.location || ''}
            </span>
          </span>
          <span className="text-[15px] font-semibold whitespace-nowrap tabular-nums">
            {p.onHand} <small className="text-[13px] font-normal text-muted">{unitOf(p, p.onHand)}</small>
          </span>
        </button>
      ))
    ) : (
      <p className={empty}>No product matches “{t}”. Check the spelling, or type the barcode.</p>
    );
  }

  const sample = 'grid w-full min-h-[var(--bt)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[10px] border-t border-rule py-[6px] text-left text-[15px] font-medium hover:text-lk-hover ';

  return (
    <dialog
      ref={dlg}
      aria-labelledby={tId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dlg.current) dlg.current?.close();
      }}
      className="m-auto mb-0 w-full max-w-[520px] max-h-[min(92svh,780px)] overflow-hidden rounded-t-[16px] border-0 bg-surface p-0 font-sans text-[15px] leading-[22px] font-normal text-text shadow-float backdrop:bg-scrim open:flex open:animate-bc-up open:flex-col motion-reduce:open:animate-none min-[700px]:m-auto min-[700px]:rounded-[12px]"
    >
      <div className="mx-auto mt-2 h-1 w-9 flex-none rounded-[2px] bg-control min-[700px]:hidden" aria-hidden="true" />
      <div className="flex flex-none items-center gap-3 border-b border-border px-5 pb-[10px] pt-[6px]">
        <h2 ref={h2} id={tId} tabIndex={-1} className="flex-1 text-[17px] leading-6 font-semibold focus:outline-none">
          {title || 'Scan or type the barcode'}
        </h2>
        <button type="button" aria-label="Close" onClick={() => dlg.current?.close()} className={cn('-mr-[10px] grid h-[var(--bt)] w-[var(--bt)] place-items-center rounded-full text-[20px] text-text hover:bg-raised', ring)}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-1">
        <section className="mt-3" aria-labelledby={hsId}>
          <h3 id={hsId} className={h3}>Scan barcode</h3>
          <div className="mt-2 grid aspect-video max-h-[200px] place-items-center overflow-hidden rounded-[8px] bg-raised-2 text-center text-muted">
            {scan ? (
              <video ref={video} playsInline muted className="block h-full w-full object-cover" />
            ) : (
              <p className="px-5 py-3 text-[13px] leading-[19px]">
                <CameraSlash size={28} className="mx-auto mb-[6px] block" aria-hidden="true" />
                This phone or browser cannot scan here.
              </p>
            )}
          </div>
          <p className={help} id={cmId}>{cam}</p>
        </section>
        <section className={sec} aria-labelledby={htId}>
          <h3 id={htId} className={h3}>Type the barcode</h3>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-[10px]">
            <input
              ref={input}
              className="min-h-[var(--bb)] w-full rounded-[8px] border-[1.5px] border-control bg-surface px-[14px] font-sans text-[16px] text-text placeholder:text-faint focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[1px] focus-visible:outline-accent"
              type="search"
              inputMode="search"
              autoComplete="off"
              enterKeyHint="go"
              aria-labelledby={htId}
              aria-describedby={qhId}
              placeholder={names ? 'Barcode, name or code' : 'The 13 digits'}
              value={q}
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  findNow();
                }
              }}
            />
            <button type="button" className={cn(btnMain, ring)} onClick={findNow}>
              <MagnifyingGlass size={20} aria-hidden="true" />
              Find
            </button>
          </div>
          <p className={help} id={qhId}>
            The number under the bars has 13 digits.{names ? ' You can also type a name or a code, for example “oil filter”.' : ''}
          </p>
        </section>
        <div className="mt-[14px]" aria-live="polite">{results()}</div>
        <section className={sec} aria-labelledby={hpId}>
          <h3 id={hpId} className={h3}>Pretend you scanned one</h3>
          <p className={help}>
            <b className="font-semibold text-text">Prototype only.</b> No camera is needed here. Tap one.
          </p>
          <div className="mt-1">
            {samples.map((p) => (
              <button key={p.id} type="button" className={cn(sample, ring)} onClick={() => resolve(p.barcode || '')}>
                <span>{p.name}</span>
                <span className="font-mono text-[12px] text-muted">{p.barcode}</span>
              </button>
            ))}
            <button type="button" className={cn(sample, ring)} onClick={() => resolve(UNKNOWN_BARCODE)}>
              <span>A product we do not have</span>
              <span className="font-mono text-[12px] text-muted">{UNKNOWN_BARCODE}</span>
            </button>
          </div>
        </section>
      </div>
    </dialog>
  );
}

const msg = 'border-l-[3px] border-accent py-[10px] pl-3 pr-0 text-[15px] leading-[22px] [&>p+p]:mt-1';
const empty = 'py-[6px] text-[14px] leading-[21px] text-muted';
