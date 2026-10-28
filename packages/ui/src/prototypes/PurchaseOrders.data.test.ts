import { describe, expect, it } from 'vitest';
import { purchaseOrdersModel, STW } from './PurchaseOrders.data';

/* expected strings are the workshop purchase-orders.js results for the same URL params (checked against all tenant, role, state, asof, pos=none, f and po combinations) */
describe('PurchaseOrders.data', () => {
  it('names the six statuses', () => {
    expect(Object.values(STW)).toEqual(['Draft', 'Sent', 'Part in', 'Short', 'Received', 'Cancelled']);
  });
  it('live headline', () => {
    expect(purchaseOrdersModel({ tenant: 'a' }).headline().text).toBe('PO-0221 came in short and waits for your manager. 1 draft is not sent yet.');
  });
  it('states: loading, error, empty store, no POs yet, quiet', () => {
    expect(purchaseOrdersModel({ state: 'loading' }).headline().loading).toBe(true);
    expect(purchaseOrdersModel({ state: 'error' }).headline().text).toBe('Purchase orders did not load, so the orders are not shown.');
    expect(purchaseOrdersModel({ state: 'empty' }).headline().text).toBe('No products yet, so there is nothing to order. Add products first.');
    const none = purchaseOrdersModel({ pos: 'none' });
    expect(none.all()).toEqual([]);
    expect(none.headline().text).toBe('No purchase orders yet. They start from an order list and show here once it is a draft.');
    expect(purchaseOrdersModel({ state: 'quiet' }).headline().text).toMatch(/^Nothing needs you\./);
  });
  it('late with asof=2 and part in PO-0223', () => {
    const m = purchaseOrdersModel({ asof: 2 });
    expect(m.todayLabel).toBe('Sat 24 Oct');
    expect(m.all().filter(m.lateDays).length).toBeGreaterThan(0);
    const p = m.byNo('PO-0223')!;
    expect(m.stKey(p)).toBe('PARTIAL');
    expect(m.inW(p)).toBe('8 sets in, 2 still due on Bosch alternator, 2 still due on Wiper blade 22"');
    expect(m.rule.inOf(8, 12)).toBe('8 of 12 in');
  });
  it('roles: clerk sees no valuation or settle rights', () => {
    const c = purchaseOrdersModel({ as: 'clerk' });
    expect(c.money).toBe(false);
    expect(c.can('accept_variance')).toBe(false);
    expect(c.can('confirm_po')).toBe(false);
    expect(purchaseOrdersModel({ as: 'manager' }).money).toBe(true);
  });
  it('one number rule', () => {
    const m = purchaseOrdersModel();
    expect(m.rule.line(5, 7)).toEqual({ ordered: 5, good: 7, received: 5, extra: 2, due: 0 });
    expect(m.rule.inOf(6, 9)).toBe('6 of 9 in');
  });
});
