/**
 * PROTOTYPE (RDY-179, epic RDY-173 features 3, 6, 7) - Portal Memory in the Slack-style shell.
 * Same content and actions as `portal/src/modules/memory/MemoryPage.tsx` (list, search, view,
 * create, edit, delete); layout, density and theme only. Delete now asks first (ConfirmDialog).
 * >= 1280: list | 28rem pane (first memory selected so the pane is never empty).
 * < 1280: list, and a selected / new memory replaces it with a back button.
 * Leda: top-bar Ask Leda; the pane footer says Leda answers from this memory.
 * Built only from @readyph/ui components and tokens. Never export from `src/index.ts`.
 */
import { useState, type ReactNode } from 'react';
import { ArrowLeft, Brain, FileText, PencilSimple, Plus, Trash, WaveTriangle } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { SearchBar } from '../../components/SearchBar';
import { Table, type TableColumn } from '../../components/Table';
import { Textarea } from '../../components/Textarea';
import { cn } from '../../utils/cn';
import type { LedaState, ShellTheme } from '../portal-shell/Shell';
import { PageShell, RetryNotice, useAskLeda, useMediaQuery, type ViewState } from './common';
import { memories as seed, type Memory } from './data';

export type MemoryMode = 'view' | 'edit' | 'create';

/* ---------------------------------------------------------------- list */

