/**
 * View-model types for the customer tracker (TrackerBlocks, ChatPanel). Plain data, redacted the way `GET /public/tracker/{token}` returns it:
 * first name only, masked plate, no phone, no internal notes, no line prices. The components are controlled: data in, callbacks out, no store access.
 */
export type TrackerStage = 'received' | 'working' | 'waiting' | 'ready' | 'done';
export type QuoteAnswer = 'approved' | 'declined';

export interface TrackerPerson { id: string; name: string; initials: string }

export interface TrackerWhoView {
  firstName: string;
  /** "Toyota Vios 2019" */
  car: string;
  /** Already masked, e.g. "NBC••21". */
  plate: string;
  service: string;
  /** Job order number. */
  number: string;
}

export interface TrackerStatusView {
  stage: TrackerStage;
  word: string;
  sentence: string;
  /** Index into the four-step line (0 to 3). */
  step: number;
  /** "Promised: today, 3:00 pm", or null. */
  promise: string | null;
}

export interface TrackerItemView { name: string; done: boolean }

export interface TrackerUpdateView {
  id: string;
  kind: 'event' | 'note' | 'quote';
  title: string;
  text: string;
  /** Number of photos attached (the redacted view carries a count, not the files). */
  photos: number;
  /** Ready-made time label, e.g. "10 min ago". */
  when: string;
  /** Who posted it, e.g. "Manager", "Jun", "The shop". */
  by: string;
  /** Avatar person for notes; null shows the event icon. */
  person: TrackerPerson | null;
}

export interface TrackerQuoteView {
  id: string;
  text: string;
  photos: number;
  amount: number;
  note: string;
  customer: 'waiting' | 'approved' | 'declined';
}

export interface TrackerPaymentView { balance: number; paid: number; readyForPickup: boolean }

export interface TrackerChatMessage {
  id: string;
  from: 'customer' | 'manager';
  text: string;
  /** ISO timestamp with offset. */
  at: string;
  /** Manager messages only: false until the customer has seen it. */
  read?: boolean;
}

export interface TrackerChatManager extends TrackerPerson { short: string }
export interface TrackerChatShop { name: string; open: boolean; /** "Open until 5:30 pm, replies here" */ note: string }

/** The whole redacted tracker, as one object (what an app builds from the API response). */
export interface TrackerView {
  who: TrackerWhoView;
  status: TrackerStatusView;
  quotes: TrackerQuoteView[];
  items: TrackerItemView[];
  payment: TrackerPaymentView | null;
  updates: TrackerUpdateView[];
  chat: TrackerChatMessage[];
}

/** Controlled-action state shared by the interactive blocks. */
export interface PendingError { pending?: boolean; error?: string | null }
