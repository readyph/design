import { useState, type ReactNode } from 'react';
import { MagnifyingGlass, Trash, UploadSimple, WarningOctagon, Wrench, Plus, Sparkle } from '@phosphor-icons/react';
import { Accordion } from '../../components/Accordion';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Notice } from '../../components/Notice';
import { OffCanvas } from '../../components/Drawer';
import { Select } from '../../components/Select';
import { Switch } from '../../components/Switch';
import { Textarea } from '../../components/Textarea';
import { toast } from '../../components/toast/toastStore';
import { CUSTOMERS, PARTS, SERVICES, peso, validPhone, type Customer, type JobPart, type JobService } from './data';

/** Quotation intake scenarios, one story each. There is no success scenario: success is a toast and the job detail. */
export type IntakeScenario = 'blank' | 'validation' | 'existing' | 'submitting' | 'error' | 'no-catalogue' | 'more-options';

export interface NewQuotation {
  customer: string; phone: string; plate: string; brand: string; model: string;
  services: JobService[]; parts: JobPart[]; total: number; preApproved: boolean; assignee: string | null; due: string;
}

interface PartLine { id: number; qty: number }
type Mode = 'search' | 'existing' | 'new';

const NEW_VEHICLE = '__new';
const ASSIGNEES = ['Rey Bautista', 'Dennis Alcala', 'Carlo Reyes', 'Joel Mendoza', 'Maricel Santos'];

