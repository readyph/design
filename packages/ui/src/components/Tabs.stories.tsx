import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Gear, HardDrives, ShieldCheck } from '@phosphor-icons/react';
import { Tabs, TabPanel, type TabItem } from './Tabs';
import { SheetBar } from './SheetBar';
import { Button } from './Button';
import { PlatformLogo } from './PlatformLogo';
import { cn } from '../utils/cn';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Tabs (C5, update) built on Radix Tabs: `role=tablist/tab/tabpanel`, roving tabindex, arrows + Home/End (Up/Down in `vertical`), automatic activation. `aria-controls` is only present while the panel is rendered. Switching is a 120ms opacity fade, never a slide.',
          '',
          'Variants: `editor` (closable, 96-180px, shrink before the strip scrolls; Delete closes), `fixed` (Memory), `vertical` (platform.html: icon, name, status word, "Unsaved" in warn), `chips` (phone, 44px). `preview` tabs are italic; double-click calls `onPin`. Tabs belong only on Home (editor), platform.html (sections) and Memory (fixed).',
          '',
          'Inside a `SheetBar`, render `Tabs` without children (navigation only) and put the panel in the page body, keyed by the same `value`. `underline` and `pill` still work as aliases of `fixed` and `chips`.',
          '',
          '```tsx',
          "import { Tabs, TabPanel, SheetBar } from '@readyph/ui';",
          '',
          '<SheetBar actions={<AskLedaBar />}>',
          '  <Tabs variant="editor" aria-label="Open items" items={tabs} value={v} onValueChange={setV} onClose={close} />',
          '</SheetBar>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Tabs>;

const memory: TabItem[] = [
  { value: 'topics', label: 'Topics', badge: 12 },
  { value: 'blocked', label: 'Blocked questions', badge: 3 },
  { value: 'requests', label: 'Customer requests' },
];

export const Fixed: Story = {
  render: function Example() {
    const [v, setV] = useState('topics');
    return (
      <div className="bg-surface p-pad">
        <Tabs variant="fixed" aria-label="Memory" items={memory} value={v} onValueChange={setV}>
          {memory.map((t) => (
            <TabPanel key={t.value} value={t.value} className="p-2 text-body text-text">
              {t.label} panel
            </TabPanel>
          ))}
        </Tabs>
      </div>
    );
  },
};

const open: TabItem[] = [
  { value: 'today', label: 'Today', closable: false },
  { value: 'c1', label: 'Return request, Marikina branch', closable: true, leading: <PlatformLogo name="Stockroom" size={16} decorative /> },
  { value: 'c2', label: 'Low stock alert', closable: true, preview: true },
  { value: 'c3', label: 'Invoice 2041', closable: true },
];

function EditorDemo({ initial = open, wide = true }: { initial?: TabItem[]; wide?: boolean }) {
  const [items, setItems] = useState(initial);
  const [v, setV] = useState(initial[0].value);
  const close = (id: string) => {
    setItems((all) => all.filter((t) => t.value !== id));
    if (id === v) setV(items[0].value);
  };
  return (
    <div className={cn('max-w-full bg-surface', wide ? 'w-[920px]' : 'w-[720px]')}>
      <SheetBar actions={<Button variant="secondary">Invite</Button>}>
        <Tabs
          variant="editor"
          aria-label="Open items"
          items={items}
          value={v}
          onValueChange={setV}
          onClose={close}
          onPin={(id) => setItems((all) => all.map((t) => (t.value === id ? { ...t, preview: false } : t)))}
        />
      </SheetBar>
      <p className="p-pad text-body text-text">Body for {v}</p>
    </div>
  );
}

export const Editor: Story = { render: () => <EditorDemo /> };

export const EditorManyTabs: Story = {
  render: () => (
    <EditorDemo
      wide={false}
      initial={Array.from({ length: 9 }, (_, i) => ({ value: `t${i}`, label: i === 3 ? 'A very long case title that has to be cut with an ellipsis' : `Case ${i + 1}`, closable: i > 0 }))}
    />
  ),
};

export const Vertical: Story = {
  render: function Example() {
    const [v, setV] = useState('system');
    const items: TabItem[] = [
      { value: 'system', label: 'System', icon: HardDrives, status: 'Saved' },
      { value: 'settings', label: 'Settings', icon: Gear, status: 'Unsaved', statusTone: 'warn' },
      { value: 'access', label: 'Access', icon: ShieldCheck, status: 'Saved' },
    ];
    return (
      <div className="w-[320px] max-w-full bg-surface p-pad">
        <Tabs variant="vertical" aria-label="Platform sections" items={items} value={v} onValueChange={setV} />
      </div>
    );
  },
};

export const PhoneChips: Story = {
  render: function Example() {
    const [v, setV] = useState('settings');
    const items: TabItem[] = [
      { value: 'system', label: 'System' },
      { value: 'settings', label: 'Settings' },
      { value: 'access', label: 'Access' },
      { value: 'billing', label: 'Billing' },
      { value: 'logs', label: 'Activity log' },
    ];
    return (
      <div className="w-[320px] max-w-full bg-surface p-4">
        <Tabs variant="chips" aria-label="Sections" items={items} value={v} onValueChange={setV} />
      </div>
    );
  },
};
