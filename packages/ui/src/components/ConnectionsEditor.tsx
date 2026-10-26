import { forwardRef, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Info, Plus } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorBlock } from './ErrorBlock';
import { ListCell, ListRow } from './List';
import { ListGroup, ListGroups } from './ListGroup';
import { PlatformLogo, type PlatformLogoProps } from './PlatformLogo';
import { Select } from './Select';
import { Skeleton } from './Skeleton';
import { StatusDot, type StatusTone } from './StatusDot';
import { toast } from './toast/toastStore';

/** The other platform of a connection. `id` is what duplicate and self-connection checks compare. */
export interface ConnectionPlatform {
  id: string;
  name: string;
  /** Short kind line under the name: "Inventory", "Point of sale". */
  kind?: string;
  /** Uploaded logo URL; the monogram shows when absent. */
  src?: string;
  /** Position in platform order (1-based), picks the identity colour. */
  index?: number;
  /** Stored identity colour. Overrides `index`. */
  color?: PlatformLogoProps['color'];
  initials?: string;
}

export type ConnectionStatus = 'linked' | 'slow' | 'paused' | 'pending';
export type ConnectionDirection = 'reads' | 'shares';

/** One link between the platform being edited and another platform. */
export interface Connection {
  /** Stable id, unique across both groups. Row id for the j / k cursor, `flashId` and every callback. */
  id: string;
  platform: ConnectionPlatform;
  /** What flows, as a short noun: "Stock", "Catalog". */
  kind: string;
  /** What it shares, in plain words: "products, stock levels and movements". */
  shares: string;
  status: ConnectionStatus;
  /** Replaces the default status words, e.g. "Paused · Cubao is offline". */
  statusLabel?: string;
}

/** A connection that can be added: one entry of the "Add connection" dropdown. */
export interface ConnectionOption {
  /** The dropdown value. */
  id: string;
  direction: ConnectionDirection;
  /** Dropdown text: "Read stock from Cebu Parts Stockroom", "Share catalog with Cubao Repair Shop". */
  label: string;
  /** The connection that Add creates (and Undo removes). */
  connection: Connection;
}

export interface ConnectionChange {
  /** True when the call is an Undo, so the page can skip the van and a second toast. */
  undo: boolean;
  /** On the Undo of a Remove: the row's old position in its group, so the page can put it back there. */
  index?: number;
}

export interface ConnectionsEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The platform being edited. Connections to this id are never offered. */
  platformId: string;
  /** Its name, used in the multi-source note and Remove dialog: "Café POS". */
  platformName: string;
  reads: Connection[];
  shares: Connection[];
  /** Every link not made yet. Ones already in `reads` or `shares`, and ones to `platformId`, are filtered out here. */
  available?: ConnectionOption[];
  /** Saves at once. The editor shows the Undo toast and, once the new row is on screen, moves focus to it only if focus was lost. May return a promise: a rejection drops the pending focus move. */
  onAdd?: (option: ConnectionOption, change: ConnectionChange) => void | Promise<unknown>;
  /** Called after the Remove dialog is confirmed, and for the Undo of an Add. */
  onRemove?: (connection: Connection, direction: ConnectionDirection, change: ConnectionChange) => void | Promise<unknown>;
  /** A row is hovered or focused (the page lights its two buildings and the road); `null` when it leaves. */
  onHover?: (connection: Connection | null, direction: ConnectionDirection | null) => void;
  /** Deep link: this row flashes once and its Remove button takes focus. */
  flashId?: string | null;
  /** Dropdown value set by Leda or a link (a prefilled choice). */
  defaultChoice?: string;
  /** Replaces the computed note ("Stock comes from 2 platforms. {platformName} lists their products together."); `false` hides it. */
  multiSourceNote?: ReactNode | false;
  /** Shown in "Reads from" when empty and a source can be added. */
  readsEmpty?: ReactNode;
  /** Shown in "Shares with" when empty. */
  sharesEmpty?: ReactNode;
  /** Kinds of platform that could provide the data when nothing offers it yet ("Inventory"); each gets an "Add {kind}" button. */
  sourceKinds?: string[];
  onAddKind?: (kind: string) => void;
  /** `loading` draws skeleton rows; `error` an inline error with Try again and no Add row. */
  status?: 'ready' | 'loading' | 'error';
  onRetry?: () => void;
  /** Leda line under the Add row (a LedaNote). */
  ledaNote?: ReactNode;
  /** j / k / Enter for the rows. Default true; turn off when another list owns the page's shortcuts. */
  shortcuts?: boolean;
  /** Names the dropdown for assistive tech. Default "Add a connection to {platformName}". */
  addLabel?: string;
}

