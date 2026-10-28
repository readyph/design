import { useState, type MouseEvent } from 'react';
import type { StockerParams } from './Stocker.data';
import { StockerHomePage } from './Stocker.home';
import { StockerInPage } from './Stocker.in';
import { StockerOutPage } from './Stocker.out';
import { StockerFindPage } from './Stocker.find';
import { StockerAccountPage, StockerSignedOutPage } from './Stocker.account';

/* RDY-408, Stocker 7/7 (g): the six pages joined. The workshop moves between stocker*.html files with links and location.href (stocker.js 52-54);
   here the same links open the matching page component with the same query string. stocker.js 57: stocker.html?p= opens Find. */
const PAGES: Record<string, (p: StockerParams) => JSX.Element> = {
  'stocker.html': StockerHomePage,
  'stocker-in.html': StockerInPage,
  'stocker-out.html': StockerOutPage,
  'stocker-find.html': StockerFindPage,
  'stocker-me.html': StockerAccountPage,
  'stocker-signedout.html': StockerSignedOutPage,
};

type Target = { file: string; params: StockerParams };

export function parseStockerHref(href: string): Target | null {
  const [file, query = ''] = href.split('?');
  if (!PAGES[file]) return null;
  const q = new URLSearchParams(query);
  const params: StockerParams = {};
  const tenant = q.get('tenant'), state = q.get('state'), via = q.get('via'), from = q.get('from'), theme = q.get('theme');
  if (tenant === 'b') params.tenant = 'b';
  if (state) params.state = state as StockerParams['state'];
  if (via === 'order' || via === 'other') params.via = via;
  if (q.has('np')) params.np = q.get('np') ?? '';
  if (from) params.from = from as StockerParams['from'];
  if (q.has('ask')) params.ask = q.get('ask') ?? '';
  if (q.get('done')) params.done = true;
  if (q.get('p')) params.p = q.get('p') as string;
  if (q.get('po')) params.po = q.get('po') as string;
  if (q.get('tr')) params.tr = q.get('tr') as string;
  if (theme === 'light' || theme === 'dark') params.theme = theme;
  if (file === 'stocker.html' && params.p && params.ask == null && params.np == null) return { file: 'stocker-find.html', params };
  return { file, params };
}

export function StockerApp(initial: StockerParams & { page?: keyof typeof PAGES }) {
  const { page = 'stocker.html', ...rest } = initial;
  const [t, setT] = useState<Target>({ file: page, params: rest });
  const [n, setN] = useState(0);
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href');
    const next = href ? parseStockerHref(href) : null;
    if (!next) return;
    e.preventDefault();
    setT(next);
    setN((x) => x + 1);
  };
  const Page = PAGES[t.file];
  return <div className="contents" onClick={onClick}><Page key={n} {...t.params} /></div>;
}
