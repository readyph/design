import type { Meta, StoryObj } from '@storybook/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { SheetBar } from './SheetBar';
import { Breadcrumbs } from './Breadcrumbs';
import { Tabs } from './Tabs';
import { Button } from './Button';

const meta: Meta<typeof SheetBar> = {
  title: 'Components/Navigation/SheetBar',
  component: SheetBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Sheet bar (C5): 48px, 24px side padding, one bottom border. Left slot takes the free width (tabs C5 or breadcrumb C42); right slot holds the Leda bar and page buttons and never shrinks.',
          '',
          'Compose with `Breadcrumbs variant="sheet"` and fixed `Tabs` side by side (Memory). The stories below measure the back label at 320, 640, 920 and 1280px: the readout under each bar shows the label text width against the space it got.',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof SheetBar>;

const crumbs = [{ label: 'Memory', href: '#' }, { label: 'Deliveries' }];
const memoryTabs = [
  { value: 'topics', label: 'Topics', badge: 12 },
  { value: 'blocked', label: 'Blocked questions', badge: 3 },
  { value: 'requests', label: 'Customer requests' },
];

/** Reports the real back-label width and the bar height/border. "full" means no ellipsis. */
function Measured({ width, children }: { width: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState('measuring');
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const run = () => {
      const label = root.querySelector<HTMLElement>('ol a span.truncate, ol button span.truncate');
      const bar = root.firstElementChild as HTMLElement | null;
      const lab = label ? `back label ${Math.round(label.scrollWidth)}px text in ${Math.round(label.clientWidth)}px (${label.scrollWidth <= label.clientWidth ? 'full' : 'cut'})` : 'no back label';
      const tl = root.querySelector<HTMLElement>('[role="tablist"]');
      const tabs = tl ? `; tabs ${Math.round(tl.clientWidth)}/${Math.round(tl.scrollWidth)}px (${tl.scrollWidth <= tl.clientWidth + 1 ? 'all visible' : 'CLIPPED'})` : '';
      setInfo(`${lab}${tabs}; bar ${Math.round(bar?.getBoundingClientRect().height ?? 0)}px`);
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="max-w-full">
      <div ref={ref} className="max-w-full bg-surface" data-measure>
        {children}
      </div>
      <p className="mt-1 text-small text-muted">{width}px bar: {info}</p>
    </div>
  );
}

const bar = (w: number, tabs: boolean) => (
  <div className="max-w-full" style={{ width: w }}>
    <Measured width={w}>
      <SheetBar actions={<Button variant="secondary">Invite</Button>}>
        <Breadcrumbs aria-label={`Breadcrumb ${w}`} variant="sheet" items={crumbs} />
        {tabs && <Tabs variant="fixed" aria-label={`Memory ${w}`} items={memoryTabs} defaultValue="topics" className="ml-4" />}
      </SheetBar>
    </Measured>
  </div>
);

const widths = [320, 640, 920, 1280];
/** Back control + tabs cannot occur at 320: at 640px and below (the phone range) the back link sits in the phone top bar and Memory's tabs become chips (C42, C5 e). */
const tabWidths = [920, 1280];

export const BackControl: Story = {
  render: () => <div className="flex flex-col gap-6">{widths.map((w) => <div key={w}>{bar(w, false)}</div>)}</div>,
};

/** Regression (RDY-265 round 3): at 920 and 1280 the readout must say tabs N/N, all visible, and the back label full. */
export const BackControlAndTabs: Story = {
  render: () => <div className="flex flex-col gap-6">{tabWidths.map((w) => <div key={w}>{bar(w, true)}</div>)}</div>,
};

export const FixedTabsLongName: Story = {
  render: () => (
    <div className="max-w-full" style={{ width: 360 }}>
      <SheetBar>
        <Tabs
          variant="fixed"
          aria-label="Long names"
          defaultValue="a"
          items={[{ value: 'a', label: 'An unreasonably long tab name that must be cut with an ellipsis rather than grow' }, { value: 'b', label: 'Short' }]}
        />
      </SheetBar>
    </div>
  ),
};