const STATUS_TONE: Record<ConnectionStatus, StatusTone> = { linked: 'ok', slow: 'warn', paused: 'warn', pending: 'accent' };
const STATUS_WORDS: Record<ConnectionStatus, string> = { linked: 'Linked', slow: 'Slow', paused: 'Paused', pending: 'Connects when you continue' };

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const keyOf = (direction: ConnectionDirection, c: Connection) => `${direction}|${c.kind.toLowerCase()}|${c.platform.id}`;
const wordsOf = (direction: ConnectionDirection, c: Connection) =>
  direction === 'reads' ? `Read ${lower(c.kind)} from ${c.platform.name}` : `Share ${lower(c.kind)} with ${c.platform.name}`;
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const COLUMNS = 'minmax(0,1.25fr) minmax(0,1.5fr) minmax(0,1fr) 88px';

/** The Remove button of the row with this connection id (no selector escaping needed). */
function removeOf(root: HTMLElement | null, id: string): HTMLElement | null {
  const row = Array.from(root?.querySelectorAll<HTMLElement>('[data-conn-id]') ?? []).find((r) => r.dataset.connId === id);
  return row?.querySelector<HTMLElement>('[data-remove]') ?? null;
}

/**
 * A focus move waiting for the page to catch up (a save can be slow). Keyed so a newer action supersedes it; it fires
 * at most once, through `focusIfLost`, so it never takes focus from where the user went meanwhile.
 * `row`: focus that row's Remove once it exists. `gone`: once row `id` has left, focus the first of `then` that
 * exists, else the Add dropdown.
 */
type DistributiveOmit<T> = T extends unknown ? Omit<T, 'key'> : never;
type Intent = { key: number; type: 'row'; id: string } | { key: number; type: 'gone'; id: string; then: string[] };

/**
 * Connections editor (C26, RDY-286): the platform's data links as two groups of ruled rows ("Reads from", "Shares
 * with") on `ListGroups` (one j / k cursor across both), then one "Add connection" dropdown + button. Each row is the
 * other platform (logo, name, kind), what it shares in plain words, its status as a dot AND words, and Remove. Add and
 * Remove save at once (`onAdd` / `onRemove`) with an Undo toast; Remove asks first (`ConfirmDialog`). The page mounts
 * one `Toaster`. Controlled: the page owns `reads`, `shares` and `available`. Hover and keyboard focus on a row call
 * `onHover` so the page can light the two buildings and the road. `className` goes on the outer element.
 */
