/* RDY-429. Sample data and adapter for the Stocker prototype (handover 2.7), the page-local Stocker.data.ts.
   DUMP = window.DATA as the stocker sees it (tenants a, b; live state; after RCV.apply with an empty record), dumped from workshop/prototypes/inventory-home/round-1/final/
   data.js (products, pos, movements, jobs, viewer, business, locations), receiving.js 23-43 (PLACES, HERE, TR_SEED via RCV.trs()). Prototype only, not exported from the package.
   The adapter below is transcribed from stocker.js 22-195: STATES (data.js 304-311), helpers 36-52, KEEP/href 52-54, TOPICS 66-71, deliveries/when/transfers 112-124, rows 125-133.
   GAP: orders.js sent orders (O.sentPOs) and saved notes (rph-stk-ask-*) live in the browser only; the sample has none, so deliveries() reads D.pos alone and notes are not part of this slice.
   GAP: links are the workshop file URLs (stocker-in.html?...); the stories do not navigate. */

export type StockerTenant = 'a' | 'b';
export type StockerState = 'live' | 'loading' | 'error' | 'empty' | 'quiet';
export type StockerPage = 'home' | 'in' | 'out' | 'find' | 'me' | 'signedout';
export type StockerUnit = string;

export interface SProduct { id: string; sku: string; name: string; cat: string; unit: StockerUnit; onHand: number; reorder: number; supplier: string; loc: string; barcode?: string; expires?: { qty: number; on: string } }
export interface SPoLine { p: string; ordered: number; received: number }
export interface SPo { no: string; supplier: string; supplierName: string; status: string; expected: string; lines: SPoLine[] }
export interface SMove { id: string; day: string; at: string; type: string; p: string; qty: number; ref?: string | null; by?: string | null; note?: string | null }
export interface STrLine { p: string; qty: number; got?: number }
export interface STransfer { id: string; from: string; to: string; status: 'draft' | 'transit' | 'received' | 'cancelled'; lines: STrLine[]; note: string; job: string; request?: boolean; createdBy: string; createdAt: string; sentAt?: string | null; sentBy?: string | null; receivedAt?: string | null; receivedBy?: string | null; legacy?: boolean }
export interface SPlace { id: string; name: string; short: string; addr: string; here?: boolean }
export interface SViewer { id: string; name: string; short: string; initials: string; role: string; title: string; mobileOnly?: boolean }
export interface STenant {
  now: { iso?: string; day?: string; date?: string; short: string; time: string; hm: string; lastLoaded: string };
  business: { key: string; company: string; platform: string; kind: string; place: string; logo: string; hours: { open: string; close: string; label: string } };
  viewer: SViewer;
  manager: SViewer;
  locations: { id: string; name: string; holds?: string }[];
  products: SProduct[];
  pos: SPo[];
  movements: SMove[];
  jobs: { jo: string; at: string; needs: { p: string; qty: number }[] }[];
  here: string;
  places: SPlace[];
  trs: STransfer[];
}
const DUMP: Record<StockerTenant, STenant> = {"a":{"now":{"iso":"2026-10-22T09:12:00+08:00","day":"Thursday","date":"Thu 22 Oct 2026","short":"Thu 22 Oct","time":"9:12 AM","hm":"09:12","lastLoaded":"9:10 AM"},"business":{"key":"a","company":"Dela Cruz Auto Works","platform":"Parts Stockroom","kind":"Inventory","place":"Aurora Blvd, Cubao","logo":"logo-autoworks.svg","hours":{"open":"08:00","close":"18:00","label":"Mon-Sat 8:00-18:00"}},"viewer":{"id":"nonoy","name":"Nonoy Bautista","short":"Nonoy","initials":"NB","role":"stocker","title":"Stocker","mobileOnly":true},"manager":{"id":"berto","name":"Berto Villanueva","short":"Berto","initials":"BV","role":"manager","title":"Stockroom manager"},"locations":[{"id":"A","name":"Aisle A","holds":"Oils & fluids"},{"id":"B","name":"Aisle B","holds":"Filters, belts & hoses"},{"id":"C","name":"Aisle C","holds":"Electrical"},{"id":"D","name":"Aisle D","holds":"Brakes & suspension"},{"id":"CAGE","name":"Cage","holds":"Batteries & alternators"},{"id":"BENCH","name":"Bench","holds":"Tools & consumables"}],"products":[{"id":"p01","sku":"SHX7-10W40-4L","name":"Shell Helix HX7 10W-40 4L","cat":"oils","unit":"bottle","onHand":14,"reorder":6,"supplier":"autopro","loc":"A","barcode":"4801230401379"},{"id":"p02","sku":"PBR-10W40-1L","name":"Petron Blaze Racing 10W-40 1L","cat":"oils","unit":"bottle","onHand":26,"reorder":12,"supplier":"petron","loc":"A","barcode":"4801230402741"},{"id":"p03","sku":"PUT-20W50-1L","name":"Petron Ultron Touring 20W-50 1L","cat":"oils","unit":"bottle","onHand":41,"reorder":12,"supplier":"petron","loc":"A","barcode":"4801230404110"},{"id":"p04","sku":"CGTX-20W50-1L","name":"Castrol GTX 20W-50 1L","cat":"oils","unit":"bottle","onHand":6,"reorder":12,"supplier":"autopro","loc":"A","barcode":"4801230405483"},{"id":"p05","sku":"BF-DOT4-500","name":"Brake fluid DOT 4 500ml","cat":"oils","unit":"bottle","onHand":3,"reorder":10,"supplier":"autopro","loc":"A","barcode":"4801230406855"},{"id":"p06","sku":"COOL-4L","name":"Coolant 4L","cat":"oils","unit":"jug","onHand":2,"reorder":8,"supplier":"petron","loc":"A","barcode":"4801230408224"},{"id":"p07","sku":"FF-OF20","name":"Fleetguard FF-OF20 oil filter","cat":"filt","unit":"pc","onHand":4,"reorder":20,"supplier":"autopro","loc":"B","barcode":"4801230409597"},{"id":"p08","sku":"SAK-A1183","name":"Sakura A-1183 air filter","cat":"filt","unit":"pc","onHand":11,"reorder":6,"supplier":"autopro","loc":"B","barcode":"4801230410968"},{"id":"p09","sku":"FG-LF3349","name":"Fleetguard LF3349 oil filter","cat":"filt","unit":"pc","onHand":18,"reorder":10,"supplier":"autopro","loc":"B","barcode":"4801230412337"},{"id":"p10","sku":"G-6PK1195","name":"Gates 6PK1195 serpentine belt","cat":"belts","unit":"pc","onHand":0,"reorder":4,"supplier":"autopro","loc":"B","barcode":"4801230413709"},{"id":"p11","sku":"G-T131","name":"Gates T131 timing belt","cat":"belts","unit":"pc","onHand":5,"reorder":3,"supplier":"autopro","loc":"B","barcode":"4801230415079"},{"id":"p15","sku":"DEN-RC11","name":"Denso radiator cap 1.1 bar","cat":"belts","unit":"pc","onHand":1,"reorder":4,"supplier":"autopro","loc":"B","barcode":"4801230420554"},{"id":"p12","sku":"NGK-BKR6E","name":"NGK BKR6E spark plug","cat":"elec","unit":"pc","onHand":0,"reorder":16,"supplier":"autopro","loc":"C","barcode":"4801230416441"},{"id":"p13","sku":"PH-H4","name":"Philips H4 bulb","cat":"elec","unit":"pc","onHand":3,"reorder":10,"supplier":"autopro","loc":"C","barcode":"4801230417813"},{"id":"p14","sku":"WB-22","name":"Wiper blade 22\"","cat":"elec","unit":"pc","onHand":2,"reorder":6,"supplier":"bosch","loc":"C","barcode":"4801230419183"},{"id":"p16","sku":"ALT-0412-B","name":"Bosch alternator","cat":"elec","unit":"pc","onHand":1,"reorder":2,"supplier":"bosch","loc":"CAGE","barcode":"4801230421926"},{"id":"p17","sku":"MOT-55D23L","name":"Motolite 55D23L battery","cat":"batt","unit":"pc","onHand":2,"reorder":6,"supplier":"motolite","loc":"CAGE","barcode":"4801230423296"},{"id":"p18","sku":"MOT-NS60","name":"Motolite NS60 battery","cat":"batt","unit":"pc","onHand":5,"reorder":4,"supplier":"motolite","loc":"CAGE","barcode":"4801230424668"},{"id":"p19","sku":"BOS-BP-F","name":"Bosch brake pad set (front)","cat":"brakes","unit":"set","onHand":9,"reorder":6,"supplier":"bosch","loc":"D","barcode":"4801230426037"},{"id":"p20","sku":"BRM-P06","name":"Brembo P06 brake pad set (front)","cat":"brakes","unit":"set","onHand":0,"reorder":4,"supplier":"autopro","loc":"D","barcode":"4801230427409"},{"id":"p21","sku":"KYB-334-VIOS","name":"KYB shock absorber, front (Vios)","cat":"susp","unit":"pc","onHand":4,"reorder":2,"supplier":"autopro","loc":"D","barcode":"4801230428772"},{"id":"p22","sku":"RAG-1KG","name":"Shop rags 1kg","cat":"tools","unit":"bag","onHand":12,"reorder":5,"supplier":"ace","loc":"BENCH","barcode":"4801230430140"},{"id":"p23","sku":"WD40-382","name":"WD-40 382ml","cat":"tools","unit":"can","onHand":9,"reorder":6,"supplier":"ace","loc":"BENCH","barcode":"4801230431512"}],"pos":[{"no":"PO-0224","supplier":"autopro","supplierName":"Autopro Distribution","status":"DRAFT","expected":"Thu 22 Oct · by 14:00 if sent by 10:00","lines":[{"p":"p07","ordered":60,"received":0},{"p":"p10","ordered":5,"received":0}]},{"no":"PO-0223","supplier":"bosch","supplierName":"Bosch Philippines","status":"PARTIAL","expected":"Mon 26 Oct (rest)","lines":[{"p":"p19","ordered":8,"received":8},{"p":"p16","ordered":2,"received":0},{"p":"p14","ordered":2,"received":0}]},{"no":"PO-0222","supplier":"motolite","supplierName":"Motolite PH","status":"ORDERED","expected":"Fri 23 Oct","lines":[{"p":"p17","ordered":6,"received":0},{"p":"p18","ordered":3,"received":0}]},{"no":"PO-0221","supplier":"petron","supplierName":"Petron Direct","status":"RECEIVED","expected":"Wed 21 Oct","lines":[{"p":"p02","ordered":24,"received":18},{"p":"p03","ordered":36,"received":36}]}],"movements":[{"id":"m09","day":"today","at":"08:55","type":"sold","p":"p13","qty":-1,"ref":"JO-0410","by":"nonoy","note":"Cubao"},{"id":"m08","day":"today","at":"08:41","type":"sold","p":"p07","qty":-1,"ref":"JO-0409","by":"dandy","note":"Cubao"},{"id":"m07","day":"today","at":"08:20","type":"sold","p":"p05","qty":-2,"ref":"JO-0408","by":"nonoy","note":"Cubao"},{"id":"m06","day":"yesterday","at":"17:12","type":"received","p":"p02","qty":18,"ref":"PO-0221","by":"dandy","note":"24 ordered"},{"id":"m05","day":"yesterday","at":"17:12","type":"received","p":"p03","qty":36,"ref":"PO-0221","by":"dandy","note":null},{"id":"m04","day":"yesterday","at":"16:05","type":"damaged","p":"p06","qty":-2,"ref":null,"by":"nonoy","note":"Leaking caps"},{"id":"m03","day":"yesterday","at":"15:40","type":"transfer","p":"p14","qty":-1,"ref":"TR-0031","by":"dandy","note":"To Kapitolyo"},{"id":"m02","day":"yesterday","at":"11:30","type":"sold","p":"p12","qty":-4,"ref":"JO-0401","by":"nonoy","note":"Cubao"},{"id":"m01","day":"yesterday","at":"10:02","type":"received","p":"p19","qty":8,"ref":"PO-0223","by":"nonoy","note":null}],"jobs":[{"jo":"JO-0413","at":"09:30","needs":[{"p":"p07","qty":1}]},{"jo":"JO-0414","at":"10:30","needs":[{"p":"p07","qty":1}]},{"jo":"JO-0412","at":"11:00","needs":[{"p":"p16","qty":1}]},{"jo":"JO-0415","at":"11:30","needs":[{"p":"p07","qty":1}]},{"jo":"JO-0416","at":"13:00","needs":[{"p":"p07","qty":1}]},{"jo":"JO-0417","at":"14:30","needs":[{"p":"p07","qty":1}]},{"jo":"JO-0418","at":"16:00","needs":[{"p":"p07","qty":1}]}],"here":"cubao","places":[{"id":"cubao","name":"Cubao stockroom","short":"Cubao","addr":"Aurora Blvd, Cubao","here":true},{"id":"kapitolyo","name":"Kapitolyo branch","short":"Kapitolyo","addr":"Shaw Blvd, Kapitolyo, Pasig"},{"id":"marikina","name":"Marikina branch","short":"Marikina","addr":"Sumulong Hwy, Marikina"}],"trs":[{"id":"TR-0032","from":"cubao","to":"kapitolyo","status":"draft","lines":[{"p":"p16","qty":1}],"note":"Kapitolyo asked for the last Bosch alternator. The car is waiting, promised 11:00.","job":"JO-0412","request":true,"createdBy":"leda","createdAt":"Thu 22 Oct 8:52"},{"id":"TR-0031","from":"cubao","to":"kapitolyo","status":"received","lines":[{"p":"p14","qty":1,"got":1}],"note":"","job":"","createdBy":"dandy","createdAt":"Wed 21 Oct 15:30","sentAt":"Wed 21 Oct 15:40","sentBy":"dandy","receivedAt":"Wed 21 Oct 16:25","receivedBy":"Kapitolyo branch","legacy":true},{"id":"TR-0030","from":"marikina","to":"cubao","status":"transit","lines":[{"p":"p05","qty":6},{"p":"p15","qty":2}],"note":"Spare stock from Marikina, coming with the delivery van.","job":"","createdBy":"Marikina branch","createdAt":"Wed 21 Oct 13:50","sentAt":"Wed 21 Oct 14:20","sentBy":"Marikina branch"},{"id":"TR-0029","from":"cubao","to":"marikina","status":"received","lines":[{"p":"p22","qty":4,"got":4}],"note":"","job":"","createdBy":"nonoy","createdAt":"Mon 19 Oct 9:50","sentAt":"Mon 19 Oct 10:10","sentBy":"nonoy","receivedAt":"Mon 19 Oct 13:00","receivedBy":"Marikina branch","legacy":true}]},"b":{"now":{"iso":"2026-10-22T09:12:00+08:00","day":"Thursday","date":"Thu 22 Oct 2026","short":"Thu 22 Oct","time":"9:12 AM","hm":"09:12","lastLoaded":"9:10 AM"},"business":{"key":"b","company":"Brew & Butter","platform":"Café Inventory","kind":"Inventory","place":"Maginhawa St, Teachers Village, QC","logo":"logo-cafe.svg","hours":{"open":"07:00","close":"21:00","label":"Daily 7:00-21:00"}},"viewer":{"id":"jomar","name":"Jomar Lim","short":"Jomar","initials":"JL","role":"stocker","title":"Stocker","mobileOnly":true},"manager":{"id":"carlo","name":"Carlo Reyes","short":"Carlo","initials":"CR","role":"manager","title":"Kitchen manager"},"locations":[{"id":"CH1","name":"Chiller 1","holds":"Milk & dairy"},{"id":"CH2","name":"Chiller 2","holds":"Meat, seafood, vegetables"},{"id":"FRZ","name":"Freezer","holds":"Bakery dough, seafood"},{"id":"DRY","name":"Dry store","holds":"Beans, dry goods, packaging"},{"id":"BAR","name":"Bar shelf","holds":"Syrups, tea & powders"},{"id":"UTIL","name":"Utility","holds":"Cleaning"}],"products":[{"id":"b01","sku":"MLK-FRESH-1L","name":"Fresh milk 1L","cat":"dairy","unit":"carton","onHand":8,"reorder":24,"supplier":"dairy","loc":"CH1","barcode":"4809870702115"},{"id":"b02","sku":"CRM-WHIP-1L","name":"Whipping cream 1L","cat":"dairy","unit":"carton","onHand":3,"reorder":6,"supplier":"dairy","loc":"CH1","barcode":"4809870704225"},{"id":"b03","sku":"BTR-UNS-225","name":"Unsalted butter 225g","cat":"dairy","unit":"block","onHand":10,"reorder":8,"supplier":"dairy","loc":"CH1","barcode":"4809870706335"},{"id":"b04","sku":"BEAN-SAG-1KG","name":"Sagada arabica beans 1kg","cat":"beans","unit":"bag","onHand":4,"reorder":3,"supplier":"beans","loc":"DRY","barcode":"4809870708445"},{"id":"b05","sku":"BEAN-BAR-1KG","name":"Barako blend beans 1kg","cat":"beans","unit":"bag","onHand":2,"reorder":4,"supplier":"beans","loc":"DRY","barcode":"4809870710554"},{"id":"b06","sku":"SYR-VAN-750","name":"Vanilla syrup 750ml","cat":"syrup","unit":"bottle","onHand":5,"reorder":3,"supplier":"syrup","loc":"BAR","barcode":"4809870712664"},{"id":"b07","sku":"SYR-CAR-750","name":"Caramel syrup 750ml","cat":"syrup","unit":"bottle","onHand":1,"reorder":3,"supplier":"syrup","loc":"BAR","barcode":"4809870714774"},{"id":"b08","sku":"MAT-PWD-500","name":"Matcha powder 500g","cat":"tea","unit":"pack","onHand":2,"reorder":2,"supplier":"syrup","loc":"BAR","barcode":"4809870716884"},{"id":"b09","sku":"CRO-DGH-12","name":"Croissant dough (12 pcs)","cat":"bake","unit":"pack","onHand":6,"reorder":4,"supplier":"bake","loc":"FRZ","barcode":"4809870718994"},{"id":"b10","sku":"CUP-HOT-12","name":"Hot cup 12oz (50s)","cat":"cups","unit":"sleeve","onHand":14,"reorder":10,"supplier":"pack","loc":"DRY","barcode":"4809870721109"},{"id":"b11","sku":"LID-HOT-12","name":"Hot cup lid 12oz (50s)","cat":"cups","unit":"sleeve","onHand":0,"reorder":8,"supplier":"pack","loc":"DRY","barcode":"4809870723219"},{"id":"b12","sku":"BCN-SLC-1KG","name":"Bacon slices 1kg","cat":"meat","unit":"pack","onHand":3,"reorder":3,"supplier":"meat","loc":"CH2","barcode":"4809870725329"},{"id":"b13","sku":"SAL-FIL-1KG","name":"Salmon fillet 1kg","cat":"sea","unit":"pack","onHand":2,"reorder":2,"supplier":"sea","loc":"FRZ","barcode":"4809870727439"},{"id":"b14","sku":"LET-ROM-1KG","name":"Romaine lettuce 1kg","cat":"veg","unit":"kg","onHand":1,"reorder":3,"supplier":"veg","loc":"CH2","barcode":"4809870729549"},{"id":"b15","sku":"OIL-CAN-1L","name":"Canola oil 1L","cat":"oil","unit":"bottle","onHand":6,"reorder":4,"supplier":"dry","loc":"DRY","barcode":"4809870731658"}],"pos":[{"no":"PO-0047","supplier":"dairy","supplierName":"Mabuhay Dairy Supply","status":"DRAFT","expected":"Fri 23 Oct, 7:00 if sent by 15:00","lines":[{"p":"b01","ordered":36,"received":0},{"p":"b02","ordered":6,"received":0}]},{"no":"PO-0046","supplier":"beans","supplierName":"Sagada Highland Coffee","status":"ORDERED","expected":"Fri 23 Oct","lines":[{"p":"b05","ordered":6,"received":0},{"p":"b04","ordered":2,"received":0}]}],"movements":[{"id":"c06","day":"today","at":"08:30","type":"sold","p":"b01","qty":-6,"ref":"Morning bar","by":"jomar","note":null},{"id":"c05","day":"today","at":"07:05","type":"count","p":"b07","qty":-1,"ref":null,"by":"jomar","note":"Count: 2 → 1"},{"id":"c04","day":"yesterday","at":"19:40","type":"damaged","p":"b14","qty":-1,"ref":null,"by":"jomar","note":"Wilted"},{"id":"c03","day":"yesterday","at":"14:10","type":"received","p":"b12","qty":3,"ref":"PO-0045","by":"jomar","note":null},{"id":"c02","day":"yesterday","at":"14:10","type":"received","p":"b13","qty":2,"ref":"PO-0045","by":"jomar","note":null},{"id":"c01","day":"yesterday","at":"10:15","type":"sold","p":"b11","qty":-8,"ref":"Takeout","by":"jomar","note":null}],"jobs":[],"here":"maginhawa","places":[{"id":"maginhawa","name":"Maginhawa café and kitchen","short":"Maginhawa","addr":"Maginhawa St, Teachers Village, QC","here":true},{"id":"katipunan","name":"Katipunan kiosk","short":"Katipunan","addr":"Katipunan Ave, Loyola Heights, QC"}],"trs":[{"id":"TR-0013","from":"katipunan","to":"maginhawa","status":"transit","lines":[{"p":"b11","qty":12}],"note":"The kiosk has spare hot cup lids. Our supplier delivers Friday.","job":"","createdBy":"Katipunan kiosk","createdAt":"Thu 22 Oct 7:30","sentAt":"Thu 22 Oct 7:40","sentBy":"Katipunan kiosk"},{"id":"TR-0012","from":"maginhawa","to":"katipunan","status":"received","lines":[{"p":"b10","qty":2,"got":2}],"note":"","job":"","createdBy":"jomar","createdAt":"Mon 19 Oct 8:00","sentAt":"Mon 19 Oct 8:20","sentBy":"jomar","receivedAt":"Mon 19 Oct 9:10","receivedBy":"Katipunan kiosk","legacy":true}]}};

