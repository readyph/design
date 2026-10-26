import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, CheckCircle, DownloadSimple, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './Modal';
import { SegmentedControl } from './SegmentedControl';
import { Button } from './Button';
import { Badge } from './Badge';
import { EmptyState } from './EmptyState';
import { ErrorBlock } from './ErrorBlock';
import { Skeleton } from './Skeleton';

export interface MarketplaceItem {
  /** Stable id of the catalog entry (the platform kind), e.g. `pos`. */
  key: string;
  /** Kind name, e.g. "POS". Also used in "Install POS". */
  name: string;
  /** Matches a `MarketplaceCategory.value`. */
  category: string;
  /** Phosphor icon shown in the tile's 36px well. */
  icon: PhosphorIcon;
  /** One line about what it is. */
  description: string;
  /** What it shares with other platforms, in plain words: ["stock", "prices"]. */
  shares?: string[];
  /** What it reads from other platforms: ["stock"]. */
  reads?: string[];
  /** How many of this kind the company already has. Shows "You have 1". */
  owned?: number;
  /** Dashed, "Coming soon" and not selectable. */
  comingSoon?: boolean;
  /** Footer line once picked: opens in its own app (true) or works through data links (false, default). */
  hasApp?: boolean;
}

export interface MarketplaceCategory {
  value: string;
  label: string;
}

export const defaultMarketplaceCategories: MarketplaceCategory[] = [
  { value: 'all', label: 'All' },
  { value: 'operations', label: 'Operations' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
];

export interface MarketplaceProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional trigger (uncontrolled use). */
  trigger?: ReactNode;
  items: MarketplaceItem[];
  /** Filter segments. Must include a first `all` entry. Default: All / Operations / Sales / Finance / Marketing. */
  categories?: MarketplaceCategory[];
  /** `loading` shows tile skeletons, `error` an inline error with Try again. */
  status?: 'ready' | 'loading' | 'error';
  onRetry?: () => void;
  /** Picked tile key (controlled; `null` = nothing picked). */
  picked?: string | null;
  /** Initial pick (for example when Leda prefilled a kind). Applies on every open. */
  defaultPicked?: string | null;
  onPickedChange?: (key: string) => void;
  /** Active category (controlled) and its initial value. */
  category?: string;
  defaultCategory?: string;
  onCategoryChange?: (value: string) => void;
  /** Called by "Install {kind}" (and a double click on a tile). */
  onInstall?: (item: MarketplaceItem) => void;
  /** Optional Leda note above the filter (the Leda note component, C38), e.g. when Leda prefilled the pick. */
  ledaNote?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Icon in the header well. */
  icon?: PhosphorIcon;
  /** Applied to the tile grid only; fixed dialog geometry and tile layout always win. */
  className?: string;
}

