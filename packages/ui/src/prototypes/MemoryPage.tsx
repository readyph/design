import { useMemo, useState } from "react";
import {
  Books,
  LockSimple,
  Plus,
} from "@phosphor-icons/react";
import { AskLedaBar } from "../components/AskLedaBar";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ErrorBlock } from "../components/ErrorBlock";
import { List, ListCell, ListRow } from "../components/List";
import { ListGroup, ListGroups } from "../components/ListGroup";
import { PlatformLogo } from "../components/PlatformLogo";
import { PortalFrame } from "./PortalFrame";
import { go as navGo, type Dest } from "./protoNav";
import { StatusBar } from "../components/StatusBar";
import { ProgressBar } from "../components/ProgressBar";
import { SheetBar } from "../components/SheetBar";
import { Skeleton } from "../components/Skeleton";
import {
  SubpageLane,
  SubpageTransition,
  type SubpageDirection,
} from "../components/SubpageTransition";
import { Switch } from "../components/Switch";
import { Tabs } from "../components/Tabs";
import { TownMap, type TownMapSlot } from "../components/TownMap";
import { autoWorks, cafe, hq, stockroom } from "../components/TownMap.data";
import { TryIt } from "../components/TryIt";
import {
  defaultSwitches,
  sampleAbouts,
  sampleAsk,
  sampleQuestions,
} from "../components/TryIt.sample";
import { TopicDocument } from "../components/TopicDocument";
import {
  UnsavedLeaveDialog,
  useUnsavedGuard,
} from "../components/TopicDocument";
import { Toaster } from "../components/toast/Toaster";
import { toast } from "../components/toast/toastStore";
import {
  FOLDER_NAMES,
  TopicLibraryPage,
  businessOptions,
  sampleTopics,
} from "../components/TopicLibrary.sample";
import { BlockedQuestions } from "../components/BlockedQuestions";
import {
  items as blockedSeed,
  replies as blockedRepliesSeed,
  scopes as blockedScopes,
} from "../components/BlockedQuestions.data";
import { Select } from "../components/Select";
import { focusRing } from "../utils/cn";
import type { TopicItem } from "../components/TopicLibrary";
import { useMatchMedia } from "../utils/useMatchMedia";

/** RDY-259. Prototype only: not exported from the package. Memory (handover 2.5) composed from @readyph/ui parts in the real PlatformShell. */

export type MemoryState = "live" | "loading" | "error" | "empty" | "full";

const ROOM_MAX = 16000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Folder id to the map building it opens. */
const BUILDING: Record<string, string> = {
  company: "hq",
  autoworks: "autoworks",
  cafe: "cafe",
  stockroom: "stockroom",
};
/** Folder id to the Try it "about" value (cafe has no sample yet). */
const TRY_ABOUT: Record<string, string> = {
  company: "company",
  autoworks: "auto",
  stockroom: "parts",
};
const map: TownMapSlot[] = [stockroom, autoWorks, cafe, hq];
const mapOf = (id: string) =>
  Object.keys(BUILDING).find((k) => BUILDING[k] === id) ?? "";
const folderKey = (t: TopicItem) =>
  Object.keys(FOLDER_NAMES).find((k) => FOLDER_NAMES[k] === t.folder?.label) ??
  "";

const tabs = [
  { value: "topics", label: "Topics" },
  { value: "blocked", label: "Blocked questions" },
  { value: "requests", label: "Customer requests" },
];

interface Request {
  id: string;
  folder: string;
  name: string;
  about: string;
  on: boolean;
}
const requestsSeed: Request[] = [
  {
    id: "r1",
    folder: "autoworks",
    name: "Book a service",
    about: "A customer asks for a date. Staff accept or suggest another.",
    on: true,
  },
  {
    id: "r2",
    folder: "autoworks",
    name: "Ask for a quote",
    about: "Sent to the front desk with the car and the work wanted.",
    on: true,
  },
  {
    id: "r3",
    folder: "autoworks",
    name: "Ask for a call back",
    about: "Staff phone the customer back.",
    on: false,
  },
  {
    id: "r4",
    folder: "cafe",
    name: "Reserve a table",
    about: "For a day, a time and a number of people.",
    on: true,
  },
  {
    id: "r5",
    folder: "cafe",
    name: "Pre-order for pick-up",
    about: "The order goes to the counter to accept.",
    on: false,
  },
  {
    id: "r6",
    folder: "stockroom",
    name: "Hold a part",
    about: "Staff hold the part for a day.",
    on: false,
  },
];

const wrap = "mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6";
const noteClass = "mb-4 flex items-start gap-2 text-ui text-muted";

