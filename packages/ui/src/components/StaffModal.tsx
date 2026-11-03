import { useState } from 'react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Notice } from './Notice';
import { Select } from './Select';
import { Switch } from './Switch';
import { TextField } from './TextField';
import { Modal } from './Modal';
import { useDirtyGuard } from './DirtyGuard';
import { WeekHoursEditor, Group } from './SettingsFields';
import { BAYS, ROLE_LABEL, ROLE_NOTE, defaultShift, newStaffId, summarizeWeek, validateStaff, type Staff, type StaffRole } from './sms/settingsModel';

const ROLES = (Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }));
const BAY_OPTIONS = BAYS.map((b) => ({ value: b || 'none', label: b || 'No bay' }));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Studio-only StaffModal (NEW): Edit staff / Add staff in one modal (full screen on a phone). Deactivate is a danger button in the footer, like the catalogue modal. */
export function StaffModal({ staff, onSave, onToggleActive, onClose }: { staff: Staff | null; onSave: (s: Staff, invite: boolean) => void; onToggleActive?: (s: Staff) => void; onClose: () => void }) {
  const base: Staff = staff ?? { id: newStaffId(), name: '', phone: '', email: '', role: 'mechanic', active: true, hours: defaultShift('mechanic'), bay: '' };
  const [d, setD] = useState<Staff>(base);
  const [invite, setInvite] = useState(true);
  const [tried, setTried] = useState(false);
  const dirty = !same(d, base);
  const { guard, node } = useDirtyGuard(dirty);
  const errs = validateStaff(d, invite && !staff);
  const set = <K extends keyof Staff>(k: K, v: Staff[K]) => setD((x) => ({ ...x, [k]: v }));
  const submit = () => { setTried(true); if (Object.keys(errs).length) return; onSave({ ...d, name: d.name.trim(), phone: d.phone.trim(), email: d.email.trim(), invited: !staff && invite ? true : d.invited }, invite && !staff); };
  return (
    <Modal open onOpenChange={(o) => !o && guard(onClose)} size="lg" aria-label={staff ? `Edit ${staff.name}` : 'Add staff'}>
      <Modal.Header description={staff ? 'Their role decides what they can see and change.' : 'They get a text or an email to set up their sign-in.'}>{staff ? 'Edit staff' : 'Add staff'}</Modal.Header>
      <Modal.Body>
        <form id="staff-form" className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
          <TextField label="Full name" value={d.name} onChange={(e) => set('name', e.target.value)} error={tried ? errs.name : undefined} autoFocus />
          <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            <TextField label="Mobile number" type="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} error={tried ? errs.phone : undefined} placeholder="0917 555 0142" />
            <TextField label="Email (optional)" type="email" value={d.email} onChange={(e) => set('email', e.target.value)} error={tried ? errs.email : undefined} />
          </div>
          <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            <div><span id="sf-role" className="mb-1 block text-ui font-medium text-text">Role</span>
              <Select aria-labelledby="sf-role" value={d.role} disabled={!!staff?.you} onValueChange={(v) => setD((x) => ({ ...x, role: v as StaffRole, hours: same(x.hours, defaultShift(x.role)) ? defaultShift(v as StaffRole) : x.hours }))} options={ROLES} /></div>
            <div><span id="sf-bay" className="mb-1 block text-ui font-medium text-text">Assigned bay (optional)</span>
              <Select aria-labelledby="sf-bay" value={d.bay || 'none'} onValueChange={(v) => set('bay', v === 'none' ? '' : v)} options={BAY_OPTIONS} /></div>
          </div>
          <Notice tone="info">{ROLE_NOTE[d.role]}</Notice>
          {staff && (
            <Switch checked={d.active} disabled={!!staff.you} onCheckedChange={(v) => set('active', v)} label={d.active ? 'Active' : 'Inactive'} description={staff.you ? "You can't deactivate yourself." : d.active ? 'Can sign in and be given services.' : 'Cannot sign in or be given services. Past jobs keep their name.'} />
          )}
          {!staff && <Checkbox checked={invite} onChange={(e) => setInvite(e.target.checked)} label="Send invite" hint={d.email.trim() ? 'We text and email them a link to set up their sign-in.' : 'We text them a link to set up their sign-in.'} />}
          <Group title="Shift" help={`Working days and hours. Now: ${summarizeWeek(d.hours)}.`}>
            <WeekHoursEditor value={d.hours} onChange={(h) => set('hours', h)} openWord="Works" closedWord="Day off" />
          </Group>
        </form>
      </Modal.Body>
      <Modal.Footer>
        {staff && !staff.you && onToggleActive && <Button variant={staff.active ? 'danger' : 'secondary'} onClick={() => onToggleActive(staff)} className="mr-auto max-[640px]:mr-0">{staff.active ? 'Deactivate' : 'Reactivate'}</Button>}
        <Button variant="text" onClick={() => guard(onClose)}>Cancel</Button>
        <Button variant="primary" type="submit" form="staff-form">{staff ? 'Save changes' : 'Add staff'}</Button>
      </Modal.Footer>
      {node}
    </Modal>
  );
}