function andList(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** "Shares stock and prices · Reads products", or "Works on its own". */
export function marketplaceIoLine(item: Pick<MarketplaceItem, 'shares' | 'reads'>): string {
  const bits = [
    item.shares?.length ? `Shares ${andList(item.shares)}` : '',
    item.reads?.length ? `Reads ${andList(item.reads)}` : '',
  ].filter(Boolean);
  return bits.join(' · ') || 'Works on its own';
}

const gridClass =
  'grid auto-rows-max grid-cols-3 content-start gap-3 max-[900px]:grid-cols-2 max-sm:grid-cols-1';
const tileHeight = 'min-h-[172px]';

interface TileProps {
  item: MarketplaceItem;
  categoryLabel: string;
  checked: boolean;
  tabStop: boolean;
  onPick: () => void;
  onInstall: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  setRef: (el: HTMLButtonElement | null) => void;
}

function Tile({ item, categoryLabel, checked, tabStop, onPick, onInstall, onKeyDown, setRef }: TileProps) {
  const id = useId();
  const Icon = item.icon;
  const soon = !!item.comingSoon;
  const owned = item.owned ?? 0;
  return (
    <button
      ref={setRef}
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={soon || undefined}
      aria-labelledby={`${id}-n`}
      aria-describedby={`${id}-c ${id}-d ${id}-io${owned > 0 ? ` ${id}-h` : ''}${soon ? ` ${id}-s` : ''}`}
      tabIndex={soon ? -1 : tabStop ? 0 : -1}
      data-state={checked ? 'checked' : 'unchecked'}
      onClick={soon ? undefined : onPick}
      onDoubleClick={soon ? undefined : onInstall}
      onKeyDown={onKeyDown}
      className={cn(
        'flex w-full min-w-0 flex-col items-start rounded-card border px-4 py-3.5 text-left transition-colors duration-hover',
        tileHeight,
        // Phone: compact icon-plus-text row (icon well left, text right) instead of the tall desktop tile.
        'max-sm:grid max-sm:min-h-0 max-sm:grid-cols-[36px_minmax(0,1fr)_auto] max-sm:content-start max-sm:gap-x-3 max-sm:px-3.5 max-sm:py-3',
        focusRing,
        soon
          ? 'cursor-default border-dashed border-control bg-surface'
          : checked
            ? 'border-accent bg-accent-tint'
            : 'border-border bg-surface hover:border-control hover:bg-raised',
      )}
    >
      <span className="flex w-full items-center justify-between gap-2 max-sm:contents">
        <span
          aria-hidden
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-card max-sm:col-start-1 max-sm:row-span-4 max-sm:row-start-1',
            checked ? 'bg-accent text-accent-ink' : soon ? 'bg-raised-2 text-muted' : 'bg-raised-2 text-text',
          )}
        >
          <Icon size={20} />
        </span>
        <span className="flex min-w-0 items-center gap-2 max-sm:col-start-3 max-sm:row-start-1">
          {soon && <Badge tone="neutral" id={`${id}-s`}>Coming soon</Badge>}
          {!soon && owned > 0 && (
            <span id={`${id}-h`} className="inline-flex items-center gap-1 text-small text-muted">
              <Check size={12} weight="bold" aria-hidden className="text-ok-ink" />
              You have {owned}
            </span>
          )}
          {checked && <CheckCircle size={20} weight="fill" aria-hidden className="shrink-0 text-accent" />}
        </span>
      </span>
      <span id={`${id}-n`} className={cn('mt-3 break-words text-body font-semibold max-sm:col-start-2 max-sm:row-start-1 max-sm:mt-0 max-sm:min-w-0', soon ? 'text-muted' : 'text-text')}>
        {item.name}
      </span>
      <span id={`${id}-c`} className="text-small text-muted max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-2">{categoryLabel}</span>
      <span id={`${id}-d`} className={cn('mt-1.5 break-words text-ui max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-3', soon ? 'text-muted' : 'text-text')}>{item.description}</span>
      <span id={`${id}-io`} className="mt-auto break-words pt-2.5 text-small text-muted max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-4 max-sm:pt-1.5">{marketplaceIoLine(item)}</span>
    </button>
  );
}

interface ContentProps extends Omit<MarketplaceProps, 'open' | 'onOpenChange' | 'trigger'> {
  categories: MarketplaceCategory[];
  /** Filled with the tab-stop tile so the modal can focus it on open. */
  focusTarget: { current: HTMLElement | null };
}

