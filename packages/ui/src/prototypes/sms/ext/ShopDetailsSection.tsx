import { useState } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { Button, TextField } from '../../../index';
import { BizMark } from './BizMark';
import { FileDropzone, Group, WeekHoursEditor } from './SettingsFields';
import type { ShopDetails, ShopErrors } from '../settingsModel';

const dateLabel = (d: string) => { const x = new Date(`${d}T00:00:00`); return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); };

/** F37 Shop details: identity, contact, logo, opening hours per weekday, closed days. A flat form; the shell owns the draft and the Save bar. */
export function ShopDetailsSection({ value, onChange, errors, showErrors }: { value: ShopDetails; onChange: (v: ShopDetails) => void; errors: ShopErrors; showErrors: boolean }) {
  const set = <K extends keyof ShopDetails>(k: K, v: ShopDetails[K]) => onChange({ ...value, [k]: v });
  const err = (k: keyof ShopErrors) => (showErrors ? (errors[k] as string | undefined) : undefined);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const addClosed = () => {
    if (!date || value.closed.some((c) => c.date === date)) return;
    set('closed', [...value.closed, { id: `cd${Date.now()}`, date, reason: reason.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
    setDate(''); setReason('');
  };
  return (
    <div className="max-w-[720px]">
      <Group first title="Business" help="Printed on receipts and quotations, and shown to customers in their texts.">
        <div className="space-y-4">
          <TextField label="Business name" value={value.business} onChange={(e) => set('business', e.target.value)} error={err('business')} autoComplete="organization" />
          <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            <TextField label="Branch name" value={value.branchName} onChange={(e) => set('branchName', e.target.value)} error={err('branchName')} placeholder="e.g. Kapitolyo" />
            <TextField label="TIN (optional)" value={value.tin} onChange={(e) => set('tin', e.target.value)} error={err('tin')} placeholder="000-000-000-000" hint="Printed on official receipts when you add it." inputMode="numeric" />
          </div>
          <TextField label="Branch address" value={value.address} onChange={(e) => set('address', e.target.value)} error={err('address')} autoComplete="street-address" />
          <FileDropzone label="Business logo" value={value.logo} onChange={(v) => set('logo', v)} placeholder={<BizMark size={32} />} helper="Shown on receipts, quotations and the mechanic app." />
        </div>
      </Group>
      <Group title="Contact" help="How customers reach the branch.">
        <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
          <TextField label="Phone" type="tel" value={value.phone} onChange={(e) => set('phone', e.target.value)} error={err('phone')} placeholder="0917 555 0142" autoComplete="tel" />
          <TextField label="Email (optional)" type="email" value={value.email} onChange={(e) => set('email', e.target.value)} error={err('email')} autoComplete="email" />
        </div>
      </Group>
      <Group title="Opening hours" help="The calendar shows these hours, and customers are told them when they book.">
        <WeekHoursEditor value={value.hours} onChange={(h) => set('hours', h)} errors={showErrors ? errors.hours : undefined} />
      </Group>
      <Group title="Closed days and holidays" help="The calendar blocks these dates. Add a date when the shop will not open.">
        {value.closed.length === 0 ? <p className="m-0 mb-3 text-[14px] text-muted">No closed days yet.</p> : (
          <ul aria-label="Closed days" className="mb-4 border-t border-rule">
            {value.closed.map((c) => (
              <li key={c.id} className="flex min-h-11 items-center gap-3 border-b border-rule">
                <span className="w-[170px] flex-none text-[14px] tabular-nums max-[640px]:w-auto max-[640px]:flex-1">{dateLabel(c.date)}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-muted max-[640px]:hidden">{c.reason || 'No reason added'}</span>
                <button type="button" aria-label={`Remove ${dateLabel(c.date)}`} onClick={() => set('closed', value.closed.filter((x) => x.id !== c.id))} className="inline-flex size-9 flex-none items-center justify-center rounded-control text-muted hover:bg-raised-2 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={16} aria-hidden /></button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <label className="block w-[180px] max-[640px]:w-full"><span className="mb-1 block text-ui font-medium text-text">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-full rounded-control border border-control bg-surface px-2.5 text-[14px] text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:h-11" /></label>
          <TextField label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Bonifacio Day" className="w-[240px] max-[640px]:w-full" />
          <Button variant="secondary" leftIcon={Plus} onClick={addClosed} disabled={!date}>Add closed day</Button>
        </div>
      </Group>
    </div>
  );
}
