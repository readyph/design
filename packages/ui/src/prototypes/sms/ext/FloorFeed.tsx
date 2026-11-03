import { FloorFeed as PublicFloorFeed, type FloorFeedProps as PublicProps, type FeedTab } from '../../../index';
import { branch, inquiries, partMovements, productOf, type Job } from '../data';
import { hm, shortName, todayEnv, viewOf } from '../floorModel';
import { useMech } from '../mechModel';

export type { FeedTab };
export type FloorFeedProps = Omit<PublicProps<Job>, 'env' | 'view' | 'inquiries' | 'partMovements' | 'productOf' | 'mechItems' | 'inventoryName' | 'branchName' | 'floorReadAt' | 'partsLoadedAt'>;

/** The public FloorFeed on the mock data: inquiries, movements, lookups and the mechanic app's store come from the studio data. */
export function FloorFeed(props: FloorFeedProps) {
  const mech = useMech();
  /** From the mechanic app: part requests waiting for an OK and found issues waiting for a quote. */
  const mechItems = [
    ...mech.requests.filter((r) => r.status === 'Requested' && /^rq\d{3}/.test(r.id)).map((r) => ({ id: r.id, title: shortName(productOf(r.productId)), time: hm(r.at), detail: `${r.qty} for ${props.jobs.find((j) => j.id === r.jobId)?.number ?? 'shop use'} · asked by ${r.by.replace('m-', '')}`, tag: 'Part requested' })),
    ...mech.proposals.filter((p) => !p.status).map((p) => ({ id: p.id, title: 'Found issue', time: hm(p.at), detail: `${props.jobs.find((j) => j.id === p.jobId)?.number ?? ''} · ${p.text}`, tag: 'Needs your quote' })),
  ];
  return <PublicFloorFeed<Job> {...props} env={todayEnv} view={viewOf} inquiries={inquiries} partMovements={partMovements} productOf={productOf} mechItems={mechItems} inventoryName={branch.inventory.platform} branchName={branch.name} floorReadAt="10:20" partsLoadedAt="10:02" />;
}