function MarketplaceContent({
  items,
  categories,
  status = 'ready',
  onRetry,
  picked,
  defaultPicked = null,
  onPickedChange,
  category,
  defaultCategory,
  onCategoryChange,
  onInstall,
  ledaNote,
  title = 'Add a platform',
  description = 'Pick what to add, then press Install. You set it up right after.',
  icon,
  className,
  focusTarget,
}: ContentProps) {
  const [pickedState, setPickedState] = useState<string | null>(defaultPicked);
  const [catState, setCatState] = useState(defaultCategory ?? categories[0]?.value ?? 'all');
  const pickedKey = picked !== undefined ? picked : pickedState;
  const cat = category ?? catState;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => () => void (focusTarget.current = null), [focusTarget]);

  const all = categories[0]?.value ?? 'all';
  const shown = items.filter((i) => cat === all || i.category === cat);
  const pickable = shown.filter((i) => !i.comingSoon);
  const pickedItem = items.find((i) => i.key === pickedKey && !i.comingSoon) ?? null;
  const labelOf = (v: string) => categories.find((c) => c.value === v)?.label ?? v;
  // One tab stop: the picked tile when it is on screen, else the first pickable one.
  const stop = pickable.find((i) => i.key === pickedKey)?.key ?? pickable[0]?.key;

  const pick = (key: string) => {
    if (picked === undefined) setPickedState(key);
    if (key !== pickedKey) onPickedChange?.(key);
  };
  const setCategory = (v: string) => {
    if (category === undefined) setCatState(v);
    onCategoryChange?.(v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, key: string) => {
    const idx = pickable.findIndex((i) => i.key === key);
    if (idx < 0) return;
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % pickable.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + pickable.length) % pickable.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = pickable.length - 1;
    else return;
    e.preventDefault();
    const target = pickable[next];
    refs.current[target.key]?.focus();
    pick(target.key);
  };

  const summary = pickedItem ? (
    <>
      <pickedItem.icon size={18} aria-hidden className="shrink-0 text-accent" />
      <span className="min-w-0 break-words max-sm:truncate">
        <b className="font-semibold text-text">{pickedItem.name}</b>
        {' · '}
        {pickedItem.hasApp ? 'opens in its own app' : 'no app yet, it works through its data links'}
      </span>
    </>
  ) : (
    <span>Nothing picked yet</span>
  );

  return (
    <>
      <ModalHeader icon={icon} description={description}>{title}</ModalHeader>
      {ledaNote && <div className="mx-pad mt-3.5 shrink-0 max-sm:mx-4">{ledaNote}</div>}
      <div className="mx-pad mt-4 shrink-0 max-sm:mx-4 max-sm:overflow-x-auto">
        <SegmentedControl
          aria-label="Category"
          options={categories}
          value={cat}
          onChange={setCategory}
          disabled={status !== 'ready'}
        />
      </div>
      <ModalBody className="mt-1 [scrollbar-gutter:stable]" aria-busy={status === 'loading' || undefined}>
        {status === 'loading' && (
          <div className={gridClass} role="status" aria-label="Loading the catalog">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className={cn('w-full', tileHeight)} />
            ))}
          </div>
        )}
        {status === 'error' && <ErrorBlock thing="platform catalog" onRetry={onRetry} />}
        {status === 'ready' && shown.length === 0 && (
          <EmptyState title="Nothing in this group yet" description="Pick another group to see what you can add." />
        )}
        {status === 'ready' && shown.length > 0 && (
          <div role="radiogroup" aria-label="Platforms you can add" className={cn(className, gridClass)}>
            {shown.map((item) => (
              <Tile
                key={item.key}
                item={item}
                categoryLabel={labelOf(item.category)}
                checked={!item.comingSoon && item.key === pickedKey}
                tabStop={item.key === stop}
                onPick={() => pick(item.key)}
                onInstall={() => {
                  pick(item.key);
                  onInstall?.(item);
                }}
                onKeyDown={(e) => onKeyDown(e, item.key)}
                setRef={(el) => {
                  refs.current[item.key] = el;
                  if (el && item.key === stop) focusTarget.current = el;
                }}
              />
            ))}
          </div>
        )}
      </ModalBody>
      <ModalFooter className="max-sm:flex-row max-sm:flex-wrap max-sm:gap-2 max-sm:pb-[calc(8px+env(safe-area-inset-bottom))] max-sm:pt-2">
        <div
          role="status"
          className="flex min-w-0 items-center gap-2 text-ui text-muted sm:mr-auto max-sm:basis-full"
        >
          {summary}
        </div>
        <Dialog.Close asChild>
          <Button variant="secondary" className="max-sm:h-11 max-sm:flex-1">Cancel</Button>
        </Dialog.Close>
        <Button className="max-sm:h-11 max-sm:min-w-0 max-sm:flex-1 max-sm:overflow-hidden max-sm:[&_svg]:shrink-0 max-sm:[&>span]:min-w-0 max-sm:[&>span:not([aria-hidden])]:max-w-full" leftIcon={DownloadSimple} disabled={!pickedItem || status !== 'ready'} onClick={() => pickedItem && onInstall?.(pickedItem)}>
          <span className="min-w-0 max-sm:truncate">{pickedItem ? `Install ${pickedItem.name}` : 'Install'}</span>
        </Button>
      </ModalFooter>
    </>
  );
}

/**
 * Marketplace modal (C20): the one dialog every "add a platform" entry point opens. Fixed 904 x 744
 * (window less 48px; full screen on a phone) in every filter, pick and state; the tiles scroll inside
 * and the footer stays pinned. Tiles are a radio group (one tab stop, arrows pick, Space/Enter picks);
 * "Coming soon" tiles are dashed and skipped. Install stays disabled until a tile is picked.
 */
export function Marketplace({ open, onOpenChange, trigger, categories = defaultMarketplaceCategories, ...rest }: MarketplaceProps) {
  // Focus starts on the picked tile (else the first one), as in the prototype; loading/error fall back to the dialog default.
  const focusTarget = useRef<HTMLElement | null>(null);
  return (
    <Modal open={open} onOpenChange={onOpenChange} trigger={trigger} size="marketplace" initialFocus={focusTarget as RefObject<HTMLElement | null>}>
      <MarketplaceContent categories={categories} focusTarget={focusTarget} {...rest} />
    </Modal>
  );
}