function MemoryList({
  items,
  state,
  query,
  split,
  selectedId,
  onQuery,
  onOpen,
  onCreate,
}: {
  items: Memory[];
  state: ViewState;
  query: string;
  split: boolean;
  selectedId?: string;
  onQuery: (q: string) => void;
  onOpen: (m: Memory) => void;
  onCreate: () => void;
}) {
  const columns: TableColumn<Memory>[] = [
    {
      key: 'title',
      header: 'Memory',
      className: split ? 'w-full max-w-0' : 'w-full max-w-0 md:w-auto md:max-w-none',
      render: (m) => {
        const selected = m.id === selectedId;
        return (
          <button
            type="button"
            aria-current={selected || undefined}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(m);
            }}
            className={cn(
              'flex w-full min-w-0 items-center gap-2 rounded-sm text-left font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40',
              selected ? 'text-primary-600' : 'text-ink',
            )}
          >
            <Icon icon={FileText} size="sm" className={cn('shrink-0', selected ? 'text-primary-600' : 'text-ink-subtle')} />
            <span className={cn('truncate', !split && 'md:whitespace-nowrap')}>{m.title}</span>
          </button>
        );
      },
    },
    ...(split
      ? []
      : [
          {
            key: 'excerpt',
            header: 'Content',
            className: 'hidden w-full max-w-0 md:table-cell',
            render: (m: Memory) => <span className="block truncate text-ink-muted">{m.content.split('\n')[0]}</span>,
          },
        ]),
    {
      key: 'version',
      header: 'Version',
      align: 'right',
      className: 'hidden sm:table-cell',
      render: (m) => (
        <Badge tone="neutral" size="sm">
          v{m.version}
        </Badge>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      align: 'right',
      className: 'whitespace-nowrap',
      render: (m) => <span className="text-ink-muted">{m.updated}</span>,
    },
  ];

  const empty =
    state === 'empty' ? (
      <EmptyState
        icon={Brain}
        title="No memory yet"
        description="Add what Leda should remember about the company: hours, policies, contacts."
        action={
          <Button leftIcon={Plus} onClick={onCreate}>
            New memory
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Brain}
        title="No matches"
        description="Try a different search."
        action={
          <Button variant="secondary" onClick={() => onQuery('')}>
            Clear search
          </Button>
        }
      />
    );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBar
          size="sm"
          placeholder="Search memory"
          aria-label="Search memory"
          value={query}
          onValueChange={onQuery}
          className="w-full sm:w-64"
        />
        <div className="ml-auto flex items-center gap-3">
          {state === 'ready' && (
            <span className="text-xs text-ink-subtle">
              {items.length} {items.length === 1 ? 'memory' : 'memories'}
              <span className="hidden sm:inline"> · Leda answers from these</span>
            </span>
          )}
          <Button leftIcon={Plus} onClick={onCreate}>
            New memory
          </Button>
        </div>
      </div>
      {state === 'error' ? (
        <RetryNotice title="Couldn't load memory">Something went wrong fetching company memory.</RetryNotice>
      ) : (
        <Table
          columns={columns}
          data={state === 'loading' ? [] : items}
          loading={state === 'loading'}
          rowKey={(m) => m.id}
          onRowClick={onOpen}
          empty={empty}
          dense
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- pane */

function PaneHeader({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="flex min-h-[2.75rem] items-center gap-2 border-b border-border px-3 py-1.5">
      {onBack && <IconButton icon={ArrowLeft} label="Back to memory" size="sm" onClick={onBack} />}
      {children}
    </div>
  );
}

function MemoryView({
  memory,
  onBack,
  onEdit,
  onDelete,
}: {
  memory: Memory;
  onBack?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <PaneHeader onBack={onBack}>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-ink">{memory.title}</h2>
          <p className="text-xs text-ink-subtle">
            v{memory.version} · Updated {memory.updated}
          </p>
        </div>
        <IconButton icon={Trash} label="Delete memory" size="sm" onClick={onDelete} />
        <Button variant="secondary" leftIcon={PencilSimple} onClick={onEdit}>
          Edit
        </Button>
      </PaneHeader>
      <div className="whitespace-pre-wrap px-3 py-3 text-sm leading-relaxed text-ink">{memory.content}</div>
      <p className="mt-auto flex items-center gap-2 border-t border-border px-3 py-2 text-xs text-ink-subtle">
        <Icon icon={WaveTriangle} size="sm" className="shrink-0 text-primary-600" />
        Leda reads this when answering customers and staff.
      </p>
    </>
  );
}

function MemoryEditor({
  mode,
  memory,
  onBack,
  onCancel,
  onSave,
}: {
  mode: 'edit' | 'create';
  memory?: Memory;
  onBack?: () => void;
  onCancel: () => void;
  onSave: (title: string, content: string) => void;
}) {
  const [title, setTitle] = useState(mode === 'edit' ? (memory?.title ?? '') : '');
  const [content, setContent] = useState(mode === 'edit' ? (memory?.content ?? '') : '');
  const valid = title.trim() !== '' && content.trim() !== '';
  return (
    <form
      className="flex min-h-0 flex-col"
      aria-label={mode === 'create' ? 'New memory' : 'Edit memory'}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(title.trim(), content.trim());
      }}
    >
      <PaneHeader onBack={onBack}>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {mode === 'create' ? 'New memory' : `Edit ${memory?.title ?? 'memory'}`}
        </h2>
      </PaneHeader>
      <div className="flex flex-col gap-3 px-3 py-3">
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Opening hours" />
        </Field>
        <Field label="Content" hint="Markdown supported. Leda uses this word for word." required>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="What should Leda remember?"
          />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
        <Button variant="subtle" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid}>
          {mode === 'create' ? 'Create memory' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- page */

export interface MemoryPageProps {
  theme?: ShellTheme;
  state?: ViewState;
  /** Memory open on mount. At >= 1280 the first one is selected when omitted. */
  memoryId?: string;
  mode?: MemoryMode;
  /** Open the delete confirmation for the selected memory on mount. */
  confirmDelete?: boolean;
  query?: string;
  leda?: LedaState;
}

export function MemoryPage({
  theme = 'light',
  state = 'ready',
  memoryId,
  mode: initialMode = 'view',
  confirmDelete = false,
  query: initialQuery = '',
  leda: initialLeda = 'closed',
}: MemoryPageProps) {
  const split = useMediaQuery('(min-width: 1280px)');
  const { leda } = useAskLeda(initialLeda);
  const [items, setItems] = useState<Memory[]>(state === 'empty' ? [] : seed);
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState<string | undefined>(memoryId);
  const [mode, setMode] = useState<MemoryMode>(initialMode);
  const [deleting, setDeleting] = useState(confirmDelete);

  const q = query.trim().toLowerCase();
  const filtered = items.filter((m) => !q || m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q));
  const listReady = state === 'ready' || state === 'no-results';
  // Split view always shows something in the pane: the chosen memory, else the first match.
  const selected =
    items.find((m) => m.id === selectedId) ?? (split && listReady && mode === 'view' ? filtered[0] : undefined);
  const paneOpen = mode !== 'view' || Boolean(selected);

  const open = (m: Memory) => {
    setSelectedId(m.id);
    setMode('view');
  };
  const back = () => {
    setSelectedId(undefined);
    setMode('view');
  };
  const save = (title: string, content: string) => {
    if (mode === 'create') {
      const created: Memory = { id: `m-${Date.now()}`, title, content, version: 1, updated: 'just now' };
      setItems((xs) => [created, ...xs]);
      setSelectedId(created.id);
    } else if (selected) {
      setItems((xs) =>
        xs.map((m) => (m.id === selected.id ? { ...m, title, content, version: m.version + 1, updated: 'just now' } : m)),
      );
    }
    setMode('view');
  };
  const remove = () => {
    if (!selected) return;
    setItems((xs) => xs.filter((m) => m.id !== selected.id));
    setSelectedId(undefined);
    setDeleting(false);
  };

  const pane = (
    <section
      aria-label="Memory detail"
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-panel border border-border bg-surface',
        !split && 'w-full max-w-content',
      )}
    >
      {mode === 'view' && selected ? (
        <MemoryView
          memory={selected}
          onBack={split ? undefined : back}
          onEdit={() => setMode('edit')}
          onDelete={() => setDeleting(true)}
        />
      ) : mode !== 'view' ? (
        <MemoryEditor
          key={`${mode}-${selected?.id ?? 'new'}`}
          mode={mode}
          memory={selected}
          onBack={split ? undefined : back}
          onCancel={() => (split || mode === 'edit' ? setMode('view') : back())}
          onSave={save}
        />
      ) : null}
    </section>
  );

  const list = (
    <MemoryList
      items={filtered}
      state={state === 'ready' && items.length === 0 ? 'empty' : state}
      query={query}
      split={split}
      selectedId={selected?.id}
      onQuery={setQuery}
      onOpen={open}
      onCreate={() => {
        setSelectedId(undefined);
        setMode('create');
      }}
    />
  );

  return (
    <PageShell theme={theme} page="memory" leda={leda}>
      {split ? (
        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_28rem]">
          {list}
          {paneOpen && pane}
        </div>
      ) : paneOpen ? (
        pane
      ) : (
        list
      )}
      <ConfirmDialog
        open={deleting && Boolean(selected)}
        onOpenChange={setDeleting}
        tone="danger"
        title={`Delete "${selected?.title ?? ''}"?`}
        description="Leda stops using it in answers right away. This cannot be undone."
        confirmLabel="Delete memory"
        onConfirm={remove}
      />
    </PageShell>
  );
}