function RequestsTab({
  requests,
  setRequests,
  folder,
  readOnly,
}: {
  requests: Request[];
  setRequests: (r: Request[]) => void;
  folder: string;
  readOnly: boolean;
}) {
  if (folder === "company")
    return (
      <p className="text-ui text-muted">
        Requests are made at a platform. Choose a platform in the filter to see
        its requests.
      </p>
    );
  const groups = Object.keys(FOLDER_NAMES).filter(
    (k) => k !== "company" && (!folder || folder === k)
  );
  return (
    <>
      <p className="mb-3 text-ui text-muted">
        Each request goes to staff to accept. Leda never accepts one on its own.
        Switches save as you change them.
      </p>
      <ListGroups
        as="list"
        aria-label="Customer requests"
        columns="minmax(0,1fr) auto"
        stackBelow={600}
        shortcuts={false}
      >
        {groups.map((k) => {
          const rs = requests.filter((r) => r.folder === k);
          return (
            <ListGroup
              key={k}
              title={FOLDER_NAMES[k]}
              count={rs.length}
              note={`${rs.filter((r) => r.on).length} of ${rs.length} on`}
              level={2}
            >
              {rs.map((r) => (
                <ListRow key={r.id} rowId={r.id} label={r.name}>
                  <ListCell kind="lead">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-ui text-muted">{r.about}</div>
                  </ListCell>
                  <ListCell kind="actions">
                    <Switch
                      aria-label={`Can request: ${r.name}, ${FOLDER_NAMES[k]}`}
                      checked={r.on}
                      disabled={readOnly}
                      onCheckedChange={(on) => {
                        setRequests(
                          requests.map((x) =>
                            x.id === r.id ? { ...x, on } : x
                          )
                        );
                        toast.undo(
                          `${r.name} is ${on ? "on" : "off"} for customers.`,
                          () => setRequests(requests)
                        );
                      }}
                    />
                  </ListCell>
                </ListRow>
              ))}
            </ListGroup>
          );
        })}
      </ListGroups>
    </>
  );
}

export interface MemoryPageProps {
  state?: MemoryState;
  readOnly?: boolean;
  initialTab?: "topics" | "blocked" | "requests";
  /** Start on the first topic's page. */
  openTopic?: boolean;
  /** Start with Try it open. */
  tryOpen?: boolean;
  /** Phone: start on the sheet, not the folder list. */
  startDetail?: boolean;
}

