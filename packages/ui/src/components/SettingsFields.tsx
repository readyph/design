import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { UploadSimple } from '@phosphor-icons/react';
import { Button } from './Button';
import { Select } from './Select';
import { Switch } from './Switch';
import { cn } from '../utils/cn';
import { DAYS, DAY_LABEL, TIME_OPTIONS, WEEKDAYS, dayError, type DayKey, type WeekHours } from './sms/settingsModel';

/**
 * Studio-only FileDropzone (NEW): choose or drop one image; a 64px square preview (or the placeholder), Remove, size and type checks.
 * The file is read in the browser only; the real product uploads it (invented: logo_url).
 */
export function FileDropzone({ value, onChange, label, helper, placeholder, maxKB = 2048 }: { value: string | null; onChange: (v: string | null) => void; label: string; helper?: ReactNode; placeholder: ReactNode; maxKB?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const id = useId();
  const take = (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g|svg\+xml|webp)$/.test(f.type)) { setErr('Use a PNG, JPG, SVG or WebP image.'); return; }
    if (f.size > maxKB * 1024) { setErr(`This image is too big. Use one under ${Math.round(maxKB / 1024)} MB.`); return; }
    setErr(undefined);
    const r = new FileReader();
    r.onload = () => onChange(String(r.result));
    r.readAsDataURL(f);
  };
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); };
  return (
    <div>
      <span id={`${id}-l`} className="mb-1 block text-ui font-medium text-text">{label}</span>
      <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
        className={cn('flex flex-wrap items-center gap-4 rounded-card border border-dashed p-4', over ? 'border-accent bg-accent-tint' : 'border-control bg-surface')}>
        <span data-testid="logo-preview" className="flex size-16 flex-none items-center justify-center overflow-hidden rounded-control border border-rule bg-raised">
          {value ? <img src={value} alt="Your business logo" className="size-full object-contain" /> : placeholder}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[14px] text-text">{value ? 'Logo ready. Save to use it.' : 'Drop an image here, or choose a file.'}</p>
          <p className="m-0 mt-0.5 text-[12px] text-muted">PNG, JPG, SVG or WebP, up to {Math.round(maxKB / 1024)} MB. A square image works best.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" leftIcon={UploadSimple} onClick={() => input.current?.click()} aria-describedby={`${id}-l`}>{value ? 'Replace file' : 'Choose file'}</Button>
            {value && <Button variant="text" onClick={() => { onChange(null); setErr(undefined); if (input.current) input.current.value = ''; }}>Remove logo</Button>}
          </div>
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" aria-label={`${label} file`} className="sr-only" tabIndex={-1} onChange={(e) => take(e.target.files?.[0])} />
      </div>
      {err ? <p role="alert" className="m-0 mt-1 text-small text-bad">{err}</p> : helper ? <p className="m-0 mt-1 text-small text-muted">{helper}</p> : null}
    </div>
  );
}

/**
 * Studio-only TimeRange (NEW): one day's hours as a row: Open / Closed switch, From and To time selects (half-hour steps), an error under it.
 * Used for the shop's opening hours and for each staff member's shift.
 */
export function TimeRange({ label, open, from, to, onChange, error, openWord = 'Open', closedWord = 'Closed' }: { label: string; open: boolean; from: string; to: string; onChange: (v: { open: boolean; from: string; to: string }) => void; error?: string; openWord?: string; closedWord?: string }) {
  return (
    <div className="border-b border-rule py-2 last:border-b-0">
      <div className="grid min-h-9 grid-cols-[96px_132px_minmax(0,1fr)] items-center gap-x-3 max-[640px]:grid-cols-[84px_minmax(0,1fr)] max-[640px]:gap-y-2">
        <span className="text-[14px] text-text">{label}</span>
        <span className="flex items-center gap-2"><Switch checked={open} onCheckedChange={(v) => onChange({ open: v, from, to })} aria-label={`${label}: ${openWord}`} /><span className="text-[13px] text-muted">{open ? openWord : closedWord}</span></span>
        {open ? (
          <span className="flex min-w-0 items-center gap-2 max-[640px]:col-span-2">
            <Select size="sm" aria-label={`${label} from`} className="w-[116px]" value={from} onValueChange={(v) => onChange({ open, from: v, to })} options={TIME_OPTIONS} invalid={!!error} />
            <span className="text-[13px] text-muted">to</span>
            <Select size="sm" aria-label={`${label} to`} className="w-[116px]" value={to} onValueChange={(v) => onChange({ open, from, to: v })} options={TIME_OPTIONS} invalid={!!error} />
          </span>
        ) : <span />}
      </div>
      {error && <p role="alert" className="m-0 mt-1 text-small text-bad">{error}</p>}
    </div>
  );
}

/** Seven TimeRange rows plus the "copy Monday to all weekdays" link. */
export function WeekHoursEditor({ value, onChange, errors, openWord, closedWord, copyLabel = "Copy Monday's hours to all weekdays" }: { value: WeekHours; onChange: (w: WeekHours) => void; errors?: Partial<Record<DayKey, string>>; openWord?: string; closedWord?: string; copyLabel?: string }) {
  const set = (d: DayKey, v: WeekHours[DayKey]) => onChange({ ...value, [d]: v });
  const copy = () => onChange(Object.fromEntries(DAYS.map((d) => [d, WEEKDAYS.includes(d) ? { ...value.mon } : value[d]])) as WeekHours);
  return (
    <div>
      <div role="group" aria-label="Hours per day">
        {DAYS.map((d) => <TimeRange key={d} label={DAY_LABEL[d]} {...value[d]} error={errors?.[d] ?? dayError(value[d])} onChange={(v) => set(d, v)} openWord={openWord} closedWord={closedWord} />)}
      </div>
      <Button variant="text" onClick={copy} className="mt-2">{copyLabel}</Button>
    </div>
  );
}

/** Sticky Save / Discard bar: only while the section has unsaved changes. */
export function SaveBar({ dirty, problems = 0, onSave, onDiscard }: { dirty: boolean; problems?: number; onSave: () => void; onDiscard: () => void }) {
  if (!dirty) return null;
  return (
    <div role="region" aria-label="Unsaved changes" className="sticky bottom-0 z-10 flex flex-none flex-wrap items-center gap-3 border-t border-rule bg-surface px-6 py-3 max-[640px]:px-4">
      <p className="m-0 mr-auto text-[14px] text-text" aria-live="polite">{problems ? `${problems} ${problems === 1 ? 'thing needs' : 'things need'} fixing before you can save.` : 'You have unsaved changes.'}</p>
      <Button variant="text" onClick={onDiscard}>Discard</Button>
      <Button variant="primary" onClick={onSave}>Save changes</Button>
    </div>
  );
}

/** One flat settings group: heading + help on top, fields below, a rule above. */
export function Group({ title, help, children, first }: { title: string; help?: ReactNode; children: ReactNode; first?: boolean }) {
  return (
    <section aria-label={title} className={cn('py-6', !first && 'border-t border-rule')}>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {help && <p className="mb-4 mt-0.5 max-w-xl text-[13px] text-muted">{help}</p>}
      {!help && <div className="h-3" />}
      {children}
    </section>
  );
}
