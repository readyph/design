import { Phone, Plus, X } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { BackLink } from './ActionLink';
import { Button } from './Button';
import { Fact, FactsLine } from './FactsLine';
import { jobTotal, peso, type Customer, type Job } from './sms/data';
import { STATUS_SHORT, serviceTitle, shortDate } from './sms/floorModel';
import { owedBy, servicesOf } from './sms/servicesData';

export interface CustomerPanelProps {
  customer: Customer;
  pool: Job[];
  onOpenService: (job: Job) => void;
  onNewService: (customer: Customer) => void;
  onClose?: () => void;
  /** Phone: pushed page with a back link. */
  asPage?: boolean;
  onBack?: () => void;
  className?: string;
}

/**
 * CustomerPanel: the lookup behind a row's customer. Phone, since when, vehicles with plates, what they owe, and every
 * service they have had here, newest first; a row opens that service. One primary: New service for this customer.
 */
export function CustomerPanel({ customer, pool, onOpenService, onNewService, onClose, asPage, onBack, className }: CustomerPanelProps) {
  const list = servicesOf(customer.id, pool).sort((a, b) => (a.statusSince < b.statusSince ? 1 : -1));
  const owed = owedBy(customer.id, pool);
  const spent = list.filter((j) => j.status === 'COMPLETED').reduce((a, j) => a + jobTotal(j), 0);
  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="px-4 pb-3 pt-3">
        {asPage && <BackLink onClick={onBack} className="mb-2">Services</BackLink>}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-muted">Customer since {new Date(customer.since).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}</p>
            <h2 className="mt-0.5 break-words text-[16px] font-semibold leading-6">{customer.name}</h2>
            <a className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-accent underline" href={`tel:${customer.phone.replace(/\s/g, '')}`}><Phone size={14} aria-hidden />{customer.phone}</a>
          </div>
          {!asPage && onClose && <button type="button" aria-label="Close customer" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-control text-muted hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={16} aria-hidden /></button>}
        </div>
        <FactsLine className="mt-2">
          <Fact value={list.length}>services here</Fact>
          <Fact value={peso(spent)}>paid over time</Fact>
          {owed > 0 && <Fact tone="warn" value={peso(owed)}>owed now</Fact>}
        </FactsLine>
      </div>
      <section className="border-t border-rule px-4 py-3">
        <h3 className="mb-2 text-[13px] font-semibold">{customer.vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}</h3>
        <ul>{customer.vehicles.map((v) => <li key={v.id} className="flex items-baseline justify-between gap-3 py-1 text-[13px]"><span className="min-w-0 break-words">{v.make} {v.model} {v.year}</span><span className="flex-none font-mono text-[12px] text-muted">{v.plate}</span></li>)}</ul>
      </section>
      <section className="border-t border-rule px-4 py-3">
        <h3 className="mb-1 text-[13px] font-semibold">History</h3>
        <ul>
          {list.map((j) => (
            <li key={j.id} className="border-b border-rule last:border-b-0">
              <button type="button" onClick={() => onOpenService(j)} className="-mx-2 flex w-[calc(100%+16px)] min-h-11 items-center gap-3 rounded-control px-2 py-1.5 text-left transition-colors duration-150 motion-reduce:transition-none hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium" title={serviceTitle(j)}>{serviceTitle(j)}</span><span className="block text-[12px] text-muted"><span className="font-mono">{j.number}</span> · {shortDate(j.statusSince)}</span></span>
                <span className="flex-none text-right"><span className="block text-[13px] tabular-nums">{peso(jobTotal(j))}</span><span className="inline-flex items-center gap-1.5 text-[12px] text-muted"><span aria-hidden className={cn('size-1.5 rounded-full', STATUS_SHORT[j.status].dot)} />{STATUS_SHORT[j.status].label}</span></span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-auto flex items-center gap-2 border-t border-rule bg-surface px-4 py-3">
        <Button variant="primary" leftIcon={Plus} onClick={() => onNewService(customer)} fullWidth={asPage}>New service for {customer.name.split(' ')[0]}</Button>
      </div>
    </div>
  );
}