export function MemoryPage({
  state = "live",
  readOnly = false,
  initialTab = "topics",
  openTopic = false,
  tryOpen = false,
  startDetail = false,
}: MemoryPageProps) {
  const phone = useMatchMedia("(max-width: 640px)");
  const [tab, setTab] = useState(initialTab);
  const [folder, setFolder] = useState("");
  const store = useState<TopicItem[]>(state === "empty" ? [] : sampleTopics);
  const [topics, setTopics] = store;
  const [requests, setRequests] = useState(requestsSeed);
  const [blockedItems, setBlockedItems] = useState(blockedSeed);
  const [blockedReplies, setBlockedReplies] = useState(blockedRepliesSeed);
  const [view, setView] = useState(openTopic ? sampleTopics[3].id : "list");
  const [dir, setDir] = useState<SubpageDirection>("in");
  const [phoneSheet, setPhoneSheet] = useState(startDetail || openTopic);
  const [tryAbout, setTryAbout] = useState<string | undefined>();
  const [tryQuestion, setTryQuestion] = useState<string | undefined>();
  const [tryShown, setTryShown] = useState(tryOpen);
  const [dirty, setDirty] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useUnsavedGuard(dirty);

  const loading = state === "loading";
  const error = state === "error";
  const inTopic = view !== "list";
  const topic = topics.find((t) => t.id === view);

  const used = state === "full" ? 14880 : 3120;
  const on = topics.filter((t) => t.on);
  const off = topics.filter((t) => !t.on);
  const finding = loading
    ? null
    : error
    ? "Couldn't load what Leda knows."
    : !topics.length
    ? "Nothing for Leda to know yet."
    : state === "full"
    ? `Customers' Leda can use ${on.length} of ${
        topics.length
      } topics. Memory is nearly full: ${(ROOM_MAX - used).toLocaleString(
        "en-US"
      )} characters left.`
    : `Customers' Leda can use ${on.length} of ${topics.length} topics. ${
        off.length === 1
          ? `${off[0].title} stays off.`
          : `${off.length} stay off: ${off
              .slice(0, 4)
              .map((t) => t.title)
              .join(", ")}.`
      }`;

  const switches = useMemo(
    () => ({
      ...defaultSwitches,
      prices: !!topics.find((t) => t.id === "t1")?.on,
      hours: !!topics.find((t) => t.id === "t2")?.on,
      stock: !!topics.find((t) => t.id === "t9")?.on,
      book: !!requests.find((r) => r.id === "r1")?.on,
    }),
    [topics, requests]
  );

  const go = (next: string, direction: SubpageDirection) => {
    setDir(direction);
    setView(next);
  };
  const pickFolder = (id: string) => {
    setFolder((f) => (f === id && id !== "" ? "" : id));
    setPhoneSheet(true);
  };
  const openTry = (about?: string, question?: string) => {
    setTryAbout(about);
    setTryQuestion(question);
    setTryShown(true);
  };
  const back = () => (dirty ? setLeaving(true) : go("list", "out"));
  const setTabAndList = (t: string) => {
    setTab(t as typeof tab);
    setPhoneSheet(true);
  };
  const counts = (k: string) => {
    const ts = topics.filter((t) => folderKey(t) === k);
    return `${ts.filter((t) => t.on).length} of ${ts.length} on`;
  };

  const rulesRows = [
    {
      tab: "blocked",
      name: "Blocked questions",
      count: String(blockedItems.length),
    },
    {
      tab: "requests",
      name: "Customer requests",
      count: `${requests.filter((r) => r.on).length} of ${requests.length} on`,
    },
  ];

  const folderRows: Array<{ id: string; name: string; note: string }> = [
    { id: "", name: "All topics", note: `${on.length} of ${topics.length} on` },
    ...Object.keys(FOLDER_NAMES).map((k) => ({
      id: k,
      name: FOLDER_NAMES[k],
      note: counts(k),
    })),
  ];

  const place = (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pb-4">
      <div className="min-h-[220px]">
        <TownMap
          platforms={map}
          caption="3 platforms + HQ"
          loading={loading}
          error={error}
          onRetry={() => toast.info("Trying again.")}
          selected={folder ? BUILDING[folder] : null}
          onSelect={(id) => (id ? pickFolder(mapOf(id)) : setFolder(""))}
        />
      </div>
      <div className="px-pad max-[640px]:pt-3">
        {phone && !phoneSheet && !inTopic ? (
          <h1 className="m-0 text-ui font-semibold">Memory</h1>
        ) : (
          <h2 className="m-0 text-ui font-semibold">Memory</h2>
        )}
        {loading ? (
          <Skeleton variant="text" lines={2} className="mt-2" />
        ) : (
          <p className="mb-0 mt-1 text-ui text-muted">{finding}</p>
        )}
        {phone && !loading ? (
          <div className="mt-3">
            <AskLedaBar
              variant="overview"
              scope="Memory"
              shortcuts={false}
              paused={tryShown}
            />
          </div>
        ) : null}
      </div>
      {!loading && !error && topics.length ? (
        <div className="px-3 sm:px-0">
          <List as="list" aria-label="Folders" shortcuts={false}>
            {folderRows.map((f) => (
              <ListRow
                key={f.id || "all"}
                rowId={f.id || "all"}
                label={f.name}
                current={folder === f.id}
                onActivate={() => pickFolder(f.id)}
              >
                <ListCell kind="lead" className="flex items-center gap-3">
                  {f.id ? (
                    <PlatformLogo name={f.name} size={24} decorative />
                  ) : (
                    <Books
                      size={20}
                      aria-hidden="true"
                      className="shrink-0 text-muted"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {f.name}
                  </span>
                  <span className="shrink-0 text-ui text-muted">{f.note}</span>
                </ListCell>
              </ListRow>
            ))}
          </List>
        </div>
      ) : null}
      {phone && !loading && !error ? (
        <div className="px-pad">
          <h2 className="m-0 mb-1 text-ui font-semibold">Rules</h2>
          <ul className="m-0 list-none p-0">
            {rulesRows.map((x) => (
              <li key={x.tab}>
                <button
                  type="button"
                  className={`flex min-h-11 w-full items-center justify-between gap-3 text-left text-body hover:text-accent ${focusRing}`}
                  onClick={() => setTabAndList(x.tab)}
                >
                  <span>{x.name}</span>
                  <span className="text-ui text-muted">{x.count}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={`flex min-h-11 w-full items-center justify-between gap-3 text-left text-body hover:text-accent ${focusRing}`}
                onClick={() => openTry()}
              >
                <span>Try it</span>
                <span className="text-ui text-muted">Ask as a customer</span>
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );

  const tryBtn =
    loading || error ? null : (
      <Button
        variant="secondary"
        onClick={() =>
          openTry(
            folder ? TRY_ABOUT[folder] : undefined
          )
        }
      >
        Try it
      </Button>
    );

  const sheetBar = inTopic ? (
    <SheetBar
      actions={
        <>
          {tryBtn}
          <AskLedaBar scope="Memory" paused={tryShown} />
        </>
      }
    >
      <Breadcrumbs
        variant="sheet"
        aria-label="Memory"
        items={[
          {
            label: "Memory",
            href: "#memory",
            onClick: (e: { preventDefault: () => void }) => {
              e.preventDefault();
              back();
            },
          },
          { label: topic?.folder?.label ?? "All", href: "#folder" },
          { label: topic?.title ?? "Topic" },
        ]}
      />
    </SheetBar>
  ) : (
    <SheetBar
      actions={
        <>
          {tryBtn}
          <AskLedaBar scope="Memory" paused={tryShown} />
        </>
      }
    >
      <button
        type="button"
        className="mr-3 shrink-0 text-ui text-muted hover:text-text sm:hidden"
        onClick={() => setPhoneSheet(false)}
      >
        &larr; Memory
      </button>
      {tab === "topics" && !phone ? (
        <Breadcrumbs
          variant="sheet"
          aria-label="Memory location"
          className="mr-4 max-[1499px]:hidden"
          items={[
            {
              label: "Memory",
              href: "#memory",
              onClick: (e: { preventDefault: () => void }) => {
                e.preventDefault();
                setFolder("");
              },
            },
            { label: folder ? FOLDER_NAMES[folder] : "All topics" },
          ]}
        />
      ) : null}
      <Tabs
        variant={phone ? "chips" : "fixed"}
        aria-label="Memory"
        items={tabs}
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
      />
    </SheetBar>
  );

  const businessFilter = (
    <div className="mb-4 max-w-[260px]">
      <Select
        size="sm"
        aria-label="Business"
        options={businessOptions}
        value={folder}
        onValueChange={(v) => setFolder(v)}
        className="w-full min-w-0"
      />
    </div>
  );

  const roNote = readOnly ? (
    <p className={noteClass}>
      <LockSimple size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>
        You can see what customers&rsquo; Leda knows. Only owners, admins and
        managers can change it.
      </span>
    </p>
  ) : null;

  let body;
  if (error) {
    body = (
      <>
        <h1 className="mb-4 text-header">What customers&rsquo; Leda knows</h1>
        <ErrorBlock
          thing="what Leda knows"
          onRetry={() => toast.info("Trying again.")}
        >
          Customers&rsquo; Leda keeps using the last saved switches.
        </ErrorBlock>
      </>
    );
  } else if (tab === "topics") {
    body = (
      <>
        {!phone ? (
          <Breadcrumbs
            aria-label="Folder"
            className="mb-2 min-[1500px]:hidden"
            items={[
              {
                label: "Memory",
                href: "#memory",
                onClick: (e: { preventDefault: () => void }) => {
                  e.preventDefault();
                  setFolder("");
                },
              },
              { label: folder ? FOLDER_NAMES[folder] : "All topics" },
            ]}
          />
        ) : null}
        <h1 className="text-header">What customers&rsquo; Leda knows</h1>
        {loading ? null : (
          <p className="mb-4 mt-1 text-ui text-muted">
            {topics.length
              ? `${on.length} of ${topics.length} topics are on. `
              : ""}
            Off means Leda never uses it for customers.
          </p>
        )}
        {roNote}
        {!loading && !topics.length ? (
          <EmptyState
            icon={Books}
            title="Nothing for Leda to know yet"
            description="Add a platform and its data becomes topics Leda can answer from, like services and prices or opening hours. You can also write your own: payment options, warranty, how to find you."
            action={
              <>
                <Button
                  leftIcon={Plus}
                  onClick={() => toast.info("A new company topic opens.")}
                >
                  Add a company topic
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.info("Add a platform opens.")}
                >
                  Add a platform
                </Button>
              </>
            }
            align="start"
            headingLevel={2}
          />
        ) : (
          <>
            {!loading ? (
              <div className="mb-4">
                <ProgressBar
                  layout="full"
                  value={used}
                  max={ROOM_MAX}
                  label={`Memory room: ${used.toLocaleString(
                    "en-US"
                  )} of ${ROOM_MAX.toLocaleString("en-US")} characters`}
                  actionHref="#plan"
                />
              </div>
            ) : null}
            <TopicLibraryPage
              store={store}
              business={folder}
              onBusiness={(v) => setFolder(v)}
              loading={loading}
              readOnly={readOnly}
              readOnlyNote={null}
              emptyHeadingLevel={2}
              onOpen={(t) => go(t.id, "in")}
              onNew={() => toast.info("A new topic opens.")}
            />
          </>
        )}
      </>
    );
  } else if (tab === "blocked") {
    body = (
      <>
        <h1 className="text-header">Blocked questions</h1>
        {roNote}
        {businessFilter}
        <div className="mt-2">
          <BlockedQuestions
            items={blockedItems}
            scopes={blockedScopes}
            replies={blockedReplies}
            scope={folder || undefined}
            readOnly={readOnly}
            status={loading ? "loading" : "ready"}
            onBlock={async (i) => {
              await wait(150);
              setBlockedItems((x) => [...x, { id: `n${Date.now()}`, ...i }]);
            }}
            onRemove={async (item, { undo }) => {
              await wait(150);
              setBlockedItems((x) =>
                undo ? [item, ...x] : x.filter((y) => y.id !== item.id)
              );
            }}
            onEditReply={async (sc, t) => {
              await wait(150);
              setBlockedReplies((x) => ({ ...x, [sc]: t }));
            }}
            onTry={(i) => openTry(undefined, i.question)}
          />
        </div>
      </>
    );
  } else {
    body = (
      <>
        <h1 className="mb-1 text-header">Customer requests</h1>
        {roNote}
        {businessFilter}
        {loading ? (
          <Skeleton variant="text" lines={5} />
        ) : (
          <RequestsTab
            requests={requests}
            setRequests={setRequests}
            folder={folder}
            readOnly={readOnly}
          />
        )}
      </>
    );
  }

  const sheet = inTopic ? (
    <div className={wrap}>
      <TopicDocument
        topic={
          topic
            ? {
                id: topic.id,
                title: topic.title,
                body: topic.lines,
                source: topic.source,
                sourceKind: topic.sourceKind,
                on: topic.on,
                locked: topic.locked,
                lockNote: topic.lockNote,
                questions: ["Is there a warranty on repairs?"],
                lastChanged: "Last edited Tue 20 Oct",
              }
            : undefined
        }
        missing={!topic}
        readOnly={readOnly}
        readOnlyNote="Written by your team. Only owners, admins and managers can change it."
        room={{ max: ROOM_MAX, others: used }}
        headingLevel={1}
        onBack={back}
        onDirtyChange={setDirty}
        onToggle={(next) => {
          if (!topic) return;
          setTopics((ts) =>
            ts.map((t) => (t.id === topic.id ? { ...t, on: next } : t))
          );
          toast.undo(
            `${topic.title} is ${next ? "on" : "off"} for customers.`,
            () =>
              setTopics((ts) =>
                ts.map((t) => (t.id === topic.id ? { ...t, on: !next } : t))
              )
          );
        }}
        onTry={(q) => openTry(undefined, q)}
        onSave={() => {}}
      />
    </div>
  ) : (
    <div className={wrap}>{body}</div>
  );

  return (
    <SubpageTransition paneKey={view} direction={dir}>
      <PortalFrame
        current="memory"
        heading={null}
        pageName="Memory"
        teamCount={3}
        onAddPlatform={() => navGo({ to: "platforms", add: true })}
        onNavigate={(d: Dest) => (d.to === "memory" ? (inTopic ? back() : undefined) : navGo(d))}
        leda={<AskLedaBar variant="bar" scope="Memory" paused={tryShown} onOpen={() => openTry()} />}
        detail={inTopic || phoneSheet}
        placeLabel="Memory folders"
        place={place}
        sheetLabel="Memory"
        sheetBar={sheetBar}
        status={
          <StatusBar
            platforms={[
              { id: "autoworks", name: "Auto Works", color: 1 },
              { id: "cafe", name: "Café POS", color: 2 },
              { id: "stockroom", name: "Main Stockroom", color: 3 },
            ]}
            people={{ count: 9 }}
            leda={{ used: 1742, max: 2000 }}
            plan="Starter"
            updatedAt="9:12 AM"
          />
        }
      >
        <SubpageLane>{sheet}</SubpageLane>
      </PortalFrame>
      <TryIt
        open={tryShown}
        onOpenChange={setTryShown}
        abouts={sampleAbouts}
        about={tryAbout}
        onAboutChange={setTryAbout}
        questions={sampleQuestions}
        question={tryQuestion}
        onQuestionChange={setTryQuestion}
        ask={(a, q) => sampleAsk(a, q, switches)}
      />
      <UnsavedLeaveDialog
        open={leaving}
        onStay={() => setLeaving(false)}
        onLeave={() => {
          setLeaving(false);
          setDirty(false);
          go("list", "out");
        }}
      />
      <Toaster />
    </SubpageTransition>
  );
}
