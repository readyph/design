import { useEffect, useRef, useState } from 'react';
import { ArrowsClockwise, ChatText, Copy, QrCode } from '@phosphor-icons/react';
import { Badge } from './Badge';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { toast } from './toast/toastStore';
import { cn } from '../utils/cn';
import { customerOf, vehicleOf, type Job } from './sms/data';
import { LINK_EXPIRY_DAYS, ensureLink, regenerateLink, urlOf, useLinks } from './sms/trackerLinks';
import { QrStandIn } from './QrStandIn';

/**
 * Studio-only TrackingLink (NEW): the manager's "Customer tracking link" block. The unique link to the customer's tracking page, with Copy link,
 * Show QR (modal), Send by SMS (simulated) and Regenerate link (confirm; the old link stops working). Used in the booked confirmation and the service detail.
 */
export function TrackingLink({ job, className }: { job: Pick<Job, 'id' | 'number' | 'customerId' | 'vehicleId'>; className?: string }) {
  const links = useLinks();
  const token = links.current[job.id] ?? ensureLink(job.id);
  const url = urlOf(token);
  const [note, setNote] = useState('');
  const [qr, setQr] = useState(false);
  const [ask, setAsk] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (m: string) => { setNote(m); clearTimeout(timer.current); timer.current = setTimeout(() => setNote(''), 4000); };
  const full = job as Job;
  const c = customerOf(full);
  const copy = () => { try { void navigator.clipboard?.writeText(url).catch(() => undefined); } catch { /* clipboard blocked: the link stays selectable */ } say('Link copied.'); toast.info('Tracking link copied.'); };
  const sms = () => { say(`Sent by SMS to ${c.name}, ${c.phone} (simulated).`); toast.info(`Tracking link sent by SMS to ${c.name.split(' ')[0]} (simulated).`); };
  return (
    <div className={cn('text-[13px] leading-5', className)} data-tracking-link>
      <p className="text-muted">The customer follows this service without logging in. Works until {LINK_EXPIRY_DAYS} days after pick-up.</p>
      <p className="mt-3 select-all break-all rounded-control border border-control bg-surface px-3 py-2 font-mono text-[12px] leading-5" aria-label="Tracking link" data-url>{url}</p>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-2">
        <Button variant="secondary" fullWidth leftIcon={Copy} onClick={copy}>Copy link</Button>
        <Button variant="secondary" fullWidth leftIcon={QrCode} onClick={() => setQr(true)}>Show QR</Button>
        <Button variant="secondary" fullWidth leftIcon={ChatText} onClick={sms}>Send by SMS</Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 border-t border-rule pt-2">
        <span className="text-muted">Shared by mistake?</span>
        <button type="button" className="inline-flex min-h-8 items-center gap-1 font-semibold text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" onClick={() => setAsk(true)}><ArrowsClockwise size={14} aria-hidden />Regenerate link</button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">{note}</p>
      <Modal open={qr} onOpenChange={setQr} size="sm" title="Tracking QR" description={`${job.number} · ${vehicleOf(full).plate}. Show it at the counter; the customer scans it with the phone camera.`}
        footer={<><Button variant="secondary" onClick={() => setQr(false)}>Close</Button><Button variant="primary" leftIcon={Copy} onClick={copy}>Copy link</Button></>}>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative rounded-control border border-rule bg-surface p-3">
            <QrStandIn value={token} />
          </div>
          <p className="text-[14px] font-medium">Scan to follow your service</p>
          <p className="max-w-full break-all text-center font-mono text-[12px] leading-5 text-muted">{url}</p>
          <Badge tone="neutral">Preview only: not scannable</Badge>
        </div>
      </Modal>
      <ConfirmDialog open={ask} onOpenChange={setAsk} title="Make a new link?" description={`The old link and QR for ${job.number} stop working at once. Share the new one with ${c.name.split(' ')[0]}.`} confirmLabel="Make new link" cancelLabel="Keep this link" icon={ArrowsClockwise}
        onCancel={() => setAsk(false)} onConfirm={() => { regenerateLink(job.id); setAsk(false); say('New link made. The old one no longer works.'); toast.info('New tracking link made. The old one no longer works.'); }} />
    </div>
  );
}