/* ---------- states (data.js 304-311, shape shared by every page; a page reads only these flags) ---------- */
export interface StockerFlags { quiet?: boolean; loading?: boolean; error?: { what: string; lastLoaded: string }; empty?: boolean }
export const STOCKER_STATES: Record<StockerState, StockerFlags> = {
  live: {},
  quiet: { quiet: true },
  loading: { loading: true },
  error: { error: { what: 'purchase orders', lastLoaded: DUMP.a.now.lastLoaded } },
  empty: { empty: true },
};

/* ---------- URL parameters the adapter reads (stocker.js 5-19, 52) ---------- */
export interface StockerParams {
  tenant?: StockerTenant;
  state?: StockerState;
  /** stocker-in.html: `order` ticks each line of an order, `other` is stock with no order. */
  via?: 'order' | 'other';
  /** stocker.html ?np=<barcode>: a new product to set up. */
  np?: string;
  /** stocker.html ?np=<barcode>&from=find|out|in|ask: where the new-product view goes back to. */
  from?: 'find' | 'out' | 'in' | 'ask';
  /** stocker.html ?ask=<topic>: tell your manager. */
  ask?: string;
  /** ?done=1: the done screen after a write. */
  done?: boolean;
  /** ?p=<product> (Stock out, Stock in, Find). */
  p?: string;
  po?: string;
  tr?: string;
  theme?: 'light' | 'dark';
}

