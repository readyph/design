import { useState } from 'react';
import { MagnifyingGlass, Trash, UploadSimple, WarningOctagon, CheckCircle, Wrench } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Notice } from '../../components/Notice';
import { OffCanvas } from '../../components/Drawer';
import { Select } from '../../components/Select';
import { CUSTOMERS, PARTS, SERVICES, peso, validEmail, validPhone } from './data';

/** Quotation intake scenarios, one story each. */
export type IntakeScenario = 'blank' | 'validation' | 'existing' | 'submitting' | 'error' | 'success' | 'no-catalogue';

interface PartLine { id: number; qty: number }

const NEW_VEHICLE = '__new';

export function QuotationIntake({ open, onOpenChange, scenario = 'blank' }: { open: boolean; onOpenChange: (o: boolean) => void; scenario?: IntakeScenario }) {
  const existing = scenario === 'existing';
  const [name, setName] = useState(existing ? 'Miguel Sorento' : '');
  const [phone, setPhone] = useState(existing ? '915 860 6972' : '');
  const [email, setEmail] = useState(existing ? 'miguel@example.com' : '');
  const [address, setAddress] = useState(existing ? '123 Rizal St., Davao City' : '');
  const [plate, setPlate] = useState(existing ? 'LDP 5432' : '');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [svc, setSvc] = useState<number[]>(existing ? [1] : []);
  const [parts, setParts] = useState<PartLine[]>(existing ? [{ id: 1, qty: 1 }] : []);
  const [tried, setTried] = useState(scenario === 'validation');
  const [done, setDone] = useState<null | 'pre' | 'confirm'>(scenario === 'success' ? 'confirm' : null);
  const [saving, setSaving] = useState<null | 'pre' | 'confirm'>(scenario === 'submitting' ? 'confirm' : null);
  const [failed, setFailed] = useState(scenario === 'error');

  const match = CUSTOMERS.find((c) => name.trim().length >= 3 && c.name.toLowerCase().startsWith(name.trim().toLowerCase()));
  const vehicles = match?.vehicles ?? [];
  const isNewVehicle = vehicles.length === 0 || plate === NEW_VEHICLE;
  const catalogueEmpty = scenario === 'no-catalogue';
  const activeServices = catalogueEmpty ? [] : SERVICES.filter((s) => s.active);
  const activeParts = catalogueEmpty ? [] : PARTS.filter((p) => p.active);

  const estimate =
    svc.reduce((a, id) => a + (SERVICES.find((s) => s.id === id)?.price ?? 0), 0) +
    parts.reduce((a, l) => a + l.qty * (PARTS.find((p) => p.id === l.id)?.price ?? 0), 0);

  const errs = {
    name: !name.trim() && 'Enter the client name.',
    phone: !validPhone(phone) && 'Enter a 10-digit mobile number, without the leading 0.',
    email: !validEmail(email) && 'Enter a valid email address, like name@email.com.',
    plate: (isNewVehicle ? !plate.trim() || plate === NEW_VEHICLE : !plate) && 'Select a vehicle or enter a plate number.',
    items: svc.length + parts.length === 0 && 'Add at least one service or part.',
  };
  const invalid = Object.values(errs).some(Boolean);
  const show = (k: keyof typeof errs) => (tried && errs[k] ? (errs[k] as string) : undefined);

  const submit = (kind: 'pre' | 'confirm') => {
    setTried(true);
    setFailed(false);
    if (invalid) return;
    setSaving(kind);
    setDone(kind);
    setSaving(null);
  };
  const busy = saving !== null;

  const useCustomer = () => {
    if (!match) return;
    setName(match.name);
    setPhone(match.phone.replace('+63', '').trim());
    setEmail(match.email);
    setAddress(match.address);
    setPlate(match.vehicles.length === 1 ? match.vehicles[0].plate : '');
  };

  if (done) {
    return (
      <OffCanvas open={open} onOpenChange={onOpenChange} title="New quotation" width="560px" footer={<Button onClick={() => onOpenChange(false)}>View job</Button>}>
        <EmptyState
          icon={CheckCircle}
          title={done === 'pre' ? 'Quotation saved as pre-approved' : 'Quotation sent for confirmation'}
          description={done === 'pre' ? 'It skipped customer confirmation and is now To-do for the shop.' : `It stays under Quotation until ${name || 'the customer'} confirms.`}
          action={<Button variant="secondary" onClick={() => { setDone(null); setName(''); setPhone(''); setEmail(''); setAddress(''); setPlate(''); setSvc([]); setParts([]); setTried(false); }}>Add another quotation</Button>}
        />
      </OffCanvas>
    );
  }

  return (
    <OffCanvas
      open={open}
      onOpenChange={onOpenChange}
      title="New quotation"
      description="Customer, vehicle and scope of work. Only active catalogue items can be added."
      width="560px"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="subtle" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => submit('pre')} loading={saving === 'pre'} disabled={busy}>Save as pre-approved</Button>
            <Button onClick={() => submit('confirm')} loading={saving === 'confirm'} disabled={busy}>Send for confirmation</Button>
          </div>
        </div>
      }
    >
      <form className="space-y-6" noValidate onSubmit={(e) => { e.preventDefault(); submit('confirm'); }}>
        {tried && invalid && (
          <Notice tone="error" title="Fix the highlighted fields to continue" icon={WarningOctagon} />
        )}
        {failed && (
          <Notice tone="error" title="Could not save the quotation" icon={WarningOctagon}>
            Nothing was created. Check your connection and try again; your entries are kept.
          </Notice>
        )}

        <section className="space-y-3 rounded-xl bg-surface-subtle p-4">
          <h3 className="text-sm font-semibold">Customer</h3>
          <Field label="Client name" required error={show('name')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} leftIcon={MagnifyingGlass} placeholder="Search or enter a name" autoComplete="off" />
          </Field>
          {match && name !== match.name && (
            <Notice tone="info" title={`Existing customer: ${match.name}`}>
              {match.vehicles.length} vehicle{match.vehicles.length === 1 ? '' : 's'} on file.{' '}
              <Button size="sm" variant="secondary" className="ml-1" onClick={useCustomer}>Use these details</Button>
            </Notice>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mobile number" required error={show('phone')} hint="+63, then 10 digits">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="917 123 4567" inputMode="tel" />
            </Field>
            <Field label="Email address" required error={show('email')}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" inputMode="email" />
            </Field>
          </div>
          <Field label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, barangay, city" />
          </Field>
        </section>

        <section className="space-y-3 rounded-xl bg-surface-subtle p-4">
          <h3 className="text-sm font-semibold">Vehicle</h3>
          {vehicles.length > 0 && (
            <Field label="Vehicle" required error={!isNewVehicle ? show('plate') : undefined}>
              <Select
                value={plate}
                onValueChange={setPlate}
                placeholder="Select a vehicle"
                options={[
                  ...vehicles.map((v) => ({ value: v.plate, label: `${v.plate} - ${v.brand} ${v.model}` })),
                  { value: NEW_VEHICLE, label: 'Add a new vehicle' },
                ]}
              />
            </Field>
          )}
          {isNewVehicle && (
            <>
              <Field label="Plate number" required error={show('plate')} hint={name && vehicles.length === 0 ? 'No vehicle on file. It is saved to the customer.' : undefined}>
                <Input value={plate === NEW_VEHICLE ? '' : plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="ABC 4555" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Brand"><Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Toyota" /></Field>
                <Field label="Model"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Vios" /></Field>
              </div>
            </>
          )}
        </section>

        <section className="space-y-3 rounded-xl bg-surface-subtle p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Scope of work</h3>
              <p className="text-xs text-ink-muted">Services and parts for this job order</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-muted">Estimated cost</p>
              <p className="text-lg font-semibold tabular-nums">{peso(estimate)}</p>
            </div>
          </div>
          {show('items') && <p role="alert" className="text-xs text-error">{show('items')}</p>}
          {catalogueEmpty ? (
            <EmptyState icon={Wrench} title="No active services or parts" description="Activate items in the catalogue first, then come back to this quotation." action={<Button size="sm" variant="secondary">Open catalogue</Button>} />
          ) : (
            <>
              <Field label="Labor and services">
                <Select placeholder="Add a service" value="" onValueChange={(v) => setSvc((s) => [...s, Number(v)])} options={activeServices.filter((s) => !svc.includes(s.id)).map((s) => ({ value: String(s.id), label: `${s.name} - ${peso(s.price)}` }))} />
              </Field>
              {svc.length > 0 && (
                <ul className="space-y-1">
                  {svc.map((id) => {
                    const s = SERVICES.find((x) => x.id === id)!;
                    return (
                      <li key={id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate">{s.name}</span>
                        <span className="flex shrink-0 items-center gap-1 tabular-nums">{peso(s.price)}<IconButton icon={Trash} label={`Remove ${s.name}`} variant="subtle" size="sm" onClick={() => setSvc((x) => x.filter((i) => i !== id))} /></span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Field label="Parts and materials">
                <Select placeholder="Add a part" value="" onValueChange={(v) => setParts((p) => [...p, { id: Number(v), qty: 1 }])} options={activeParts.filter((p) => !parts.some((l) => l.id === p.id)).map((p) => ({ value: String(p.id), label: `${p.name} - ${peso(p.price)}` }))} />
              </Field>
              {parts.length > 0 && (
                <ul className="space-y-1">
                  {parts.map((l) => {
                    const p = PARTS.find((x) => x.id === l.id)!;
                    return (
                      <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate">{p.name}</span>
                        <span className="flex shrink-0 items-center gap-1 tabular-nums">
                          <Input aria-label={`Quantity of ${p.name}`} type="number" min={1} inputSize="sm" className="w-16" value={l.qty} onChange={(e) => setParts((x) => x.map((i) => (i.id === l.id ? { ...i, qty: Math.max(1, Number(e.target.value) || 1) } : i)))} />
                          {peso(l.qty * p.price)}
                          <IconButton icon={Trash} label={`Remove ${p.name}`} variant="subtle" size="sm" onClick={() => setParts((x) => x.filter((i) => i.id !== l.id))} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>

        <Field label="Attachments" hint="Photos or documents; multiple files allowed.">
          <Button type="button" variant="secondary" leftIcon={UploadSimple}>Choose files</Button>
        </Field>
      </form>
    </OffCanvas>
  );
}
