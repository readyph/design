/** Display contract of the inbox (RDY-652): plain fields the caller supplies. No studio fixtures are imported here. */
export type ItemKind = 'part' | 'problem' | 'question' | 'note' | 'customer';
export type ItemStatus = 'Needs you' | 'Approved' | 'Ready' | 'Collected' | 'Declined' | 'Quoted' | 'Dismissed' | 'Answered' | 'Seen';
export const KIND_LABEL: Record<ItemKind, string> = { part: 'Part', problem: 'Problem', question: 'Question', note: 'Note', customer: 'Customer' };

/** A person as the inbox shows them. */
export interface RequestPerson { id: string; name: string; short: string; initials: string }
/** Display part of an inbox pair of fields; supplied by the caller (API rows), never looked up from studio fixtures. */
export interface RequestDisplay {
  /** Plate of the service's vehicle; null = shop use / not tied to a service. */
  plate: string | null;
  /** Service title shown next to the plate; null falls back to `title`. */
  jobTitle: string | null;
  sender: RequestPerson;
  /** Relative time word, e.g. "12 min ago". */
  agoLabel: string;
  /** Detail header extras (optional): "Toyota Vios", customer name, job number. */
  vehicleLabel?: string | null; customerName?: string | null; jobNumber?: string | null;
}
/** What RequestList needs: plain display fields only. */
export interface RequestListItem extends RequestDisplay {
  id: string; kind: ItemKind; status: ItemStatus; needsYou: boolean; unread: boolean;
  title: string; preview: string;
}

/** One post of a service thread, as RequestThread shows it. `mine` = written by the mechanic (else by the manager). */
export interface ThreadPostView { id: string; mine: boolean; kind: 'note' | 'found' | 'part' | 'manager' | 'question' | 'you'; text: string; photos?: number; meta?: string; agoLabel: string }
/** One message of the customer chat, as CustomerThread shows it. `mine` = written by the manager. */
export interface ChatPostView { id: string; mine: boolean; text: string; whenLabel: string; read?: boolean }