/* the pages that carry state, tenant and theme from one page to the next (stocker.js 52) */
const KEEP = ['tenant', 'theme', 'state'] as const;
export const STOCKER_FILES: Record<'home' | 'in' | 'out' | 'find' | 'me', string> = { home: 'stocker.html', in: 'stocker-in.html', out: 'stocker-out.html', find: 'stocker-find.html', me: 'stocker-me.html' };

export interface Stocker {
  d: STenant;
  key: StockerTenant;
  isA: boolean;
  flags: StockerFlags;
  params: StockerParams;
  mgr: string;
  Mgr: string;
  HERE: string;
  /** stocker.js 52: the link to a workshop file, keeping tenant, theme and state. */
  href: (file: string, o?: Record<string, string | undefined>, drop?: string[]) => string;
  prod: (id: string) => SProduct | undefined;
  loc: (p: SProduct) => string;
  unitOf: (p: SProduct, n: number) => string;
  qtyW: (p: SProduct, n: number) => string;
  hm12: (hm: string) => string;
  nowStamp: () => string;
  place: (id: string) => SPlace;
  stOf: (p: SProduct) => 'Out of stock' | 'Low stock' | '';
  deliveries: () => (SPo & { lines: (SPoLine & { product: SProduct; out: number })[] })[];
  when: (po: SPo) => string;
  transfers: () => STransferView[];
  toSend: () => STransferView[];
  toCheck: () => STransferView[];
  canSend: (t: STransferView) => boolean;
  unitWords: (ls: { product: SProduct; n: number }[]) => string;
  tWhat: (t: STransferView) => string;
  nLines: (po: { lines: { out: number }[] }) => number;
  plural: (n: number, one: string, many?: string) => string;
}
export interface STransferView extends Omit<STransfer, 'lines'> { out: boolean; other: SPlace; lines: (STrLine & { product: SProduct; p: string })[] }