export const ConnectionsEditor = forwardRef<HTMLDivElement, ConnectionsEditorProps>(function ConnectionsEditor(
  {
    platformId,
    platformName,
    reads,
    shares,
    available = [],
    onAdd,
    onRemove,
    onHover,
    flashId = null,
    defaultChoice = '',
    multiSourceNote,
    readsEmpty = 'Nothing yet. Add a connection below.',
    sharesEmpty = 'Nothing yet.',
    sourceKinds = [],
    onAddKind,
    status = 'ready',
    onRetry,
    ledaNote,
    shortcuts = true,
    addLabel,
    className,
    ...rest
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectRef = useRef<HTMLButtonElement | null>(null);
  const intent = useRef<Intent | null>(null);
  const seq = useRef(0);
  const flashed = useRef<string | null>(null);
  const hintId = useId();
  const [choice, setChoice] = useState(defaultChoice);
  const [confirm, setConfirm] = useState<{ connection: Connection; direction: ConnectionDirection } | null>(null);

  const taken = useMemo(() => new Set([...reads.map((c) => keyOf('reads', c)), ...shares.map((c) => keyOf('shares', c))]), [reads, shares]);
  const options = useMemo(() => {
    const seen = new Set<string>();
    return available.filter((o) => {
      const k = keyOf(o.direction, o.connection);
      if (o.connection.platform.id === platformId || taken.has(k) || seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  }, [available, taken, platformId]);
  const picked = options.find((o) => o.id === choice) ?? null;
  const ready = status === 'ready';

  const arm = (i: DistributiveOmit<Intent>) => {
    const key = ++seq.current;
    intent.current = { ...i, key } as Intent;
    return key;
  };
  // A rejected save never happens: drop its focus move (only if nothing newer replaced it).
  const track = (key: number, result: void | Promise<unknown>) => {
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<unknown>).catch(() => {
        if (intent.current?.key === key) intent.current = null;
      });
    }
  };

  // Fires when the page's lists change. No timers: it runs in the same commit that shows (or removes) the row.
  // While the Remove dialog is still closing its focus trap would pull focus back, so wait for it to leave the page.
  const settleIntent = () => {
    const i = intent.current;
    const root = rootRef.current;
    if (!i || !root) return;
    if (i.type === 'row') {
      const b = removeOf(root, i.id);
      if (!b) return;
      intent.current = null;
      focusIfLost(root, b);
      return;
    }
    if (removeOf(root, i.id)) return; // not gone yet
    if (document.querySelector('[role="alertdialog"]')) {
      const mo = new MutationObserver(() => {
        if (document.querySelector('[role="alertdialog"]')) return;
        mo.disconnect();
        if (intent.current === i) settleIntent();
      });
      mo.observe(document.body, { childList: true, subtree: true });
      return;
    }
    intent.current = null;
    let target: HTMLElement | null = null;
    for (const id of i.then) target = target ?? removeOf(root, id);
    if (!target) {
      target = selectRef.current;
      if (!target) {
        root.setAttribute('tabindex', '-1');
        target = root;
      }
    }
    focusIfLost(root, target);
  };
  useLayoutEffect(settleIntent, [reads, shares, options.length]);

  // The user went somewhere else (not the dialog or the toast): the move is no longer wanted.
  useEffect(() => {
    const away = (e: Event) => {
      if (!intent.current) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t && !rootRef.current?.contains(t) && !t.closest('[role="alertdialog"],[role="status"]')) intent.current = null;
    };
    document.addEventListener('focusin', away);
    document.addEventListener('pointerdown', away);
    return () => {
      document.removeEventListener('focusin', away);
      document.removeEventListener('pointerdown', away);
    };
  }, []);

  // Deep link: take focus on the flashed row's Remove, once per flashId (and only if focus was lost).
  useLayoutEffect(() => {
    if (!flashId || !ready || flashed.current === flashId) return;
    const b = removeOf(rootRef.current, flashId);
    if (!b) return;
    flashed.current = flashId;
    focusIfLost(rootRef.current, b);
    b.closest('[data-conn-id]')?.scrollIntoView?.({ block: 'nearest' });
  }, [flashId, ready, reads, shares]);

  const add = (o: ConnectionOption, undo = false, index?: number) => {
    if (o.connection.platform.id === platformId || (!undo && taken.has(keyOf(o.direction, o.connection)))) return;
    const key = arm({ type: 'row', id: o.connection.id });
    track(key, onAdd?.(o, { undo, index }));
    if (!undo) {
      toast.undo(`Connection added · ${o.label}`, () => {
        const k = arm({ type: 'gone', id: o.connection.id, then: [] });
        track(k, onRemove?.(o.connection, o.direction, { undo: true }));
      });
    }
  };
  const onAddClick = () => {
    if (!picked) return; // aria-disabled until a choice: the button stays focusable
    add(picked);
    setChoice('');
  };
  const remove = () => {
    if (!confirm) return;
    const { connection: c, direction } = confirm;
    const list = direction === 'reads' ? reads : shares;
    const i = list.findIndex((x) => x.id === c.id);
    const then = [list[i + 1], list[i - 1]].filter(Boolean).map((x) => x.id);
    setConfirm(null);
    const key = arm({ type: 'gone', id: c.id, then });
    track(key, onRemove?.(c, direction, { undo: false }));
    toast.undo(`Connection removed · ${wordsOf(direction, c)}`, () => add({ id: `undo:${c.id}`, direction, label: wordsOf(direction, c), connection: c }, true, i));
  };

  const multi = useMemo(() => {
    if (multiSourceNote === false) return null;
    if (multiSourceNote != null) return multiSourceNote;
    const kinds = Array.from(new Set(reads.map((c) => c.kind))).filter((k) => reads.filter((c) => c.kind === k).length > 1);
    if (!kinds.length) return null;
    const n = reads.filter((c) => c.kind === kinds[0]).length;
    return `${andList(kinds)} comes from ${kinds.length === 1 ? `${n} platforms` : 'more than one platform'}. ${platformName} lists their products together.`;
  }, [multiSourceNote, reads, platformName]);

  const hasSourceOption = options.some((o) => o.direction === 'reads');
  const readsNone =
    !reads.length && !hasSourceOption && sourceKinds.length ? (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span>Add a platform that provides this first.</span>
        {sourceKinds.map((k) => (
          <Button key={k} variant="secondary" leftIcon={Plus} actionBar onClick={() => onAddKind?.(k)}>
            Add {k}
          </Button>
        ))}
      </span>
    ) : (
      readsEmpty
    );

  const row = (c: Connection, direction: ConnectionDirection) => {
    const words = c.statusLabel ?? STATUS_WORDS[c.status];
    const describedBy = `${c.id}-shares`;
    return (
      <ListRow
        key={c.id}
        rowId={c.id}
        label={c.platform.name}
        flash={flashId === c.id}
        data-conn-id={c.id}
        onMouseEnter={() => onHover?.(c, direction)}
        onMouseLeave={() => onHover?.(null, null)}
        onFocus={() => onHover?.(c, direction)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onHover?.(null, null);
        }}
      >
        <ListCell kind="lead" className="flex items-start gap-3">
          <PlatformLogo name={c.platform.name} src={c.platform.src} index={c.platform.index} color={c.platform.color} initials={c.platform.initials} size={32} decorative className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="m-0 text-ui font-medium text-text">{c.platform.name}</p>
            {c.platform.kind ? <p className="m-0 text-small text-muted">{c.platform.kind}</p> : null}
          </div>
        </ListCell>
        <ListCell id={describedBy}>
          <p className="m-0 text-ui font-medium text-text">{c.kind}</p>
          <p className="m-0 text-small text-muted">{c.shares}</p>
        </ListCell>
        <ListCell>
          <StatusDot status={STATUS_TONE[c.status]} label={words} className="items-start text-ui text-muted [&>span:first-child]:mt-[7px]" />
        </ListCell>
        <ListCell kind="actions">
          <Button
            variant="text"
            actionBar
            data-remove=""
            aria-label={`Remove connection to ${c.platform.name}`}
            aria-describedby={describedBy}
            onClick={() => setConfirm({ connection: c, direction })}
          >
            Remove
          </Button>
        </ListCell>
      </ListRow>
    );
  };

  const skeleton = (
    <div aria-hidden className="border-t border-rule">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3 border-b border-rule py-row-y">
          <Skeleton variant="rect" width={32} height={32} />
          <Skeleton variant="text" lines={2} width="40%" />
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      aria-busy={status === 'loading' || undefined}
      className={cn('min-w-0 text-text outline-none', className)}
      {...rest}
    >
      {status === 'error' ? (
        <ErrorBlock thing="connections" onRetry={onRetry} />
      ) : status === 'loading' ? (
        <div role="status" aria-label="Loading connections">
          <p className="m-0 pb-1.5 pt-5 text-ui font-semibold">Reads from</p>
          {skeleton}
          <p className="m-0 pb-1.5 pt-5 text-ui font-semibold">Shares with</p>
          {skeleton}
        </div>
      ) : (
        <>
          <ListGroups columns={COLUMNS} stackBelow={760} shortcuts={shortcuts}>
            <ListGroup title="Reads from" level={3} count={reads.length} empty={readsNone}>
              {reads.map((c) => row(c, 'reads'))}
            </ListGroup>
            {multi ? (
              <p className="m-0 flex items-start gap-2 border-t border-rule py-row-y text-ui text-muted">
                <Info aria-hidden size={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0">{multi}</span>
              </p>
            ) : null}
            <ListGroup title="Shares with" level={3} count={shares.length} empty={sharesEmpty}>
              {shares.map((c) => row(c, 'shares'))}
            </ListGroup>
          </ListGroups>
          <div className="mt-6 border-t border-rule pt-4">
            {options.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  ref={selectRef}
                  size="sm"
                  className="min-w-0 max-sm:w-full sm:w-[min(100%,420px)]"
                  aria-label={addLabel ?? `Add a connection to ${platformName}`}
                  placeholder="Choose a platform and what it shares…"
                  value={choice}
                  onValueChange={setChoice}
                  options={options.map((o) => ({ value: o.id, label: o.label, textValue: o.label, meta: o.connection.platform.kind }))}
                />
                <Button variant="secondary" leftIcon={Plus} actionBar aria-disabled={!picked || undefined} aria-describedby={picked ? undefined : hintId} title={picked ? undefined : 'Choose a connection first'} className={cn(!picked && 'cursor-not-allowed opacity-50')} onClick={onAddClick}>
                  Add connection
                </Button>
                <span id={hintId} className="sr-only">Choose a connection first</span>
              </div>
            ) : (
              <p className="m-0 text-ui text-muted">{reads.length + shares.length ? 'Everything it can connect to is connected.' : 'Nothing to connect to yet.'}</p>
            )}
            {ledaNote ? <div className="mt-4">{ledaNote}</div> : null}
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirm != null}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        title="Remove this connection?"
        tone="danger"
        confirmLabel="Remove"
        iconNode={confirm ? <PlatformLogo name={confirm.connection.platform.name} src={confirm.connection.platform.src} index={confirm.connection.platform.index} color={confirm.connection.platform.color} initials={confirm.connection.platform.initials} size={24} decorative /> : undefined}
        name={confirm ? confirm.connection.platform.name : undefined}
        context={confirm ? wordsOf(confirm.direction, confirm.connection) : undefined}
        description={confirm ? `${platformName} stops ${confirm.direction === 'reads' ? 'reading' : 'sharing'} ${lower(confirm.connection.kind)}. You can undo this right after.` : undefined}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
});
