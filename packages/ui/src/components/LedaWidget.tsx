import {
  forwardRef,
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import {
  ArrowRight,
  CheckCircle,
  Info,
  Warning,
  WarningOctagon,
  Sparkle,
  FileText,
  PencilSimple,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import { Button } from './Button';
import { Badge } from './Badge';
import { Stat } from './Stat';
import { DataList, type DataListItem } from './DataList';

/**
 * Leda AI chat widgets — the interactive "blocks" Leda renders *inside* an
 * assistant message (Portal §4 / Inventory §4). A reply is a stream of these,
 * not just text: reads render as Facts / StatGrid / Table / Chart / Heatmap /
 * SegmentBars; writes always arrive as an **Action proposal** the user confirms
 * (confirm-before-write, 01 §6).
 *
 * **Design language** (matches the ReadyPH portal): fill-and-elevation, *not*
 * borders — cards are a raised surface on the canvas, inner blocks are filled
 * tiles, and hairlines appear only where a list genuinely needs them. Soft large
 * radii, blue accent carried through fill intensity, value pills on charts.
 * Theme-aware via tokens (shines in `data-theme="dark"`, the portal default).
 * Presentational — the project owns the data and what the buttons do.
 *
 * Compose the base `LedaWidget` card, or drop in a self-contained widget:
 * `StatGrid`, `Chart`, `Heatmap`, `SegmentBars`, `Facts`, `Proposal`, `Form`,
 * `Choices`, `Links`, `Result`, `Memory`, `Suggestions`.
 */

export type LedaTone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const toneChip: Record<LedaTone, string> = {
  primary: 'bg-primary-500/15 text-primary-500',
  success: 'bg-tint-green-bg text-tint-green-fg',
  warning: 'bg-warning/15 text-warning-fg',
  error: 'bg-error/15 text-error-fg',
  info: 'bg-tint-teal-bg text-tint-teal-fg',
  neutral: 'bg-surface-muted text-ink-muted',
};

const toneText: Record<LedaTone, string> = {
  primary: 'text-primary-500',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  error: 'text-error-fg',
  info: 'text-info',
  neutral: 'text-ink-subtle',
};

/** A high-contrast value chip (white-on-dark / dark-on-light) — the reference's bar labels. */
const valuePill =
  'inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-[0.6875rem] font-semibold text-neutral-50 tabular-nums shadow-sm';

/* ------------------------------------------------------------------ shell -- */

export interface LedaWidgetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Card title. */
  title?: ReactNode;
  /** Leading icon in a tinted chip. */
  icon?: PhosphorIcon;
  /** Secondary line under the title (e.g. a range or count). */
  meta?: ReactNode;
  /** Icon chip + accent tone. */
  tone?: LedaTone;
  /** Right-aligned header controls (pill buttons, dropdowns). */
  headerActions?: ReactNode;
  /** Footer row (action buttons or chips). */
  footer?: ReactNode;
}

/**
 * The card every Leda widget sits in: a tinted icon chip, title + meta, optional
 * header actions, a body and an optional footer. A raised surface — no border.
 */
const LedaWidgetRoot = forwardRef<HTMLDivElement, LedaWidgetProps>(function LedaWidget(
  { title, icon, meta, tone = 'primary', headerActions, footer, className, children, ...rest },
  ref,
) {
  const hasHeader = icon || title || meta || headerActions;
  return (
    <div
      ref={ref}
      className={cn('overflow-hidden rounded-base border border-border bg-surface text-ink', className)}
      {...rest}
    >
      {hasHeader && (
        <div className="flex items-center gap-3 px-5 pt-4 pb-1">
          {icon && (
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-base', toneChip[tone])}>
              <Icon icon={icon} size="md" weight="fill" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {title && <p className="truncate text-sm font-semibold text-ink">{title}</p>}
            {meta && <p className="truncate text-xs text-ink-muted">{meta}</p>}
          </div>
          {headerActions}
        </div>
      )}
      {children != null && <div className="px-5 py-3">{children}</div>}
      {footer && <div className="flex flex-wrap items-center gap-2 px-5 pb-4 pt-1">{footer}</div>}
    </div>
  );
});

/** If `title`/`icon` are given, wrap in the card; otherwise render the body bare. */
function maybeWrap(
  wrap: Pick<LedaWidgetProps, 'title' | 'icon' | 'meta' | 'tone' | 'headerActions' | 'footer' | 'className'>,
  body: ReactNode,
): ReactNode {
  if (wrap.title == null && wrap.icon == null) return <>{body}</>;
  return <LedaWidgetRoot {...wrap}>{body}</LedaWidgetRoot>;
}

/* --------------------------------------------------------------- stat grid -- */

export interface LedaStatItem {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: 'success' | 'error' | 'neutral';
  icon?: PhosphorIcon;
  points?: number[];
  sparklineTone?: 'primary' | 'success' | 'error' | 'neutral';
}

export interface LedaStatGridProps
  extends Pick<LedaWidgetProps, 'title' | 'icon' | 'meta' | 'tone' | 'footer'> {
  items: LedaStatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const gridCols: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

/** A row of metric tiles — stock health, AI usage, cross-platform KPIs. */
function LedaStatGrid({ items, columns, className, ...wrap }: LedaStatGridProps) {
  const cols = (columns ?? Math.min(items.length, 4)) as 2 | 3 | 4;
  const body = (
    <div className={cn('grid grid-cols-2 gap-2.5', gridCols[cols], className)}>
      {items.map((s, i) => (
        <div key={i} className="rounded-base bg-surface-subtle p-3.5">
          <Stat
            label={s.label}
            value={s.value}
            delta={s.delta}
            deltaTone={s.deltaTone}
            icon={s.icon}
            points={s.points}
            sparklineTone={s.sparklineTone}
          />
        </div>
      ))}
    </div>
  );
  return maybeWrap(wrap, body);
}

/* ------------------------------------------------------------------- chart -- */

export interface LedaChartDatum {
  label?: string;
  value: number;
}

export interface LedaChartProps
  extends Pick<LedaWidgetProps, 'title' | 'icon' | 'meta' | 'tone' | 'footer' | 'headerActions'> {
  data: Array<number | LedaChartDatum>;
  kind?: 'area' | 'bar';
  chartTone?: LedaTone;
  height?: number;
  /** Headline number shown above the plot (e.g. "₱8.8k"). */
  total?: ReactNode;
  /** A comparison callout, e.g. "+12% vs last week". */
  delta?: { value: ReactNode; tone?: 'success' | 'error' | 'neutral' };
  /** Bar only: show the reference-style value pill above each bar. */
  valuePills?: boolean;
  /** Bar only: index of the bar to highlight at full intensity. */
  peakIndex?: number;
  /** Format a bar's pill value. */
  formatValue?: (value: number) => string;
  /** Show the x labels under the plot (uses each datum's `label`). */
  showLabels?: boolean;
  className?: string;
}

/**
 * A compact inline chart for a trend or small breakdown — "sales this week",
 * "stock valuation by category". `area` is an SVG trend; `bar` is a set of
 * rounded, blue-intensity bars with optional value pills, like the portal's
 * Income Sources chart. For a full revenue-by-channel split, use `RevenueChart`.
 */
function LedaChart({
  data,
  kind = 'area',
  chartTone = 'primary',
  height = 120,
  total,
  delta,
  valuePills = false,
  peakIndex,
  formatValue,
  showLabels = false,
  className,
  ...wrap
}: LedaChartProps) {
  const pts: LedaChartDatum[] = data.map((d) => (typeof d === 'number' ? { value: d } : d));
  const values = pts.map((p) => p.value);
  const max = Math.max(1, ...values);
  const peak = peakIndex ?? values.indexOf(Math.max(...values));
  const fmt = formatValue ?? ((v: number) => String(v));

  const deltaToneClass =
    delta?.tone === 'error' ? 'text-error-fg' : delta?.tone === 'neutral' ? 'text-ink-subtle' : 'text-success-fg';

  const header = (total != null || delta) && (
    <div className="mb-3 flex items-baseline gap-2">
      {total != null && <span className="text-2xl font-extrabold tracking-tight text-ink tabular-nums">{total}</span>}
      {delta && <span className={cn('text-xs font-semibold', deltaToneClass)}>{delta.value}</span>}
    </div>
  );

  let plot: ReactNode;
  if (kind === 'bar') {
    plot = (
      <div className="flex items-end gap-2.5" style={{ height }}>
        {pts.map((p, i) => {
          const h = Math.max(6, (p.value / max) * 100);
          const isPeak = i === peak;
          const opacity = isPeak ? 1 : 0.32 + (p.value / max) * 0.5;
          return (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              {valuePills && <span className={valuePill}>{fmt(p.value)}</span>}
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: `rgb(var(--ds-primary-500) / ${opacity.toFixed(2)})`,
                }}
              />
            </div>
          );
        })}
      </div>
    );
  } else {
    const W = 560;
    const H = height;
    const n = pts.length;
    const minV = Math.min(0, ...values);
    const span = max - minV || 1;
    const y = (v: number) => H - ((v - minV) / span) * H;
    const step = n > 1 ? W / (n - 1) : W;
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${y(p.value).toFixed(1)}`).join(' ');
    const area = `${line} L ${W} ${H} L 0 ${H} Z`;
    const gid = `leda-area-${chartTone}`;
    plot = (
      <div className={toneText[chartTone]}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" fill="none" role="img" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  const body = (
    <div className={cn('flex flex-col', className)}>
      {header}
      {plot}
      {showLabels && (
        <div className="mt-2 flex justify-between text-[0.6875rem] text-ink-subtle">
          {pts.map((p, i) => (
            <span key={i} className="flex-1 truncate text-center">{p.label ?? ''}</span>
          ))}
        </div>
      )}
    </div>
  );
  return maybeWrap(wrap, body);
}

/* ----------------------------------------------------------------- heatmap -- */

export interface LedaHeatmapRow {
  label: ReactNode;
  /** One intensity per column, 0–1. */
  cells: number[];
}

export interface LedaHeatmapProps
  extends Pick<LedaWidgetProps, 'title' | 'icon' | 'meta' | 'tone' | 'footer' | 'headerActions'> {
  rows: LedaHeatmapRow[];
  columns: string[];
  chartTone?: LedaTone;
  className?: string;
}

const heatmapVar: Record<LedaTone, string> = {
  primary: '--ds-primary-500',
  success: '--ds-success',
  warning: '--ds-warning',
  error: '--ds-error',
  info: '--ds-info',
  neutral: '--ds-ink-subtle',
};

/**
 * A rounded-tile heatmap — the portal's "Orders Breakdown". Each cell's blue
 * intensity maps to its value; busier cells pick up a woven diagonal hatch for
 * texture. All fill, no borders.
 */
function LedaHeatmap({ rows, columns, chartTone = 'primary', className, ...wrap }: LedaHeatmapProps) {
  const v = heatmapVar[chartTone];
  const gridTemplate = { gridTemplateColumns: `minmax(0,5rem) repeat(${columns.length}, minmax(0,1fr))` };
  const body = (
    <div className={cn('flex flex-col gap-2', className)}>
      {rows.map((r, ri) => (
        <div key={ri} className="grid items-center gap-2" style={gridTemplate}>
          <span className="truncate pr-1 text-xs font-medium text-ink-muted">{r.label}</span>
          {r.cells.map((c, ci) => {
            const op = (0.12 + Math.min(1, Math.max(0, c)) * 0.88).toFixed(2);
            const hatch = c >= 0.5 && (ri + ci) % 2 === 0;
            return (
              <div
                key={ci}
                className="aspect-square w-full rounded-base"
                style={{
                  backgroundColor: `rgb(var(${v}) / ${op})`,
                  backgroundImage: hatch
                    ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 7px)'
                    : undefined,
                }}
                aria-hidden
              />
            );
          })}
        </div>
      ))}
      <div className="grid gap-2 pt-0.5" style={gridTemplate}>
        <span />
        {columns.map((c, i) => (
          <span key={i} className="truncate text-center text-xs text-ink-subtle">{c}</span>
        ))}
      </div>
    </div>
  );
  return maybeWrap(wrap, body);
}

/* -------------------------------------------------------------- segment bars -- */

export interface LedaSegmentRow {
  label: ReactNode;
  /** Number of filled segments. */
  filled: number;
  /** Total segments in the row. */
  total: number;
}

export interface LedaSegmentBarsProps
  extends Pick<LedaWidgetProps, 'title' | 'icon' | 'meta' | 'tone' | 'footer' | 'headerActions'> {
  rows: LedaSegmentRow[];
  className?: string;
}

/**
 * Segmented progress rows — the portal's "Income" chart. A label and a run of
 * small rounded segments, filled in brand blue up to a value. Fill only.
 */
function LedaSegmentBars({ rows, className, ...wrap }: LedaSegmentBarsProps) {
  const body = (
    <div className={cn('flex flex-col gap-3', className)}>
      {rows.map((r, ri) => (
        <div key={ri} className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-xs font-medium text-ink-muted">{r.label}</span>
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: r.total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-2.5 flex-1 rounded-full',
                  i < r.filled ? 'bg-gradient-to-r from-primary-400 to-primary-600' : 'bg-surface-muted',
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
  return maybeWrap(wrap, body);
}

/* ------------------------------------------------------------------- table -- */

export interface LedaTableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface LedaTableProps<T>
  extends Pick<LedaWidgetProps, 'title' | 'icon' | 'meta' | 'tone' | 'footer' | 'headerActions'> {
  columns: LedaTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
}

const tableAlign = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;

/**
 * A borderless in-conversation table — low stock, movements, PO lines, team. No
 * outer box or filled header; columns are quiet labels and rows are separated by
 * the faintest hairline (the reference's Messages list), sitting right on the
 * card surface.
 */
function LedaTable<T>({ columns, data, rowKey, onRowClick, className, ...wrap }: LedaTableProps<T>) {
  const body = (
    <div className={cn('-mx-1 overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-2 pb-2 text-xs font-medium text-ink-subtle',
                  tableAlign[col.align ?? 'left'],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-t border-border/50 first:border-t-0',
                onRowClick && 'cursor-pointer transition-colors hover:bg-surface-subtle',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-2 py-2.5 text-ink', tableAlign[col.align ?? 'left'])}
                >
                  {col.render ? col.render(row, i) : (row as Record<string, ReactNode>)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return maybeWrap(wrap, body);
}

/* ------------------------------------------------------------------- facts -- */

export interface LedaFactsProps
  extends Pick<LedaWidgetProps, 'title' | 'icon' | 'meta' | 'tone' | 'footer'> {
  items: DataListItem[];
  stacked?: boolean;
  className?: string;
}

/** Key/value detail of one thing — a product, the company profile, a schedule. */
function LedaFacts({ items, stacked, className, ...wrap }: LedaFactsProps) {
  return maybeWrap(wrap, <DataList items={items} stacked={stacked} className={className} />);
}

/* ------------------------------------------------------------- proposal ----- */

export type ProposalIntent = 'create' | 'update' | 'delete' | 'stock' | 'order' | 'generic';
export type ProposalStatus = 'pending' | 'applying' | 'confirmed' | 'cancelled';

export interface ProposalChange {
  label: ReactNode;
  from?: ReactNode;
  to?: ReactNode;
  value?: ReactNode;
  sign?: 'in' | 'out';
}

export interface LedaProposalProps {
  title: ReactNode;
  icon?: PhosphorIcon;
  intent?: ProposalIntent;
  summary?: ReactNode;
  changes?: ProposalChange[];
  status?: ProposalStatus;
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  resultText?: ReactNode;
  className?: string;
}

const intentIcon: Record<ProposalIntent, PhosphorIcon> = {
  create: Sparkle,
  update: PencilSimple,
  delete: WarningOctagon,
  stock: ArrowRight,
  order: FileText,
  generic: Info,
};

/**
 * The confirm-before-write card — the heart of Leda's safety model (01 §6).
 * Shows *exactly* what will change as filled change-tiles; nothing happens until
 * the user confirms. Once resolved it collapses to a result line.
 */
function LedaProposal({
  title,
  icon,
  intent = 'generic',
  summary,
  changes,
  status = 'pending',
  destructive = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  resultText,
  className,
}: LedaProposalProps) {
  const headIcon = icon ?? intentIcon[intent];
  const tone: LedaTone = destructive || intent === 'delete' ? 'error' : 'primary';

  const footer =
    status === 'confirmed' ? (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-fg">
        <Icon icon={CheckCircle} size="sm" weight="fill" />
        {resultText ?? 'Done.'}
      </span>
    ) : status === 'cancelled' ? (
      <span className="text-xs font-medium text-ink-subtle">{resultText ?? 'Cancelled.'}</span>
    ) : (
      <>
        <Button
          size="sm"
          variant={destructive ? 'danger' : 'primary'}
          loading={status === 'applying'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button size="sm" variant="subtle" disabled={status === 'applying'} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <span className="ml-auto text-[0.6875rem] font-medium uppercase tracking-wide text-ink-subtle">
          Needs your confirmation
        </span>
      </>
    );

  return (
    <LedaWidgetRoot icon={headIcon} tone={tone} title={title} meta={summary} footer={footer} className={className}>
      {changes && changes.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {changes.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-sm bg-surface-subtle px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink-muted">{c.label}</span>
              {c.from != null || c.to != null ? (
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  <span className="text-ink-subtle line-through">{c.from}</span>
                  <Icon icon={ArrowRight} size="sm" className="text-ink-subtle" />
                  <span>{c.to}</span>
                </span>
              ) : (
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    c.sign === 'in' ? 'text-success-fg' : c.sign === 'out' ? 'text-error-fg' : 'text-ink',
                  )}
                >
                  {c.sign === 'in' ? '+' : c.sign === 'out' ? '−' : ''}
                  {c.value}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </LedaWidgetRoot>
  );
}

/* ---------------------------------------------------------------- form ------ */

export interface LedaFormProps extends Pick<LedaWidgetProps, 'title' | 'icon' | 'tone' | 'meta'> {
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  busy?: boolean;
  className?: string;
}

/** A mini form Leda asks the user to fill inline (add product, invite member). */
function LedaForm({
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
  busy = false,
  className,
  title,
  icon = Sparkle,
  tone = 'primary',
  meta,
}: LedaFormProps) {
  return (
    <LedaWidgetRoot icon={icon} tone={tone} title={title} meta={meta} className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(e);
        }}
        className="flex flex-col gap-3"
      >
        {children}
        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" variant="primary" loading={busy}>
            {submitLabel}
          </Button>
          <Button type="button" size="sm" variant="subtle" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </form>
    </LedaWidgetRoot>
  );
}

/* --------------------------------------------------------------- choices ---- */

export interface LedaChoiceOption {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  icon?: PhosphorIcon;
}

export interface LedaChoicesProps extends Pick<LedaWidgetProps, 'title' | 'icon' | 'tone'> {
  options: LedaChoiceOption[];
  onSelect?: (id: string) => void;
  className?: string;
}

/** Disambiguation — "which product / which Ana did you mean?" Fill, no borders. */
function LedaChoices({ options, onSelect, className, title, icon, tone = 'primary' }: LedaChoicesProps) {
  const body = (
    <div className={cn('flex flex-col gap-2', className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelect?.(o.id)}
          className={cn(
            'group flex items-center gap-3 rounded-base bg-surface-subtle px-3 py-2.5 text-left transition-colors',
            'hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          )}
        >
          {o.icon && (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-surface-muted text-ink-muted group-hover:bg-primary-500/15 group-hover:text-primary-500">
              <Icon icon={o.icon} size="md" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{o.label}</span>
            {o.description && <span className="block truncate text-xs text-ink-muted">{o.description}</span>}
          </span>
          {o.meta && <span className="shrink-0 text-xs text-ink-subtle">{o.meta}</span>}
          <Icon icon={ArrowRight} size="sm" className="shrink-0 text-ink-subtle group-hover:text-primary-500" />
        </button>
      ))}
    </div>
  );
  return maybeWrap({ title, icon, tone }, body);
}

/* ----------------------------------------------------------------- links ---- */

export interface LedaLink {
  label: ReactNode;
  description?: ReactNode;
  icon?: PhosphorIcon;
  href?: string;
  onClick?: () => void;
}

export interface LedaLinksProps extends Pick<LedaWidgetProps, 'title' | 'icon' | 'tone'> {
  links: LedaLink[];
  className?: string;
}

/** Deep links into the manual UI — "Open the Team page". Hover fill, no borders. */
function LedaLinks({ links, className, title, icon, tone = 'primary' }: LedaLinksProps) {
  const body = (
    <div className={cn('flex flex-col gap-1', className)}>
      {links.map((l, i) => {
        const inner = (
          <>
            {l.icon && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-primary-500/15 text-primary-500">
                <Icon icon={l.icon} size="md" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{l.label}</span>
              {l.description && <span className="block truncate text-xs text-ink-muted">{l.description}</span>}
            </span>
            <Icon icon={ArrowRight} size="sm" className="shrink-0 text-ink-subtle" />
          </>
        );
        const cls =
          'flex items-center gap-3 rounded-base px-3 py-2.5 transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-focus';
        return l.href ? (
          <a key={i} href={l.href} className={cls}>
            {inner}
          </a>
        ) : (
          <button key={i} type="button" onClick={l.onClick} className={cn(cls, 'text-left')}>
            {inner}
          </button>
        );
      })}
    </div>
  );
  return maybeWrap({ title, icon, tone }, body);
}

/* ---------------------------------------------------------------- result ---- */

export type ResultTone = 'success' | 'error' | 'info' | 'warning';

export interface LedaResultProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: ResultTone;
  title: ReactNode;
  detail?: ReactNode;
  icon?: PhosphorIcon;
}

const resultTone: Record<ResultTone, { fill: string; icon: string; defaultIcon: PhosphorIcon }> = {
  success: { fill: 'bg-success/12', icon: 'text-success-fg', defaultIcon: CheckCircle },
  error: { fill: 'bg-error/12', icon: 'text-error-fg', defaultIcon: WarningOctagon },
  warning: { fill: 'bg-warning/12', icon: 'text-warning-fg', defaultIcon: Warning },
  info: { fill: 'bg-info/12', icon: 'text-info', defaultIcon: Info },
};

/** The outcome strip after a confirmed write — a soft tonal fill, no border. */
const LedaResult = forwardRef<HTMLDivElement, LedaResultProps>(function LedaResult(
  { tone = 'success', title, detail, icon, className, ...rest },
  ref,
) {
  const t = resultTone[tone];
  return (
    <div ref={ref} className={cn('flex items-start gap-2.5 rounded-base px-3.5 py-3', t.fill, className)} {...rest}>
      <Icon icon={icon ?? t.defaultIcon} size="md" weight="fill" className={cn('mt-0.5 shrink-0', t.icon)} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        {detail && <p className="mt-0.5 text-xs text-ink-muted">{detail}</p>}
      </div>
    </div>
  );
});

/* ---------------------------------------------------------------- memory ---- */

export interface LedaMemoryProps {
  /** The memory file title, e.g. "Refund policy". */
  name: ReactNode;
  /** Rendered markdown / preview of the entry. */
  children?: ReactNode;
  updatedBy?: 'leda' | 'you';
  updatedAt?: ReactNode;
  onOpen?: () => void;
  onEdit?: () => void;
  justSaved?: boolean;
  className?: string;
}

/** A company-knowledge (Memory) file Leda wrote or updated — transparent by design. */
function LedaMemory({
  name,
  children,
  updatedBy = 'leda',
  updatedAt,
  onOpen,
  onEdit,
  justSaved = false,
  className,
}: LedaMemoryProps) {
  return (
    <LedaWidgetRoot
      icon={FileText}
      tone="info"
      title={name}
      meta={
        <span>
          {justSaved ? 'Saved ' : 'Updated '}
          {updatedBy === 'leda' ? 'by Leda' : 'by you'}
          {updatedAt ? ` · ${updatedAt}` : ''}
        </span>
      }
      headerActions={justSaved ? <Badge tone="success" size="sm">Saved</Badge> : undefined}
      footer={
        <>
          {onOpen && (
            <Button size="sm" variant="subtle" onClick={onOpen}>
              Open
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="subtle" leftIcon={PencilSimple} onClick={onEdit}>
              Edit
            </Button>
          )}
        </>
      }
      className={className}
    >
      {children != null && (
        <div className="rounded-base bg-surface-subtle px-3.5 py-3 text-sm leading-relaxed text-ink-muted">
          {children}
        </div>
      )}
    </LedaWidgetRoot>
  );
}

/* ------------------------------------------------------------ suggestions --- */

export interface LedaSuggestion {
  id?: string;
  label: string;
  icon?: PhosphorIcon;
}

export interface LedaSuggestionsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  items: Array<LedaSuggestion | string>;
  onSelect?: (value: string) => void;
}

/** Follow-up prompt chips — filled pills, the reference's control style. */
const LedaSuggestions = forwardRef<HTMLDivElement, LedaSuggestionsProps>(function LedaSuggestions(
  { items, onSelect, className, ...rest },
  ref,
) {
  const norm = items.map((i) => (typeof i === 'string' ? { label: i } : i));
  return (
    <div ref={ref} className={cn('flex flex-wrap gap-2', className)} {...rest}>
      {norm.map((s, i) => (
        <button
          key={s.id ?? i}
          type="button"
          onClick={() => onSelect?.(s.label)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink transition-colors',
            'hover:bg-primary-500/15 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          )}
        >
          {s.icon && <Icon icon={s.icon} size="sm" className="text-primary-500" />}
          {s.label}
        </button>
      ))}
    </div>
  );
});

/* -------------------------------------------------------------- assembly ---- */

export const LedaWidget = Object.assign(LedaWidgetRoot, {
  StatGrid: LedaStatGrid,
  Chart: LedaChart,
  Heatmap: LedaHeatmap,
  SegmentBars: LedaSegmentBars,
  Table: LedaTable,
  Facts: LedaFacts,
  Proposal: LedaProposal,
  Form: LedaForm,
  Choices: LedaChoices,
  Links: LedaLinks,
  Result: LedaResult,
  Memory: LedaMemory,
  Suggestions: LedaSuggestions,
});

export {
  LedaStatGrid,
  LedaChart,
  LedaHeatmap,
  LedaSegmentBars,
  LedaTable,
  LedaFacts,
  LedaProposal,
  LedaForm,
  LedaChoices,
  LedaLinks,
  LedaResult,
  LedaMemory,
  LedaSuggestions,
};
