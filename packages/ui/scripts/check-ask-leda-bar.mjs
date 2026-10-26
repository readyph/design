// Browser check (RDY-266): real className props on AskLedaBar must not resize the button.
// Usage: STORYBOOK=http://localhost:6006 CHROME=/path/to/chrome PW=/path/to/playwright-core node scripts/check-ask-leda-bar.mjs
const { chromium } = await import(process.env.PW ?? 'playwright-core');
const base = process.env.STORYBOOK ?? 'http://localhost:6006';
const b = await chromium.launch({ executablePath: process.env.CHROME });
let bad = 0;
for (const theme of ['light', 'dark']) for (const w of [1280, 560, 375, 320]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme });
  const p = await c.newPage();
  await p.goto(`${base}/iframe.html?id=components-leda-ask-leda-bar--class-name-stress&viewMode=story`);
  await p.waitForSelector('[data-case] button');
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  const rows = await p.evaluate(() => [...document.querySelectorAll('[data-case]')].map((d) => {
    const bt = d.querySelector('button').getBoundingClientRect(); const o = d.firstElementChild.getBoundingClientRect();
    return [d.dataset.case, Math.round(bt.width), Math.round(bt.height), Math.round(o.width), Math.round(bt.x)];
  }));
  for (const [k, bw, bh, ow] of rows) {
    const v = k.split('|')[0];
    const exp = v === 'bar' ? (w <= 640 ? 44 : 320) : Math.min(560, w - 64 - (k.endsWith('ml-4') ? 16 : 0)); // story + iframe padding take 64px
    const eh = v === 'bar' ? (w <= 640 ? 44 : 34) : 44;
    const eo = bw; // outer box never wider than the button
    if (bw !== exp || bh !== eh || ow !== eo) { bad++; console.log('BAD', theme, w, k, { bw, bh, ow, exp }); }
  }
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  if (sw > w) { bad++; console.log('SCROLL', theme, w, sw); }
  await c.close();
}
console.log(bad ? `${bad} problems` : 'all sizes hold'); await b.close(); process.exit(bad ? 1 : 0);
