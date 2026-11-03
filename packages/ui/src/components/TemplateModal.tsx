import { useRef, useState } from 'react';
import { Button } from './Button';
import { Notice } from './Notice';
import { Textarea } from './TextField';
import { Modal } from './Modal';
import { useDirtyGuard } from './DirtyGuard';
import { VARIABLES, renderTemplate, smsCount, unknownVariables, type Template } from './sms/settingsModel';

/** Studio-only TemplateModal (NEW): edit one customer text. Variable chips insert at the cursor, a live preview bubble shows sample values, the count shows characters and SMS segments, Reset to default. */
export function TemplateModal({ template, onSave, onClose }: { template: Template; onSave: (t: Template) => void; onClose: () => void }) {
  const [body, setBody] = useState(template.body);
  const [tried, setTried] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const { guard, node } = useDirtyGuard(body !== template.body);
  const preview = renderTemplate(body);
  const n = smsCount(preview);
  const unknown = unknownVariables(body);
  const insert = (token: string) => {
    const el = ref.current; const a = el?.selectionStart ?? body.length; const b = el?.selectionEnd ?? body.length;
    setBody(body.slice(0, a) + token + body.slice(b));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(a + token.length, a + token.length); });
  };
  const submit = () => { setTried(true); if (!body.trim()) return; onSave({ ...template, body: body.trim() }); };
  return (
    <Modal open onOpenChange={(o) => !o && guard(onClose)} size="lg" aria-label={`Edit text: ${template.name}`}>
      <Modal.Header description={`Sent ${template.when.charAt(0).toLowerCase()}${template.when.slice(1)}.`}>{template.name}</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <Textarea ref={ref} label="Message" rows={5} value={body} onChange={(e) => setBody(e.target.value)} error={tried && !body.trim() ? 'The message cannot be empty.' : undefined} />
          <div>
            <p id="tm-vars" className="m-0 mb-1.5 text-[13px] text-muted">Tap a variable to put it in the message. Each is replaced with the real value when the text is sent.</p>
            <div role="group" aria-labelledby="tm-vars" className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => <button key={v.id} type="button" title={v.hint} aria-label={`Insert ${v.label}, ${v.hint}`} onClick={() => insert(v.label)} className="inline-flex h-8 items-center rounded-chip border border-control bg-surface px-2.5 font-mono text-[13px] text-text hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:h-11">{v.label}</button>)}
            </div>
          </div>
          <p className="m-0 text-[13px] text-muted tabular-nums" aria-live="polite" data-testid="sms-count">{n.chars} {n.chars === 1 ? 'character' : 'characters'} · {n.segments} text {n.segments === 1 ? 'message' : 'messages'} {n.segments > 1 ? `(${n.perSegment} each)` : `(up to ${n.perSegment})`}{n.unicode ? ' · special characters make texts shorter' : ''}</p>
          {unknown.length > 0 && <Notice tone="warn">{unknown.map((u) => `{${u}}`).join(', ')} {unknown.length === 1 ? "isn't a variable" : "aren't variables"} we know, so the customer would see it as typed.</Notice>}
          {template.id === 'quote' && !body.includes('{link}') && <Notice tone="warn">Without {'{link}'} the customer cannot open the quotation to approve it.</Notice>}
          <div>
            <p className="m-0 mb-1.5 text-[12px] font-medium uppercase tracking-wide text-muted">Preview with sample values</p>
            <div className="max-w-[360px] rounded-card rounded-bl-none border border-rule bg-raised px-3 py-2 text-[14px] leading-5 text-text" data-testid="sms-preview" aria-label="Preview of the text">{preview || <span className="text-muted">Nothing to show yet.</span>}</div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" disabled={body === template.original} onClick={() => setBody(template.original)} className="mr-auto max-[640px]:mr-0">Reset to default</Button>
        <Button variant="text" onClick={() => guard(onClose)}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Save text</Button>
      </Modal.Footer>
      {node}
    </Modal>
  );
}
