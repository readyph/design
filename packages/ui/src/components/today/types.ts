/**
 * Structural types for the Today page components (JobRow, PartChip, SidePanelLayout). They describe the shape a consumer's data must have and
 * carry no data: the API client types of a platform satisfy them as they are.
 */
export type JobStatus = 'QUOTATION' | 'FOR_APPROVAL' | 'TODO' | 'IN_PROGRESS' | 'PENDING' | 'FOR_PICKUP' | 'COMPLETED';
export type PendingReason = 'WAITING_FOR_PARTS' | 'WAITING_FOR_CUSTOMER' | 'WAITING_FOR_ANOTHER_MECHANIC' | 'OTHER';
/** Why a service needs the manager (the "stuck" reasons). */
export type NeedsReason = 'OVERDUE' | 'PARTS' | 'APPROVAL' | 'PICKUP_UNPAID';
export type TodayStockState = 'in' | 'low' | 'out' | 'on_order';

export interface TodayStockLocation { name: string; qty: number; thisBranch: boolean }
export interface TodayOnOrder { po: string; qty: number; eta: string; supplier: string }
export interface TodayProduct {
  id: string; sku: string; name: string; unit: string; price: number; reorder: number;
  locations: TodayStockLocation[]; onOrder?: TodayOnOrder;
}
export interface TodayMechanic { id: string; name: string; short: string; initials: string }
export interface TodayJob {
  id: string; number: string; status: JobStatus; assigneeId: string | null;
  statusSince: string; promisedAt: string | null;
  pendingReason?: PendingReason; pendingNote?: string; quoteSentAt?: string; quoteParked?: boolean;
  services: { name: string }[];
}
export interface TodayInquiry {
  id: string; at: string; channel: 'Text' | 'Call' | 'Walk-in' | 'Messenger'; name: string; text: string; jobId?: string; repliedAt?: string;
}
/** A stock movement of the day (stock in / out), as Inventory reports it. */
export interface TodayPartMovement { id: string; at: string; productId: string; qty: number; dir: 'in' | 'out'; ref: string; by: string }
/** What a job row shows about the car and the customer. */
export interface TodayJobView { vehicle: string; plate: string; customer: string }

/** The action a row offers next. `pay`: it opens the Payment page instead of changing the status. */
export interface NextAction { label: string; to: { status?: JobStatus }; toast: string; pay?: boolean }
export interface Flag { tone: 'bad' | 'warn'; word: string }

/**
 * Everything the helpers need that is not in the job itself: the clock and the stock rules. Passed in, never read from a module,
 * so the same code runs on mock data (Storybook) and on API data. Method syntax: an env typed for a richer job still fits.
 */
export interface TodayEnv {
  /** ISO timestamp of "now". */
  now: string;
  /** The calendar day of `now`, `YYYY-MM-DD`. */
  today: string;
  stockState(p: TodayProduct): TodayStockState;
  /** Stock held at other branches (only locations with quantity). */
  elsewhere(p: TodayProduct): TodayStockLocation[];
  /** Part lines of the job the branch cannot cover, as their products. */
  shortParts(j: TodayJob): TodayProduct[];
  /** What the customer still owes on the job, in pesos. */
  balance(j: TodayJob): number;
  peso(n: number): string;
}

/**
 * A change Leda proposes and the manager confirms. `jobIds` scopes it to services (the Inspector lists a service's own proposals);
 * `writes` / `cannot` are the plain lines the card shows; nothing is written until the consumer's confirm callback runs.
 */
export interface LedaProposalData {
  id: string; title: string; why: string; jobIds: string[];
  writes: string[]; cannot?: string; confirmLabel: string; platform: 'SMS' | 'Inventory' | 'SMS + Inventory';
}

/** What the Inspector reads from a service beyond `TodayJob`. Structural: an API job with these fields fits. */
export interface InspectorJob extends TodayJob {
  complaint: string;
  services: { name: string; price: number; qty: number; done?: boolean }[];
  parts: { productId: string; qty: number }[];
}
export interface InspectorMechanic extends TodayMechanic { bay: string }
/** The quotation kept with a service. `open`: it is still waiting for the customer; `validUntil` is the display date. */
export interface InspectorQuotation { number: string; open: boolean; validUntil: string }
/** One lane of the shop floor: a mechanic, the counter or the unassigned queue. */
export interface FloorLane<J extends TodayJob = TodayJob> { id: string; name: string; sub: string; initials?: string; jobs: J[]; manager?: boolean }
/** A place a chip can be moved to (the "Move to..." menu): a mechanic, with their bay as the meta. */
export interface FloorMoveTarget { id: string; label: string; meta?: string; /** Draws the separator above this entry. */ separatorBefore?: boolean }
/** A row from another app that waits on the manager (a mechanic's part request or found issue). */
export interface FeedMechItem { id: string; title: string; time: string; detail: string; tag: string }
