import vm from 'vm'; import fs from 'fs';
const dir = '/Users/earvingemenez/Projects/readyph/workshop/prototypes/portal-home/round-2/final/';
const win = { location: { search: '' }, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), localStorage: { getItem: () => null, setItem() {} } };
win.window = win;
const doc = { addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), documentElement: { dataset: {}, style: {}, classList: { add() {}, remove() {} } }, body: { dataset: {}, classList: { add() {}, remove() {} } }, readyState: 'loading' };
const ctx = vm.createContext({ window: win, document: doc, location: win.location, localStorage: win.localStorage, URLSearchParams, console, setTimeout, Date, matchMedia: win.matchMedia, navigator: {}, sessionStorage: win.localStorage });
for (const f of ['data.js', 'data-ext.js']) { try { vm.runInContext(fs.readFileSync(dir + f, 'utf8'), ctx, { filename: f }); } catch (e) { console.error(f, e.message); } }

export const A = win.DATA_ALL; export const EXT = win.EXT; export const CAT = win.CATALOG;