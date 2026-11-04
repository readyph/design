import { useMemo, useRef, useState, type ReactNode } from 'react';
import { CaretRight, PencilSimple, Plus, Trash, Warning } from '@phosphor-icons/react';
import { BackLink, Button, ConfirmDialog, Fact, FactsLine, SegmentedControl, Select, Switch, cn, toast } from '../../../index';
import { TODAY, jobTotal, peso, type Job, type Vehicle } from '../data';
import { STATUS_SHORT, reasonOf, serviceTitle } from '../floorModel';
import type { CustomerRec } from '../customersModel';
import { colourOf, dueOn, intervalOf, isOverdue, mileageOf, profileOf } from '../customerExtras';
import { shortDate } from './ServicesTable';

export interface CustomerPageProps {
  rec: CustomerRec;
  notes: string;
  onOpenService: (job: Job) => void;
  /** No id: the booking sheet asks which car. */
  onNewService: (vehicleId?: string) => void;
  onEdit: () => void;
  /** No vehicle: add a car; with one: edit it. */
  onCar: (vehicleId?: string) => void;
  onRemoveCar: (vehicleId: string) => void;
  /** Open the remove confirmation (or its explanation) on start. */
  initialRemove?: string;
  onBack: () => void;
  initialCar?: string;
  initialStatus?: StatusId;
  className?: string;
}

