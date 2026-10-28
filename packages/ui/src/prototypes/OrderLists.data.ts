/* RDY-405. Sample data for the Order lists page, generated from the workshop FINAL data: inventory-home/round-1/final/data.js (tenant A lines 53-206, tenant B 208-): business, suppliers, products, people, purchase orders; orders.js 21-42 (supplier contacts), 44-50 (seed lists). "Now" is Thu 22 Oct 2026, 9:12 AM (data.js 18). Do not edit by hand. */
export interface OLProduct { id: string; sku: string; name: string; unit: string; onHand: number; reorder: number; cost: number; supplier: string }
export interface OLSupplier { id: string; name: string; leadTime: string; cutoff?: string; sameDayArrival?: string }
export interface OLContact { who: string; phone: string; email: string; addr: string }
export interface OLPoLine { p: string; ordered: number; received: number; cost: number }
export interface OLPo { no: string; supplier: string; status: 'DRAFT' | 'PARTIAL' | 'ORDERED'; ordered: string | null; expected: string; sentAt?: string; draftedBy?: string; lines: OLPoLine[] }
export interface OLCart { id: string; sup: string; by: string; at: string; lines: { p: string; qty: number; by: string }[] }
export interface OLTenant { key: 'a' | 'b'; company: string; platform: string; place: string; hoursLabel: string; suppliers: OLSupplier[]; contacts: Record<string, OLContact>; products: OLProduct[]; people: { id: string; short: string; initials: string }[]; pos: OLPo[]; carts: OLCart[] }
export const OL_NOW = { date: "Thu 22 Oct 2026", short: "Thu 22 Oct", time: "9:12 AM", lastLoaded: "9:10 AM" };
export const OL_A: OLTenant = {
 "key": "a",
 "company": "Dela Cruz Auto Works",
 "platform": "Parts Stockroom",
 "place": "Aurora Blvd, Cubao",
 "hoursLabel": "Mon-Sat 8:00-18:00",
 "suppliers": [
  {
   "id": "petron",
   "name": "Petron Direct",
   "leadTime": "1-2 days"
  },
  {
   "id": "autopro",
   "name": "Autopro Distribution",
   "leadTime": "Same day if ordered by 10:00, arrives by 14:00",
   "cutoff": "10:00",
   "sameDayArrival": "14:00"
  },
  {
   "id": "motolite",
   "name": "Motolite PH",
   "leadTime": "1-2 days"
  },
  {
   "id": "bosch",
   "name": "Bosch Philippines",
   "leadTime": "3-5 days"
  },
  {
   "id": "ace",
   "name": "Ace Hardware Trading",
   "leadTime": "1 day"
  }
 ],
 "contacts": {
  "autopro": {
   "who": "Rommel Aquino",
   "phone": "(02) 8921 4410",
   "email": "orders@autopro.ph",
   "addr": "218 Quezon Ave, Quezon City"
  },
  "petron": {
   "who": "Liza Ocampo",
   "phone": "(02) 8888 1020",
   "email": "sales@petrondirect.ph",
   "addr": "12 Sen. Gil Puyat Ave, Makati"
  },
  "motolite": {
   "who": "Ben Salonga",
   "phone": "(02) 8715 3300",
   "email": "dealers@motolite.ph",
   "addr": "40 Marcos Hwy, Marikina"
  },
  "bosch": {
   "who": "Carmela Reyes",
   "phone": "(02) 8631 0900",
   "email": "trade@bosch.ph",
   "addr": "Ortigas Ave, Pasig"
  },
  "ace": {
   "who": "Dennis Uy",
   "phone": "(02) 8426 7711",
   "email": "trading@acehw.ph",
   "addr": "E. Rodriguez Ave, Quezon City"
  }
 },
 "products": [
  {
   "id": "p01",
   "sku": "SHX7-10W40-4L",
   "name": "Shell Helix HX7 10W-40 4L",
   "unit": "bottle",
   "onHand": 14,
   "reorder": 6,
   "cost": 1690,
   "supplier": "autopro"
  },
  {
   "id": "p02",
   "sku": "PBR-10W40-1L",
   "name": "Petron Blaze Racing 10W-40 1L",
   "unit": "bottle",
   "onHand": 26,
   "reorder": 12,
   "cost": 465,
   "supplier": "petron"
  },
  {
   "id": "p03",
   "sku": "PUT-20W50-1L",
   "name": "Petron Ultron Touring 20W-50 1L",
   "unit": "bottle",
   "onHand": 41,
   "reorder": 12,
   "cost": 340,
   "supplier": "petron"
  },
  {
   "id": "p04",
   "sku": "CGTX-20W50-1L",
   "name": "Castrol GTX 20W-50 1L",
   "unit": "bottle",
   "onHand": 6,
   "reorder": 12,
   "cost": 385,
   "supplier": "autopro"
  },
  {
   "id": "p05",
   "sku": "BF-DOT4-500",
   "name": "Brake fluid DOT 4 500ml",
   "unit": "bottle",
   "onHand": 3,
   "reorder": 10,
   "cost": 210,
   "supplier": "autopro"
  },
  {
   "id": "p06",
   "sku": "COOL-4L",
   "name": "Coolant 4L",
   "unit": "jug",
   "onHand": 2,
   "reorder": 8,
   "cost": 520,
   "supplier": "petron"
  },
  {
   "id": "p07",
   "sku": "FF-OF20",
   "name": "Fleetguard FF-OF20 oil filter",
   "unit": "pc",
   "onHand": 4,
   "reorder": 20,
   "cost": 245,
   "supplier": "autopro"
  },
  {
   "id": "p08",
   "sku": "SAK-A1183",
   "name": "Sakura A-1183 air filter",
   "unit": "pc",
   "onHand": 11,
   "reorder": 6,
   "cost": 390,
   "supplier": "autopro"
  },
  {
   "id": "p09",
   "sku": "FG-LF3349",
   "name": "Fleetguard LF3349 oil filter",
   "unit": "pc",
   "onHand": 18,
   "reorder": 10,
   "cost": 280,
   "supplier": "autopro"
  },
  {
   "id": "p10",
   "sku": "G-6PK1195",
   "name": "Gates 6PK1195 serpentine belt",
   "unit": "pc",
   "onHand": 0,
   "reorder": 4,
   "cost": 750,
   "supplier": "autopro"
  },
  {
   "id": "p11",
   "sku": "G-T131",
   "name": "Gates T131 timing belt",
   "unit": "pc",
   "onHand": 5,
   "reorder": 3,
   "cost": 1180,
   "supplier": "autopro"
  },
  {
   "id": "p15",
   "sku": "DEN-RC11",
   "name": "Denso radiator cap 1.1 bar",
   "unit": "pc",
   "onHand": 1,
   "reorder": 4,
   "cost": 320,
   "supplier": "autopro"
  },
  {
   "id": "p12",
   "sku": "NGK-BKR6E",
   "name": "NGK BKR6E spark plug",
   "unit": "pc",
   "onHand": 0,
   "reorder": 16,
   "cost": 165,
   "supplier": "autopro"
  },
  {
   "id": "p13",
   "sku": "PH-H4",
   "name": "Philips H4 bulb",
   "unit": "pc",
   "onHand": 3,
   "reorder": 10,
   "cost": 290,
   "supplier": "autopro"
  },
  {
   "id": "p14",
   "sku": "WB-22",
   "name": "Wiper blade 22\"",
   "unit": "pc",
   "onHand": 2,
   "reorder": 6,
   "cost": 380,
   "supplier": "bosch"
  },
  {
   "id": "p16",
   "sku": "ALT-0412-B",
   "name": "Bosch alternator",
   "unit": "pc",
   "onHand": 1,
   "reorder": 2,
   "cost": 7450,
   "supplier": "bosch"
  },
  {
   "id": "p17",
   "sku": "MOT-55D23L",
   "name": "Motolite 55D23L battery",
   "unit": "pc",
   "onHand": 2,
   "reorder": 6,
   "cost": 4850,
   "supplier": "motolite"
  },
  {
   "id": "p18",
   "sku": "MOT-NS60",
   "name": "Motolite NS60 battery",
   "unit": "pc",
   "onHand": 5,
   "reorder": 4,
   "cost": 4500,
   "supplier": "motolite"
  },
  {
   "id": "p19",
   "sku": "BOS-BP-F",
   "name": "Bosch brake pad set (front)",
   "unit": "set",
   "onHand": 9,
   "reorder": 6,
   "cost": 1450,
   "supplier": "bosch"
  },
  {
   "id": "p20",
   "sku": "BRM-P06",
   "name": "Brembo P06 brake pad set (front)",
   "unit": "set",
   "onHand": 0,
   "reorder": 4,
   "cost": 2650,
   "supplier": "autopro"
  },
  {
   "id": "p21",
   "sku": "KYB-334-VIOS",
   "name": "KYB shock absorber, front (Vios)",
   "unit": "pc",
   "onHand": 4,
   "reorder": 2,
   "cost": 2950,
   "supplier": "autopro"
  },
  {
   "id": "p22",
   "sku": "RAG-1KG",
   "name": "Shop rags 1kg",
   "unit": "bag",
   "onHand": 12,
   "reorder": 5,
   "cost": 95,
   "supplier": "ace"
  },
  {
   "id": "p23",
   "sku": "WD40-382",
   "name": "WD-40 382ml",
   "unit": "can",
   "onHand": 9,
   "reorder": 6,
   "cost": 260,
   "supplier": "ace"
  }
 ],
 "people": [
  {
   "id": "berto",
   "short": "Berto",
   "initials": "BV"
  },
  {
   "id": "joy",
   "short": "Aling Joy",
   "initials": "JM"
  },
  {
   "id": "mon",
   "short": "Mon",
   "initials": "RD"
  },
  {
   "id": "nonoy",
   "short": "Nonoy",
   "initials": "NB"
  },
  {
   "id": "dandy",
   "short": "Dandy",
   "initials": "DR"
  }
 ],
 "pos": [
  {
   "no": "PO-0224",
   "supplier": "autopro",
   "status": "DRAFT",
   "ordered": null,
   "expected": "Thu 22 Oct · by 14:00 if sent by 10:00",
   "draftedBy": "leda",
   "lines": [
    {
     "p": "p07",
     "ordered": 60,
     "received": 0,
     "cost": 245
    },
    {
     "p": "p10",
     "ordered": 5,
     "received": 0,
     "cost": 750
    }
   ]
  },
  {
   "no": "PO-0223",
   "supplier": "bosch",
   "status": "PARTIAL",
   "ordered": "Mon 19 Oct",
   "expected": "Mon 26 Oct (rest)",
   "lines": [
    {
     "p": "p19",
     "ordered": 8,
     "received": 8,
     "cost": 1450
    },
    {
     "p": "p16",
     "ordered": 2,
     "received": 0,
     "cost": 7450
    },
    {
     "p": "p14",
     "ordered": 2,
     "received": 0,
     "cost": 1200
    }
   ]
  },
  {
   "no": "PO-0222",
   "supplier": "motolite",
   "status": "ORDERED",
   "ordered": "Tue 20 Oct",
   "expected": "Fri 23 Oct",
   "lines": [
    {
     "p": "p17",
     "ordered": 6,
     "received": 0,
     "cost": 4850
    },
    {
     "p": "p18",
     "ordered": 3,
     "received": 0,
     "cost": 4500
    }
   ]
  }
 ],
 "carts": [
  {
   "id": "L-c1",
   "sup": "petron",
   "by": "joy",
   "at": "8:40 AM",
   "lines": [
    {
     "p": "p06",
     "qty": 8,
     "by": "joy"
    }
   ]
  }
 ]
};
export const OL_B: OLTenant = {
 "key": "b",
 "company": "Brew & Butter",
 "platform": "Café Inventory",
 "place": "Maginhawa St, Teachers Village, QC",
 "hoursLabel": "Daily 7:00-21:00",
 "suppliers": [
  {
   "id": "dairy",
   "name": "Mabuhay Dairy Supply",
   "leadTime": "Next morning if ordered by 15:00",
   "cutoff": "15:00"
  },
  {
   "id": "beans",
   "name": "Sagada Highland Coffee",
   "leadTime": "2-3 days"
  },
  {
   "id": "syrup",
   "name": "Bellissimo Trading",
   "leadTime": "2 days"
  },
  {
   "id": "bake",
   "name": "Panaderia Uno Wholesale",
   "leadTime": "Next morning"
  },
  {
   "id": "pack",
   "name": "QC Packaging Center",
   "leadTime": "1-2 days"
  },
  {
   "id": "meat",
   "name": "Commonwealth Meat Shop",
   "leadTime": "Same day"
  },
  {
   "id": "sea",
   "name": "Navotas Fishport Traders",
   "leadTime": "Next morning"
  },
  {
   "id": "veg",
   "name": "Balintawak Fresh Produce",
   "leadTime": "Next morning"
  },
  {
   "id": "dry",
   "name": "Puregold Wholesale",
   "leadTime": "Same day"
  },
  {
   "id": "clean",
   "name": "Clean Pro Supplies",
   "leadTime": "2 days"
  }
 ],
 "contacts": {
  "dairy": {
   "who": "Tina Mabuhay",
   "phone": "0917 555 0142",
   "email": "orders@mabuhaydairy.ph",
   "addr": "Balintawak, Quezon City"
  },
  "beans": {
   "who": "Gabriel Dulnuan",
   "phone": "0918 555 0177",
   "email": "sales@sagadacoffee.ph",
   "addr": "Sagada, Mountain Province"
  },
  "syrup": {
   "who": "Marco Bellini",
   "phone": "(02) 8777 4040",
   "email": "orders@bellissimo.ph",
   "addr": "Greenhills, San Juan"
  },
  "bake": {
   "who": "Elsa Uno",
   "phone": "0920 555 0108",
   "email": "wholesale@panaderiauno.ph",
   "addr": "Project 4, Quezon City"
  },
  "pack": {
   "who": "Rey Tan",
   "phone": "(02) 8923 1188",
   "email": "sales@qcpackaging.ph",
   "addr": "Kamias Rd, Quezon City"
  },
  "meat": {
   "who": "Boy Cruz",
   "phone": "0915 555 0129",
   "email": "orders@cwmeat.ph",
   "addr": "Commonwealth Ave, Quezon City"
  },
  "sea": {
   "who": "Nena Santos",
   "phone": "0916 555 0163",
   "email": "orders@navotasfish.ph",
   "addr": "Navotas Fish Port"
  },
  "veg": {
   "who": "Aling Mercy",
   "phone": "0919 555 0190",
   "email": "fresh@balintawak.ph",
   "addr": "Balintawak Market"
  },
  "dry": {
   "who": "Customer desk",
   "phone": "(02) 8800 2200",
   "email": "wholesale@puregoldw.ph",
   "addr": "Cubao, Quezon City"
  },
  "clean": {
   "who": "Jun Pascual",
   "phone": "(02) 8911 6060",
   "email": "sales@cleanpro.ph",
   "addr": "Mandaluyong"
  }
 },
 "products": [
  {
   "id": "b01",
   "sku": "MLK-FRESH-1L",
   "name": "Fresh milk 1L",
   "unit": "carton",
   "onHand": 8,
   "reorder": 24,
   "cost": 98,
   "supplier": "dairy"
  },
  {
   "id": "b02",
   "sku": "CRM-WHIP-1L",
   "name": "Whipping cream 1L",
   "unit": "carton",
   "onHand": 3,
   "reorder": 6,
   "cost": 285,
   "supplier": "dairy"
  },
  {
   "id": "b03",
   "sku": "BTR-UNS-225",
   "name": "Unsalted butter 225g",
   "unit": "block",
   "onHand": 10,
   "reorder": 8,
   "cost": 165,
   "supplier": "dairy"
  },
  {
   "id": "b04",
   "sku": "BEAN-SAG-1KG",
   "name": "Sagada arabica beans 1kg",
   "unit": "bag",
   "onHand": 4,
   "reorder": 3,
   "cost": 1150,
   "supplier": "beans"
  },
  {
   "id": "b05",
   "sku": "BEAN-BAR-1KG",
   "name": "Barako blend beans 1kg",
   "unit": "bag",
   "onHand": 2,
   "reorder": 4,
   "cost": 720,
   "supplier": "beans"
  },
  {
   "id": "b06",
   "sku": "SYR-VAN-750",
   "name": "Vanilla syrup 750ml",
   "unit": "bottle",
   "onHand": 5,
   "reorder": 3,
   "cost": 420,
   "supplier": "syrup"
  },
  {
   "id": "b07",
   "sku": "SYR-CAR-750",
   "name": "Caramel syrup 750ml",
   "unit": "bottle",
   "onHand": 1,
   "reorder": 3,
   "cost": 420,
   "supplier": "syrup"
  },
  {
   "id": "b08",
   "sku": "MAT-PWD-500",
   "name": "Matcha powder 500g",
   "unit": "pack",
   "onHand": 2,
   "reorder": 2,
   "cost": 890,
   "supplier": "syrup"
  },
  {
   "id": "b09",
   "sku": "CRO-DGH-12",
   "name": "Croissant dough (12 pcs)",
   "unit": "pack",
   "onHand": 6,
   "reorder": 4,
   "cost": 540,
   "supplier": "bake"
  },
  {
   "id": "b10",
   "sku": "CUP-HOT-12",
   "name": "Hot cup 12oz (50s)",
   "unit": "sleeve",
   "onHand": 14,
   "reorder": 10,
   "cost": 260,
   "supplier": "pack"
  },
  {
   "id": "b11",
   "sku": "LID-HOT-12",
   "name": "Hot cup lid 12oz (50s)",
   "unit": "sleeve",
   "onHand": 0,
   "reorder": 8,
   "cost": 140,
   "supplier": "pack"
  },
  {
   "id": "b12",
   "sku": "BCN-SLC-1KG",
   "name": "Bacon slices 1kg",
   "unit": "pack",
   "onHand": 3,
   "reorder": 3,
   "cost": 520,
   "supplier": "meat"
  },
  {
   "id": "b13",
   "sku": "SAL-FIL-1KG",
   "name": "Salmon fillet 1kg",
   "unit": "pack",
   "onHand": 2,
   "reorder": 2,
   "cost": 1180,
   "supplier": "sea"
  },
  {
   "id": "b14",
   "sku": "LET-ROM-1KG",
   "name": "Romaine lettuce 1kg",
   "unit": "kg",
   "onHand": 1,
   "reorder": 3,
   "cost": 210,
   "supplier": "veg"
  },
  {
   "id": "b15",
   "sku": "OIL-CAN-1L",
   "name": "Canola oil 1L",
   "unit": "bottle",
   "onHand": 6,
   "reorder": 4,
   "cost": 165,
   "supplier": "dry"
  }
 ],
 "people": [
  {
   "id": "carlo",
   "short": "Carlo",
   "initials": "CR"
  },
  {
   "id": "mika",
   "short": "Mika",
   "initials": "MT"
  },
  {
   "id": "bea",
   "short": "Bea",
   "initials": "BS"
  },
  {
   "id": "jomar",
   "short": "Jomar",
   "initials": "JL"
  }
 ],
 "pos": [
  {
   "no": "PO-0047",
   "supplier": "dairy",
   "status": "DRAFT",
   "ordered": null,
   "expected": "Fri 23 Oct, 7:00 if sent by 15:00",
   "draftedBy": "leda",
   "lines": [
    {
     "p": "b01",
     "ordered": 36,
     "received": 0,
     "cost": 98
    },
    {
     "p": "b02",
     "ordered": 6,
     "received": 0,
     "cost": 285
    }
   ]
  },
  {
   "no": "PO-0046",
   "supplier": "beans",
   "status": "ORDERED",
   "ordered": "Tue 20 Oct",
   "expected": "Fri 23 Oct",
   "lines": [
    {
     "p": "b05",
     "ordered": 6,
     "received": 0,
     "cost": 720
    },
    {
     "p": "b04",
     "ordered": 2,
     "received": 0,
     "cost": 1150
    }
   ]
  }
 ],
 "carts": [
  {
   "id": "L-c1",
   "sup": "pack",
   "by": "mika",
   "at": "8:15 AM",
   "lines": [
    {
     "p": "b11",
     "qty": 16,
     "by": "mika"
    }
   ]
  }
 ]
};
