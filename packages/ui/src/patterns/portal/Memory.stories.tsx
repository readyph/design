import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ReactNode } from 'react';
import { FileText, Plus, PencilSimple, WaveTriangle, Clock, DotsThree } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Badge } from '../../components/Badge';
import { Icon } from '../../components/Icon';
import { SearchBar } from '../../components/SearchBar';
import { PortalShell } from './shell';

/**
 * Memory — what Leda knows about the company, as a Dropbox-like store of
 * Markdown docs. Browse the cards, click one to view it, edit in place. Leda
 * writes here too (marked "by Leda"). See 03-Portal.md §10. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Memory',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

interface Doc {
  id: string;
  title: string;
  tag: string;
  updated: string;
  by: 'Leda' | 'you';
  snippet: string;
  body: ReactNode;
}

const docs: Doc[] = [
  {
    id: 'hours',
    title: 'Opening hours',
    tag: 'Schedule',
    updated: '2d ago',
    by: 'Leda',
    snippet: 'Mon–Sat 8:00–20:00, Sun 9:00–18:00. Closed on public holidays.',
    body: (
      <>
        <h2 className="mt-0 text-base font-semibold text-ink">Opening hours</h2>
        <ul className="my-3 space-y-1 text-sm text-ink">
          <li>Monday–Friday — 8:00 AM to 8:00 PM</li>
          <li>Saturday — 8:00 AM to 8:00 PM</li>
          <li>Sunday — 9:00 AM to 6:00 PM</li>
        </ul>
        <p className="text-sm text-ink">We are closed on national public holidays. Holiday hours are announced a week ahead.</p>
      </>
    ),
  },
  {
    id: 'faq',
    title: 'Customer FAQ',
    tag: 'FAQ',
    updated: '1d ago',
    by: 'Leda',
    snippet: 'Delivery, returns, bulk orders, and payment questions customers ask most.',
    body: (
      <>
        <h2 className="mt-0 text-base font-semibold text-ink">Customer FAQ</h2>
        <p className="mt-2 text-sm font-medium text-ink">Do you deliver?</p>
        <p className="text-sm text-ink-muted">Yes — within Metro Manila, same-day for orders before 2 PM.</p>
        <p className="mt-3 text-sm font-medium text-ink">Can I return items?</p>
        <p className="text-sm text-ink-muted">Fresh produce within 24 hours with a receipt; see the Return policy.</p>
        <p className="mt-3 text-sm font-medium text-ink">Do you take bulk orders?</p>
        <p className="text-sm text-ink-muted">Yes, for 20+ units — message us and Leda will prepare a quote.</p>
      </>
    ),
  },
  {
    id: 'returns',
    title: 'Return policy',
    tag: 'Policy',
    updated: '5d ago',
    by: 'you',
    snippet: 'Fresh produce returnable within 24 hours with a receipt.',
    body: (
      <>
        <h2 className="mt-0 text-base font-semibold text-ink">Return policy</h2>
        <p className="mt-2 text-sm text-ink">Fresh produce can be returned within 24 hours of purchase with a valid receipt. Refunds are issued to the original payment method within 3 business days.</p>
      </>
    ),
  },
  {
    id: 'delivery',
    title: 'Delivery areas',
    tag: 'Delivery',
    updated: '1w ago',
    by: 'you',
    snippet: 'Metro Manila and nearby cities, with cut-off times per zone.',
    body: <p className="text-sm text-ink">Metro Manila (same-day), Cavite &amp; Rizal (next-day). Cut-off 2:00 PM.</p>,
  },
  {
    id: 'promos',
    title: 'Current promotions',
    tag: 'Marketing',
    updated: '3h ago',
    by: 'Leda',
    snippet: '10% off citrus this week; free delivery over ₱1,500.',
    body: <p className="text-sm text-ink">This week: 10% off all citrus. Free delivery for orders over ₱1,500.</p>,
  },
  {
    id: 'contact',
    title: 'Contact & location',
    tag: 'Company',
    updated: '2w ago',
    by: 'you',
    snippet: 'Address, phone, and branch locations.',
    body: <p className="text-sm text-ink">Main branch: 12 Mabini St, Makati. ☎ (02) 8123 4567.</p>,
  },
];

export const Memory: Story = {
  name: 'Memory (knowledge)',
  render: function MemoryPage() {
    const [selected, setSelected] = useState<string>('faq');
    const doc = docs.find((d) => d.id === selected) ?? null;

    return (
      <PortalShell active="memory" title="Memory" scroll={false}>
        <div className="flex min-h-0 flex-1">
          {/* files */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <div>
                <p className="text-sm font-semibold text-ink">Company memory</p>
                <p className="text-xs text-ink-subtle">What Leda knows and answers from</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-40 sm:w-56">
                  <SearchBar placeholder="Search memory…" />
                </div>
                <Button size="sm" leftIcon={Plus}>New</Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]">
                {docs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d.id)}
                    className={cnCard(d.id === selected)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                        <Icon icon={FileText} size="md" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{d.title}</p>
                        <Badge tone={d.by === 'Leda' ? 'primary' : 'neutral'} size="sm">{d.tag}</Badge>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{d.snippet}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-ink-subtle">
                      <Icon icon={Clock} size="sm" /> {d.updated} · by {d.by}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* preview */}
          <aside className="hidden w-96 shrink-0 flex-col lg:flex">
            {doc ? (
              <>
                <div className="flex items-center gap-2 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{doc.title}</p>
                    <p className="text-xs text-ink-subtle">Updated {doc.updated} · by {doc.by}</p>
                  </div>
                  <IconButton icon={DotsThree} label="More" variant="subtle" size="sm" />
                  <Button size="sm" variant="secondary" leftIcon={PencilSimple}>Edit</Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 leading-relaxed">{doc.body}</div>
                <div className="flex items-center gap-2 px-5 py-3 text-xs text-ink-subtle">
                  <Icon icon={WaveTriangle} size="sm" className="text-primary-500" />
                  {doc.by === 'Leda' ? 'Saved by Leda from your conversations' : 'Edited by you'}
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-6 text-center text-sm text-ink-subtle">
                Select a memory to view it
              </div>
            )}
          </aside>
        </div>
      </PortalShell>
    );
  },
};

function cnCard(selected: boolean): string {
  return [
    'flex flex-col rounded-xl border bg-surface p-4 text-left transition-colors',
    selected ? 'border-primary-300 ring-1 ring-primary-200' : 'border-transparent hover:border-primary-200 hover:bg-surface-subtle',
  ].join(' ');
}
