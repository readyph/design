import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ReactNode } from 'react';
import {
  Package,
  TrendUp,
  CurrencyDollar,
  Warning,
  ShoppingCart,
  Coffee,
  Drop,
  Cube,
  Clock,
  UsersThree,
  ArrowsClockwise,
  ChartLineUp,
  SquaresFour,
} from '@phosphor-icons/react';
import { LedaWidget, LedaTable, type LedaTableColumn } from './LedaWidget';
import { Chat } from './Chat';
import { Badge } from './Badge';
import { Field } from './Field';
import { Input } from './Input';

/**
 * **Leda AI chat widgets** — the interactive blocks Leda streams *inside* an
 * assistant message (Portal §4 / Inventory §4). A reply is a stream of these,
 * not plain text: **reads render** (Facts · StatGrid · Table · Chart · Heatmap ·
 * SegmentBars) and **writes propose** (Action proposal → Result), so every
 * change is shown before it happens (confirm-before-write, 01 §6).
 *
 * The look follows the ReadyPH portal: **fill and elevation, not borders** —
 * raised surfaces, filled inner tiles, blue carried through fill intensity,
 * value pills, heatmap tiles, segmented bars. Shown here on the portal's dark
 * theme (`data-theme="dark"`). Each example answers a real owner prompt from
 * `knowledgebase/tenants/prompts/business-owner-prompts.md`.
 */