function IntakeSection({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{title}</h3>{aside}</div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

/**
 * Quotation intake on one screen: customer, vehicle, work. No wizard. Minimum quotation is a customer,
 * a vehicle and one item; everything else sits under "More options".
 */
export function QuotationIntake({
  open, onOpenChange, scenario = 'blank', onCreated,
}: { open: boolean; onOpenChange: (o: boolean) => void; scenario?: IntakeScenario; onCreated?: (q: NewQuotation) => void }) {
  const existing = scenario === 'existing';
  const seeded = existing ? CUSTOMERS[1] : null;
  const [mode, setMode] = useState<Mode>(existing ? 'existing' : 'search');
  const [picked, setPicked] = useState<Customer | null>(seeded);
  const [query, setQuery] = useState(existing ? 'Miguel Sorento' : '');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState(existing ? 'LDP 5432' : '');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [svc, setSvc] = useState<number[]>(existing ? [1] : []);
  const [parts, setParts] = useState<PartLine[]>(existing ? [{ id: 1, qty: 1 }] : []);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [preApproved, setPreApproved] = useState(false);
  const [due, setDue] = useState('2026-10-24');
  const [assignee, setAssignee] = useState('none');
  const [tried, setTried] = useState(scenario === 'validation');
  const [failed, setFailed] = useState(scenario === 'error');
  const saving = scenario === 'submitting';

  const catalogueEmpty = scenario === 'no-catalogue';
  const activeServices = catalogueEmpty ? [] : SERVICES.filter((s) => s.active);
  const activeParts = catalogueEmpty ? [] : PARTS.filter((p) => p.active);

  const vehicles = picked?.vehicles ?? [];
  const isNewVehicle = vehicles.length === 0 || plate === NEW_VEHICLE;
  const matches = mode === 'search' && query.trim().length >= 2 ? CUSTOMERS.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 3) : [];

  const subtotal =
    svc.reduce((a, id) => a + (SERVICES.find((s) => s.id === id)?.price ?? 0), 0) +
    parts.reduce((a, l) => a + l.qty * (PARTS.find((p) => p.id === l.id)?.price ?? 0), 0);
  const off = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - off;

  const errs = {
    customer: (mode === 'search' ? 'Search for a customer, or add a new one.' : mode === 'new' && !query.trim() ? 'Enter the customer name.' : false),
    phone: mode === 'new' && !validPhone(phone) && 'Enter a 10-digit mobile number, without the leading 0.',
    plate: (isNewVehicle ? !plate.trim() || plate === NEW_VEHICLE : !plate) && 'Select a vehicle or enter a plate number.',
    items: svc.length + parts.length === 0 && 'Add at least one service or part.',
  };
  const invalid = Object.values(errs).some(Boolean);
  const show = (k: keyof typeof errs) => (tried && errs[k] ? (errs[k] as string) : undefined);

  const reset = () => {
    setMode('search'); setPicked(null); setQuery(''); setPhone(''); setPlate(''); setBrand(''); setModel('');
    setSvc([]); setParts([]); setNotes(''); setDiscount(''); setPreApproved(false); setAssignee('none'); setTried(false);
  };

  const submit = () => {
    setTried(true);
    setFailed(false);
    if (invalid) return;
    const v = vehicles.find((x) => x.plate === plate);
    const q: NewQuotation = {
      customer: picked?.name ?? query.trim(),
      phone: picked?.phone ?? `+63 ${phone}`,
      plate: v?.plate ?? plate.trim(),
      brand: v?.brand ?? (brand || 'Unknown'),
      model: v?.model ?? model,
      services: svc.map((id, i) => { const s = SERVICES.find((x) => x.id === id)!; return { id: 100 + i, name: s.name, description: s.description, updated: 'Oct 17, 2026', assignees: [], price: s.price, status: 'todo' as const, comments: 0 }; }),
      parts: parts.map((l, i) => { const p = PARTS.find((x) => x.id === l.id)!; return { id: 100 + i, name: p.name, sku: `DB-${22000 + p.id}`, qty: l.qty, unit: 'pc', unitPrice: p.price }; }),
      total, preApproved, assignee: assignee === 'none' ? null : assignee, due,
    };
    toast.success(preApproved ? `${q.customer} is on the To-do list.` : `${q.customer} can now confirm the quotation.`, { title: preApproved ? 'Job created' : 'Quotation sent for confirmation' });
    onCreated?.(q);
    onOpenChange(false);
    reset();
  };

  const pickWork = (v: string) => {
    const [kind, id] = v.split(':');
    if (kind === 's') setSvc((s) => [...s, Number(id)]);
    else setParts((p) => [...p, { id: Number(id), qty: 1 }]);
  };
  const workOptions = [
    ...activeServices.filter((s) => !svc.includes(s.id)).map((s) => ({ value: `s:${s.id}`, label: `Service: ${s.name} - ${peso(s.price)}` })),
    ...activeParts.filter((p) => !parts.some((l) => l.id === p.id)).map((p) => ({ value: `p:${p.id}`, label: `Part: ${p.name} - ${peso(p.price)}` })),
  ];

  return (
    <OffCanvas open={open} onOpenChange={onOpenChange} width="35rem">
      <OffCanvas.Header>New quotation</OffCanvas.Header>
      <OffCanvas.Body>
      <p className="-mt-2 mb-6 text-sm text-ink-muted">Customer, vehicle and work. Everything else is optional.</p>
      <form className="flex flex-col gap-6" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {tried && invalid && <Notice tone="error" title="Fix the highlighted fields to continue" icon={WarningOctagon} />}
        {failed && (
          <Notice tone="error" title="Could not save the quotation" icon={WarningOctagon}>
            Nothing was created. Check your connection and try again; your entries are kept.
          </Notice>
        )}

        {/* PLACEHOLDER: Leda is undecided (Earvin decides at the next gate). Inert, connected to nothing. */}
        <Field
          label={<span className="inline-flex flex-wrap items-center gap-2"><Sparkle size={14} />Describe the job<Badge size="sm" tone="neutral">Leda, pending decision</Badge></span>}
          hint="Not connected yet. Fill in the fields below."
        >
          <Input disabled placeholder="e.g. Honda Civic 2015, brake noise, front pads" />
        </Field>

        <IntakeSection title="Customer">
          {mode === 'existing' && picked ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-subtle px-3 py-2">
              <div className="flex min-w-0 flex-col"><span className="truncate text-sm font-medium">{picked.name}</span><span className="text-xs text-ink-muted">{picked.phone}</span></div>
              <Button size="sm" variant="subtle" onClick={() => { setMode('search'); setPicked(null); setPlate(''); }}>Change</Button>
            </div>
          ) : (
            <Field label="Customer" required error={show('customer')}>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={MagnifyingGlass} placeholder="Search by name, or type a new one" autoComplete="off" />
            </Field>
          )}
          {mode === 'search' && query.trim().length >= 2 && (
            <ul className="flex flex-col gap-2">
              {matches.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { setPicked(c); setMode('existing'); setQuery(c.name); setPlate(c.vehicles.length === 1 ? c.vehicles[0].plate : ''); }} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-surface-subtle px-3 py-2 text-left text-sm hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    <span className="font-medium">{c.name}</span><span className="text-xs text-ink-muted">{c.phone} / {c.vehicles.length} vehicle{c.vehicles.length === 1 ? '' : 's'}</span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => setMode('new')} className="flex min-h-12 w-full items-center gap-2 rounded-xl bg-surface-subtle px-3 py-2 text-left text-sm hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  <Plus size={16} />Add &quot;{query.trim()}&quot; as a new customer
                </button>
              </li>
            </ul>
          )}
          {mode === 'new' && (
            <Field label="Mobile number" required error={show('phone')} hint="+63, then 10 digits">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="917 123 4567" inputMode="tel" />
            </Field>
          )}
        </IntakeSection>

        <IntakeSection title="Vehicle">
          {vehicles.length > 0 && (
            <Field label="Vehicle" required error={!isNewVehicle ? show('plate') : undefined}>
              <Select
                value={plate}
                onValueChange={setPlate}
                placeholder="Select a vehicle"
                options={[...vehicles.map((v) => ({ value: v.plate, label: `${v.plate} - ${v.brand} ${v.model}` })), { value: NEW_VEHICLE, label: 'Add a new vehicle' }]}
              />
            </Field>
          )}
          {isNewVehicle && (
            <>
              <Field label="Plate number" required error={show('plate')}>
                <Input value={plate === NEW_VEHICLE ? '' : plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="ABC 4555" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Brand"><Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Toyota" /></Field>
                <Field label="Model"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Vios" /></Field>
              </div>
            </>
          )}
        </IntakeSection>

        <IntakeSection title="Work">
          {catalogueEmpty ? (
            <EmptyState icon={Wrench} title="No active services or parts" description="Activate items in the catalogue first, then come back to this quotation." action={<Button size="sm" variant="secondary">Open catalogue</Button>} />
          ) : (
            <Field label="Add a service or part" error={show('items')}>
              <Select placeholder="Search the catalogue" value="" onValueChange={pickWork} options={workOptions} />
            </Field>
          )}
          {(svc.length > 0 || parts.length > 0) && (
            <ul className="flex flex-col gap-2">
              {svc.map((id) => {
                const s = SERVICES.find((x) => x.id === id)!;
                return (
                  <li key={`s${id}`} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{s.name}</span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">{peso(s.price)}<IconButton icon={Trash} label={`Remove ${s.name}`} variant="subtle" size="sm" onClick={() => setSvc((x) => x.filter((i) => i !== id))} /></span>
                  </li>
                );
              })}
              {parts.map((l) => {
                const p = PARTS.find((x) => x.id === l.id)!;
                return (
                  <li key={`p${l.id}`} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{p.name}</span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      <Input aria-label={`Quantity of ${p.name}`} type="number" min={1} inputSize="sm" className="w-16" value={l.qty} onChange={(e) => setParts((x) => x.map((i) => (i.id === l.id ? { ...i, qty: Math.max(1, Number(e.target.value) || 1) } : i)))} />
                      {peso(l.qty * p.price)}
                      <IconButton icon={Trash} label={`Remove ${p.name}`} variant="subtle" size="sm" onClick={() => setParts((x) => x.filter((i) => i.id !== l.id))} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink-muted">Estimated cost</span>
            <span className="text-lg font-semibold tabular-nums">{peso(total)}</span>
          </div>
        </IntakeSection>

        <Accordion
          defaultOpen={scenario === 'more-options' ? ['more'] : []}
          items={[{
            value: 'more',
            title: 'More options',
            content: (
              <div className="flex flex-col gap-4">
                <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the shop should know" /></Field>
                <Field label="Discount" hint="In pesos, taken off the estimate."><Input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" /></Field>
                <Switch checked={preApproved} onCheckedChange={setPreApproved} label="Pre-approved" description="The customer already agreed. Skips confirmation and goes straight to To-do." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Due date"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
                  <Field label="Assigned to"><Select value={assignee} onValueChange={setAssignee} options={[{ value: 'none', label: 'Unassigned' }, ...ASSIGNEES.map((a) => ({ value: a, label: a }))]} /></Field>
                </div>
                <Field label="Attachments" hint="Photos or documents; multiple files allowed.">
                  <Button type="button" variant="secondary" leftIcon={UploadSimple}>Choose files</Button>
                </Field>
              </div>
            ),
          }]}
        />
      </form>
      </OffCanvas.Body>
      <OffCanvas.Footer>
        <Button variant="subtle" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
        <Button onClick={submit} loading={saving} disabled={saving}>{preApproved ? 'Create job' : 'Send for confirmation'}</Button>
      </OffCanvas.Footer>
    </OffCanvas>
  );
}
