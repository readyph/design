import { Inspector, type InspectorProps } from '../Inspector';
import { branch, customerOf, ledaProposals, loadError, mechanics, products, type Job } from './data';
import { money, todayEnv, viewOf } from './floorModel';
import { hasQuotation, isQuote, quoteNoOf, docFromJob } from './wizardModel';
import { longDay } from './scheduleModel';

type Injected = 'env' | 'view' | 'customerPhone' | 'mechanics' | 'products' | 'inventoryName' | 'totals' | 'quotation' | 'loadError' | 'proposals';

/** The data props the Inspector needs for a mock-data service (what a platform's API client supplies in the product). */
export function inspectorData(job: Job | null): Pick<InspectorProps<Job>, Injected> {
  return {
    env: todayEnv,
    view: job ? viewOf(job) : undefined,
    customerPhone: job ? customerOf(job).phone : undefined,
    mechanics,
    products,
    inventoryName: branch.inventory.platform,
    totals: job ? { total: money.total(job), paid: money.paid(job) } : undefined,
    quotation: job && hasQuotation(job) ? { number: quoteNoOf(job), open: isQuote(job), validUntil: longDay(docFromJob(job).validUntil) } : null,
    loadError,
    proposals: ledaProposals,
  };
}

/** The Inspector bound to the mock data (Storybook pages and tests). The public `Inspector` takes all of this as props. */
export function LiveInspector({ job, floorProposalIds = ['lp2'], ...rest }: Omit<InspectorProps<Job>, Injected> & Partial<Pick<InspectorProps<Job>, Injected>>) {
  return <Inspector<Job> {...inspectorData(job)} {...rest} job={job} floorProposalIds={floorProposalIds} />;
}