const meta: Meta = {
  title: 'Components/Chat/Widgets',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Leda chat widgets — the in-conversation blocks that render inside a `Chat.Message`, on the portal dark theme. Compose the base `LedaWidget` card, or use a self-contained widget: `StatGrid`, `Chart`, `Heatmap`, `SegmentBars`, `Table`, `Facts`, `Proposal`, `Form`, `Choices`, `Links`, `Result`, `Memory`, `Suggestions`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

/** Frames widgets on the portal's dark canvas, like the Leda dock. */
function Dock({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div data-theme="dark" className="ds-root min-h-screen bg-surface-canvas p-6 font-sans text-ink">
      {label && <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</p>}
      <div className="flex w-[460px] max-w-full flex-col gap-3">{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------------- data ----- */

interface LowStockRow {
  name: string;
  sku: string;
  stock: string;
  reorder: number;
}
const lowStock: LowStockRow[] = [
  { name: 'House espresso beans', sku: 'BEAN-HSE', stock: '3 kg', reorder: 8 },
  { name: 'Oat milk (1L)', sku: 'MILK-OAT', stock: '4 cartons', reorder: 12 },
  { name: 'Vanilla syrup', sku: 'SYR-VAN', stock: '1 btl', reorder: 4 },
  { name: '12oz paper cups', sku: 'CUP-12', stock: '180 pcs', reorder: 500 },
];
const lowStockCols: LedaTableColumn<LowStockRow>[] = [
  { key: 'name', header: 'Product', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
  { key: 'sku', header: 'SKU', render: (r) => <span className="text-ink-subtle">{r.sku}</span> },
  { key: 'stock', header: 'In stock', align: 'right', render: (r) => <Badge tone="warning" size="sm">{r.stock}</Badge> },
  { key: 'reorder', header: 'Reorder at', align: 'right', render: (r) => <span className="tabular-nums">{r.reorder}</span> },
];

interface ReconRow {
  item: string;
  ordered: number;
  received: number;
}
const recon: ReconRow[] = [
  { item: 'House espresso beans', ordered: 30, received: 30 },
  { item: 'Decaf beans', ordered: 10, received: 8 },
  { item: 'Oat milk (1L)', ordered: 24, received: 24 },
];
const reconCols: LedaTableColumn<ReconRow>[] = [
  { key: 'item', header: 'Line', render: (r) => <span className="font-medium text-ink">{r.item}</span> },
  { key: 'ordered', header: 'Ordered', align: 'right', render: (r) => <span className="tabular-nums">{r.ordered}</span> },
  { key: 'received', header: 'Received', align: 'right', render: (r) => <span className="tabular-nums">{r.received}</span> },
  {
    key: 'variance',
    header: 'Variance',
    align: 'right',
    render: (r) => {
      const v = r.received - r.ordered;
      return v === 0 ? <Badge tone="success" size="sm">OK</Badge> : <Badge tone="error" size="sm">{v} short</Badge>;
    },
  },
];

/* --------------------------------------------------------- single widgets -- */

export const StockHealth: Story = {
  name: 'StatGrid · inventory health',
  render: () => (
    <Dock label="READ · inventory__summarize_inventory">
      <LedaWidget.StatGrid
        icon={Package}
        title="Inventory health"
        meta="Across all categories · live"
        columns={2}
        items={[
          { label: 'Total SKUs', value: '128', icon: Cube },
          { label: 'Low stock', value: '7', delta: '+2 today', deltaTone: 'error', icon: Warning },
          { label: 'Out of stock', value: '3', deltaTone: 'error' },
          { label: 'Stock value', value: '₱146k', delta: '+4%', deltaTone: 'success', icon: CurrencyDollar },
        ]}
      />
    </Dock>
  ),
};

export const LowStockTable: Story = {
  name: 'Table · what\'s low on stock',
  render: () => (
    <Dock label="READ · inventory__list_low_stock">
      <LedaWidget
        icon={Warning}
        tone="warning"
        title="7 products below reorder level"
        meta="Showing the 4 most urgent"
        footer={<LedaWidget.Suggestions items={[{ label: 'Draft a reorder PO', icon: ShoppingCart }, 'Show all 7']} />}
      >
        <LedaTable columns={lowStockCols} data={lowStock} rowKey={(r) => r.sku} />
      </LedaWidget>
    </Dock>
  ),
};

export const SalesChart: Story = {
  name: 'Chart · income sources (value pills)',
  render: () => (
    <Dock label="READ · inventory__report / sales">
      <LedaWidget.Chart
        icon={TrendUp}
        title="Income sources"
        meta="This month, by channel"
        total="₱8.83K"
        delta={{ value: '+72.4% vs last month', tone: 'success' }}
        kind="bar"
        valuePills
        showLabels
        formatValue={(v) => `₱${(v / 1000).toFixed(2)}k`}
        data={[
          { label: 'Sales', value: 1766 },
          { label: 'Ads', value: 883 },
          { label: 'Commissions', value: 3532 },
          { label: 'Shipping', value: 2649 },
        ]}
      />
      <LedaWidget.Chart
        icon={ChartLineUp}
        title="Revenue · last 7 days"
        total="₱24.6k"
        delta={{ value: '+12%', tone: 'success' }}
        kind="area"
        data={[38, 30, 42, 56, 44, 62, 71]}
      />
    </Dock>
  ),
};

export const OrdersHeatmap: Story = {
  name: 'Heatmap · orders breakdown',
  render: () => (
    <Dock label="READ · inventory__report (orders by category/day)">
      <LedaWidget.Heatmap
        icon={SquaresFour}
        title="Orders breakdown"
        meta="This week"
        columns={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
        rows={[
          { label: 'Beans', cells: [0.9, 0.5, 0.75, 0.25, 0.8, 0.6] },
          { label: 'Milk', cells: [0.2, 0.7, 0.55, 0.3, 0.85, 0.15] },
          { label: 'Pastry', cells: [0.65, 0.35, 0.9, 0.2, 0.5, 0.95] },
        ]}
      />
    </Dock>
  ),
};

export const IncomeSegments: Story = {
  name: 'SegmentBars · income by day',
  render: () => (
    <Dock label="READ · income weekly">
      <LedaWidget.SegmentBars
        icon={CurrencyDollar}
        title="Income"
        meta="Weekly · ₱5,456.00"
        rows={[
          { label: 'Mon', filled: 3, total: 9 },
          { label: 'Tue', filled: 2, total: 9 },
          { label: 'Wed', filled: 4, total: 9 },
          { label: 'Thu', filled: 7, total: 9 },
          { label: 'Fri', filled: 3, total: 9 },
          { label: 'Sat', filled: 8, total: 9 },
          { label: 'Sun', filled: 6, total: 9 },
        ]}
      />
    </Dock>
  ),
};

export const ProductFacts: Story = {
  name: 'Facts · product detail',
  render: () => (
    <Dock label="READ · inventory__get_product">
      <LedaWidget.Facts
        icon={Coffee}
        title="House espresso beans"
        meta="BEAN-HSE · Beans"
        items={[
          { label: 'In stock', value: <Badge tone="warning" size="sm">3 kg</Badge> },
          { label: 'Reorder level', value: '8 kg' },
          { label: 'Unit price', value: '₱820 / kg' },
          { label: 'Supplier', value: 'Kalsada Coffee' },
          { label: 'Last received', value: '4 days ago' },
        ]}
        footer={<LedaWidget.Suggestions items={['Stock in beans', 'Reorder from Kalsada', 'Movement history']} />}
      />
    </Dock>
  ),
};

export const StockInProposal: Story = {
  name: 'Action proposal · stock in (interactive)',
  render: function StockInDemo() {
    const [status, setStatus] = useState<'pending' | 'applying' | 'confirmed'>('pending');
    return (
      <Dock label="WRITE · inventory__adjust_stock — confirm-before-write">
        <LedaWidget.Proposal
          title="Stock in — House espresso beans"
          intent="stock"
          summary="Received from Kalsada Coffee · reference DR-2291"
          status={status}
          resultText="Stocked in. New level: 23 kg."
          confirmLabel="Confirm stock-in"
          onConfirm={() => {
            setStatus('applying');
            setTimeout(() => setStatus('confirmed'), 900);
          }}
          onCancel={() => setStatus('pending')}
          changes={[
            { label: 'House espresso beans', value: '20 kg', sign: 'in' },
            { label: 'Movement reason', to: 'received' },
            { label: 'New stock level', from: '3 kg', to: '23 kg' },
          ]}
        />
      </Dock>
    );
  },
};

export const DeleteProposal: Story = {
  name: 'Action proposal · destructive',
  render: () => (
    <Dock label="WRITE · destructive — explicit confirm">
      <LedaWidget.Proposal
        title="Delete product"
        intent="delete"
        destructive
        summary="This removes the product and hides its history. It can't be undone."
        confirmLabel="Delete product"
        changes={[{ label: 'Summer-only Ube latte mix', value: 'remove' }]}
      />
    </Dock>
  ),
};

export const AddProductForm: Story = {
  name: 'Form · add a product (interactive)',
  render: function AddProductDemo() {
    const [done, setDone] = useState(false);
    if (done)
      return (
        <Dock label="WRITE · inventory__create_product → Result">
          <LedaWidget.Result
            tone="success"
            title="Added Single-origin Benguet beans"
            detail="SKU BEAN-BEN · ₱900/kg · reorder at 5 kg. It's live in your catalog."
          />
        </Dock>
      );
    return (
      <Dock label="WRITE · inventory__create_product (collect → propose)">
        <LedaWidget.Form
          title="Add a product"
          meta="Fill what you know — Leda confirms before saving"
          submitLabel="Review & save"
          onSubmit={() => setDone(true)}
        >
          <Field label="Name">
            <Input defaultValue="Single-origin Benguet beans" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <Input defaultValue="BEAN-BEN" />
            </Field>
            <Field label="Price (₱/kg)">
              <Input type="number" defaultValue="900" />
            </Field>
          </div>
          <Field label="Reorder level (kg)">
            <Input type="number" defaultValue="5" />
          </Field>
        </LedaWidget.Form>
      </Dock>
    );
  },
};

export const WhichProduct: Story = {
  name: 'Choices · disambiguation',
  render: () => (
    <Dock label="READ → next step · disambiguation">
      <LedaWidget.Choices
        icon={Coffee}
        title="We carry 3 bean products — which one?"
        options={[
          { id: '1', label: 'House espresso beans', description: 'BEAN-HSE · 3 kg left', icon: Coffee },
          { id: '2', label: 'Decaf beans', description: 'BEAN-DEC · 6 kg left', icon: Coffee },
          { id: '3', label: 'Single-origin Benguet', description: 'BEAN-BEN · 11 kg left', icon: Coffee },
        ]}
      />
    </Dock>
  ),
};

export const OpenPages: Story = {
  name: 'Links · deep links',
  render: () => (
    <Dock label="READ · navigation">
      <LedaWidget.Links
        title="You can also manage this here"
        links={[
          { label: 'Team', description: 'Members, roles & invitations', icon: UsersThree, href: '#' },
          { label: 'Purchase Orders', description: '3 open · 1 short-delivered', icon: ShoppingCart, href: '#' },
          { label: 'Settings › Schedule', description: 'Business hours & holidays', icon: Clock, href: '#' },
        ]}
      />
    </Dock>
  ),
};

export const ResultStates: Story = {
  name: 'Result · outcomes',
  render: () => (
    <Dock label="after a confirmed write">
      <LedaWidget.Result tone="success" title="Stock updated" detail="House espresso beans: 3 kg → 23 kg." />
      <LedaWidget.Result tone="info" title="Report saved" detail="‘Weekly sales’ is now in Reports." />
      <LedaWidget.Result tone="warning" title="Partially received" detail="Decaf beans came up 2 kg short — variance logged." />
      <LedaWidget.Result tone="error" title="Couldn't update" detail="You don't have permission to change prices. Ask an admin." />
    </Dock>
  ),
};

export const MemoryCard: Story = {
  name: 'Memory · saved knowledge file',
  render: () => (
    <Dock label="WRITE · leda__write_memory">
      <LedaWidget.Memory name="WiFi & amenities" justSaved updatedBy="leda" updatedAt="just now" onOpen={() => {}} onEdit={() => {}}>
        Free WiFi for customers — ask staff for today's password. Pet-friendly on the terrace. Street parking only, free
        after 6pm.
      </LedaWidget.Memory>
    </Dock>
  ),
};

export const FollowUps: Story = {
  name: 'Suggestions · follow-up chips',
  render: () => (
    <Dock label="one-click next step">
      <LedaWidget.Suggestions
        items={[
          { label: "What's low on stock?", icon: Warning },
          { label: 'Revenue this week', icon: TrendUp },
          { label: 'Open purchase orders', icon: ShoppingCart },
          { label: "Who's on my team?", icon: UsersThree },
        ]}
      />
    </Dock>
  ),
};

export const Reconciliation: Story = {
  name: 'Reconciliation · did PO-1043 arrive in full?',
  render: () => (
    <Dock label="READ · inventory__get_purchase_order">
      <LedaWidget
        icon={ArrowsClockwise}
        tone="warning"
        title="PO-1043 · Kalsada Coffee"
        meta="Ordered Oct 6 · partially received"
        footer={<LedaWidget.Suggestions items={[{ label: 'Receive the rest', icon: ShoppingCart }, 'Flag the supplier']} />}
      >
        <LedaTable columns={reconCols} data={recon} rowKey={(r) => r.item} />
      </LedaWidget>
    </Dock>
  ),
};

export const TeamTable: Story = {
  name: 'Table · who\'s on my team',
  render: () => {
    interface Member {
      name: string;
      email: string;
      role: string;
      status: 'active' | 'invited';
    }
    const members: Member[] = [
      { name: 'Maria Santos', email: 'maria@kapetiryaluna.ph', role: 'Administrator', status: 'active' },
      { name: 'Ana Cruz', email: 'ana@kapetiryaluna.ph', role: 'Manager', status: 'active' },
      { name: 'Miguel Reyes', email: 'miguel@kapetiryaluna.ph', role: 'User', status: 'invited' },
    ];
    const cols: LedaTableColumn<Member>[] = [
      { key: 'name', header: 'Member', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
      { key: 'role', header: 'Role', render: (r) => <Badge tone={r.role === 'Administrator' ? 'primary' : 'neutral'} size="sm">{r.role}</Badge> },
      {
        key: 'status',
        header: 'Status',
        align: 'right',
        render: (r) =>
          r.status === 'active' ? (
            <Badge tone="success" size="sm" dot>Active</Badge>
          ) : (
            <Badge tone="warning" size="sm" dot>Invited</Badge>
          ),
      },
    ];
    return (
      <Dock label="READ · core__list_team_members">
        <LedaWidget
          icon={UsersThree}
          title="3 people on your team"
          footer={<LedaWidget.Suggestions items={[{ label: 'Invite a barista', icon: UsersThree }, 'Show roles & permissions']} />}
        >
          <LedaTable columns={cols} data={members} rowKey={(r) => r.email} />
        </LedaWidget>
      </Dock>
    );
  },
};

export const Gallery: Story = {
  name: 'Gallery (all widgets)',
  render: () => (
    <Dock label="the full set">
      <LedaWidget.StatGrid
        icon={Package}
        title="Inventory health"
        columns={2}
        items={[
          { label: 'Total SKUs', value: '128', icon: Cube },
          { label: 'Low stock', value: '7', delta: '+2', deltaTone: 'error', icon: Warning },
          { label: 'Out of stock', value: '3' },
          { label: 'Stock value', value: '₱146k', delta: '+4%', deltaTone: 'success' },
        ]}
      />
      <LedaWidget.Chart
        icon={TrendUp}
        title="Income sources"
        total="₱8.83K"
        delta={{ value: '+72.4%', tone: 'success' }}
        kind="bar"
        valuePills
        showLabels
        formatValue={(v) => `₱${(v / 1000).toFixed(1)}k`}
        data={[
          { label: 'Sales', value: 1766 },
          { label: 'Ads', value: 883 },
          { label: 'Comm.', value: 3532 },
          { label: 'Ship', value: 2649 },
        ]}
      />
      <LedaWidget.Heatmap
        icon={SquaresFour}
        title="Orders breakdown"
        columns={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
        rows={[
          { label: 'Home', cells: [0.9, 0.5, 0.75, 0.25, 0.8, 0.6] },
          { label: 'Beauty', cells: [0.2, 0.7, 0.55, 0.3, 0.85, 0.15] },
          { label: 'Decor', cells: [0.65, 0.35, 0.9, 0.2, 0.5, 0.95] },
        ]}
      />
      <LedaWidget.SegmentBars
        icon={CurrencyDollar}
        title="Income"
        meta="Weekly"
        rows={[
          { label: 'Thu', filled: 7, total: 9 },
          { label: 'Fri', filled: 3, total: 9 },
          { label: 'Sat', filled: 8, total: 9 },
        ]}
      />
      <LedaWidget.Proposal
        title="Stock in — House espresso beans"
        intent="stock"
        summary="Received from Kalsada Coffee"
        changes={[{ label: 'House espresso beans', value: '20 kg', sign: 'in' }, { label: 'New stock level', from: '3 kg', to: '23 kg' }]}
      />
      <LedaWidget.Result tone="success" title="Stock updated" detail="House espresso beans: 3 kg → 23 kg." />
      <LedaWidget.Suggestions items={[{ label: "What's low?", icon: Warning }, { label: 'Revenue', icon: TrendUp }]} />
    </Dock>
  ),
};

/* ----------------------------------------------------- end-to-end in chat -- */

type WidgetKind = 'lowstock' | 'proposal' | 'hoursResult';

interface Turn {
  id: number;
  role: 'user' | 'assistant';
  text?: ReactNode;
  widget?: WidgetKind;
}

let turnSeq = 1;

export const InConversation: Story = {
  name: 'In conversation (coffee shop)',
  parameters: { layout: 'centered' },
  render: function ConversationDemo() {
    const [turns, setTurns] = useState<Turn[]>([
      { id: 0, role: 'assistant', text: 'Morning, Maria. Ask me anything about Kapetirya Luna — stock, hours, your team.' },
    ]);
    const [proposed, setProposed] = useState<'pending' | 'applying' | 'confirmed'>('pending');

    const push = (t: Omit<Turn, 'id'>) => setTurns((p) => [...p, { ...t, id: turnSeq++ }]);

    const askStockIn = () => {
      setProposed('pending');
      push({ role: 'user', text: 'Stock in 20kg of house espresso beans from Kalsada.' });
      push({ role: 'assistant', text: "Here's what I'll record — confirm and I'll post it to the ledger:", widget: 'proposal' });
    };

    const askLowStock = () => {
      push({ role: 'user', text: "What's low on stock?" });
      push({ role: 'assistant', text: '7 products are below reorder level — the most urgent:', widget: 'lowstock' });
    };

    const askHours = () => {
      push({ role: 'user', text: 'Set us to open 6:30am on weekdays.' });
      push({ role: 'assistant', text: 'Updated your schedule — saved to Settings › Schedule:', widget: 'hoursResult' });
    };

    const renderWidget = (kind: WidgetKind) => {
      switch (kind) {
        case 'lowstock':
          return (
            <LedaWidget
              icon={Warning}
              tone="warning"
              title="Low stock"
              footer={<LedaWidget.Suggestions items={['Stock in beans', 'Draft a reorder PO']} onSelect={askStockIn} />}
            >
              <LedaTable columns={lowStockCols} data={lowStock.slice(0, 3)} rowKey={(r) => r.sku} />
            </LedaWidget>
          );
        case 'proposal':
          return (
            <LedaWidget.Proposal
              title="Stock in — House espresso beans"
              intent="stock"
              summary="Received from Kalsada Coffee"
              status={proposed}
              resultText="Posted. New level: 23 kg."
              confirmLabel="Confirm"
              onConfirm={() => {
                setProposed('applying');
                setTimeout(() => setProposed('confirmed'), 900);
              }}
              onCancel={() => setProposed('pending')}
              changes={[
                { label: 'House espresso beans', value: '20 kg', sign: 'in' },
                { label: 'New stock level', from: '3 kg', to: '23 kg' },
              ]}
            />
          );
        case 'hoursResult':
          return <LedaWidget.Result tone="success" title="Weekday hours updated" detail="Mon–Fri now 6:30 AM – 8:00 PM." />;
      }
    };

    return (
      <div data-theme="dark" className="ds-root bg-surface-canvas p-6">
        <Chat size="lg" className="h-[42rem] border-0 shadow-none">
          <Chat.Header title="Leda" subtitle="Kapetirya Luna" />
          <Chat.Messages>
            {turns.map((t) =>
              t.role === 'user' ? (
                <Chat.Message key={t.id} role="user">
                  {t.text}
                </Chat.Message>
              ) : (
                <div key={t.id} className="flex flex-col gap-2 self-start">
                  {t.text && (
                    <Chat.Message role="assistant" className="max-w-full">
                      {t.text}
                    </Chat.Message>
                  )}
                  {t.widget && renderWidget(t.widget)}
                </div>
              ),
            )}
          </Chat.Messages>
          <Chat.QuickActions>
            <LedaWidget.Suggestions
              items={[
                { label: 'Low stock', icon: Warning },
                { label: 'Stock in beans', icon: Drop },
                { label: 'Set hours', icon: Clock },
              ]}
              onSelect={(v) => (v === 'Low stock' ? askLowStock() : v === 'Set hours' ? askHours() : askStockIn())}
            />
          </Chat.QuickActions>
          <Chat.Input placeholder="Message Leda…" />
        </Chat>
      </div>
    );
  },
};
