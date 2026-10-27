/* RDY-358. GENERATED once from the workshop prototype's own data (workshop/prototypes/portal-home/round-2/final: data.js, data-ext.js as memory.html renders it). Exact copy: do not paraphrase. */
export type MemSrc = 'company' | 'autoworks' | 'stockroom';
export interface MemTopic { src: MemSrc; k: string; type: 'data' | 'custom'; title: string; text: string; on: boolean; ask: string; qs: string[]; updated: string; sensitive?: string; staff?: boolean; edit?: [string, string]; yes?: string; no?: string }
export interface MemRequest { src: MemSrc; key: string; name: string; about: string; ask: string; yes: string; no: string; on: boolean }
export interface MemBlocked { src: MemSrc; id: string; q: string }
export const MEM_CAP = 16000;
export const MEM_USED = 2201;
export const MEM_SOURCES: MemSrc[] = ['company', 'autoworks', 'stockroom'];
export const MEM_NAME: Record<MemSrc, string> = {"company":"Company","autoworks":"Dela Cruz Auto Works","stockroom":"Parts Stockroom"};
export const MEM_SHORT: Record<MemSrc, string> = {"company":"Company","autoworks":"Auto Works","stockroom":"Stockroom"};
export const MEM_KIND: Record<MemSrc, string> = { company: 'For every business', autoworks: 'Repair shop', stockroom: 'Inventory' };
export const MEM_PHONE: Record<MemSrc, string> = {"company":"0917 555 0142","autoworks":"0917 555 0142","stockroom":"0917 555 0188"};
export const MEM_NEVER = "Other customers' details, staff notes and pay are never used for customers.";
export const memTopics: MemTopic[] = [
 {
  "src": "company",
  "k": "profile",
  "title": "Company profile",
  "text": "Dela Cruz Auto Works is a family-run car repair and parts business in Cubao, Quezon City, owned by Ramon Dela Cruz. It runs a repair shop and a parts stockroom at 1180 Aurora Blvd, Cubao, Quezon City. Customers can call 0917 555 0142 or email hello@delacruzauto.ph.",
  "on": true,
  "type": "data",
  "ask": "Who owns Dela Cruz Auto Works?",
  "qs": [
   "How do I email you?",
   "What is the company address?"
  ],
  "updated": "Tue 1 Sep",
  "edit": [
   "settings",
   "Change it in Settings"
  ],
  "yes": "Dela Cruz Auto Works is a family business owned by Ramon Dela Cruz. You can call 0917 555 0142.",
  "no": "I can't help with that here. Please call 0917 555 0142."
 },
 {
  "src": "company",
  "k": "hours",
  "title": "Opening hours",
  "text": "The company is open Mon-Sat 8:00 AM-6:00 PM; Sun closed. It closes on public holidays; the next is All Saints' Day, Sun 1 Nov.",
  "on": true,
  "type": "data",
  "ask": "What time do you close?",
  "qs": [
   "What time do you close on Saturday?",
   "Are you open on All Saints' Day?"
  ],
  "updated": "Mon 19 Oct",
  "edit": [
   "settings",
   "Change them in Settings"
  ],
  "yes": "We are open until 6:00 PM today. On Sundays we are closed.",
  "no": "I can't help with the hours here. Please call 0917 555 0142."
 },
 {
  "src": "company",
  "k": "c:m3",
  "title": "Supplier lead times",
  "text": "Banawe Autoparts Supply delivers the next day if ordered before 15:00. Petron delivers weekly, on Fridays.",
  "on": false,
  "type": "custom",
  "ask": "How fast can you get a part?",
  "qs": [
   "When will my part arrive?"
  ],
  "updated": "Wed 21 Oct",
  "sensitive": "Customers would see who you buy from.",
  "staff": true
 },
 {
  "src": "company",
  "k": "c:m5",
  "title": "Payment options",
  "text": "Every Dela Cruz business takes cash, GCash, Maya and credit or debit cards (Visa and Mastercard). Card payments over ₱5,000 can be split into 3 or 6 months with BPI and Metrobank cards. Official receipts are issued for every payment.",
  "on": true,
  "type": "custom",
  "ask": "Do you take GCash?",
  "qs": [
   "Can I pay in installments?",
   "Do you issue official receipts?"
  ],
  "updated": "Tue 1 Sep"
 },
 {
  "src": "company",
  "k": "c:m10",
  "title": "Warranty policy",
  "text": "Parts bought from the Dela Cruz stockroom carry the maker's warranty, usually 6 months. Customers bring the part and the official receipt, and the shop checks it for free. Parts damaged by wrong installation elsewhere are not covered.",
  "on": true,
  "type": "custom",
  "ask": "What if a part breaks after I buy it?",
  "qs": [
   "How long is the warranty on parts?",
   "What is not covered?"
  ],
  "updated": "Mon 19 Oct"
 },
 {
  "src": "company",
  "k": "c:m11",
  "title": "Finding us",
  "text": "Both buildings are at 1180 Aurora Blvd, Cubao, beside the Petron station and two blocks from Gateway Mall. The repair shop is in front; the parts stockroom is the rear building, through the side gate. Jeepneys to Cubao stop at the corner.",
  "on": true,
  "type": "custom",
  "ask": "How do I get to you?",
  "qs": [
   "Which jeepney goes to you?",
   "Where is the stockroom?"
  ],
  "updated": "Tue 13 Oct"
 },
 {
  "src": "company",
  "k": "c:m12",
  "title": "About the business",
  "text": "Dela Cruz Auto Works and the Parts Stockroom are one family business, owned by Ramon Dela Cruz. Customers can buy parts at the stockroom and have them fitted at the shop. There are no other branches.",
  "on": true,
  "type": "custom",
  "ask": "Are the shop and the stockroom the same business?",
  "qs": [
   "Do you have other branches?",
   "Can the shop fit parts I buy at the stockroom?"
  ],
  "updated": "Wed 21 Oct"
 },
 {
  "src": "autoworks",
  "k": "services",
  "title": "Services and prices",
  "text": "Auto Works does preventive maintenance (PMS), brakes, aircon, suspension, tune-ups and wheel alignment. A 10,000 km PMS for a Toyota Vios is ₱3,800 and takes about 2 hours. A 5,000 km oil change is ₱1,650. Brake pads start at ₱2,400 an axle and aircon cleaning at ₱2,800. Other repairs are ₱650 an hour for labour, plus parts. Labour has a 30-day warranty.",
  "on": true,
  "type": "data",
  "ask": "How much is a PMS for a Vios?",
  "qs": [
   "What does a 20,000 km PMS include?",
   "How much is labour per hour?"
  ],
  "updated": "Wed 21 Oct",
  "edit": [
   "app",
   "Change them in the Repair shop app"
  ],
  "yes": "A 10,000 km PMS for a Toyota Vios is ₱3,800 at Auto Works. It takes about 2 hours.",
  "no": "I can't help with prices here. Please call Auto Works at 0917 555 0142."
 },
 {
  "src": "autoworks",
  "k": "hours",
  "title": "Opening hours",
  "text": "Auto Works is open Mon-Sat 8:00 AM-6:00 PM; Sun closed. It closes on public holidays; the next is All Saints' Day, Sun 1 Nov.",
  "on": true,
  "type": "data",
  "ask": "Are you open on Sunday?",
  "qs": [
   "What time do you close on Saturday?",
   "Are you open on All Saints' Day?"
  ],
  "updated": "Mon 19 Oct",
  "edit": [
   "system",
   "Change them in System"
  ],
  "yes": "Auto Works is closed on Sundays. It opens Monday at 8:00 AM.",
  "no": "I can't help with the shop's hours here. Please call 0917 555 0142."
 },
 {
  "src": "autoworks",
  "k": "jobs",
  "title": "Job status updates",
  "text": "A customer can ask about jobs on their own car only, matched to the phone number on their account. Leda gives the job's step (received, checking, waiting for parts, in repair, final check, ready for pickup) and the time the shop promised. Auto Works has 12 open jobs today.",
  "on": true,
  "type": "data",
  "ask": "Is my car ready?",
  "qs": [
   "When can I pick up my car?",
   "What is left on my job order?"
  ],
  "updated": "Thu 22 Oct",
  "edit": [
   "app",
   "Updated by your team in the Repair shop app"
  ],
  "yes": "Your Vios (NBC 1234) is in final check. It should be ready by 4:00 PM.",
  "no": "I can't help with job updates here. Please call the shop for your car's status."
 },
 {
  "src": "autoworks",
  "k": "quotes",
  "title": "Quotations",
  "text": "Quotations already sent to that customer: the total, what it covers and how long it stays valid (7 days). Draft quotations and other customers’ quotations are never used.",
  "on": true,
  "type": "data",
  "ask": "How much was my quote?",
  "qs": [
   "Can you send my estimate again?",
   "Until when is my quote valid?"
  ],
  "updated": "Thu 22 Oct",
  "edit": [
   "app",
   "Sent from the Repair shop app"
  ],
  "yes": "Your quote QT-0213 is ₱12,450 for brake pads and rotor resurfacing. It is valid until Tue 27 Oct.",
  "no": "I can't help with quotations here. Please ask your service advisor."
 },
 {
  "src": "autoworks",
  "k": "c:m1",
  "title": "Warranty on repairs",
  "text": "Labour is under warranty for 30 days or 1,000 km, whichever comes first. Parts follow the maker's warranty. Customers bring the job order slip, and the shop checks the work for free.",
  "on": true,
  "type": "custom",
  "ask": "Do you have a warranty on repairs?",
  "qs": [
   "How long is the warranty on labour?",
   "What if the same problem comes back?"
  ],
  "updated": "Mon 19 Oct"
 },
 {
  "src": "autoworks",
  "k": "c:m2",
  "title": "Pickup and towing",
  "text": "Pickup is free within Cubao for PMS jobs booked a day ahead. Towing starts at ₱1,500 within Quezon City. Customers call the shop first so a driver can be sent.",
  "on": true,
  "type": "custom",
  "ask": "Can you pick up my car?",
  "qs": [
   "How much is towing?",
   "Is pickup free?"
  ],
  "updated": "Fri 2 Oct"
 },
 {
  "src": "autoworks",
  "k": "c:m6",
  "title": "Payment and deposits",
  "text": "The shop takes cash, GCash, Maya and credit or debit cards. Jobs over ₱10,000 need a 30% deposit before parts are ordered. The rest is paid at pickup.",
  "on": true,
  "type": "custom",
  "ask": "Can I pay with GCash?",
  "qs": [
   "Do I need to pay a deposit?",
   "Do you take cards?"
  ],
  "updated": "Tue 13 Oct"
 },
 {
  "src": "autoworks",
  "k": "c:m7",
  "title": "Directions and parking",
  "text": "The shop is on Aurora Blvd, beside the Petron station, two blocks from Gateway. Customers park inside the gate. There is a waiting area with Wi-Fi and coffee.",
  "on": true,
  "type": "custom",
  "ask": "Where do I park?",
  "qs": [
   "Is there a waiting area?",
   "Where exactly is the shop?"
  ],
  "updated": "Tue 13 Oct"
 },
 {
  "src": "autoworks",
  "k": "c:m8",
  "title": "Common questions",
  "text": "Customers can wait while a PMS or oil change is done, usually 1 to 2 hours. Longer repairs get a call when the car is ready. The shop works on all Japanese and Korean makes, but not on European cars.",
  "on": true,
  "type": "custom",
  "ask": "Can I wait while my car is fixed?",
  "qs": [
   "Do you fix European cars?",
   "How long does a PMS take?"
  ],
  "updated": "Wed 21 Oct"
 },
 {
  "src": "stockroom",
  "k": "availability",
  "title": "Product availability",
  "text": "Whether each of the 612 products is in stock, running low or out, found by name or part number. Leda says “in stock” or “out of stock”, never how many.",
  "on": true,
  "type": "data",
  "ask": "Is the Toyota oil filter in stock?",
  "qs": [
   "Do you have brake pads for a 2019 Innova?",
   "When will the Denso spark plugs be back?"
  ],
  "updated": "Thu 22 Oct",
  "edit": [
   "app",
   "Kept up to date in the Inventory app"
  ],
  "yes": "Yes, the Toyota oil filter (90915-YZZE1) is in stock.",
  "no": "I can't help with stock here. Please ask at the counter."
 },
 {
  "src": "stockroom",
  "k": "prices",
  "title": "Prices",
  "text": "The selling price of each product, VAT included. For example, Petron Blaze 10W-40 (4 litres) is ₱1,450 and the Toyota oil filter (90915-YZZE1) is ₱385.",
  "on": true,
  "type": "data",
  "ask": "How much is Petron Blaze 4L?",
  "qs": [
   "How much is a set of wiper blades?",
   "Is the price with VAT?"
  ],
  "updated": "Tue 20 Oct",
  "edit": [
   "app",
   "Change them in the Inventory app"
  ],
  "yes": "Petron Blaze 10W-40, 4 litres, is ₱1,450.",
  "no": "I can't help with prices here. Please ask at the counter."
 },
 {
  "src": "stockroom",
  "k": "costs",
  "title": "Costs and margins",
  "text": "What the stockroom pays for each product and the margin on it, from the last purchase order. For example, the Toyota oil filter costs ₱210 and sells for ₱385.",
  "on": false,
  "type": "data",
  "ask": "How much does the shop pay for this filter?",
  "qs": [
   "What is your markup on oil?"
  ],
  "updated": "Tue 20 Oct",
  "sensitive": "Customers would see what you pay.",
  "edit": [
   "app",
   "From purchase orders in the Inventory app"
  ],
  "yes": "The shop buys it for ₱210.",
  "no": "I can't help with that."
 },
 {
  "src": "stockroom",
  "k": "suppliers",
  "title": "Suppliers",
  "text": "Who the stockroom buys from and on what terms: Banawe Autoparts Supply (next day if ordered before 3:00 PM) and Petron (weekly, on Fridays).",
  "on": false,
  "type": "data",
  "ask": "Where do you get your oil?",
  "qs": [
   "Who supplies your batteries?"
  ],
  "updated": "Fri 16 Oct",
  "sensitive": "Customers would see who you buy from.",
  "edit": [
   "app",
   "From the Inventory app"
  ],
  "yes": "From Petron, delivered weekly on Fridays.",
  "no": "I can't help with that."
 },
 {
  "src": "stockroom",
  "k": "value",
  "title": "Stock counts and value",
  "text": "Exact quantities of every product, 9 of them below their reorder level, and what the stock on hand is worth.",
  "on": false,
  "type": "data",
  "ask": "How many oil filters do you have?",
  "qs": [
   "How much stock do you carry?"
  ],
  "updated": "Thu 22 Oct",
  "sensitive": "Customers would see exact counts. Availability still answers “in stock”.",
  "edit": [
   "app",
   "From the Inventory app"
  ],
  "yes": "There are 46 in stock.",
  "no": "Yes, it is in stock. I can't share exact counts."
 },
 {
  "src": "stockroom",
  "k": "c:m9",
  "title": "Pickup at the stockroom",
  "text": "Reserved parts are picked up at the rear building, through the side gate on Aurora Blvd, from 7:00 AM. Bring the reservation number shown in the app.",
  "on": true,
  "type": "custom",
  "ask": "Can I pick up parts myself?",
  "qs": [
   "What time can I pick up my reserved parts?",
   "Which gate do I use?"
  ],
  "updated": "Thu 8 Oct"
 }
];
export const memRequests: MemRequest[] = [
 {
  "src": "autoworks",
  "key": "booking",
  "name": "Book a service",
  "about": "Customers ask for a day and time. Staff accept it or suggest another.",
  "ask": "Can I bring my car in on Saturday morning?",
  "yes": "I've asked Auto Works for Sat 24 Oct, 9:00 AM. They'll confirm in the app.",
  "no": "Please call Auto Works at 0917 555 0142 to book.",
  "on": true
 },
 {
  "src": "autoworks",
  "key": "quote",
  "name": "Ask for a quotation",
  "about": "Customers describe the problem. A service advisor sends the quote.",
  "ask": "How much to fix my aircon?",
  "yes": "I've sent your request to Auto Works. A service advisor will send you a quote.",
  "no": "Please visit or call Auto Works for a quote.",
  "on": false
 },
 {
  "src": "stockroom",
  "key": "reserve",
  "name": "Reserve an item",
  "about": "Customers ask to hold an item for pickup. Staff accept it.",
  "ask": "Can you hold 2 oil filters for me?",
  "yes": "I've asked the stockroom to hold 2 oil filters for you. They'll confirm in the app.",
  "no": "Please call the stockroom to reserve items.",
  "on": false
 }
];
export const memBlocked: MemBlocked[] = [
 {
  "src": "company",
  "id": "cb0",
  "q": "What is the owner's personal number?"
 },
 {
  "src": "company",
  "id": "cb1",
  "q": "How much rent do you pay?"
 },
 {
  "src": "autoworks",
  "id": "b0",
  "q": "How much do you pay your mechanics?"
 },
 {
  "src": "autoworks",
  "id": "b1",
  "q": "Who is your parts supplier?"
 },
 {
  "src": "autoworks",
  "id": "b2",
  "q": "How much did the shop earn this month?"
 },
 {
  "src": "stockroom",
  "id": "b0",
  "q": "Which shops do you supply?"
 }
];
export const memReplies: Record<MemSrc, string> = {
 "company": "Sorry, I can't help with that one. For anything else about Dela Cruz Auto Works, just ask, or call 0917 555 0142.",
 "autoworks": "Sorry, I can't help with that one. For anything else about Auto Works, just ask, or call 0917 555 0142.",
 "stockroom": "Sorry, I can't help with that one. For anything else about Stockroom, just ask, or call 0917 555 0188."
};
