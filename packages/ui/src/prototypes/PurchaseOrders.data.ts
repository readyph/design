/* RDY-425. Data adapter for the Purchase orders prototype (Prototypes/Inventory/Purchase orders). Non-visual; prototype only, not exported from the package.
   Transcribed from workshop/prototypes/inventory-home/round-1/final/purchase-orders.js 1-148 (model: view 45-52, build 54-65, page state 93-116, headline 118, detailLine 141),
   receiving.js 64-96 (RCV.rule, plural) and 107-145 (short-delivery settle). PURCHASE_ORDERS is the workshop's own build() output
   (data.js tenants a and b after receiving.js apply, orders.js drafts, receiving.js HISTORY), dumped from the running scripts for a fresh store.
   URL params carried by POQuery: tenant, as, state, pos=none, asof, f, sup, qs, group, po, receive. Roles differ only in permissions (can). */
export const PURCHASE_ORDERS: Record<POTenant, POTenantData> = {"a":{"all":[{"no":"PO-0223","supplier":"bosch","supplierName":"Bosch Philippines","status":"PARTIAL","lines":[{"p":"p19","product":{"id":"p19","sku":"BOS-BP-F","name":"Bosch brake pad set (front)","cat":"brakes","unit":"set","onHand":9,"reorder":6,"cost":1450,"price":2350,"supplier":"bosch","loc":"D","barcode":"4801230426037"},"ordered":8,"received":8,"extra":0,"cost":1450,"total":11600},{"p":"p16","product":{"id":"p16","sku":"ALT-0412-B","name":"Bosch alternator","cat":"elec","unit":"pc","onHand":1,"reorder":2,"cost":7450,"price":10500,"supplier":"bosch","loc":"CAGE","barcode":"4801230421926"},"ordered":2,"received":0,"extra":0,"cost":7450,"total":14900},{"p":"p14","product":{"id":"p14","sku":"WB-22","name":"Wiper blade 22\"","cat":"elec","unit":"pc","onHand":2,"reorder":6,"cost":380,"price":550,"supplier":"bosch","loc":"C","barcode":"4801230419183"},"ordered":2,"received":0,"extra":0,"cost":1200,"total":2400}],"src":"data","expected":"Mon 26 Oct (rest)","ordered":"Mon 19 Oct","draftedBy":null,"receivedAt":null,"varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"unitsOrdered":12,"unitsReceived":8,"unitsExtra":0,"total":28900,"shortUnits":0,"shortValue":0},{"no":"PO-0222","supplier":"motolite","supplierName":"Motolite PH","status":"ORDERED","lines":[{"p":"p17","product":{"id":"p17","sku":"MOT-55D23L","name":"Motolite 55D23L battery","cat":"batt","unit":"pc","onHand":2,"reorder":6,"cost":4850,"price":6900,"supplier":"motolite","loc":"CAGE","barcode":"4801230423296","usePerDay":2},"ordered":6,"received":0,"extra":0,"cost":4850,"total":29100},{"p":"p18","product":{"id":"p18","sku":"MOT-NS60","name":"Motolite NS60 battery","cat":"batt","unit":"pc","onHand":5,"reorder":4,"cost":4500,"price":6300,"supplier":"motolite","loc":"CAGE","barcode":"4801230424668"},"ordered":3,"received":0,"extra":0,"cost":4500,"total":13500}],"src":"data","expected":"Fri 23 Oct","ordered":"Tue 20 Oct","draftedBy":null,"receivedAt":null,"varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"unitsOrdered":9,"unitsReceived":0,"unitsExtra":0,"total":42600,"shortUnits":0,"shortValue":0},{"no":"PO-0221","supplier":"petron","supplierName":"Petron Direct","status":"RECEIVED","lines":[{"p":"p02","product":{"id":"p02","sku":"PBR-10W40-1L","name":"Petron Blaze Racing 10W-40 1L","cat":"oils","unit":"bottle","onHand":26,"reorder":12,"cost":465,"price":595,"supplier":"petron","loc":"A","barcode":"4801230402741"},"ordered":24,"received":18,"extra":0,"cost":465,"total":11160},{"p":"p03","product":{"id":"p03","sku":"PUT-20W50-1L","name":"Petron Ultron Touring 20W-50 1L","cat":"oils","unit":"bottle","onHand":41,"reorder":12,"cost":340,"price":450,"supplier":"petron","loc":"A","barcode":"4801230404110"},"ordered":36,"received":36,"extra":0,"cost":340,"total":12240}],"src":"data","expected":"Wed 21 Oct","ordered":"Mon 19 Oct","draftedBy":null,"receivedAt":"Wed 21 Oct 17:12","varianceState":"awaiting","closedShort":false,"settleInfo":null,"dispute":null,"told":null,"unitsOrdered":60,"unitsReceived":54,"unitsExtra":0,"total":23400,"shortUnits":6,"shortValue":2790},{"no":"PO-0224","supplier":"autopro","supplierName":"Autopro Distribution","status":"DRAFT","lines":[{"p":"p07","product":{"id":"p07","sku":"FF-OF20","name":"Fleetguard FF-OF20 oil filter","cat":"filt","unit":"pc","onHand":4,"reorder":20,"cost":245,"price":380,"supplier":"autopro","loc":"B","barcode":"4801230409597"},"ordered":60,"received":0,"extra":0,"cost":245,"total":14700},{"p":"p10","product":{"id":"p10","sku":"G-6PK1195","name":"Gates 6PK1195 serpentine belt","cat":"belts","unit":"pc","onHand":0,"reorder":4,"cost":750,"price":1100,"supplier":"autopro","loc":"B","barcode":"4801230413709"},"ordered":5,"received":0,"extra":0,"cost":750,"total":3750}],"src":"draft","expected":"Thu 22 Oct · by 14:00 if sent by 10:00","ordered":null,"draftedBy":"leda","receivedAt":null,"varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"list":{"id":"L-PO-0224","no":"PO-0224","sup":"autopro","by":"leda","at":"9:02 AM","note":"","printed":null,"asked":null,"lines":[{"p":"p07","qty":60,"by":"leda"},{"p":"p10","qty":5,"by":"leda"}]},"unitsOrdered":65,"unitsReceived":0,"unitsExtra":0,"total":18450,"shortUnits":0,"shortValue":0},{"no":"PO-0220","supplier":"autopro","supplierName":"Autopro Distribution","status":"RECEIVED","lines":[{"p":"p01","product":{"id":"p01","sku":"SHX7-10W40-4L","name":"Shell Helix HX7 10W-40 4L","cat":"oils","unit":"bottle","onHand":14,"reorder":6,"cost":1690,"price":2150,"supplier":"autopro","loc":"A","barcode":"4801230401379"},"ordered":12,"received":12,"extra":0,"cost":1690,"total":20280},{"p":"p09","product":{"id":"p09","sku":"FG-LF3349","name":"Fleetguard LF3349 oil filter","cat":"filt","unit":"pc","onHand":18,"reorder":10,"cost":280,"price":420,"supplier":"autopro","loc":"B","barcode":"4801230412337"},"ordered":20,"received":20,"extra":0,"cost":280,"total":5600}],"src":"history","expected":"Tue 13 Oct","ordered":"Mon 12 Oct","draftedBy":null,"receivedAt":"Tue 13 Oct 11:20","varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"sentBy":"berto","receivedBy":"nonoy","cancelled":null,"unitsOrdered":32,"unitsReceived":32,"unitsExtra":0,"total":25880,"shortUnits":0,"shortValue":0},{"no":"PO-0219","supplier":"motolite","supplierName":"Motolite PH","status":"RECEIVED","lines":[{"p":"p18","product":{"id":"p18","sku":"MOT-NS60","name":"Motolite NS60 battery","cat":"batt","unit":"pc","onHand":5,"reorder":4,"cost":4500,"price":6300,"supplier":"motolite","loc":"CAGE","barcode":"4801230424668"},"ordered":4,"received":4,"extra":0,"cost":4500,"total":18000}],"src":"history","expected":"Sat 10 Oct","ordered":"Thu 8 Oct","draftedBy":null,"receivedAt":"Mon 12 Oct 14:05","varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"sentBy":"berto","receivedBy":"dandy","cancelled":null,"unitsOrdered":4,"unitsReceived":4,"unitsExtra":0,"total":18000,"shortUnits":0,"shortValue":0},{"no":"PO-0218","supplier":"ace","supplierName":"Ace Hardware Trading","status":"CANCELLED","lines":[{"p":"p22","product":{"id":"p22","sku":"RAG-1KG","name":"Shop rags 1kg","cat":"tools","unit":"bag","onHand":12,"reorder":5,"cost":95,"price":0,"supplier":"ace","loc":"BENCH","barcode":"4801230430140"},"ordered":24,"received":0,"extra":0,"cost":95,"total":2280},{"p":"p23","product":{"id":"p23","sku":"WD40-382","name":"WD-40 382ml","cat":"tools","unit":"can","onHand":9,"reorder":6,"cost":260,"price":380,"supplier":"ace","loc":"BENCH","barcode":"4801230431512"},"ordered":12,"received":0,"extra":0,"cost":260,"total":3120}],"src":"history","expected":"Wed 7 Oct","ordered":"Tue 6 Oct","draftedBy":null,"receivedAt":null,"varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"sentBy":"berto","cancelled":{"by":"berto","at":"Tue 6 Oct 15:40","why":"Supplier was out of stock"},"unitsOrdered":36,"unitsReceived":0,"unitsExtra":0,"total":5400,"shortUnits":0,"shortValue":0},{"no":"PO-0217","supplier":"petron","supplierName":"Petron Direct","status":"RECEIVED","lines":[{"p":"p06","product":{"id":"p06","sku":"COOL-4L","name":"Coolant 4L","cat":"oils","unit":"jug","onHand":2,"reorder":8,"cost":520,"price":720,"supplier":"petron","loc":"A","barcode":"4801230408224"},"ordered":12,"received":8,"extra":0,"cost":520,"total":6240},{"p":"p03","product":{"id":"p03","sku":"PUT-20W50-1L","name":"Petron Ultron Touring 20W-50 1L","cat":"oils","unit":"bottle","onHand":41,"reorder":12,"cost":340,"price":450,"supplier":"petron","loc":"A","barcode":"4801230404110"},"ordered":24,"received":24,"extra":0,"cost":340,"total":8160}],"src":"history","expected":"Mon 5 Oct","ordered":"Fri 2 Oct","draftedBy":null,"receivedAt":"Mon 5 Oct 10:15","varianceState":null,"closedShort":true,"settleInfo":null,"dispute":null,"told":null,"sentBy":"berto","receivedBy":"nonoy","settled":"Berto accepted the short delivery","cancelled":null,"unitsOrdered":36,"unitsReceived":32,"unitsExtra":0,"total":14400,"shortUnits":4,"shortValue":2080}],"business":{"key":"a","logo":"logo-autoworks.svg"},"now":{"iso":"2026-10-22T09:12:00+08:00","day":"Thursday","date":"Thu 22 Oct 2026","short":"Thu 22 Oct","time":"9:12 AM","hm":"09:12","lastLoaded":"9:10 AM"},"suppliers":[{"id":"petron","name":"Petron Direct","leadTime":"1-2 days"},{"id":"autopro","name":"Autopro Distribution","leadTime":"Same day if ordered by 10:00, arrives by 14:00","cutoff":"10:00","sameDayArrival":"14:00"},{"id":"motolite","name":"Motolite PH","leadTime":"1-2 days"},{"id":"bosch","name":"Bosch Philippines","leadTime":"3-5 days"},{"id":"ace","name":"Ace Hardware Trading","leadTime":"1 day"}],"people":[{"id":"berto","short":"Berto","name":"Berto Villanueva","initials":"BV"},{"id":"joy","short":"Aling Joy","name":"Joy Mendoza","initials":"JM"},{"id":"mon","short":"Mon","name":"Ramon Dela Cruz","initials":"RD"},{"id":"nonoy","short":"Nonoy","name":"Nonoy Bautista","initials":"NB"},{"id":"dandy","short":"Dandy","name":"Dandy Ramos","initials":"DR"}],"roles":{"manager":{"can":["lookup","movements","low_stock","draft_po","receive","confirm_po","accept_variance","approve_transfer","adjust_stock","stock_out","transfer","valuation","reconcile","setup"],"roleLabel":"Manager"},"clerk":{"can":["lookup","movements","low_stock","draft_po","receive","stock_out","transfer"],"roleLabel":"Stock clerk"},"owner":{"can":["lookup","movements","low_stock","draft_po","receive","confirm_po","accept_variance","approve_transfer","adjust_stock","stock_out","transfer","valuation","reconcile","setup"],"roleLabel":"Owner"}}},"b":{"all":[{"no":"PO-0046","supplier":"beans","supplierName":"Sagada Highland Coffee","status":"ORDERED","lines":[{"p":"b05","product":{"id":"b05","sku":"BEAN-BAR-1KG","name":"Barako blend beans 1kg","cat":"beans","unit":"bag","onHand":2,"reorder":4,"cost":720,"price":0,"supplier":"beans","loc":"DRY","expires":null,"barcode":"4809870710554"},"ordered":6,"received":0,"extra":0,"cost":720,"total":4320},{"p":"b04","product":{"id":"b04","sku":"BEAN-SAG-1KG","name":"Sagada arabica beans 1kg","cat":"beans","unit":"bag","onHand":4,"reorder":3,"cost":1150,"price":0,"supplier":"beans","loc":"DRY","expires":null,"barcode":"4809870708445"},"ordered":2,"received":0,"extra":0,"cost":1150,"total":2300}],"src":"data","expected":"Fri 23 Oct","ordered":"Tue 20 Oct","draftedBy":null,"receivedAt":null,"varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"unitsOrdered":8,"unitsReceived":0,"unitsExtra":0,"total":6620,"shortUnits":0,"shortValue":0},{"no":"PO-0047","supplier":"dairy","supplierName":"Mabuhay Dairy Supply","status":"DRAFT","lines":[{"p":"b01","product":{"id":"b01","sku":"MLK-FRESH-1L","name":"Fresh milk 1L","cat":"dairy","unit":"carton","onHand":8,"reorder":24,"cost":98,"price":0,"supplier":"dairy","loc":"CH1","expires":{"qty":5,"on":"Sat 24 Oct"},"barcode":"4809870702115","usePerDay":20},"ordered":36,"received":0,"extra":0,"cost":98,"total":3528},{"p":"b02","product":{"id":"b02","sku":"CRM-WHIP-1L","name":"Whipping cream 1L","cat":"dairy","unit":"carton","onHand":3,"reorder":6,"cost":285,"price":0,"supplier":"dairy","loc":"CH1","expires":null,"barcode":"4809870704225"},"ordered":6,"received":0,"extra":0,"cost":285,"total":1710}],"src":"draft","expected":"Fri 23 Oct, 7:00 if sent by 15:00","ordered":null,"draftedBy":"leda","receivedAt":null,"varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"list":{"id":"L-PO-0047","no":"PO-0047","sup":"dairy","by":"leda","at":"9:02 AM","note":"","printed":null,"asked":null,"lines":[{"p":"b01","qty":36,"by":"leda"},{"p":"b02","qty":6,"by":"leda"}]},"unitsOrdered":42,"unitsReceived":0,"unitsExtra":0,"total":5238,"shortUnits":0,"shortValue":0},{"no":"PO-0045","supplier":"meat","supplierName":"Commonwealth Meat Shop","status":"RECEIVED","lines":[{"p":"b12","product":{"id":"b12","sku":"BCN-SLC-1KG","name":"Bacon slices 1kg","cat":"meat","unit":"pack","onHand":3,"reorder":3,"cost":520,"price":0,"supplier":"meat","loc":"CH2","expires":{"qty":1,"on":"Fri 23 Oct"},"barcode":"4809870725329"},"ordered":3,"received":3,"extra":0,"cost":520,"total":1560},{"p":"b13","product":{"id":"b13","sku":"SAL-FIL-1KG","name":"Salmon fillet 1kg","cat":"sea","unit":"pack","onHand":2,"reorder":2,"cost":1180,"price":0,"supplier":"sea","loc":"FRZ","expires":null,"barcode":"4809870727439"},"ordered":2,"received":2,"extra":0,"cost":1180,"total":2360}],"src":"history","expected":"Wed 21 Oct","ordered":"Tue 20 Oct","draftedBy":null,"receivedAt":"Wed 21 Oct 14:10","varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"sentBy":"carlo","receivedBy":"jomar","cancelled":null,"unitsOrdered":5,"unitsReceived":5,"unitsExtra":0,"total":3920,"shortUnits":0,"shortValue":0},{"no":"PO-0044","supplier":"dairy","supplierName":"Mabuhay Dairy Supply","status":"RECEIVED","lines":[{"p":"b01","product":{"id":"b01","sku":"MLK-FRESH-1L","name":"Fresh milk 1L","cat":"dairy","unit":"carton","onHand":8,"reorder":24,"cost":98,"price":0,"supplier":"dairy","loc":"CH1","expires":{"qty":5,"on":"Sat 24 Oct"},"barcode":"4809870702115","usePerDay":20},"ordered":48,"received":48,"extra":0,"cost":98,"total":4704},{"p":"b03","product":{"id":"b03","sku":"BTR-UNS-225","name":"Unsalted butter 225g","cat":"dairy","unit":"block","onHand":10,"reorder":8,"cost":165,"price":0,"supplier":"dairy","loc":"CH1","expires":null,"barcode":"4809870706335"},"ordered":8,"received":8,"extra":0,"cost":165,"total":1320}],"src":"history","expected":"Tue 20 Oct","ordered":"Mon 19 Oct","draftedBy":null,"receivedAt":"Tue 20 Oct 7:10","varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"sentBy":"carlo","receivedBy":"jomar","cancelled":null,"unitsOrdered":56,"unitsReceived":56,"unitsExtra":0,"total":6024,"shortUnits":0,"shortValue":0},{"no":"PO-0043","supplier":"pack","supplierName":"QC Packaging Center","status":"RECEIVED","lines":[{"p":"b10","product":{"id":"b10","sku":"CUP-HOT-12","name":"Hot cup 12oz (50s)","cat":"cups","unit":"sleeve","onHand":14,"reorder":10,"cost":260,"price":0,"supplier":"pack","loc":"DRY","expires":null,"barcode":"4809870721109"},"ordered":20,"received":20,"extra":0,"cost":260,"total":5200},{"p":"b11","product":{"id":"b11","sku":"LID-HOT-12","name":"Hot cup lid 12oz (50s)","cat":"cups","unit":"sleeve","onHand":0,"reorder":8,"cost":140,"price":0,"supplier":"pack","loc":"DRY","expires":null,"barcode":"4809870723219"},"ordered":12,"received":12,"extra":0,"cost":140,"total":1680}],"src":"history","expected":"Fri 16 Oct","ordered":"Wed 14 Oct","draftedBy":null,"receivedAt":"Mon 19 Oct 9:30","varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"sentBy":"carlo","receivedBy":"jomar","cancelled":null,"unitsOrdered":32,"unitsReceived":32,"unitsExtra":0,"total":6880,"shortUnits":0,"shortValue":0},{"no":"PO-0042","supplier":"syrup","supplierName":"Bellissimo Trading","status":"CANCELLED","lines":[{"p":"b06","product":{"id":"b06","sku":"SYR-VAN-750","name":"Vanilla syrup 750ml","cat":"syrup","unit":"bottle","onHand":5,"reorder":3,"cost":420,"price":0,"supplier":"syrup","loc":"BAR","expires":null,"barcode":"4809870712664"},"ordered":6,"received":0,"extra":0,"cost":420,"total":2520}],"src":"history","expected":"Wed 14 Oct","ordered":"Mon 12 Oct","draftedBy":null,"receivedAt":null,"varianceState":null,"closedShort":false,"settleInfo":null,"dispute":null,"told":null,"sentBy":"carlo","cancelled":{"by":"carlo","at":"Mon 12 Oct 16:10","why":"Price changed, reorder next month"},"unitsOrdered":6,"unitsReceived":0,"unitsExtra":0,"total":2520,"shortUnits":0,"shortValue":0}],"business":{"key":"b","logo":"logo-cafe.svg"},"now":{"iso":"2026-10-22T09:12:00+08:00","day":"Thursday","date":"Thu 22 Oct 2026","short":"Thu 22 Oct","time":"9:12 AM","hm":"09:12","lastLoaded":"9:10 AM"},"suppliers":[{"id":"dairy","name":"Mabuhay Dairy Supply","leadTime":"Next morning if ordered by 15:00","cutoff":"15:00"},{"id":"beans","name":"Sagada Highland Coffee","leadTime":"2-3 days"},{"id":"syrup","name":"Bellissimo Trading","leadTime":"2 days"},{"id":"bake","name":"Panaderia Uno Wholesale","leadTime":"Next morning"},{"id":"pack","name":"QC Packaging Center","leadTime":"1-2 days"},{"id":"meat","name":"Commonwealth Meat Shop","leadTime":"Same day"},{"id":"sea","name":"Navotas Fishport Traders","leadTime":"Next morning"},{"id":"veg","name":"Balintawak Fresh Produce","leadTime":"Next morning"},{"id":"dry","name":"Puregold Wholesale","leadTime":"Same day"},{"id":"clean","name":"Clean Pro Supplies","leadTime":"2 days"}],"people":[{"id":"carlo","short":"Carlo","name":"Carlo Reyes","initials":"CR"},{"id":"mika","short":"Mika","name":"Mika Torres","initials":"MT"},{"id":"bea","short":"Bea","name":"Bea Santos","initials":"BS"},{"id":"jomar","short":"Jomar","name":"Jomar Lim","initials":"JL"}],"roles":{"manager":{"can":["lookup","movements","low_stock","draft_po","receive","confirm_po","accept_variance","approve_transfer","adjust_stock","stock_out","transfer","valuation","reconcile","setup"],"roleLabel":"Manager"},"clerk":{"can":["lookup","movements","low_stock","draft_po","receive","stock_out","transfer"],"roleLabel":"Stock clerk"},"owner":{"can":["lookup","movements","low_stock","draft_po","receive","confirm_po","accept_variance","approve_transfer","adjust_stock","stock_out","transfer","valuation","reconcile","setup"],"roleLabel":"Owner"}}}};

/* ---------- types ---------- */
export type POTenant = 'a' | 'b';
export type PORole = 'manager' | 'clerk' | 'owner';
export type POState = 'live' | 'quiet' | 'loading' | 'error' | 'empty' | 'degraded';
export type POStatus = 'DRAFT' | 'ORDERED' | 'PARTIAL' | 'SHORT' | 'RECEIVED' | 'CANCELLED';
export type POFilter = 'all' | 'draft' | 'sent' | 'part' | 'short' | 'received' | 'cancelled';
export type POSort = 'attn' | 'date' | 'new' | 'sup';
export type POTone = 'dash' | 'info' | 'warn' | 'ok' | 'off';
export interface POProduct { id: string; sku: string; name: string; cat: string; unit: string; onHand: number; reorder: number; cost: number; price?: number; supplier: string; loc: string; barcode?: string }
export interface POLine { p: string; product: POProduct; ordered: number; received: number; extra: number; cost: number; total: number }
export interface PODispute { id?: string; reason?: string; note?: string; ref?: string; status: 'open' | 'resolved'; by?: string; at?: string; outcome?: 'credit' | 'replacement' | 'refused'; credit?: string; eta?: string; rnote?: string; rby?: string; rat?: string }
export interface POInfo { by?: string; at?: string; why?: string; note?: string }
/* one shape for every kind of order (purchase-orders.js 45-52) */
export interface PurchaseOrder {
  no: string; supplier: string; supplierName: string; status: Exclude<POStatus, 'SHORT'>; lines: POLine[]; src: 'data' | 'sent' | 'draft' | 'history';
  expected: string; ordered: string | null; draftedBy: string | null; receivedAt: string | null; varianceState: 'awaiting' | 'disputed' | 'settled' | null;
  closedShort: boolean; settleInfo: POInfo | null; dispute: PODispute | null; told: POInfo | null;
  unitsOrdered: number; unitsReceived: number; unitsExtra: number; total: number; shortUnits: number; shortValue: number;
  sentRec?: Record<string, unknown>; cancelled?: POInfo | null; list?: Record<string, unknown> | null; sentBy?: string; receivedBy?: string; settled?: string;
}
export interface POTenantData {
  all: PurchaseOrder[];
  business: { key: string; name: string; logo: string };
  now: { date: string; short: string; time: string; hm: string; lastLoaded: string } & Record<string, unknown>;
  suppliers: ({ id: string; name: string } & Record<string, unknown>)[];
  people: { id: string; short: string; name: string; initials: string }[];
  roles: Record<PORole, { can: string[]; roleLabel: string }>;
}
export interface POQuery { tenant?: string; as?: string; state?: string; pos?: string; asof?: string | number; f?: string; sup?: string; qs?: string; group?: string; po?: string; receive?: string; retried?: boolean }

/* ---------- the one rule for "received / still due / n of m" (receiving.js 64-96) ----------
   ordered   what the order asked for.
   good      units that arrived and were not damaged (arrived minus damaged); this is what goes into stock.
   received  min(good, ordered): what counts toward the order. Damaged units are NOT received. Extra units are NOT in the total.
   extra     max(good - ordered, 0): kept (or sent back) and shown beside the line as "n extra", never added to received.
   due       max(ordered - good, 0): still due. received + due = ordered, always. */
interface RuleRow { p?: string; product?: POProduct; ordered: number; got: number }
interface RuleLine { p?: string; product?: POProduct; ordered: number; received: number; extra?: number }
const unitsById = (tenant: POTenant) => new Map(PURCHASE_ORDERS[tenant].all.flatMap((o) => o.lines.map((l) => [l.p, l.product] as const)));
export function makeRule(prodOf: (id: string) => POProduct | undefined) {
  const unitOf = (l: { p?: string; product?: POProduct }) => { const pr = l.product || (l.p ? prodOf(l.p) : undefined); return pr ? pr.unit : ''; };
  const nameOf = (l: { p?: string; product?: POProduct }) => { const pr = l.product || (l.p ? prodOf(l.p) : undefined); return pr ? pr.name : ''; };
  const rule = {
    line(ordered: number, good: number) { const g = Math.max(0, Math.round(+good || 0)), o = Math.max(0, Math.round(+ordered || 0)); return { ordered: o, good: g, received: Math.min(g, o), extra: Math.max(g - o, 0), due: Math.max(o - g, 0) }; },
    inOf: (received: number, ordered: number) => `${received} of ${ordered} in`,
    dueW: (n: number) => `${n} still due`,
    unitOf, nameOf,
    mixed(ls: { p?: string; product?: POProduct }[]) { return new Set(ls.map((l) => unitOf(l))).size > 1; },
    /* "6 bottles and 2 pc" */
    unitWords<T extends { p?: string; product?: POProduct }>(ls: T[], get: (l: T) => number) { const g = new Map<string, number>(); ls.forEach((l) => { const u = unitOf(l); g.set(u, (g.get(u) || 0) + get(l)); }); const parts = [...g].map(([u, n]) => `${n.toLocaleString('en-PH')} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`); return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`; },
    /* an amount of lines: a bare number for one unit, "2 bottles and 3 pc" for several */
    amt<T extends { p?: string; product?: POProduct }>(ls: T[], get: (l: T) => number) { return rule.mixed(ls) ? rule.unitWords(ls, get) : String(ls.reduce((s, l) => s + get(l), 0)); },
    tally(rows: RuleRow[], word?: string) {
      const w = word || 'still due', ord = rows.reduce((s, r) => s + r.ordered, 0), rec = rows.reduce((s, r) => s + Math.min(r.got, r.ordered), 0), due = ord - rec;
      if (!rule.mixed(rows)) return { text: `${rule.inOf(rec, ord)}${due ? `, ${due} ${w}` : ''}`, ordered: ord, received: rec, due, mixed: false };
      const full = rows.filter((r) => r.got >= r.ordered), part = rows.filter((r) => r.got < r.ordered), out: string[] = [];
      if (full.length) out.push(`${rule.unitWords(full, (r) => r.ordered)} in`);
      part.forEach((r) => { const g = Math.min(r.got, r.ordered), u = rule.unitWords([{ ...r }], () => r.ordered).replace(/^[\d,]+ /, ''), sw = w === 'short' ? 'short' : 'still due'; out.push(g > 0 ? `${g} of ${r.ordered} ${u} in, ${r.ordered - g} ${sw} on ${rule.nameOf(r)}` : `${r.ordered - g} ${sw} on ${rule.nameOf(r)}`); });
      return { text: out.join(', '), ordered: ord, received: rec, due, mixed: true };
    },
    /* "6 of 9 in, 3 still due" for any set of lines carrying { ordered, received } */
    words(ls: RuleLine[]) { const rows: RuleRow[] = ls.map((l) => { const r = rule.line(l.ordered, l.received + (l.extra || 0)); return { p: l.p, product: l.product, ordered: r.ordered, got: r.received }; }), t = rule.tally(rows, 'still due'); return { ordered: t.ordered, received: t.received, due: t.due, extra: ls.reduce((s, l) => s + rule.line(l.ordered, l.received + (l.extra || 0)).extra, 0), text: t.text }; },
  };
  return rule;
}
/* plural helper used on every page: plural(1, 'item') = "1 item", plural(3, 'item') = "3 items", plural(2, 'box', 'boxes') = "2 boxes" */
export const plural = (n: number, one: string, many?: string) => `${n} ${n === 1 ? one : many || one + 's'}`;
const plr = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;

/* ---------- short deliveries: accept the shortage, or dispute it with the supplier (receiving.js 107-145) ---------- */
export const DSP = {
  reasons: [['short', 'Short delivery'], ['damaged', 'Damaged'], ['wrong', 'Wrong item']] as [string, string][],
  outcomes: [['credit', 'Credit expected'], ['replacement', 'Replacement coming'], ['refused', 'Supplier refused']] as [string, string][],
  accWhy: [['never', 'The supplier will not send the rest'], ['nolonger', 'We do not need the rest any more'], ['credited', 'The supplier already credited us'], ['other', 'Another reason']] as [string, string][],
  word(list: [string, string][], k: string) { return (list.find((x) => x[0] === k) || [k, k])[1]; },
};
/* the records a settle reads: acc (shortage accepted), dsp (dispute), told (noted for the manager), closed (a receipt row closed the order) */
export interface POSettleRecords { acc?: Record<string, POInfo>; dsp?: Record<string, PODispute>; told?: Record<string, POInfo>; closed?: Record<string, boolean> }
export const replacing = (d?: PODispute) => !!d && d.status === 'resolved' && d.outcome === 'replacement';
export const dspCloses = (d?: PODispute) => !!d && d.status === 'resolved' && (d.outcome === 'credit' || d.outcome === 'refused');
export const isClosed = (no: string, r: POSettleRecords) => !replacing(r.dsp?.[no]) && (!!r.closed?.[no] || !!r.acc?.[no] || dspCloses(r.dsp?.[no]));
/* one plain phrase for the state of a short delivery ('' when nothing was done about it) */
export const flag = (no: string, r: POSettleRecords) => { const d = r.dsp?.[no]; if (d) return d.status === 'open' ? 'Disputed with the supplier' : `Dispute resolved, ${d.outcome === 'credit' ? 'credit expected' : d.outcome === 'replacement' ? 'replacement coming' : 'supplier refused'}`; return r.acc?.[no] ? 'Short accepted' : ''; };
/* an order (the shape of the model's input) after accept / dispute: status, variance state, expected date, and the records themselves */
export function settle<T extends { no: string; status: string; lines: { ordered: number; received: number }[]; expected?: string; varianceState?: string | null; closedShort?: boolean; receivedAt?: string | null; settleInfo?: POInfo | null; dispute?: PODispute | null; told?: POInfo | null }>(po: T, r: POSettleRecords): T {
  const no = po.no, acc = r.acc?.[no], d = r.dsp?.[no], tl = r.told?.[no];
  if (acc) po.settleInfo = { ...acc }; if (d) po.dispute = { ...d }; if (tl) po.told = { ...tl };
  if (po.status !== 'PARTIAL' && po.status !== 'RECEIVED') return po;
  if (!po.lines.some((l) => l.received < l.ordered)) return po;
  if (replacing(d)) { if (po.status === 'RECEIVED') po.status = 'PARTIAL'; po.varianceState = null; po.closedShort = false; po.expected = `${d!.eta || 'Soon'} (replacement)`; return po; }
  if (acc || dspCloses(d)) { po.status = 'RECEIVED'; po.closedShort = true; po.varianceState = 'settled'; po.receivedAt = po.receivedAt || (acc || d)!.at || null; return po; }
  if (po.status === 'RECEIVED') po.varianceState = (d && d.status === 'open' ? 'disputed' : po.varianceState || 'awaiting') as typeof po.varianceState;
  return po;
}

/* ---------- the model: one shape for every kind of order (purchase-orders.js 44-92) ---------- */
export const STW: Record<POStatus, string> = { DRAFT: 'Draft', ORDERED: 'Sent', PARTIAL: 'Part in', SHORT: 'Short', RECEIVED: 'Received', CANCELLED: 'Cancelled' };
export const STONE: Record<POStatus, POTone> = { DRAFT: 'dash', ORDERED: 'info', PARTIAL: 'warn', SHORT: 'warn', RECEIVED: 'ok', CANCELLED: 'off' };
export const FKEY: Record<POFilter, POStatus | null> = { all: null, draft: 'DRAFT', sent: 'ORDERED', part: 'PARTIAL', short: 'SHORT', received: 'RECEIVED', cancelled: 'CANCELLED' };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dnum = (s: string | null | undefined) => { const m = /(\d{1,2}) Oct/.exec(String(s || '')); return m ? +m[1] : null; };

export function purchaseOrdersModel(query: POQuery = {}) {
  const tenant: POTenant = query.tenant === 'b' ? 'b' : 'a';
  const role: PORole = query.as === 'clerk' || query.as === 'owner' ? query.as : 'manager';
  const state: POState = (['live', 'quiet', 'loading', 'error', 'empty', 'degraded'] as const).find((s) => s === query.state) || 'live';
  const T = PURCHASE_ORDERS[tenant];
  const F = { quiet: state === 'quiet', loading: state === 'loading', empty: state === 'empty', error: state === 'error' };
  const can = (p: string) => T.roles[role].can.includes(p);
  const money = can('valuation');
  const rule = makeRule((id) => unitsById(tenant).get(id));
  const mgr = () => 'your manager';
  const poErr = F.error;
  const asof = Math.max(0, Math.min(5, +(query.asof ?? 0) || 0));
  const TODAY = 22 + asof;
  const todayLabel = `${DOW[(4 + asof) % 7]} ${TODAY} Oct`;
  const stKey = (po: PurchaseOrder): POStatus => (po.status === 'RECEIVED' && (po.varianceState === 'awaiting' || po.varianceState === 'disputed') && !F.quiet ? 'SHORT' : po.status);
  const all = (): PurchaseOrder[] => (query.pos === 'none' || F.empty ? [] : T.all);
  const byNo = (no: string) => all().find((p) => p.no === no) || null;
  const outstanding = (l: POLine, po: PurchaseOrder) => (po.status === 'CANCELLED' || po.status === 'RECEIVED' ? 0 : Math.max(0, l.ordered - l.received));
  const unitsLeft = (po: PurchaseOrder) => po.lines.reduce((s, l) => s + outstanding(l, po), 0);
  /* unlike units are never added: a bare number for one unit, "2 bottles and 3 pc" for several */
  const leftAmt = (po: PurchaseOrder) => rule.amt(po.lines.filter((l) => outstanding(l, po) > 0), (l) => outstanding(l, po));
  const shortAmt = (po: PurchaseOrder) => rule.amt(po.lines.filter((l) => l.ordered > l.received), (l) => l.ordered - l.received);
  const tallyPO = (ls: POLine[], word?: string) => rule.tally(ls.map((l) => ({ p: l.p, product: l.product, ordered: l.ordered, got: l.received + (l.extra || 0) })), word);
  const inW = (po: PurchaseOrder) => (rule.mixed(po.lines) ? rule.words(po.lines).text : rule.inOf(po.unitsReceived, po.unitsOrdered));
  const isOpen = (po: PurchaseOrder) => po.status === 'ORDERED' || po.status === 'PARTIAL';
  const expDate = (po: PurchaseOrder) => { const m = /^([A-Za-z]{3} \d{1,2} [A-Za-z]{3})/.exec(po.expected); return m ? m[1] : po.expected.replace(/ \(rest\)/, ''); };
  const ifSentBy = (po: PurchaseOrder) => { const m = /if sent by (\d{1,2}:\d{2})/.exec(po.expected); return m ? m[1] : ''; };
  const dueN = (po: PurchaseOrder) => dnum(po.expected);
  const lateDays = (po: PurchaseOrder) => { if (!isOpen(po)) return 0; const d = dueN(po); return d != null && d < TODAY ? TODAY - d : 0; };
  const dueToday = (po: PurchaseOrder) => isOpen(po) && dueN(po) === TODAY;
  // history rows: how late it came (days after the expected date)
  const cameLate = (po: PurchaseOrder) => { if (po.status !== 'RECEIVED' || !po.receivedAt) return 0; const a = dnum(po.receivedAt), b = dnum(po.expected); return a != null && b != null && a > b ? a - b : 0; };
  const qtyText = (po: PurchaseOrder) => { const g = new Map<string, number>(); po.lines.forEach((l) => { const u = l.product.unit; g.set(u, (g.get(u) || 0) + l.ordered); }); const parts = [...g].map(([u, n]) => `${n.toLocaleString('en-PH')} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`); return parts.length > 2 ? plr(po.unitsOrdered, 'item', 'items') : parts.join(' · '); };
  const draftNote = (po: PurchaseOrder) => { const l = po.list as { asked?: unknown; printed?: string } | null | undefined; return !l ? 'Not sent' : l.asked ? `Waiting for ${mgr()}` : l.printed ? `Printed ${l.printed}` : 'Not printed'; };
  /* what needs the signed-in person first: a clerk cannot send a draft or settle a short, so those wait behind what the clerk can do */
  const attention = (po: PurchaseOrder) => (lateDays(po) ? 0 : dueToday(po) ? 1 : po.status === 'DRAFT' ? (can('confirm_po') ? 2 : 6) : stKey(po) === 'SHORT' ? (can('accept_variance') ? 3 : 6) : po.status === 'ORDERED' ? 4 : po.status === 'PARTIAL' ? 5 : po.status === 'RECEIVED' ? 7 : 8);
  const orderNo = (po: PurchaseOrder) => +String(po.no).replace(/\D/g, '');

  /* ---------- page state ---------- */
  const S = {
    f: (Object.keys(FKEY) as POFilter[]).includes(query.f as POFilter) ? (query.f as POFilter) : 'all' as POFilter, sup: query.sup || 'all', q: query.qs || '', group: query.group === 'sup' ? 'sup' : 'flat', sort: 'attn' as POSort,
    open: query.po || null, rcv: !!query.receive, retried: !!query.retried,
  };
  const matches = (po: PurchaseOrder) => {
    const t = S.q.trim().toLowerCase();
    if (S.sup !== 'all' && po.supplier !== S.sup) return false;
    if (t && ![po.no, po.supplierName, ...po.lines.flatMap((l) => [l.product.name, l.product.sku])].some((x) => String(x).toLowerCase().includes(t))) return false;
    return true;
  };
  const shown = (sort: POSort = S.sort, f: POFilter = S.f) => {
    const l = all().filter(matches).filter((p) => !FKEY[f] || stKey(p) === FKEY[f]);
    const by: Record<POSort, (a: PurchaseOrder, b: PurchaseOrder) => number> = { attn: (a, b) => attention(a) - attention(b) || (dueN(a) ?? 99) - (dueN(b) ?? 99) || orderNo(b) - orderNo(a), date: (a, b) => (dueN(a) ?? 99) - (dueN(b) ?? 99) || orderNo(b) - orderNo(a), new: (a, b) => orderNo(b) - orderNo(a), sup: (a, b) => a.supplierName.localeCompare(b.supplierName) || orderNo(b) - orderNo(a) };
    return l.sort(by[sort]);
  };
  const counts = () => { const base = all().filter(matches), c: Record<POFilter, number> = { all: base.length, draft: 0, sent: 0, part: 0, short: 0, received: 0, cancelled: 0 }; (Object.keys(FKEY) as POFilter[]).forEach((k) => { if (k !== 'all') c[k] = base.filter((p) => stKey(p) === FKEY[k]).length; }); return c; };

  /* ---------- the page's one line (Leda), from the orders (purchase-orders.js 118-148) ---------- */
  function detailLine(po: PurchaseOrder): string {
    if (S.rcv) return po.status === 'PARTIAL' ? `Count what came in. ${rule.words(po.lines).text}.` : 'Count what came in and type it next to each line. Nothing counts until you confirm.';
    const l = lateDays(po);
    if (po.status === 'DRAFT') return `${po.no} is a draft. Open the paper to print it, then it is marked sent.`;
    if (isOpen(po)) return l ? `${po.no} is ${plr(l, 'day', 'days')} late. It was expected ${expDate(po)}.` : dueToday(po) ? `${po.no} is due today. Receive it when it arrives.` : `${po.no} is on the way, expected ${expDate(po)}.`;
    if (po.status === 'RECEIVED') return po.shortUnits ? `${po.no} came in short by ${shortAmt(po)}${po.settleInfo ? ' and the shortage was accepted' : po.dispute ? (po.dispute.status === 'open' ? ' and is disputed with the supplier' : ` and the dispute is resolved: ${flag(po.no, { dsp: { [po.no]: po.dispute } }).replace('Dispute resolved, ', '')}`) : ''}.` : `${po.no} is fully received.`;
    return `${po.no} was cancelled. Nothing is expected from ${po.supplierName.split(' ')[0]}.`;
  }
  /* the text of the headline; `loading` is the skeleton line */
  function headline(): { loading: boolean; text: string } {
    if (F.loading) return { loading: true, text: '' };
    let h: string;
    const a = all();
    if (poErr && !S.retried) h = 'Purchase orders did not load, so the orders are not shown.';
    else if (F.empty) h = 'No products yet, so there is nothing to order. Add products first.';
    else if (S.open && byNo(S.open)) h = detailLine(byNo(S.open) as PurchaseOrder);
    else if (!a.length) h = 'No purchase orders yet. They start from an order list and show here once it is a draft.';
    else {
      const open = a.filter(isOpen), late = open.filter(lateDays), today = open.filter(dueToday), drafts = a.filter((p) => p.status === 'DRAFT'), aw = a.filter((p) => stKey(p) === 'SHORT');
      const parts: string[] = [];
      if (late.length) parts.push(`${plr(late.length, 'order is', 'orders are')} late: ${late.map((p) => p.no).join(', ')}.`);
      if (today.length) parts.push(`${today.map((p) => `${p.no} from ${p.supplierName.split(' ')[0]}`).join(' and ')} ${today.length === 1 ? 'is' : 'are'} due today.`);
      const aw0 = aw.filter((p) => p.varianceState === 'awaiting'), dp = a.filter((p) => p.dispute && p.dispute.status === 'open');
      if (aw0.length) parts.push(`${aw0.map((p) => p.no).join(', ')} came in short and waits for ${mgr()}.`);
      if (dp.length) parts.push(`${dp.map((p) => p.no).join(', ')} ${dp.length === 1 ? 'is' : 'are'} disputed with the supplier.`);
      if (drafts.length && !F.quiet) parts.push(`${plr(drafts.length, 'draft is', 'drafts are')} not sent yet.`);
      const nxt = open.filter((p) => !lateDays(p) && !dueToday(p)).sort((x, y) => (dueN(x) ?? 99) - (dueN(y) ?? 99))[0];
      if (F.quiet || !parts.length) h = `Nothing needs you. ${open.length ? `${plr(open.length, 'order is', 'orders are')} on the way${nxt ? `, next ${nxt.no} on ${expDate(nxt).replace(/ Oct$/, '')}` : ''}.` : 'No order is waiting for a delivery.'}`;
      else h = parts.join(' ');
    }
    return { loading: false, text: h };
  }
  return { tenant, role, state, flags: F, can, money, asof, TODAY, todayLabel, page: S, business: T.business, now: T.now, suppliers: T.suppliers, people: T.people, roleLabel: T.roles[role].roleLabel, rule, all, byNo, stKey, outstanding, unitsLeft, leftAmt, shortAmt, tallyPO, inW, isOpen, expDate, ifSentBy, dueN, lateDays, dueToday, cameLate, qtyText, draftNote, attention, orderNo, matches, shown, counts, headline, detailLine };
}
