import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowsClockwise, ChatText, Copy, QrCode } from '@phosphor-icons/react';
import { Badge } from './Badge';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { toast } from './toast/toastStore';
import { cn } from '../utils/cn';
import { QrStandIn } from './QrStandIn';

export interface TrackingLinkProps {
  /** The service number (JO-0412), used in the QR and confirm text. */
  jobNumber: string;
  /** Plate shown in the QR dialog. */
  plate: string;
  /** The customer the link is shared with. */
  customerName: string;
  customerPhone: string;
  /** The service's current tracking link. */
  url: string;
  /** What the QR encodes (default: the url). */
  qrValue?: string;
  /** Days after pick-up that the link keeps working. */
  expiryDays: number;
  /** Called after the link is copied. */
  onCopy?: () => void;
  /** Called when the manager sends the link by SMS. The page sends it; the block only reports it. */
  onSendSms?: () => void;
  /** Called when the manager confirms "Make new link". The page issues the new token and passes the new `url`; the old link stops working. */
  onRegenerate: () => void;
  /** Replace the stand-in QR with a real one (an image or QR component). */
  qr?: ReactNode;
  className?: string;
}

/**
 * The manager's "Customer tracking link" block. The unique link to the customer's tracking page, with Copy link,
 * Show QR (modal), Send by SMS and Regenerate link (confirm; the old link stops working). Data and actions come in as props.
 */
export function TrackingLink({ jobNumber, plate, customerName, customerPhone, url, qrValue, expiryDays, onCopy, onSendSms, onRegenerate, qr: qrNode, className }: TrackingLinkProps) {
  const [note, setNote] = useState('');
  const [qr, setQr] = useState(false);
  const [ask, setAsk] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (m: string) => { setNote(m); clearTimeout(timer.current); timer.current = setTimeout(() => setNote(''), 4000); };
  const copy = () => { try { void navigator.clipboard?.writeText(url).catch(() => undefined); } catch { /* clipboard blocked: the link stays selectable */ } say('Link copied.'); toast.info('Tracking link copied.'); onCopy?.(); };
  const sms = () => { onSendSms?.(); say(`Sent by SMS to ${customerName}, ${customerPhone} (simulated).`); toast.info(`Tracking link sent by SMS to ${customerName.split(' ')[0]} (simulated).`); };
  return (
    <div className={cn('text-[13px] leading-5', className)} data-tracking-link>
      <p className="text-muted">The customer follows this service without logging in. Works until {expiryDays} days after pick-up.</p>
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
      <Modal open={qr} onOpenChange={setQr} size="sm" title="Tracking QR" description={`${jobNumber} · ${plate}. Show it at the counter; the customer scans it with the phone camera.`}
        footer={<><Button variant="secondary" onClick={() => setQr(false)}>Close</Button><Button variant="primary" leftIcon={Copy} onClick={copy}>Copy link</Button></>}>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative rounded-control border border-rule bg-surface p-3">
            {qrNode ?? <QrStandIn value={qrValue ?? url} />}
          </div>
          <p className="text-[14px] font-medium">Scan to follow your service</p>
          <p className="max-w-full break-all text-center font-mono text-[12px] leading-5 text-muted">{url}</p>
          <Badge tone="neutral">Preview only: not scannable</Badge>
        </div>
      </Modal>
      <ConfirmDialog open={ask} onOpenChange={setAsk} title="Make a new link?" description={`The old link and QR for ${jobNumber} stop working at once. Share the new one with ${customerName.split(' ')[0]}.`} confirmLabel="Make new link" cancelLabel="Keep this link" icon={ArrowsClockwise}
        onCancel={() => setAsk(false)} onConfirm={() => { onRegenerate(); setAsk(false); say('New link made. The old one no longer works.'); toast.info('New tracking link made. The old one no longer works.'); }} />
    </div>
  );
}