/* stocker.js 66-71 */
export const TOPICS = (Mgr: string) => [
  { k: 'damaged', label: 'Damaged or lost stock', help: `${Mgr} writes it off. Put it aside, away from good stock.` },
  { k: 'count', label: 'The shelf has a different number', help: `${Mgr} corrects the count. Please do not change it yourself.` },
  { k: 'more', label: 'We need more of this', help: `${Mgr} orders it.` },
  { k: 'other', label: 'Something else', help: '' },
];

const OPEN = ['ORDERED', 'PARTIAL'];
const dayN = (s: string) => { const m = /(\d{1,2}) [A-Za-z]{3}/.exec(String(s || '')); return m ? +m[1] : 99; };

/** The adapter: everything a Stocker page reads, for one tenant and state (stocker.js 22-133 on top of DUMP). */
export function stockerData(params: StockerParams = {}): Stocker {
  const key: StockerTenant = params.tenant === 'b' ? 'b' : 'a';
  const stateKey: StockerState = params.state && STOCKER_STATES[params.state] ? params.state : 'live';
  const d = DUMP[key];
  const flags = STOCKER_STATES[stateKey];
  const mgr = 'your manager', Mgr = 'Your manager';
  const prod = (id: string) => d.products.find((p) => p.id === id);
  const place = (id: string): SPlace => d.places.find((x) => x.id === id) || { id, name: id, short: id, addr: '' };
  const unitOf = (p: SProduct, n: number) => (p.unit === 'pc' ? 'pc' : n === 1 ? p.unit : p.unit + 's');
  const plural = (n: number, one: string, many?: string) => `${n} ${n === 1 ? one : many || one + 's'}`;
  const href = (file: string, o: Record<string, string | undefined> = {}, drop: string[] = []) => {
    const u = new URLSearchParams();
    KEEP.forEach((k) => { const v = k === 'state' ? (stateKey === 'live' ? undefined : stateKey) : k === 'tenant' ? (key === 'b' ? 'b' : undefined) : params[k]; if (v && !drop.includes(k)) u.set(k, v); });
    Object.entries(o).forEach(([k, v]) => { if (v != null && v !== '') u.set(k, v); });
    const s = u.toString();
    return file + (s ? '?' + s : '');
  };
  const tview = (t: STransfer): STransferView => {
    const out = t.from === d.here, other = place(out ? t.to : t.from);
    const lines = t.lines.map((l) => ({ ...l, product: prod(l.p) as SProduct })).filter((l) => l.product);
    return { ...t, out, other, lines };
  };
  const transfers = () => d.trs.map(tview).filter((t) => !(flags.quiet && (t.status === 'draft' || t.status === 'transit')));
  const toSend = () => transfers().filter((t) => t.status === 'draft' && t.out);
  const toCheck = () => transfers().filter((t) => t.status === 'transit' && !t.out);
  const unitWords = (ls: { product: SProduct; n: number }[]) => {
    const g = new Map<string, number>();
    ls.forEach((l) => g.set(l.product.unit, (g.get(l.product.unit) || 0) + l.n));
    const parts = [...g].map(([u, n]) => `${n.toLocaleString('en-PH')} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`);
    return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  };
  return {
    d, key, isA: d.business.key === 'a', flags, params, mgr, Mgr, HERE: d.here, href, prod, place, unitOf, plural,
    loc: (p) => (d.locations.find((l) => l.id === p.loc) || {}).name || '',
    qtyW: (p, n) => `${n.toLocaleString('en-PH')} ${unitOf(p, n)}`,
    hm12: (hm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || '')); if (!m) return hm || ''; const h = +m[1]; return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`; },
    nowStamp: () => `${d.now.short} ${d.now.hm.replace(/^0/, '')}`,
    stOf: (p) => (p.onHand <= 0 ? 'Out of stock' : p.onHand <= p.reorder ? 'Low stock' : ''),
    deliveries: () => d.pos
      .filter((po) => OPEN.includes(po.status))
      .map((po) => ({ ...po, lines: po.lines.map((l) => ({ ...l, product: prod(l.p) as SProduct, out: Math.max(0, l.ordered - l.received) })).filter((l) => l.product) }))
      .sort((a, b) => dayN(a.expected) - dayN(b.expected)),
    when: (po) => {
      const ex = String(po.expected || ''), by = /by (\d{1,2}:\d{2})/.exec(ex), m = /^[A-Za-z]{3} \d{1,2} [A-Za-z]{3}/.exec(ex);
      if (m && m[0] === d.now.short) return `Due today${by ? ' by ' + by[1] : ''}`;
      return m ? `Due ${m[0]}${/\(rest\)/.test(ex) ? ', the rest' : ''}` : 'On its way';
    },
    transfers, toSend, toCheck,
    canSend: (t) => !t.request,
    unitWords,
    tWhat: (t) => unitWords(t.lines.map((l) => ({ product: l.product, n: l.qty }))),
    nLines: (po) => po.lines.filter((l) => l.out > 0).length,
  };
}
