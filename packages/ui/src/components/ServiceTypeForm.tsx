import { useState } from 'react';
import { Button } from './Button';
import { Notice } from './Notice';
import { Select } from './Select';
import { TextField, Textarea } from './TextField';
import { Modal } from './Modal';
import { peso } from './sms/data';
import { MoneyField } from './MoneyField';
import { CATEGORIES, VEHICLE_SCOPE_LABEL, newTypeId, partsCost, partsStock, type Category, type ServicePart, type ServiceType, type VehicleScope } from './sms/catalogue';
import { ServicePartsEditor } from './ServicePartsEditor';
import type { PartSearch, PartsStatus } from './PartPicker';
import { useWizardData } from './sms/wizardData';
import type { Product } from './sms/data';
import { useDirtyGuard } from './DirtyGuard';

const MINS = [15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360].map((m) => ({ value: String(m), label: m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` }));
const digits = (s: string) => s.replace(/\D/g, '');

/**
 * Studio-only ServiceTypeForm (NEW): add or edit one service in the catalogue, in a modal (full screen on a phone).
 * Name, category, default price, estimated time (sets the calendar card length), vehicle type, description. Deactivate / Reactivate sits in the footer.
 */
export function ServiceTypeForm({ type, onSave, onClose, onToggleActive, products, searchParts, partsStatus }: { /** Host data for the parts section (RDY-629): products to show linked parts, the Inventory search and how Inventory is answering. */ products?: Product[]; searchParts?: PartSearch; partsStatus?: PartsStatus; type: ServiceType | null; onSave: (t: ServiceType) => void; onClose: () => void; /** Deactivate / Reactivate (the page asks to confirm). Only for an existing service. */ onToggleActive?: (t: ServiceType) => void }) {
  const wd = useWizardData();
  const [picked, setPicked] = useState<Product[]>([]);
  const listed = [...(products ?? wd.products), ...picked];
  const [name, setName] = useState(type?.name ?? '');
  const [category, setCategory] = useState<Category>(type?.category ?? 'Maintenance');
  const [price, setPrice] = useState(type ? String(type.price) : '');
  const [mins, setMins] = useState(String(type?.mins ?? 60));
  const [vehicle, setVehicle] = useState<VehicleScope>(type?.vehicle ?? 'all');
  const [description, setDescription] = useState(type?.description ?? '');
  const [parts, setParts] = useState<ServicePart[]>(type?.parts ?? []);
  const [tried, setTried] = useState(false);
  const partsKey = (p: ServicePart[]) => p.map((x) => `${x.productId}:${x.qty}`).join(',');
  const dirty = name !== (type?.name ?? '') || category !== (type?.category ?? 'Maintenance') || price !== (type ? String(type.price) : '') || mins !== String(type?.mins ?? 60) || vehicle !== (type?.vehicle ?? 'all') || description !== (type?.description ?? '') || partsKey(parts) !== partsKey(type?.parts ?? []);
  const { guard, node } = useDirtyGuard(dirty);
  const nameErr = !name.trim() ? 'Give the service a name.' : undefined;
  const priceErr = !price ? 'Enter a price. Use 0 if it is quoted per job.' : undefined;
  const submit = () => {
    setTried(true);
    if (nameErr || priceErr) return;
    onSave({ ...(type ?? { id: newTypeId(), active: true }), name: name.trim(), category, price: Number(price), mins: Number(mins), vehicle, description: description.trim() || undefined, parts: parts.length ? parts : undefined });
  };
  const labour = Number(price) || 0;
  const pc = partsCost(parts, listed);
  const stock = partsStock(parts, listed);
  const lbl = 'mb-1 block text-ui font-medium text-text';
  const summary = (
    <dl aria-label="Price at a glance" className="rounded-card border border-rule bg-raised p-4 text-[14px]">
      <dt className="text-[12px] font-medium uppercase tracking-wide text-muted">Price at a glance</dt>
      <dd className="m-0 mb-3 mt-1 text-[26px] font-semibold leading-8 tabular-nums">{peso(labour + pc)}</dd>
      <div className="flex justify-between gap-4 py-0.5"><dt className="text-muted">Labour (you set this)</dt><dd className="tabular-nums">{peso(labour)}</dd></div>
      <div className="flex justify-between gap-4 py-0.5"><dt className="text-muted">Parts ({parts.length}, Inventory price)</dt><dd className="tabular-nums">{peso(pc)}</dd></div>
      <div className="mt-2 flex justify-between gap-4 border-t border-control pt-2 font-semibold"><dt>Customer pays about</dt><dd className="tabular-nums">{peso(labour + pc)}</dd></div>
      <p className="mt-3 text-[12px] leading-[18px] text-muted">Labour {peso(labour)} + parts {peso(pc)} = {peso(labour + pc)}. Parts follow the Inventory sell price, so this total moves when Inventory changes a price.</p>
    </dl>
  );
  return (
    <Modal open onOpenChange={(o) => !o && guard(onClose)} size="form" aria-label={type ? `Edit ${type.name}` : 'Add a service'}>
      <Modal.Header description="Shown when a manager picks services for a job. The price is only a starting point; it can be changed on each job.">{type ? 'Edit service' : 'Add a service'}</Modal.Header>
      <Modal.Body>
        <form id="service-type-form" className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-x-10 gap-y-6 max-[860px]:grid-cols-1" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
          <div className="min-w-0 space-y-5">
            <TextField size="large" label="Service name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brake pad replacement, front" error={tried ? nameErr : undefined} autoFocus />
            <div className="grid grid-cols-2 items-start gap-x-4 gap-y-5 max-[640px]:grid-cols-1">
              <div className="min-w-0"><span id="st-cat" className={lbl}>Category</span><Select aria-labelledby="st-cat" value={category} onValueChange={(v) => setCategory(v as Category)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></div>
              <div className="min-w-0"><span id="st-veh" className={lbl}>Vehicle type</span><Select aria-labelledby="st-veh" value={vehicle} onValueChange={(v) => setVehicle(v as VehicleScope)} options={(Object.keys(VEHICLE_SCOPE_LABEL) as VehicleScope[]).map((v) => ({ value: v, label: VEHICLE_SCOPE_LABEL[v] }))} /></div>
              <MoneyField size="large" label="Labour price" inputMode="numeric" value={price} onChange={(e) => setPrice(digits(e.target.value))} placeholder="0" error={tried ? priceErr : undefined} hint="What you charge for the work. Parts are priced separately." />
              <div className="min-w-0"><span id="st-min" className={lbl}>Estimated time</span><Select aria-labelledby="st-min" value={mins} onValueChange={setMins} options={MINS} /><p className="m-0 mt-1 text-small text-muted">Sets how long its card is on the calendar.</p></div>
            </div>
            <Textarea label="Description (optional)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} hint="What is included. Mechanics see it too." />
            <section aria-labelledby="st-parts" className="border-t border-rule pt-5">
              <h3 id="st-parts" className="text-[15px] font-semibold">Parts used</h3>
              <p className="mb-3 mt-0.5 text-[13px] text-muted">Inventory products this service normally uses. When you add the service to a job, these parts come with it, at today&rsquo;s Inventory price. You can change or remove them on the job.</p>
              <ServicePartsEditor parts={parts} onChange={setParts} products={products} search={searchParts} status={partsStatus} onProduct={(p) => setPicked((l) => [...l.filter((x) => x.id !== p.id), p])} />
              {(stock.state === 'low' || stock.state === 'out' || stock.state === 'on_order') && <div className="mt-3"><Notice tone="warn" title={stock.state === 'low' ? 'A linked part is low on stock' : stock.state === 'on_order' ? 'A linked part is out of stock, on order' : 'A linked part is out of stock'}>{stock.worst}. The service can still be sold; the job will warn the manager.</Notice></div>}
            </section>
          </div>
          <aside aria-label="Summary" className="min-w-0 min-[861px]:sticky min-[861px]:top-0">{summary}</aside>
        </form>
      </Modal.Body>
      <Modal.Footer>
        {type && onToggleActive && <Button variant={type.active ? 'danger' : 'secondary'} onClick={() => onToggleActive(type)} className="mr-auto max-[640px]:mr-0">{type.active ? 'Deactivate' : 'Reactivate'}</Button>}
        <Button variant="text" onClick={() => guard(onClose)}>Cancel</Button>
        <Button variant="primary" type="submit" form="service-type-form">{type ? 'Save changes' : 'Add service'}</Button>
      </Modal.Footer>
      {node}
    </Modal>
  );
}