export type StatusId = 'all' | 'open' | 'quotes' | 'done';
const carLine = (v: Vehicle) => `${v.make} ${v.model} ${v.year}`;
const longDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00+08:00`).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' });
const isQuote = (j: Job) => j.status === 'QUOTATION' || j.status === 'FOR_APPROVAL';
const statusOf: Record<StatusId, (j: Job) => boolean> = { all: () => true, open: (j) => j.status !== 'COMPLETED' && !isQuote(j), quotes: isQuote, done: (j) => j.status === 'COMPLETED' };
const link = 'text-[13px] font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

function Section({ id, title, aside, children }: { id?: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="border-t border-rule py-5 scroll-mt-4">
      <div className="mb-3 flex min-h-8 items-center justify-between gap-3"><h2 className="text-[15px] font-semibold">{title}</h2>{aside}</div>
      {children}
    </section>
  );
}
const Spec = ({ label, strong, children }: { label: string; strong?: boolean; children: ReactNode }) => (
  <div className="min-w-0"><dt className="text-[12px] text-muted">{label}</dt><dd className={cn('break-words', strong && 'font-medium')}>{children}</dd></div>
);
/**
 * Studio-only CustomerPage (NEW, replaces the CustomerDetail off-canvas): the whole customer as a page. Header with the actions, one facts line, Cars
 * (each with specs, mileage, last service, next due, its own New service and History), Services (all cars, filter by car and status, rows open the Inspector),
 * Contact, Reminders and consent, Notes. Flat, ruled, one column that reads the same on a phone.
 */
export function CustomerPage({ rec, notes, onOpenService, onNewService, onEdit, onCar, onRemoveCar, initialRemove, onBack, initialCar = 'all', initialStatus = 'all', className }: CustomerPageProps) {
  const { customer: c } = rec;
  const prof = profileOf(c);
  const [car, setCar] = useState(initialCar);
  const [st, setSt] = useState<StatusId>(initialStatus);
  const [remind, setRemind] = useState(prof.remindByText);
  const [every, setEvery] = useState(String(prof.remindEvery));
  const [removing, setRemoving] = useState<string | null>(initialRemove ?? null);
  const histRef = useRef<HTMLElement>(null);
  const multi = c.vehicles.length > 1;
  const done = rec.services.filter((j) => j.status === 'COMPLETED');
  const forCar = rec.services.filter((j) => car === 'all' || j.vehicleId === car);
  const counts = useMemo(() => Object.fromEntries((['all', 'open', 'quotes', 'done'] as StatusId[]).map((k) => [k, forCar.filter(statusOf[k]).length])) as Record<StatusId, number>, [forCar]);
  const rows = forCar.filter(statusOf[st]);
  const plateOf = (id: string) => c.vehicles.find((v) => v.id === id)?.plate ?? '';
  const showHistory = (id: string) => { setCar(id); setSt('all'); histRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const years = Math.max(1, Math.round((new Date(TODAY).getTime() - new Date(c.since).getTime()) / (365 * 864e5)));

  return (
    <div className={cn('mx-auto w-full max-w-[880px] px-6 pb-12 pt-4 max-[640px]:px-4', className)}>
      <BackLink onClick={onBack} className="mb-3">Customers</BackLink>
      <header>
        <p className="text-[12px] text-muted">Customer since {longDate(c.since)}{years > 1 ? ` · ${years} years` : ''}</p>
        <h1 className="mt-0.5 break-words text-[22px] font-semibold leading-8 max-[640px]:text-[20px]">{c.name}</h1>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13px]" aria-label="Contact details">
          <div className="flex gap-2"><dt className="text-muted">Mobile</dt><dd><a className="tabular-nums text-accent underline" href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a></dd></div>
          <div className="flex min-w-0 gap-2"><dt className="text-muted">Email</dt><dd className="min-w-0 break-all">{prof.email ? <a className="text-accent underline" href={`mailto:${prof.email}`}>{prof.email}</a> : '-'}</dd></div>
          {prof.address && <div className="flex min-w-0 gap-2"><dt className="text-muted">Address</dt><dd className="min-w-0 break-words">{prof.address}</dd></div>}
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary" leftIcon={Plus} onClick={() => onNewService(multi ? undefined : c.vehicles[0]?.id)} className="max-[640px]:min-h-11">New service</Button>
          <Button variant="secondary" leftIcon={PencilSimple} onClick={onEdit} className="max-[640px]:min-h-11">Edit customer</Button>
        </div>
        <FactsLine className="mt-4" aria-label="Customer totals">
          <Fact value={done.length}>{done.length === 1 ? 'visit' : 'visits'}</Fact>
          <Fact value={peso(rec.spend)}>lifetime spend</Fact>
          <Fact value={rec.last ? shortDate(rec.last) : 'never'}>last visit</Fact>
          <Fact value={rec.open.length}>open now</Fact>
          {rec.owed > 0 && <Fact value={peso(rec.owed)}>owed now</Fact>}
        </FactsLine>
      </header>

      <div className="mt-5">
        <Section id="cars" title={multi ? `Cars (${c.vehicles.length})` : 'Cars'}>
          <ul>
            {c.vehicles.map((v) => {
              const mine = rec.services.filter((j) => j.vehicleId === v.id);
              const last = mine.find((j) => j.status === 'COMPLETED');
              const open = mine.filter((j) => j.status !== 'COMPLETED').length;
              const due = last ? dueOn(last.statusSince, intervalOf(v, c)) : null;
              const over = !!due && isOverdue(due);
              return (
                <li key={v.id} className="border-b border-rule py-3 first:pt-0 last:border-b-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <p className="break-all font-mono text-[15px] font-semibold leading-6">{v.plate}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted"><span className="break-words">{carLine(v)}</span><span aria-hidden>·</span>
                        <button type="button" onClick={() => showHistory(v.id)} className={cn(link, 'inline-flex min-h-8 items-center max-[640px]:min-h-11')}>{mine.length} {mine.length === 1 ? 'service' : 'services'}{open ? `, ${open} open` : ''}<span className="sr-only"> for {v.plate}</span></button></p>
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      <button type="button" onClick={() => onCar(v.id)} aria-label={`Edit car ${v.plate}`} className={cn(link, 'inline-flex min-h-8 items-center gap-1 px-1 max-[640px]:min-h-11')}><PencilSimple size={14} aria-hidden />Edit</button>
                      <button type="button" onClick={() => setRemoving(v.id)} aria-label={`Remove car ${v.plate}`} className="inline-flex min-h-8 items-center gap-1 px-1 text-[13px] text-muted underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:min-h-11"><Trash size={14} aria-hidden />Remove</button>
                    </div>
                  </div>
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-[13px] min-[641px]:grid-cols-2 min-[800px]:grid-cols-4">
                    <Spec label="Colour, type">{[colourOf(v), v.kind].filter(Boolean).join(', ') || '-'}</Spec>
                    <Spec label="Mileage">{mileageOf(v) ? `${mileageOf(v).toLocaleString('en-PH')} km` : '-'}</Spec>
                    <Spec label="Last service">{last ? <>{serviceTitle(last)}<span className="text-muted">, {shortDate(last.statusSince)}</span></> : '-'}</Spec>
                    <Spec label="Next due" strong={over}>{due ? <>{over && <Warning size={14} weight="fill" aria-hidden className="mr-1 inline text-warn-dot" />}{longDate(due)}{over ? ', overdue' : ''}</> : '-'}</Spec>
                  </dl>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 border-t border-rule pt-3 text-[13px] text-muted">Has another car? <button type="button" onClick={() => onCar()} className={cn(link, 'min-h-8 max-[640px]:min-h-11')}>Add car</button></p>
        </Section>

        <section ref={histRef} id="services" className="scroll-mt-4 border-t border-rule py-5">
          <div className="mb-3 flex min-h-8 flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold">Services{multi ? ' across all cars' : ''} ({rec.services.length})</h2>
            {multi && (
              <label className="flex items-center gap-2 text-[13px] text-muted">Car
                <Select size="sm" aria-label="Filter by car" className="w-[240px] max-[640px]:w-[200px]" value={car} onValueChange={setCar} options={[{ value: 'all', label: 'All cars' }, ...c.vehicles.map((v) => ({ value: v.id, label: `${v.plate} · ${v.make} ${v.model}` }))]} />
              </label>
            )}
          </div>
          <div className="mb-2 overflow-x-auto pb-1"><SegmentedControl size="md" aria-label="Service status" value={st} onChange={(v) => setSt(v as StatusId)} options={[{ value: 'all', label: 'All', count: counts.all }, { value: 'open', label: 'Open', count: counts.open }, { value: 'quotes', label: 'Quotes', count: counts.quotes }, { value: 'done', label: 'Completed', count: counts.done }]} /></div>
          {rows.length === 0 ? (
            <p className="py-4 text-[13px] text-muted">{rec.services.length === 0 ? 'No services yet. Start one with New service above.' : 'Nothing matches. Choose All cars or All to see the rest.'}</p>
          ) : (
            <ul className="border-t border-rule">
              {rows.map((j) => (
                <li key={j.id} className="border-b border-rule">
                  <button type="button" onClick={() => onOpenService(j)}
                    className={cn('-mx-2 flex min-h-12 w-[calc(100%+16px)] items-center gap-3 rounded-control px-2 py-2 text-left transition-colors duration-150 motion-reduce:transition-none hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent', reasonOf(j) && 'bg-warn-bg hover:bg-warn-bg')}>
                    <span className="w-14 flex-none text-[13px] tabular-nums text-muted max-[640px]:w-12">{shortDate(j.statusSince)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-[14px] font-medium leading-5">{serviceTitle(j)}</span>
                      <span className="block text-[12px] text-muted"><span className="font-mono">{j.number}</span>{multi && <> · <span className="font-mono">{plateOf(j.vehicleId)}</span></>}</span>
                    </span>
                    <span className="flex-none text-right">
                      <span className="block text-[13px] tabular-nums">{peso(jobTotal(j))}</span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted"><span aria-hidden className={cn('size-1.5 rounded-full', STATUS_SHORT[j.status].dot)} />{STATUS_SHORT[j.status].label}</span>
                    </span>
                    <CaretRight size={14} aria-hidden className="flex-none text-faint" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Section title="Reminders">
          <div className="space-y-3">
            <Switch label="Text service reminders" description={`Agreed at the counter. ${remind ? 'A text goes out when a car is due.' : 'Off: this customer is not texted unless you send one.'}`} checked={remind} onCheckedChange={(on) => { setRemind(on); toast.info(on ? 'Reminders on.' : 'Reminders off.'); }} />
            <label className="flex flex-wrap items-center gap-2 text-[13px]"><span className="text-muted">Remind after</span>
              <Select size="sm" aria-label="Reminder interval" className="w-[150px]" disabled={!remind} value={every} onValueChange={setEvery} options={[{ value: '3', label: '3 months' }, { value: '6', label: '6 months' }, { value: '12', label: '12 months' }]} />
              <span className="text-muted">since each car's last service</span></label>
          </div>
        </Section>

        <Section title="Notes" aside={<button type="button" onClick={onEdit} className={cn(link, 'min-h-8 max-[640px]:min-h-11')}>{notes ? 'Edit' : 'Add'}</button>}>
          {notes ? <p className="whitespace-pre-line break-words text-[13px] leading-5">{notes}</p> : <p className="text-[13px] text-muted">No notes. Add what to remember next time, like how they pay or when they can be reached.</p>}
        </Section>
      </div>
      {(() => {
        const v = c.vehicles.find((x) => x.id === removing);
        if (!v) return null;
        const mine = rec.services.filter((j) => j.vehicleId === v.id);
        const open = mine.filter((j) => j.status !== 'COMPLETED').length;
        const why = open > 0 ? `${v.plate} has ${open} open ${open === 1 ? 'service' : 'services'}. Finish or cancel ${open === 1 ? 'it' : 'them'} first, then the car can be removed.`
          : mine.length > 0 ? `${v.plate} has ${mine.length} past ${mine.length === 1 ? 'service' : 'services'}. Past services stay tied to their car, so it cannot be removed. Use Edit if the plate or details are wrong.`
          : c.vehicles.length === 1 ? 'A customer needs at least one car. Add the other car first, then remove this one.' : null;
        return (
          <ConfirmDialog open onOpenChange={(o) => !o && setRemoving(null)} onCancel={() => setRemoving(null)}
            title={why ? `Cannot remove ${v.plate}` : `Remove ${v.plate}?`} description={why ?? `${v.make} ${v.model} is taken off ${c.name}. It has no services, so no history is lost.`}
            name={`${v.plate} · ${carLine(v)}`} tone="primary" confirmLabel={why ? 'Got it' : 'Remove car'} cancelLabel={why ? 'Close' : 'Keep car'}
            onConfirm={() => { setRemoving(null); if (!why) onRemoveCar(v.id); }} />
        );
      })()}
    </div>
  );
}
