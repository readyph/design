import { TrackingLink } from '../TrackingLink';
import { customerOf, vehicleOf, type Job } from './data';
import { LINK_EXPIRY_DAYS, ensureLink, regenerateLink, urlOf, useLinks } from './trackerLinks';

/** The TrackingLink bound to the mock token store (Storybook pages and tests). The public `TrackingLink` takes the url and callbacks as props. */
export function LiveTrackingLink({ job, className }: { job: Pick<Job, 'id' | 'number' | 'customerId' | 'vehicleId'>; className?: string }) {
  const links = useLinks();
  const token = links.current[job.id] ?? ensureLink(job.id);
  const full = job as Job;
  const c = customerOf(full);
  return (
    <TrackingLink
      jobNumber={job.number} plate={vehicleOf(full).plate} customerName={c.name} customerPhone={c.phone}
      url={urlOf(token)} qrValue={token} expiryDays={LINK_EXPIRY_DAYS} onSendSms={() => {}} onRegenerate={() => { regenerateLink(job.id); }} className={className}
    />
  );
}
