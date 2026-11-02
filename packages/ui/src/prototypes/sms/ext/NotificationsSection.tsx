import { useState } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { Checkbox, toast } from '../../../index';
import { Group } from './SettingsFields';
import { TemplateModal } from './TemplateModal';
import { CHANNELS, NOTIF_EVENTS, NOTIF_ROLE_HINT, NOTIF_ROLE_LABEL, prefKey, renderTemplate, type NotifPrefs, type Template } from '../settingsModel';

const GRID = 'grid grid-cols-[minmax(0,1fr)_repeat(3,72px)] items-center max-[640px]:grid-cols-[minmax(0,1fr)_repeat(3,56px)]';

/** Studio-only PermissionMatrix (NEW): events x who x channel as a ruled checkbox grid; every box has a full accessible name ("Payment received, Manager, SMS"). */
function PermissionMatrix({ value, onChange }: { value: NotifPrefs; onChange: (v: NotifPrefs) => void }) {
  return (
    <div role="table" aria-label="Who is told about what" className="max-w-[720px] border-t border-rule">
      <div role="row" className={`${GRID} h-9 border-b border-rule`}>
        <div role="columnheader" className="text-[12px] font-medium text-muted">When this happens, tell</div>
        {CHANNELS.map((c) => <div key={c.id} role="columnheader" className="text-center text-[12px] font-medium text-muted">{c.label}</div>)}
      </div>
      {NOTIF_EVENTS.map((e) => (
        <div key={e.id} role="rowgroup" className="border-b border-rule">
          <div role="row" className="pb-1 pt-3"><div role="cell"><p className="m-0 text-[14px] font-medium">{e.label}</p><p className="m-0 text-[12px] text-muted">{e.hint}</p></div></div>
          {e.roles.map((r) => (
            <div key={r} role="row" className={`${GRID} min-h-10`}>
              <div role="cell" className="pl-3 text-[14px] text-text">{NOTIF_ROLE_LABEL[r]}{NOTIF_ROLE_HINT[`${e.id}.${r}`] && <span className="text-[12px] text-muted"> · {NOTIF_ROLE_HINT[`${e.id}.${r}`]}</span>}</div>
              {CHANNELS.map((c) => (
                <div key={c.id} role="cell" className="flex justify-center">
                  <Checkbox aria-label={`${e.label}, ${NOTIF_ROLE_LABEL[r]}, ${c.label}`} checked={!!value[prefKey(e.id, r, c.id)]} onChange={(ev) => onChange({ ...value, [prefKey(e.id, r, c.id)]: ev.target.checked })} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** F39 Notifications: the matrix (part of the page draft, saved by the Save bar) and the customer text templates (each saved in its own modal). */
export function NotificationsSection({ prefs, onPrefs, templates, onTemplates, initialTemplate = null }: { prefs: NotifPrefs; onPrefs: (p: NotifPrefs) => void; templates: Template[]; onTemplates: (t: Template[]) => void; initialTemplate?: string | null }) {
  const [open, setOpen] = useState<string | null>(initialTemplate);
  const t = templates.find((x) => x.id === open) ?? null;
  return (
    <div>
      <Group first title="Staff notifications" help="Choose who is told when something happens, and how. In-app shows in the bell; SMS and Email reach their phone or inbox.">
        <PermissionMatrix value={prefs} onChange={onPrefs} />
      </Group>
      <Group title="Customer text templates" help="The texts your customers get. Open one to change the words; the variables fill in the customer, car and amount.">
        <ul aria-label="Customer text templates" className="max-w-[720px] border-t border-rule">
          {templates.map((x) => (
            <li key={x.id} className="border-b border-rule">
              <button type="button" onClick={() => setOpen(x.id)} aria-label={`Edit text: ${x.name}`} className="flex min-h-14 w-full items-center gap-3 py-2 text-left hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{x.name}{x.body !== x.original && <span className="ml-2 text-[12px] font-normal text-muted">Edited</span>}</span>
                  <span className="block text-[12px] text-muted">{x.when}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-muted">{renderTemplate(x.body)}</span>
                </span>
                <CaretRight size={16} aria-hidden className="flex-none text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </Group>
      {t && <TemplateModal key={t.id} template={t} onClose={() => setOpen(null)} onSave={(n) => { const before = templates; onTemplates(templates.map((x) => (x.id === n.id ? n : x))); setOpen(null); toast.undo(`${n.name} text saved.`, () => onTemplates(before)); }} />}
    </div>
  );
}
