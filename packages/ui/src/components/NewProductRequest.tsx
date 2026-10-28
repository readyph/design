import { useId, type ChangeEvent } from 'react';
import { Barcode, Camera, Minus, PaperPlaneTilt, Plus } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { digitsOf, isCode } from './BarcodeSheet';

/*
 * RDY-391 I19. Transcribed from inventory-home round-1/final:
 *   stocker.js 242-285 (npView: need, sum, paint, send), stocker.js 179 (stepper);
 *   stocker.css 53-54 (.help), 86-92 (.sb), 105-108 (.tin), 110-111 (.lbl), 146-152 (.stp, .stp-w), 154-157 (.chips, .chip),
 *   158-162 (.photo), 180-182 (.sum), 221-223 (.bcf), 6 (--tap 44px, --tap-big 52px);
 *   stock.css 88-96 (.nsu, .nsu-l, .nsu-r, .nsu-m, .nsu-s, .nsu-a, 640px); products.css 46-52 (.pnl-h), 56-57 (.va); shell.css 70, 250-252 (.id, .btn, .btn.primary);
 *   products.js 285-287 (Needs setting up rows).
 * Two parts: NewProductForm + NewProductBar (stocker side, the bar goes in StockerFrame `bar`) and NewProductRequests (manager side).
 * GAP: the Not ours confirm ("Remove this request?", products.js 317) and the Undo toast are I22/app level; copy exported as NOT_OURS_CONFIRM.
 * GAP: stocker.css 146-152 stepper is the 52px stocker variant, not I2 (QuantityStepper, 36px); built here from the stocker lines.
 * GAP: scan button opens BarcodeSheet (I16, ctx "np", capture mode) in the consumer; here it is the onScan callback.
 */

export interface NewProductDraft {
  code: string;
  name: string;
  /** Kept as text like the prototype (N.qty). */
  qty: string;
  /** A place name, "Not sure", or "" for none. */
  loc: string;
  /** File name only; the file is not stored. */
  photo: string;
}

export const EMPTY_NEW_PRODUCT: NewProductDraft = { code: '', name: '', qty: '', loc: '', photo: '' };

export const NOT_OURS_CONFIRM = {
  title: 'Remove this request?',
  line: 'Nothing changes in stock. The stocker can scan it again.',
  go: 'Remove request',
} as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const qtyNum = (q: string) => (q === '' ? 0 : Math.max(0, Math.round(+q) || 0));

/** need() (stocker.js 249): why the request cannot be sent yet, or "". */
export function newProductNeed(d: NewProductDraft, manager: string, alreadyRequested: (code: string) => boolean): string {
  if (!isCode(d.code)) return 'Type or scan the barcode, at least 8 digits.';
  if (alreadyRequested(d.code)) return `You already told ${manager} about this barcode. They have not set it up yet.`;
  return '';
}

const lbl = 'mt-5 block text-[15px] font-semibold';
const lblSmall = 'text-[13px] font-normal text-muted';
const sb =
  'inline-flex min-h-[var(--tap-big)] items-center justify-center gap-2.5 rounded-[8px] px-5 text-center text-[16px] font-semibold leading-[22px] transition-colors duration-[120ms] [&_svg]:h-5 [&_svg]:w-5';
const sbSecondary = sb + ' cursor-pointer border-[1.5px] border-control bg-surface text-text hover:border-muted';
const tin =
  'min-h-[var(--tap-big)] w-full rounded-[8px] border-[1.5px] border-control bg-surface px-3.5 text-[16px] text-text placeholder:text-faint focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';
const stpBtn =
  'grid cursor-pointer place-items-center bg-raised text-[20px] text-text hover:bg-raised-2 ' + focusRing;

export interface NewProductFormProps {
  value: NewProductDraft;
  onChange: (next: NewProductDraft) => void;
  /** Place names (DATA.locations); "Not sure" is added after them. */
  locations: string[];
  /** The word for the manager. Default "your manager". */
  manager?: string;
  /** Opens the barcode sheet (I16). */
  onScan?: () => void;
  className?: string;
}

