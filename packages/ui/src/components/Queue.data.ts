import type { QueueDoneItem, QueueItem, QueuePlatform, QueueSnoozedItem, QueueWatchItem } from './Queue';

/** Sample data shared by the Queue stories and tests. Replace before real use. */
export const auto: QueuePlatform = { id: 'auto', name: 'Cubao Auto Works', index: 1 };
export const stock: QueuePlatform = { id: 'stock', name: 'Main Stockroom', index: 2 };
export const cafe: QueuePlatform = { id: 'cafe', name: 'Café POS', index: 3 };
export const hq: QueuePlatform = { id: 'hq', name: 'HQ', hq: true };
export const allPlatforms = [auto, stock, cafe, hq];

export const items: QueueItem[] = [
  { id: 'q1', platform: auto, due: '9:45', urgent: true, title: 'Alternator for the 11:00 Vios', detail: 'Not in stock. Leda drafted the order.', action: 'Order alternator' },
  { id: 'q2', platform: stock, due: '10:30', title: 'PO-0221 waits for your OK', detail: '12 lines, ₱48,200 from Parts Depot', action: 'Confirm PO' },
  { id: 'q3', platform: hq, source: 'HQ · Team', due: 'Today', title: 'Marco Reyes accepted the invite', detail: 'Approve as Service advisor', action: 'Approve invite' },
  { id: 'q4', platform: cafe, due: 'Fri', title: 'Supplier invoice differs by ₱420', detail: 'Delivery DR-3381 vs invoice INV-77', action: 'Dispute or accept' },
];
export const watching: QueueWatchItem[] = [
  { id: 'w1', platform: stock, title: 'Brake pads reorder point in 2 days', detail: 'Leda will draft when it hits 6 left' },
  { id: 'w2', platform: auto, title: 'Vios 11:00 ready to pick up' },
];
export const snoozed: QueueSnoozedItem[] = [{ id: 's1', platform: cafe, title: 'Milk stock count off by 3', until: 'Later today · 13:00' }];
export const done: QueueDoneItem[] = [
  { id: 'd1', platform: auto, title: 'Oil filter order sent to Parts Depot', at: '8:12' },
  { id: 'd2', platform: hq, source: 'HQ · Plan', title: 'Plan renewal confirmed', at: '8:40' },
];
export const manyItems: QueueItem[] = Array.from({ length: 12 }, (_, i) => ({
  ...items[i % items.length],
  id: `m${i}`,
  title: `${items[i % items.length].title} (${i + 1})`,
}));