/** New-product request form (I19, stocker): barcode, optional name, optional photo (file name only), optional count, which place. */
export function NewProductForm({ value, onChange, locations, manager = 'your manager', onScan, className }: NewProductFormProps) {
  const uid = useId();
  const ids = { code: `${uid}-code`, name: `${uid}-name`, photo: `${uid}-photo`, qty: `${uid}-qty`, lq: `${uid}-lq`, ll: `${uid}-ll` };
  const set = (p: Partial<NewProductDraft>) => onChange({ ...value, ...p });
  const step = (n: number) => set({ qty: String(Math.max(0, Math.min(9999, (+value.qty || 0) + n))) });
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) set({ photo: f.name });
  };
  return (
    <div className={className}>
      <p className="mt-3 text-[13px] leading-[19px] text-muted">
        You are not adding stock. A stocker cannot create a product or add stock to one that is not set up.
      </p>
      <label className={lbl} htmlFor={ids.code}>Barcode</label>
      <div className="mt-2 flex items-stretch gap-2">
        <input
          id={ids.code}
          className={cn(tin, 'min-w-0 flex-1 font-mono')}
          inputMode="numeric"
          autoComplete="off"
          value={value.code}
          placeholder="The 13 digits under the bars"
          onChange={(e) => set({ code: digitsOf(e.target.value) })}
        />
        <button type="button" className={cn(sbSecondary, 'w-auto flex-none', focusRing)} onClick={onScan}>
          <Barcode aria-hidden />
          Scan
        </button>
      </div>
      <label className={lbl} htmlFor={ids.name}>Name <small className={lblSmall}>(optional)</small></label>
      <input
        id={ids.name}
        className={cn(tin, 'mt-2')}
        type="text"
        maxLength={60}
        autoComplete="off"
        value={value.name}
        placeholder="What does the box say?"
        onChange={(e) => set({ name: e.target.value })}
      />
      <h2 className={lbl}>Photo <small className={lblSmall}>(optional)</small></h2>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input id={ids.photo} className="peer absolute h-px w-px opacity-0" type="file" accept="image/*" capture="environment" onChange={onFile} />
        <label htmlFor={ids.photo} className={cn(sbSecondary, 'w-auto peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent')}>
          <Camera aria-hidden />
          {value.photo ? 'Take another photo' : 'Take a photo'}
        </label>
        <span className="text-[13px] text-muted">{value.photo ? `${value.photo} added` : `Helps ${manager} find the right product.`}</span>
      </div>
      <h2 className={lbl} id={ids.lq}>How many did you count? <small className={lblSmall}>(optional)</small></h2>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="inline-grid h-[var(--tap-big)] grid-cols-[var(--tap-big)_88px_var(--tap-big)] overflow-hidden rounded-[8px] border-[1.5px] border-control bg-surface">
          <button type="button" className={stpBtn} aria-label="One less How many you counted" onClick={() => step(-1)}>
            <Minus aria-hidden />
          </button>
          <input
            id={ids.qty}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={value.qty}
            placeholder="0"
            aria-label="How many you counted"
            className="w-full appearance-none border-0 bg-surface p-0 text-center text-[20px] font-semibold tabular-nums text-text [-moz-appearance:textfield] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-[3px] focus-visible:outline-accent [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            onChange={(e) => set({ qty: e.target.value })}
          />
          <button type="button" className={stpBtn} aria-label="One more How many you counted" onClick={() => step(1)}>
            <Plus aria-hidden />
          </button>
        </span>
      </div>
      <h2 className={lbl} id={ids.ll}>Which place is it in?</h2>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby={ids.ll}>
        {[...locations, 'Not sure'].map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={value.loc === l}
            onClick={() => set({ loc: value.loc === l ? '' : l })}
            className={cn(
              'min-h-[var(--tap)] cursor-pointer rounded-[24px] border-[1.5px] bg-surface px-3.5 text-[15px] font-medium hover:border-muted',
              value.loc === l ? 'border-accent font-semibold text-accent' : 'border-control',
              focusRing,
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface NewProductBarProps {
  value: NewProductDraft;
  manager?: string;
  alreadyRequested: (code: string) => boolean;
  onSend: () => void;
}

/** The pinned bar content (stocker.js 252-253): the plain sentence and "Send to {manager}". Pass to StockerFrame `bar`. */
export function NewProductBar({ value, manager = 'your manager', alreadyRequested, onSend }: NewProductBarProps) {
  const need = newProductNeed(value, manager, alreadyRequested);
  const n = qtyNum(value.qty);
  return (
    <>
      <p className="mb-2 text-[14px] leading-5 text-text" role="status" aria-live="polite">
        {need ? (
          <span className="text-muted">{need}</span>
        ) : (
          <>
            <b className="font-semibold">Nothing goes into stock yet.</b> {cap(manager)} sets the product up first
            {n ? (
              <>
                , then your count of <b className="font-semibold">{n}</b> goes in
              </>
            ) : null}
            .
          </>
        )}
      </p>
      <button
        type="button"
        disabled={!!need}
        onClick={onSend}
        className={cn(
          sb,
          'w-full bg-accent text-accent-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:border-0 disabled:bg-raised-2 disabled:text-muted',
          focusRing,
        )}
      >
        <PaperPlaneTilt aria-hidden />
        Send to {manager}
      </button>
    </>
  );
}

export interface NewProductRequest {
  id: string;
  barcode: string;
  /** Typed name; "No name typed" is shown when empty. */
  name?: string;
  qty?: number;
  /** Place the stocker chose. */
  loc?: string;
  /** Who told the manager (a name). */
  by: string;
  /** When (a time string). */
  at: string;
  /** True when a photo was added (file name only is kept). */
  photo?: boolean;
  note?: string;
}

export interface NewProductRequestsProps {
  requests: NewProductRequest[];
  onSetUp: (id: string) => void;
  /** Opens the app's confirm (NOT_OURS_CONFIRM). */
  onNotOurs: (id: string) => void;
  className?: string;
}

/** Manager side (I19): the Products "Needs setting up" panel. Returns nothing when there are no open requests. */
export function NewProductRequests({ requests, onSetUp, onNotOurs, className }: NewProductRequestsProps) {
  const hid = useId();
  if (!requests.length) return null;
  return (
    <section className={cn('mb-5 flex min-w-0 flex-col', className)} aria-labelledby={hid}>
      <div className="flex min-h-8 items-baseline gap-2.5 border-b border-border pb-2.5">
        <Barcode aria-hidden className="h-[18px] w-[18px] flex-none self-center text-muted" />
        <h2 id={hid} className="whitespace-nowrap text-[16px] font-semibold leading-[22px]">Needs setting up</h2>
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-muted">
          {requests.length} {requests.length === 1 ? 'barcode' : 'barcodes'} the system does not know. Stockers cannot add stock to an unknown product.
        </span>
      </div>
      <ul className="m-0 list-none p-0">
        {requests.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-4 border-b border-rule py-3 max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-mono text-[13px] tracking-[0]">{r.barcode}</span>
              <b className="text-[14px] font-semibold">{r.name || 'No name typed'}</b>
              <span className="text-[13px] text-muted">
                {r.qty ? `${r.qty} counted` : 'No count'}
                {r.loc ? ` · put in ${r.loc}` : ''} · {r.by}, {r.at}
                {r.photo ? ' · photo added' : ''}
                {r.note ? ` · “${r.note}”` : ''}
              </span>
            </div>
            <div className="flex flex-none items-center gap-3 max-[640px]:justify-between">
              <button
                type="button"
                onClick={() => onSetUp(r.id)}
                className={cn(
                  'inline-flex h-8 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-control bg-accent px-3 text-[13px] font-medium text-accent-ink transition-colors duration-[120ms] hover:bg-accent-hover max-[640px]:min-h-[44px]',
                  focusRing,
                )}
              >
                Set up product
              </button>
              <button
                type="button"
                onClick={() => onNotOurs(r.id)}
                className={cn(
                  'inline-flex h-6 cursor-pointer items-center gap-1 rounded-[4px] px-1 text-[12px] font-semibold text-accent no-underline max-[640px]:min-h-[44px]',
                  focusRing,
                )}
              >
                Not ours
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
