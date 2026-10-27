import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CaretLeft,
  ArrowRight,
  Buildings,
  Check,
  ChatCircle,
  Database,
  FileX,
  FolderOpen,
  Funnel,
  HandWaving,
  ListBullets,
  LockSimple,
  MagnifyingGlass,
  PencilSimple,
  PencilSimpleLine,
  Plus,
  PlusSquare,
  Prohibit,
  SquaresFour,
  ToggleLeft,
  ToggleRight,
  Trash,
  WarningCircle,
  X,
  Books,
  type Icon,
} from "@phosphor-icons/react";
import { AskLedaBar } from "../components/AskLedaBar";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { LedaMark } from "../components/Leda";
import { PlatformLogo } from "../components/PlatformLogo";
import { PortalFrame } from "./PortalFrame";
import { go as navGo, type Dest } from "./protoNav";
import { StatusBar } from "../components/StatusBar";
import { SheetBar } from "../components/SheetBar";
import { Select } from "../components/Select";
import { SubpageLane, SubpageTransition, type SubpageDirection } from "../components/SubpageTransition";
import { Switch } from "../components/Switch";
import { Tabs } from "../components/Tabs";
import { TownMap, type TownMapSlot } from "../components/TownMap";
import { TryIt, type TryItAnswer } from "../components/TryIt";
import { Toaster } from "../components/toast/Toaster";
import { toast } from "../components/toast/toastStore";
import { cn, focusRing } from "../utils/cn";
import { useMatchMedia } from "../utils/useMatchMedia";
import {
  MEM_CAP,
  MEM_NAME,
  MEM_PHONE,
  MEM_SHORT,
  MEM_SOURCES,
  MEM_KIND,
  memBlocked,
  memReplies,
  memRequests,
  memTopics,
  type MemBlocked,
  type MemRequest,
  type MemSrc,
  type MemTopic,
  priceListTopic,
} from "./Memory.proto.data";

/**
 * RDY-258/259/358. Prototype only: not exported from the package. Memory (handover 2.5) as an exact copy of the workshop's
 * memory.html (round-2/final), composed from @readyph/ui parts in the real PlatformShell. Data: Memory.proto.data.ts, taken from
 * the prototype itself. Deep links as in the prototype: ?tab=topics|blocked|requests|try  &folder=company|autoworks|stockroom
 * &topic=<key>  &state=loading|error|empty|full  &as=arnel (read only).
 */

export type MemoryState = "live" | "loading" | "error" | "empty" | "full";

const AUTO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c2471f"/><path d="M0 46h64v18H0z" fill="#9e3615"/><circle cx="32" cy="29" r="15" fill="none" stroke="#fff3e3" stroke-width="7" stroke-dasharray="5.2 3.2"/><circle cx="32" cy="29" r="7" fill="#fff3e3"/><path d="M14 52 L44 22" stroke="#fff3e3" stroke-width="6" stroke-linecap="round"/><circle cx="46" cy="20" r="7" fill="#fff3e3"/><path d="M47 13 l5 5 -4 4 -5 -5z" fill="#c2471f"/></svg>';
const AUTO_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(AUTO_SVG)}`;

function Logo({ src, size = 16 }: { src: MemSrc; size?: 14 | 16 | 20 | 24 }) {
  if (src === "company") return <PlatformLogo name="Company" hq size={size} decorative />;
  if (src === "autoworks") return <PlatformLogo name={MEM_NAME[src]} src={AUTO_LOGO} size={size} decorative />;
  return <PlatformLogo name={MEM_NAME[src]} initials="PS" color="#6d48c6" size={size} decorative />;
}

const BUILDING: Record<string, string> = { company: "hq", autoworks: "autoworks", stockroom: "stockroom" };
const mapOf = (id: string): MemSrc | "" => (MEM_SOURCES.find((k) => BUILDING[k] === id) as MemSrc) ?? "";
const mapSlots: TownMapSlot[] = [
  { id: "stockroom", name: "Parts Stockroom", shortName: "Stockroom", kind: "Inventory", mapType: "warehouse", status: "ACTIVE", initials: "PS", color: "#6d48c6" },
  { id: "autoworks", name: "Dela Cruz Auto Works", shortName: "Auto Works", kind: "Repair shop", mapType: "service", status: "ACTIVE", logo: AUTO_LOGO },
  null,
  { id: "hq", name: "Company", shortName: "Company", kind: "HQ", status: "ACTIVE", hq: true },
];

const TABS: { value: "topics" | "blocked" | "requests"; label: string; icon: Icon }[] = [
  { value: "topics", label: "Topics", icon: Books },
  { value: "blocked", label: "Blocked questions", icon: Prohibit },
  { value: "requests", label: "Customer requests", icon: HandWaving },
];
const FILTERS = [
  ["all", "All"],
  ["on", "On"],
  ["off", "Off"],
  ["custom", "Custom"],
  ["data", "From data"],
] as const;
type Filter = (typeof FILTERS)[number][0];
const FWORD: Record<Filter, string> = { all: "all", on: "on", off: "off", custom: "custom", data: "from data" };
const LAYOUT_KEY = "rph-mem-layout";
const num = (n: number) => n.toLocaleString("en-PH");
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const norm = (q: string) => q.toLowerCase().replace(/[^a-z0-9₱ ]+/g, "").replace(/\s+/g, " ").trim();
const sentences = (t: string, n: number) => ((t.match(/[^.!?]+[.!?]+/g) || [t]).slice(0, n).join("")).trim();
const srcName = (s: MemSrc) => MEM_NAME[s];
const srcShort = (s: MemSrc) => MEM_SHORT[s];
const keyOf = (t: { src: MemSrc; k: string }) => `${t.src}|${t.k}`;
const NEW_DOC = "new";

function params(): URLSearchParams {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

const sr = "sr-only";
const crumbLink = cn("inline-flex items-center gap-1.5 rounded-[2px] text-muted hover:text-text hover:underline hover:underline-offset-2", focusRing);

/** Segmented control (shell.css .seg). */
function Seg({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cn("flex h-8 items-center gap-0.5 rounded-[5px] bg-raised-2 p-0.5", className)}>
      {children}
    </div>
  );
}
function SegBtn({ pressed, onClick, label, children, className }: { pressed: boolean; onClick: () => void; label?: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 items-center whitespace-nowrap rounded-[4px] border text-[13px] leading-5",
        pressed ? "border-border bg-surface font-medium text-text" : "border-transparent text-muted hover:text-text",
        focusRing,
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A page head: title, sub and the actions on the right (.ahead). */
function Head({ title, sub, extra, h = "h2" }: { title: ReactNode; sub?: ReactNode; extra?: ReactNode; h?: "h1" | "h2" }) {
  const H = h;
  return (
    <div className="flex items-start gap-4 max-[640px]:flex-wrap max-[640px]:gap-2.5">
      <div className="min-w-0">
        <H className="m-0 text-[20px] font-semibold leading-7 tracking-[-0.01em] max-[640px]:text-[18px] max-[640px]:leading-[25px]">{title}</H>
        {sub ? <p className="m-0 mt-0.5 text-[14px] leading-5 text-muted">{sub}</p> : null}
      </div>
      {extra}
    </div>
  );
}

const roNoteClass = "mt-4 flex items-start gap-2 rounded-card border border-dashed border-control px-3 py-2.5 text-[13px] leading-[18px] text-muted";

/** The workshop's own confirm card (platforms.css dialog.dlg): a 440px card, a 16px title with an optional mark, one muted line, the buttons on the right. */
function DlgCard({
  open,
  title,
  mark,
  children,
  cancelLabel = "Cancel",
  confirmLabel,
  tone,
  focus = "confirm",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  mark?: ReactNode;
  children: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  tone: "primary" | "danger";
  focus?: "confirm" | "cancel";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const goRef = useRef<HTMLButtonElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      size="confirm"
      role="alertdialog"
      aria-label={title}
      initialFocus={focus === "confirm" ? goRef : noRef}
      className="w-[min(440px,calc(100vw-32px))] px-[22px] py-5"
    >
      <h2 aria-hidden className="m-0 flex items-center gap-2.5 text-base font-semibold leading-[22px]">{mark}{title}</h2>
      {children}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button ref={noRef} variant="secondary" onClick={onCancel} className="max-[640px]:h-11 max-[640px]:flex-auto">{cancelLabel}</Button>
        <Button ref={goRef} variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} className="max-[640px]:h-11 max-[640px]:flex-auto">{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export interface MemoryPageProps {
  state?: MemoryState;
  readOnly?: boolean;
  initialTab?: "topics" | "blocked" | "requests";
  /** Start on a topic's page (prototype key, e.g. "c:m5"). `true` opens the first custom company topic. */
  openTopic?: boolean | string;
  /** Start with Try it open. */
  tryOpen?: boolean;
  /** Start in this folder. */
  initialFolder?: "" | MemSrc;
  /** Phone: start on the sheet, not the folder list. */
  startDetail?: boolean;
  /** Start with the grid layout. */
  initialLayout?: "list" | "grid";
  /** Start with this search text. */
  initialQuery?: string;
  /** Start with this filter. */
  initialFilter?: Filter;
}

export function MemoryPage(props: MemoryPageProps) {
  const url = useMemo(params, []);
  const stateQ = url.get("state");
  const state: MemoryState = props.state ?? (["loading", "error", "empty", "full"].includes(stateQ ?? "") ? (stateQ as MemoryState) : "live");
  const readOnly = props.readOnly ?? url.get("as") === "arnel";
  const phone = useMatchMedia("(max-width: 640px)");
  const q0 = url.get("tab");
  const tab0 = props.initialTab ?? (q0 === "blocked" || q0 === "requests" ? q0 : "topics");
  const folder0 = (props.initialFolder ?? (MEM_SOURCES.includes(url.get("folder") as MemSrc) ? (url.get("folder") as MemSrc) : "")) as "" | MemSrc;
  const topicQ = url.get("topic");
  const docKey = typeof props.openTopic === "string" ? props.openTopic : props.openTopic ? "c:m5" : topicQ;
  const doc0 = docKey ? memTopics.find((t) => t.k === docKey && (!folder0 || t.src === folder0)) : undefined;

  const loading = state === "loading";
  const error = state === "error";
  const empty = state === "empty";
  const SRCS: MemSrc[] = empty ? ["company"] : MEM_SOURCES;

  const [tab, setTab] = useState<"topics" | "blocked" | "requests">(tab0);
  const [folder, setFolder] = useState<"" | MemSrc>(folder0);
  const [q, setQ] = useState(props.initialQuery ?? "");
  const [filter, setFilter] = useState<Filter>(props.initialFilter ?? "all");
  const [layout, setLayout] = useState<"list" | "grid">(() => {
    if (props.initialLayout) return props.initialLayout;
    try {
      const v = localStorage.getItem(LAYOUT_KEY);
      return v === "grid" ? "grid" : "list";
    } catch {
      return "list";
    }
  });
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(memTopics.map((t) => [keyOf(t), t.on])));
  const [reqOn, setReqOn] = useState<Record<string, boolean>>(() => Object.fromEntries(memRequests.map((r) => [`${r.src}|${r.key}`, r.on])));
  const [blocked, setBlocked] = useState<MemBlocked[]>(memBlocked);
  const [replies, setReplies] = useState(memReplies);
  const [custom, setCustom] = useState<Record<string, { title: string; text: string }>>({});
  const [added, setAdded] = useState<MemTopic[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [doc, setDoc] = useState<string | null>(doc0 ? keyOf(doc0) : null);
  const [dir, setDir] = useState<SubpageDirection>("in");
  const [phoneSheet, setPhoneSheet] = useState(!!props.startDetail || !!props.tryOpen || !!doc0 || tab0 !== "topics" || !!folder0);
  const [tryShown, setTryShown] = useState(props.tryOpen ?? url.get("tab") === "try");
  const [tryAbout, setTryAbout] = useState<string | undefined>();
  const [tryQ, setTryQ] = useState<string | undefined>();
  const [hover, setHover] = useState<string | null>(null);
  const [bulkAsk, setBulkAsk] = useState<{ src: MemSrc; how: "on" | "off" } | null>(null);
  const [delAsk, setDelAsk] = useState<MemTopic | null>(null);
  const [edit, setEdit] = useState<{ t: string; c: string; err?: string; errAt?: "t" | "c"; src?: MemSrc; pick?: boolean } | null>(doc0 && doc0.type === "custom" && !readOnly ? { t: doc0.title, c: doc0.text } : null);
  const [bulkSens, setBulkSens] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState<(() => void) | null>(null);
  const [refEdit, setRefEdit] = useState<{ src: MemSrc; v: string; err?: string } | null>(null);
  const [bqText, setBqText] = useState("");
  const [bqScope, setBqScope] = useState<MemSrc>("company");
  const [bqErr, setBqErr] = useState<string | null>(null);
  const [rmAsk, setRmAsk] = useState<MemBlocked | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const pushRef = useRef(false);
  const allTopicsRef = useRef<MemTopic[]>([]);
  // the topic's paragraph grows with its words (memory.js autoGrow), on every render, on resize and once fonts are ready
  const autoGrow = () => {
    const c = document.getElementById("docC");
    if (c) {
      c.style.height = "auto";
      c.style.height = `${c.scrollHeight + 2}px`;
    }
  };
  useLayoutEffect(autoGrow);
  useEffect(() => {
    window.addEventListener("resize", autoGrow);
    document.fonts?.ready.then(autoGrow);
    return () => window.removeEventListener("resize", autoGrow);
  }, []);
  const first = useRef(true);

  const hh: "h1" | "h2" = phone && phoneSheet ? "h1" : "h2";
  const canEdit = !readOnly;
  const inDoc = doc !== null;
  const allTopics: MemTopic[] = useMemo(
    () =>
      empty
        ? []
        : [...memTopics, ...(state === "full" ? [priceListTopic()] : []), ...added]
            .filter((t) => !removed.includes(keyOf(t)))
            .map((t) => (custom[keyOf(t)] ? { ...t, ...custom[keyOf(t)] } : t))
            .map((t) => ({ ...t, on: on[keyOf(t)] ?? t.on })),
    [empty, added, removed, custom, on],
  );
  allTopicsRef.current = allTopics;
  const topicsOf = (src: MemSrc | "") => (src ? allTopics.filter((t) => t.src === src) : allTopics);
  const onCount = (src: MemSrc | "") => topicsOf(src).filter((t) => t.on).length;
  const blockedAll = empty ? [] : blocked;
  const requestsAll: MemRequest[] = (empty ? [] : memRequests).map((r) => ({ ...r, on: reqOn[`${r.src}|${r.key}`] }));
  const used = allTopics.filter((t) => t.type === "custom").reduce((n, t) => n + t.title.length + t.text.length, 0);
  const left = MEM_CAP - used;
  const roomState: "ok" | "near" | "full" = used / MEM_CAP >= 1 ? "full" : used / MEM_CAP >= 0.85 ? "near" : "ok";
  // the bulk confirm (memory.js bulk): what would change, and the topics that start off and need their own tick
  const bulkTopics = bulkAsk ? allTopics.filter((t) => t.src === bulkAsk.src) : [];
  const bulkChange = bulkAsk ? bulkTopics.filter((t) => t.on !== (bulkAsk.how === "on")) : [];
  const bulkSensTopics = bulkAsk?.how === "on" ? bulkChange.filter((t) => t.sensitive) : [];
  const bulkPlain = bulkChange.filter((t) => !bulkSensTopics.includes(t));
  // a new topic is a page of its own until it is added (memory.js docHTML with k "new"): it is not in the list yet
  const isNew = doc === NEW_DOC;
  const draft: MemTopic = { src: edit?.src ?? "company", k: NEW_DOC, type: "custom", title: "", text: "", on: true, ask: "", qs: [], updated: "" };
  const curTopic = isNew ? draft : doc ? allTopics.find((t) => keyOf(t) === doc) : undefined;

  // fade a tab or folder switch: 120ms ease-out (shell: no slide for these), never under reduced motion
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = bodyRef.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || !el.animate) return;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: "ease-out" });
  }, [tab, folder]);

  // address: ?tab= ?folder= ?topic= follow the page (replace, the way the prototype does outside a topic page)
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      ["view", "tab", "folder", "topic"].forEach((k) => u.searchParams.delete(k));
      if (doc && curTopic) {
        u.searchParams.set("tab", "topics");
        u.searchParams.set("folder", curTopic.src);
        if (!isNew) u.searchParams.set("topic", curTopic.k);
      } else if (!phone || phoneSheet) {
        if (tab !== "topics" || folder || phone) u.searchParams.set("tab", tab);
        if (folder) u.searchParams.set("folder", folder);
      }
      if (pushRef.current) {
        pushRef.current = false;
        window.history.pushState({ mem: 1 }, "", u.toString());
      } else window.history.replaceState(window.history.state, "", u.toString());
    } catch {
      /* ignore */
    }
  }, [tab, folder, doc, curTopic, phone, phoneSheet, isNew]);

  // Back and Forward (memory.js popstate): the address says which tab, folder and topic page
  useEffect(() => {
    const onPop = () => {
      const u = new URL(window.location.href).searchParams;
      const t = u.get("tab");
      const f = u.get("folder");
      const k = u.get("topic");
      const nextFolder = (MEM_SOURCES.includes(f as MemSrc) ? f : "") as "" | MemSrc;
      const topic = k ? allTopicsRef.current.find((x) => x.k === k && (!nextFolder || x.src === nextFolder)) : undefined;
      setDir("out");
      setTab(t === "blocked" || t === "requests" ? t : "topics");
      setFolder(nextFolder);
      setDoc(topic ? keyOf(topic) : null);
      setEdit(topic && topic.type === "custom" && !readOnly ? { t: topic.title, c: topic.text } : null);
      setPhoneSheet(!!(t || f || k));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [readOnly]);

  const headline = loading
    ? null
    : error
    ? "Couldn't load what Leda knows."
    : !allTopics.length
    ? "Nothing for Leda to know yet."
    : (() => {
        const ons = allTopics.filter((t) => t.on);
        const offs = allTopics.filter((t) => !t.on);
        const room = roomState !== "ok" ? ` Memory is ${roomState === "full" ? "full" : "nearly full"}: ${num(Math.max(0, left))} characters left.` : "";
        const offsT =
          offs.length === 1
            ? ` ${offs[0].title} stays off.`
            : offs.length
            ? ` ${offs.length} stay off: ${offs.slice(0, 4).map((t) => t.title).join(", ")}${offs.length > 4 ? ` and ${offs.length - 4} more` : ""}.`
            : " Everything is on.";
        return `Customers' Leda can use ${ons.length} of ${allTopics.length} topics.${room || offsT}`;
      })();

  const shown = doc && curTopic ? curTopic.src : folder || null;
  const caption = loading ? (
    <span className="inline-block h-3 w-[150px] rounded-[3px] bg-skeleton align-middle" />
  ) : error ? (
    <span>No data</span>
  ) : empty ? (
    <span>
      <b className="font-semibold text-text">No platforms yet</b> · the company is the HQ plot
    </span>
  ) : shown ? (
    <span>
      <b className="font-semibold text-text">{srcName(shown)}</b> · {onCount(shown)} of {topicsOf(shown).length} topics on
    </span>
  ) : (
    <span>
      <b className="font-semibold text-text">2 platforms and the company</b> · pick one to see its topics
    </span>
  );

  // ----- moves -----
  const guardLeave = (go: () => void) => {
    if (edit && dirty) setLeaveAsk(() => go);
    else go();
  };
  const dirty = (() => {
    if (!edit || !curTopic) return false;
    if (doc === NEW_DOC) return !!(edit.t.trim() || edit.c.trim());
    return edit.t !== curTopic.title || edit.c !== curTopic.text;
  })();
  const pickFolder = (id: "" | MemSrc) => {
    guardLeave(() => {
      setQ("");
      setDoc(null);
      setEdit(null);
      setDir("out");
      if (phone) setTab("topics");
      setPhoneSheet(true);
      setFolder((f) => (!phone && f === id && id ? "" : id));
    });
  };
  const openDoc = (t: MemTopic) => {
    setDir("in");
    pushRef.current = true;
    setTab("topics");
    setDoc(keyOf(t));
    setPhoneSheet(true);
    setEdit(t.type === "custom" && canEdit ? { t: t.title, c: t.text } : null);
  };
  const closeDoc = () =>
    guardLeave(() => {
      // a topic page opened here sits on its own history entry: Back pops it, as memory.js does
      if (window.history.state?.mem) {
        window.history.back();
        return;
      }
      setDir("out");
      setDoc(null);
      setEdit(null);
    });
  // Esc (memory.js onEscape): leaves a topic page (a phone detail screen goes back to the folders), or clears the search. Dialogs, menus and text fields keep their own Esc.
  const escRef = useRef<() => void>(() => undefined);
  escRef.current = () => {
    if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')) return;
    const a = document.activeElement as HTMLInputElement | null;
    if (a && /INPUT|TEXTAREA/.test(a.tagName) && a.type !== "checkbox") return;
    if (doc) closeDoc();
    else if (phone && phoneSheet) setPhoneSheet(false);
    else if (q) {
      setQ("");
      document.getElementById("mq")?.focus();
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) escRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  // a new topic starts on its title (memory.js newDoc focus '#docT')
  useEffect(() => {
    if (!isNew) return undefined;
    const id = window.setTimeout(() => document.getElementById("docT")?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [isNew]);
  const goTab = (v: string) =>
    guardLeave(() => {
      setDoc(null);
      setEdit(null);
      setTab(v as typeof tab);
      setPhoneSheet(true);
    });
  const openTry = (about?: string, question?: string) => {
    setTryAbout(about);
    setTryQ(question);
    setTryShown(true);
  };
  const guard = () => {
    if (canEdit) return false;
    toast.info("Only owners, admins and managers can change what Leda knows.");
    return true;
  };
  const setTopic = (t: MemTopic, next: boolean) => {
    if (guard()) return;
    const k = keyOf(t);
    const prev = on[k] ?? t.on;
    setOn((o) => ({ ...o, [k]: next }));
    toast.undo(`${t.title} (${srcShort(t.src)}): ${next ? "customers' Leda can use it" : "off for customers"}.`, () => setOn((o) => ({ ...o, [k]: prev })));
  };
  const setRequest = (r: MemRequest, next: boolean) => {
    if (guard()) return;
    const k = `${r.src}|${r.key}`;
    setReqOn((o) => ({ ...o, [k]: next }));
    toast.undo(`${r.name} at ${srcShort(r.src)}: ${next ? "customers can ask for it" : "off"}.`, () => setReqOn((o) => ({ ...o, [k]: !next })));
  };

  // ----- Try it (answerOf in memory.js) -----
  const pvItems = (scope: string) => {
    const srcs = scope === "any" ? SRCS : [scope as MemSrc];
    const tag = (s: MemSrc) => (scope === "any" ? srcShort(s) : "");
    const out: { v: string; q: string; kind: "topic" | "req" | "blocked"; t?: MemTopic; r?: MemRequest; b?: MemBlocked; src: MemSrc; meta: string }[] = [];
    srcs.forEach((src) => {
      topicsOf(src).forEach((t) => out.push({ v: `${src}|t:${t.k}`, q: t.ask, kind: "topic", t, src, meta: tag(src) }));
      requestsAll.filter((r) => r.src === src).forEach((r) => out.push({ v: `${src}|r:${r.key}`, q: r.ask, kind: "req", r, src, meta: tag(src) }));
      blockedAll.filter((b) => b.src === src).forEach((b) => out.push({ v: `${src}|b:${b.id}`, q: b.q, kind: "blocked", b, src, meta: scope === "any" ? `Blocked · ${srcShort(src)}` : "Blocked" }));
    });
    if (scope !== "any" && scope !== "company") blockedAll.filter((b) => b.src === "company").forEach((b) => out.push({ v: `company|b:${b.id}`, q: b.q, kind: "blocked", b, src: "company", meta: "Blocked · every business" }));
    return out;
  };
  const tryAbouts = [
    { value: "any", label: "Any business" },
    { value: "company", label: "The company", icon: <Logo src="company" /> },
    { value: "autoworks", label: srcName("autoworks"), icon: <Logo src="autoworks" /> },
    { value: "stockroom", label: srcName("stockroom"), icon: <Logo src="stockroom" /> },
  ];
  const tryQuestions = ["any", "company", "autoworks", "stockroom"].flatMap((sc) =>
    pvItems(sc).map((i) => ({ value: `${sc}#${i.v}`, label: i.q, about: [sc], meta: i.meta })),
  );
  const askTry = (about: string, qv: string): TryItAnswer => {
    const it = pvItems(about).find((x) => `${about}#${x.v}` === qv) ?? pvItems(about)[0];
    const nm = srcShort(it.src);
    const coBlocked = blockedAll.some((b) => b.src === "company" && norm(b.q) === norm(it.q));
    const ownBlocked = it.src !== "company" && blockedAll.some((b) => b.src === it.src && norm(b.q) === norm(it.q));
    if (it.kind === "blocked" || coBlocked || ownBlocked) {
      const reply = it.src === "company" || (coBlocked && !ownBlocked) ? replies.company : replies[it.src];
      return { answer: reply, reason: `This is a blocked question ${coBlocked ? "for every business" : `for ${nm}`}, so Leda gives your reply.`, tone: "no" };
    }
    if (it.kind === "topic" && it.t) {
      const t = it.t;
      if (t.type === "data")
        return t.on
          ? { answer: t.yes ?? "", reason: `Used the topic “${t.title}”, from ${it.src === "company" ? "company" : nm} data.`, tone: "ok" }
          : { answer: t.no ?? "", reason: `“${t.title}” is off, so Leda can't answer this.`, tone: "no" };
      const off = it.src === "company" ? `I can't help with that here. Please call ${MEM_PHONE.company}.` : `I can't help with that here. Please call ${nm} at ${MEM_PHONE[it.src]}.`;
      const whyOff = t.staff && !t.on ? `“${t.title}” is for your team only, so customers' Leda doesn't use it.` : `“${t.title}” is off, so Leda can't answer this.`;
      return t.on
        ? { answer: sentences(t.text, 2), reason: `Used your topic “${t.title}” (${it.src === "company" ? "company" : nm}).`, tone: "ok" }
        : { answer: off, reason: whyOff, tone: "no" };
    }
    const r = it.r!;
    return r.on
      ? { answer: r.yes, reason: `“${r.name}” is on at ${nm}. The request goes to staff to accept.`, tone: "ok" }
      : { answer: r.no, reason: `“${r.name}” is off at ${nm}, so Leda doesn't take this request.`, tone: "no" };
  };

  // ----- the left column -----
  const folderRows: { id: "" | MemSrc; name: string; note: string }[] = [
    { id: "", name: "All topics", note: allTopics.length ? `${onCount("")} of ${allTopics.length} on` : "None yet" },
    ...SRCS.map((s) => ({ id: s as MemSrc, name: srcName(s), note: topicsOf(s).length ? `${onCount(s)} of ${topicsOf(s).length} on` : "None yet" })),
  ];
  const curFolder: "" | MemSrc | undefined = phone && !phoneSheet ? undefined : doc && curTopic ? curTopic.src : folder;
  const lrow = (on0: boolean) =>
    cn(
      "flex w-full items-center rounded-[6px] border px-3 py-[9px] text-left max-[640px]:min-h-11 max-[640px]:rounded-none max-[640px]:border-0 max-[640px]:px-4 max-[640px]:py-3 max-[640px]:[button+&]:mt-0.5 max-[640px]:[button+&]:border-t max-[640px]:[button+&]:border-rule max-[640px]:[div+div_&]:border-t max-[640px]:[div+div_&]:border-rule",
      on0 ? "border-border bg-surface" : "border-transparent hover:bg-frame-hover",
      focusRing,
    );
  const ghead = (b: string, span?: string, mt = false) => (
    <div className={cn("flex items-center gap-2 px-3 pb-1.5 pt-2 text-[12px] leading-5 text-muted max-[640px]:px-4 max-[640px]:pt-3", mt && "mt-2.5")}>
      <b className="text-[13px] font-semibold leading-5 text-text">{b}</b>
      {span ? <span className="ml-auto">{span}</span> : null}
    </div>
  );
  const tabRow = (id: "blocked" | "requests", words: string, icon: Icon) => {
    const I = icon;
    return (
      <button key={id} type="button" className={cn(lrow(false), "gap-1.5")} onClick={() => goTab(id)}>
        <I size={14} aria-hidden className="shrink-0 text-muted" />
        <span className="min-w-0 truncate text-[13px] font-medium leading-[18px]">{id === "blocked" ? "Blocked questions" : "Customer requests"}</span>
        <span className="ml-auto shrink-0 pl-2 text-[13px] leading-[18px] text-muted">{words}</span>
      </button>
    );
  };
  const placeBody = (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto pb-4">
      <div className="min-h-[220px] shrink-0 max-[640px]:min-h-0">
        <TownMap
          platforms={error ? [null, null, null, null] : empty ? [null, null, null, mapSlots[3]] : mapSlots}
          caption={caption}
          loading={loading}
          onAddPlatform={() => navGo({ to: "platforms", add: true })}
          hqLabel={() => `Company, ${onCount("company")} of ${topicsOf("company").length} topics on`}
          selected={shown ? BUILDING[shown] : null}
          highlight={hover ? [hover] : null}
          onSelect={(id) => (id ? pickFolder(mapOf(id) as MemSrc) : pickFolder(""))}
        />
      </div>
      <div className="px-3 pb-3 pr-1 pt-3 max-[640px]:px-4 max-[640px]:pt-4">
        <div className="flex items-center gap-2.5">
          {phone && phoneSheet ? null : <LedaMark size={20} decorative className="shrink-0" />}
          {phone && phoneSheet ? (
            <p className="m-0 text-[22px] font-semibold leading-7 tracking-[-0.01em]">Memory</p>
          ) : (
            <h1 className="m-0 text-[22px] font-semibold leading-7 tracking-[-0.01em]">Memory</h1>
          )}
        </div>
        <p className="m-0 mt-1.5 flex gap-2 text-[14px] leading-5">
          <LedaMark size={16} decorative className="mt-0.5 shrink-0" />
          {loading ? <span className="mt-[3px] block h-[13px] w-[88%] rounded-[3px] bg-skeleton" /> : <span>{headline}</span>}
        </p>
        {phone ? (
          <div className="mt-3">
            <AskLedaBar variant="overview" scope="memory" shortcuts={false} paused={tryShown} />
          </div>
        ) : null}
      </div>
      {loading ? (
        <>
          {ghead("Folders")}
          {[0, 1, 2, 3].map((i) => (
            <div key={i} aria-hidden="true" className={cn("flex items-center border border-transparent px-3 py-[9px] max-[640px]:min-h-11 max-[640px]:border-0 max-[640px]:px-4 max-[640px]:py-3", i > 0 && "mt-0.5 max-[640px]:border-t max-[640px]:border-rule")}>
              <span className="block h-[13px] w-[70%] rounded-[3px] bg-skeleton" />
            </div>
          ))}
        </>
      ) : error ? (
        <>
          {ghead("Folders")}
          <p className="mx-3 my-0 rounded-card border border-dashed border-control px-3 py-2.5 text-[13px] leading-[18px] text-muted max-[640px]:mx-4">No data. Try again in the main panel.</p>
        </>
      ) : (
        <>
          {ghead("Folders", "Where Leda's knowledge comes from")}
          <div role="list" aria-label="Folders" className="pb-1 max-[640px]:px-0">
            {folderRows.map((f) => (
              <div role="listitem" key={f.id || "all"} className={(f.id ? "mt-0.5" : "")}>
                <button
                  type="button"
                  aria-pressed={curFolder === f.id}
                  onClick={() => pickFolder(f.id)}
                  onMouseEnter={() => setHover(f.id ? BUILDING[f.id] : null)}
                  onMouseLeave={() => setHover(null)}
                  className={cn(lrow(curFolder === f.id), "gap-1.5")}
                >
                  {f.id ? <Logo src={f.id} /> : <Books size={14} aria-hidden className={cn("shrink-0", curFolder === f.id ? "text-accent" : "text-muted")} />}
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium leading-[18px]">{f.name}</span>
                  <span className="ml-auto shrink-0 pl-2 text-[13px] leading-[18px] text-muted">{f.note}</span>
                </button>
              </div>
            ))}
          </div>
          {phone ? (
            <>
              {ghead("Rules", "For customers", true)}
              {tabRow("blocked", String(blockedAll.length), Prohibit)}
              {requestsAll.length ? tabRow("requests", `${requestsAll.filter((r) => r.on).length} of ${requestsAll.length} on`, HandWaving) : null}
              <button type="button" className={cn(lrow(false), "gap-1.5")} onClick={() => openTry()}>
                <ChatCircle size={14} aria-hidden className="shrink-0 text-muted" />
                <span className="min-w-0 truncate text-[13px] font-medium leading-[18px]">Try it</span>
                <span className="ml-auto shrink-0 pl-2 text-[13px] leading-[18px] text-muted">Ask as a customer</span>
              </button>
            </>
          ) : null}
          {ghead("Memory room", "Topics you write", true)}
          <div className="mx-3 pt-1 text-[13px] leading-[18px] max-[640px]:mx-4">
            <div className="flex items-center gap-2.5 font-medium">
              <span className={cn("tabular-nums", roomState === "full" ? "text-bad" : roomState === "near" && "text-warn")}>
                {num(used)} of {num(MEM_CAP)} characters
              </span>
              <span aria-hidden="true" className="ml-auto h-1 w-24 shrink-0 overflow-hidden rounded-[2px] bg-frame-active">
                <i className={cn("block h-full", roomState === "full" ? "bg-bad-dot" : roomState === "near" ? "bg-warn-dot" : "bg-control")} style={{ width: `${Math.min(100, Math.round((used / MEM_CAP) * 100))}%` }} />
              </span>
            </div>
            <p className="m-0 mt-1 text-muted">
              {roomState === "full"
                ? "Memory is full. Shorten or delete topics before you add more."
                : roomState === "near"
                ? `${num(left)} left. Shorten or delete topics before you add long ones.`
                : `${num(left)} left. Topics from your platforms' data don't use any.`}
            </p>
          </div>
          <p className="m-0 mx-3 mt-2 text-[12px] leading-4 text-muted">Off means Leda never uses it for customers. Your team's own use of Leda follows their role on Team.</p>
        </>
      )}
    </div>
  );

  // ----- sheet parts -----
  const tryBtn =
    loading || error ? null : (
      <Button variant="secondary" leftIcon={ChatCircle} aria-haspopup="dialog" onClick={() => openTry(folder || undefined)} className="mr-4 min-[641px]:max-[1100px]:ml-auto min-[641px]:max-[1100px]:mr-0 max-[640px]:mr-3 max-[640px]:h-10">
        Try it
      </Button>
    );
  const actions = (
    <>
      {tryBtn}
      <AskLedaBar scope="memory" paused={tryShown} className="min-[641px]:max-[1100px]:ml-2" />
    </>
  );
  const sheetBar = inDoc ? (
    <SheetBar actions={actions} flatActions className="min-[641px]:max-[1100px]:[&>div:first-child]:!h-auto">
      <nav aria-label="You are here" className="flex min-w-0 items-center gap-2 text-[13px] leading-[18px] text-muted">
        <button type="button" title="Back to Memory (Esc)" onClick={closeDoc} className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[2px] font-medium text-muted hover:text-text", focusRing)}>
          <ArrowLeft size={14} aria-hidden />
          Memory
        </button>
        <span aria-hidden className="text-control">/</span>
        {curTopic ? (
          <button type="button" onClick={() => pickFolder(curTopic.src)} className={cn("-ml-1.5 inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control px-1.5 text-muted hover:bg-raised hover:text-text", focusRing)}>
            <Logo src={curTopic.src} size={14} />
            <span>{srcName(curTopic.src)}</span>
          </button>
        ) : null}
        <span aria-hidden className="text-control">/</span>
        <b className="inline-flex min-w-0 items-center gap-1.5 truncate font-medium text-text" aria-current="page"><span className="truncate">{curTopic?.title || (isNew ? "New topic" : "Topic")}</span></b>
      </nav>
    </SheetBar>
  ) : (
    <SheetBar actions={actions} flatActions>
      <button type="button" className="mr-3 inline-flex shrink-0 items-center gap-1 text-[14px] text-muted hover:text-text sm:hidden" onClick={() => setPhoneSheet(false)}>
        <ArrowLeft size={14} aria-hidden /> Memory
      </button>
      <div className="flex min-w-0 flex-1 items-stretch [&_[role=tab]]:text-[13px] [&_[role=tab]]:font-normal [&_[role=tab]_svg]:size-[14px]">
      <Tabs
        keepInView={false}
        variant={phone ? "chips" : "fixed"}
        aria-label="Memory"
        items={TABS.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
        value={tab}
        onValueChange={goTab}
      />
      </div>
    </SheetBar>
  );

  // Phone detail screens (the workshop's fixed .sbar): the way back, Try it and the Leda entry replace the frame's top bar; the tabs become icon-less chips under it.
  const phoneDetail = phone && (phoneSheet || inDoc);
  const phoneTop = phoneDetail ? (
    <>
      <button type="button" onClick={() => (inDoc ? closeDoc() : setPhoneSheet(false))} className={cn("-ml-3 inline-flex h-11 shrink-0 items-center gap-1 self-center rounded-control px-2 text-[14px] text-text", focusRing)}>
        <CaretLeft size={16} aria-hidden />
        <span>Memory</span>
      </button>
      <span className="flex-1" />
      {tryBtn}
      <AskLedaBar variant="bar" scope="memory" paused={tryShown} onOpen={() => openTry()} className="max-[640px]:[&_button]:!border-0 max-[640px]:[&_button]:!bg-transparent" />
    </>
  ) : undefined;
  const phoneChips =
    phone && phoneSheet && !inDoc ? (
      <div className="sticky top-0 z-[5] flex gap-1.5 overflow-x-auto border-b border-rule bg-surface px-4 py-2 [scrollbar-width:none]">
        <Tabs
          variant="chips"
          aria-label="Memory"
          items={TABS.map((t) => ({ value: t.value, label: t.label }))}
          value={tab}
          onValueChange={goTab}
          className="[&_[role=tablist]]:gap-1.5 [&_[role=tablist]]:py-0 [&_[role=tab]]:!h-9 [&_[role=tab]]:!rounded-[18px] [&_[role=tab]]:!bg-transparent [&_[role=tab]]:text-[13px] [&_[role=tab]]:font-normal [&_[role=tab]]:text-text [&_[role=tab][data-state=active]]:!border-accent [&_[role=tab][data-state=active]]:!text-accent"
        />
      </div>
    ) : null;

  const bizFilter = (
    <div className="w-[216px] min-w-0 shrink-0 max-[640px]:w-auto max-[640px]:flex-1 max-[640px]:basis-full [&_[role=combobox]]:pl-2.5 [&_[role=combobox]]:pr-2 [&_[role=combobox]]:text-[13px]">
      <Select
        size="sm"
        aria-label={`Business: ${folder ? srcName(folder) : "All businesses"}`}
        options={[
          { value: "", label: "All businesses", icon: <Books size={14} aria-hidden /> },
          ...SRCS.map((s) => ({ value: s, label: srcName(s), icon: <Logo src={s} size={14} /> })),
        ]}
        value={folder}
        onValueChange={(v) => pickFolder(v as "" | MemSrc)}
        className="w-full min-w-0"
      />
    </div>
  );
  const roNote = readOnly ? (
    <p className={roNoteClass}>
      <LockSimple size={15} aria-hidden className="mt-px shrink-0" />
      <span>You can see what customers' Leda knows. Only owners, admins and managers can change it.</span>
    </p>
  ) : null;

  const hit = (ts: MemTopic[]) => {
    if (!q) return ts;
    const s = q.toLowerCase();
    return ts.filter((t) => t.title.toLowerCase().includes(s) || t.text.toLowerCase().includes(s));
  };
  const passes = (t: MemTopic, k: Filter) => k === "all" || (k === "on" ? t.on : k === "off" ? !t.on : k === "custom" ? t.type === "custom" : t.type === "data");
  const mark = (s: string): ReactNode => {
    if (!q) return s;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return s.split(re).map((p, i) => (i % 2 ? <mark key={i} className="rounded-[2px] bg-warn-bg px-px text-inherit">{p}</mark> : p));
  };
  const srcLabel = (t: MemTopic) =>
    t.type === "data" ? (
      <>
        <Database size={14} aria-hidden className="shrink-0" />
        <span className="min-w-0 truncate">From {t.src === "company" ? "company" : srcShort(t.src)} data</span>
      </>
    ) : (
      <>
        <PencilSimpleLine size={14} aria-hidden className="shrink-0" />
        <span>Custom</span>
      </>
    );
  const miniSw = (t: MemTopic) => (
    <span className="flex items-center justify-self-end gap-2 max-[640px]:min-h-11">
      <Switch look="workshop" aria-label={`${t.title}: customers' Leda can use it`} checked={t.on} disabled={readOnly} onCheckedChange={(v) => setTopic(t, v)} />
      <span aria-hidden className="min-w-[22px] text-[13px] leading-[18px] text-muted">{t.on ? "On" : "Off"}</span>
    </span>
  );
  const lockIc = (t: MemTopic) =>
    t.sensitive ? (
      <span className="inline-flex shrink-0 text-warn" title={`Off by default. ${t.sensitive}`}>
        <LockSimple size={13} aria-hidden />
        <span className={sr}>, off by default</span>
      </span>
    ) : null;

  const docHref = (t: MemTopic) => `?tab=topics&folder=${t.src}&topic=${encodeURIComponent(t.k)}`;
  const nw = canEdit ? (
    <Button leftIcon={Plus} disabled={roomState === "full"} title={roomState === "full" ? "Memory is full" : undefined} onClick={() => newTopic()} className="max-[640px]:h-11">
      New topic
    </Button>
  ) : null;
  const newTopic = (src0?: MemSrc) => {
    setDir("in");
    pushRef.current = true;
    setTab("topics");
    setPhoneSheet(true);
    setDoc(NEW_DOC);
    setEdit({ t: "", c: "", src: src0 ?? ((folder || "company") as MemSrc), pick: !src0 && !folder });
  };

  const libraryBody = (() => {
    const f = folder;
    const ts = topicsOf(f);
    const onN = ts.filter((t) => t.on).length;
    const base = hit(q ? allTopics : ts);
    const list = base.filter((t) => passes(t, filter));
    const withF = !f || !!q;
    const all = ts.length > 0 && onN === ts.length;
    const bulk = f && canEdit && ts.length ? (
      <Button variant="secondary" leftIcon={all ? ToggleLeft : ToggleRight} onClick={() => { setBulkSens(false); setBulkAsk({ src: f, how: all ? "off" : "on" }); }} className="max-[640px]:h-11">
        {all ? "Turn all off" : "Turn all on"}
      </Button>
    ) : null;
    const sub = `${ts.length ? `${onN} of ${ts.length} on` : "No topics yet"} · ${f ? (f === "company" ? "Leda uses these for every business" : MEM_KIND[f]) : plural(SRCS.length, "folder")}`;
    const title = f ? (
      <span className="inline-flex items-center gap-2.5 max-[640px]:mb-[0.5px]">
        <Logo src={f} size={24} />
        <span>{srcName(f)}</span>
      </span>
    ) : (
      "All topics"
    );
    const cnt = Object.fromEntries(FILTERS.map(([k]) => [k, base.filter((t) => passes(t, k)).length])) as Record<Filter, number>;
    const fname = f ? srcName(f) : "any folder";
    let res: ReactNode;
    if (!ts.length && !q)
      res = (
        <EmptyBox icon={FolderOpen} title={`No topics in ${fname} yet`}>
          {f === "company" ? "Write what every business should be able to answer, like payment options or holiday hours." : "Write what customers often ask, like the warranty or where to park."}
          {nw ? <div className="mt-3 flex gap-2">{nw}</div> : null}
        </EmptyBox>
      );
    else if (!list.length && q)
      res = (
        <EmptyBox icon={MagnifyingGlass} title={`No topics match “${q}”${filter !== "all" ? ` in ${FWORD[filter]}` : ""}`}>
          Search looks at the titles and paragraphs in every folder. Try a shorter word, or write it as a new topic.
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" leftIcon={X} onClick={() => setQ("")}>Clear search</Button>
            {filter !== "all" ? <Button variant="text" onClick={() => setFilter("all")}>Show all</Button> : null}
          </div>
        </EmptyBox>
      );
    else if (!list.length)
      res = (
        <EmptyBox icon={Funnel} title={filter === "on" ? `Nothing is on in ${fname}` : filter === "off" ? `Nothing is off in ${fname}` : filter === "custom" ? `No custom topics in ${fname}` : `No topics from data in ${fname}`}>
          {filter === "off" ? "Customers' Leda can use every topic here." : filter === "on" ? "Customers' Leda answers nothing from here." : filter === "custom" ? "Topics you write show here." : "Topics written from a platform's data show here."}
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setFilter("all")}>Show all</Button>
            {filter === "custom" && canEdit ? <Button variant="text" leftIcon={Plus} onClick={() => newTopic()}>New topic</Button> : null}
          </div>
        </EmptyBox>
      );
    else if (layout === "grid")
      res = (
        <ul className="m-0 mt-4 grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-0 max-[640px]:grid-cols-1">
          {list.map((t) => (
            <li key={keyOf(t)} onMouseEnter={() => setHover(BUILDING[t.src])} onMouseLeave={() => setHover(null)} className="flex min-h-[176px] min-w-0 flex-col rounded-card bg-raised transition-colors hover:bg-raised-2 max-[640px]:min-h-0">
              <a href={docHref(t)} onClick={(e) => { e.preventDefault(); openDoc(t); }} className={cn("flex min-w-0 flex-1 flex-col gap-1.5 rounded-t-card px-3.5 pb-2.5 pt-3.5 text-text", focusRing)}>
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] leading-4 text-muted">{srcLabel(t)}</span>
                <span className={cn("flex min-w-0 items-center gap-1.5 text-[14px] font-medium leading-5", !t.on && "text-muted")}>
                  <span className="min-w-0 truncate">{mark(t.title)}</span>
                  {lockIc(t)}
                </span>
                <span className="line-clamp-3 overflow-hidden text-[13px] leading-[19px] text-muted">{mark(t.text)}</span>
              </a>
              <div className="flex min-w-0 items-center gap-2 px-3.5 pb-3 pt-2">
                {withF ? (
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] leading-[18px] text-muted">
                    <Logo src={t.src} size={14} />
                    <span className="truncate">{srcShort(t.src)}</span>
                  </span>
                ) : null}
                <span className="ml-auto">{miniSw(t)}</span>
              </div>
            </li>
          ))}
        </ul>
      );
    else {
      const cols = withF ? "grid-cols-[minmax(0,1fr)_120px_156px_80px] @max-[760px]/sheet:grid-cols-[minmax(0,1fr)_140px_80px]" : "grid-cols-[minmax(0,1fr)_156px_80px]";
      res = (
        <div className="mt-4">
          <div aria-hidden className={cn("grid items-center gap-x-6 border-b border-border px-2 pb-2 text-[12px] leading-4 text-muted max-[640px]:hidden", cols)}>
            <span>Topic</span>
            {withF ? <span>Folder</span> : null}
            <span className={withF ? "@max-[760px]/sheet:hidden" : ""}>Source</span>
            <span className="justify-self-end">For customers</span>
          </div>
          <ul className="m-0 list-none p-0">
            {list.map((t) => (
              <li
                key={keyOf(t)}
                onMouseEnter={() => setHover(BUILDING[t.src])}
                onMouseLeave={() => setHover(null)}
                className={cn("grid items-center gap-x-6 border-b border-rule px-2 py-3 transition-colors hover:bg-raised max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-y-2 max-[640px]:px-0 max-[640px]:py-3.5 max-[640px]:hover:bg-transparent", cols)}
              >
                <a href={docHref(t)} onClick={(e) => { e.preventDefault(); openDoc(t); }} className={cn("group block min-w-0 rounded-[2px] text-text max-[640px]:col-span-full", focusRing)}>
                  <span className={cn("flex min-w-0 items-center gap-1.5 text-[14px] font-medium leading-5", !t.on && "text-muted")}>
                    <span className="min-w-0 truncate group-hover:underline group-hover:underline-offset-[3px]">{mark(t.title)}</span>
                    {lockIc(t)}
                  </span>
                  <span className="mt-0.5 line-clamp-2 overflow-hidden text-[13px] leading-[19px] text-muted">{mark(t.text)}</span>
                </a>
                <span className="contents max-[640px]:flex max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-center max-[640px]:gap-x-3 max-[640px]:gap-y-1 @max-[760px]/sheet:flex @max-[760px]/sheet:flex-col @max-[760px]/sheet:items-start @max-[760px]/sheet:gap-0.5">
                  {withF ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] leading-[18px] text-muted">
                      <Logo src={t.src} size={14} />
                      <span className="min-w-0 truncate">{srcShort(t.src)}</span>
                    </span>
                  ) : null}
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] leading-[18px] text-muted">{srcLabel(t)}</span>
                </span>
                {miniSw(t)}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <>
        <nav aria-label="Folder" className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[18px]">
          <a href="#memory" onClick={(e) => { e.preventDefault(); pickFolder(""); }} className={cn(crumbLink, "max-[640px]:min-h-11")}>Memory</a>
          <span aria-hidden className="text-control">/</span>
          <b className="inline-flex items-center gap-1.5 font-medium text-text">
            {f ? <Logo src={f} size={14} /> : null}
            <span>{f ? srcName(f) : "All topics"}</span>
          </b>
        </nav>
        <Head h={hh} title={title} sub={sub} extra={<div className="ml-auto flex shrink-0 gap-2 max-[640px]:ml-0 max-[640px]:flex-[1_1_100%]">{bulk}{nw}</div>} />
        {roNote}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2.5 max-[640px]:mt-4">
          <div className="relative min-w-0 flex-[1_1_260px]">
            <label htmlFor="mq" className={sr}>Search every folder</label>
            <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="mq"
              type="search"
              autoComplete="off"
              placeholder="Search every folder, like “warranty” or “GCash”"
              value={q}
              onChange={(e) => setQ(e.target.value.trimStart())}
              className={cn("block h-9 w-full rounded-[5px] border border-control bg-surface pl-9 pr-3 text-[14px] text-text placeholder:text-muted max-[640px]:h-11 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent")}
            />
          </div>
          <div className="flex min-w-0 items-center gap-3 max-[640px]:flex-[1_1_100%] max-[640px]:flex-wrap max-[640px]:gap-2">
            {bizFilter}
            {phone ? (
              <div className="min-w-0 flex-1 [&_[role=combobox]]:pl-2.5 [&_[role=combobox]]:pr-2 [&_[role=combobox]]:text-[13px]">
                <Select
                  size="sm"
                  aria-label={`Show: ${FILTERS.find(([k]) => k === filter)![0] === "all" ? "Show all" : FILTERS.find(([k]) => k === filter)![1]}`}
                  options={FILTERS.map(([k, l]) => ({ value: k, label: k === "all" ? "Show all" : l, meta: String(cnt[k]) }))}
                  value={filter}
                  onValueChange={(v) => setFilter(v as Filter)}
                  className="w-full min-w-0"
                />
              </div>
            ) : (
              <Seg label="Show">
                {FILTERS.map(([k, l]) => (
                  <SegBtn key={k} pressed={filter === k} onClick={() => setFilter(k)} className="px-2.5">
                    {l}
                    <span className="ml-1.5 text-[12px] font-normal text-muted">{cnt[k]}</span>
                  </SegBtn>
                ))}
              </Seg>
            )}
            <Seg label="View as">
              {(
                [
                  ["list", "List", ListBullets],
                  ["grid", "Grid", SquaresFour],
                ] as const
              ).map(([k, l, I]) => (
                <SegBtn
                  key={k}
                  pressed={layout === k}
                  label={l}
                  onClick={() => {
                    setLayout(k);
                    try {
                      localStorage.setItem(LAYOUT_KEY, k);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="w-8 justify-center max-[640px]:w-10"
                >
                  <I size={16} aria-hidden />
                </SegBtn>
              ))}
            </Seg>
          </div>
        </div>
        {q && list.length ? (
          <p aria-live="polite" className="m-0 mt-3 flex items-center gap-2 text-[13px] leading-[18px] text-muted">
            {plural(list.length, "topic")} match “{q}”{f ? ", in every folder" : ""}.
            <Button variant="text" onClick={() => setQ("")} className="!h-7 !border-0 !px-1.5 !text-[13px]">Clear</Button>
          </p>
        ) : null}
        <div id="lbres">{res}</div>
      </>
    );
  })();


  const renderPanel = () => {
    if (loading)
      return (
        <>
          <div className="mb-2.5 flex h-3"><span className="block h-3 w-[140px] rounded-[3px] bg-skeleton" /></div>
          <Head h={hh} title="All topics" sub={<span className="inline-block h-[13px] w-[220px] rounded-[3px] bg-skeleton align-middle" />} />
          <div className="mt-5"><span className="block h-10 w-full rounded-[3px] bg-skeleton" /></div>
          <div className="mt-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_156px_80px] items-center gap-x-6 border-b border-rule px-2 py-3">
                <span className="block"><span className="block h-3.5 w-2/5 rounded-[3px] bg-skeleton" /><span className="mt-2 block h-3 w-[85%] rounded-[3px] bg-skeleton" /></span>
                <span className="block h-3 w-[90px] rounded-[3px] bg-skeleton" />
                <span className="block h-5 w-10 rounded-[3px] bg-skeleton" />
              </div>
            ))}
          </div>
        </>
      );
    if (error)
      return (
        <>
          <Head h={hh} title="What customers' Leda knows" />
          <div role="alert" className="mt-5 flex items-center gap-2.5 rounded-card border border-dashed border-control px-3.5 py-3 text-[14px] leading-5">
            <WarningCircle size={18} aria-hidden className="shrink-0 text-bad" />
            <span className="min-w-0 flex-1">Couldn't load what Leda knows. Customers' Leda keeps using the last saved switches.</span>
            <Button variant="secondary" onClick={() => toast.info("Memory loaded.")}>Try again</Button>
          </div>
        </>
      );
    if (tab === "blocked") return blockedPanel;
    if (tab === "requests") return requestsPanel;
    if (!allTopics.length)
      return (
        <>
          <Head h={hh} title="All topics" sub="Nothing yet" />
          <div className="mt-5 rounded-card bg-raised px-5 pb-5 pt-[18px]">
            <h3 className="m-0 text-base font-semibold leading-[22px]">Nothing for Leda to know yet</h3>
            <p className="m-0 mt-0.5 text-[14px] leading-5 text-muted">Add a platform and its data becomes topics Leda can answer from, like services and prices or opening hours. You can also write your own: payment options, warranty, how to find you.</p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {canEdit ? <Button leftIcon={Plus} onClick={() => newTopic("company")}>Add a company topic</Button> : null}
              <Button variant="secondary" leftIcon={PlusSquare} onClick={() => navGo({ to: "platforms", add: true })}>Add a platform</Button>
            </div>
          </div>
        </>
      );
    return libraryBody;
  };

  // ----- blocked questions -----
  const blockedPanel = (() => {
    const f = folder;
    const list = f ? blockedAll.filter((b) => b.src === f) : blockedAll;
    const inherited = f && f !== "company" ? blockedAll.filter((b) => b.src === "company") : [];
    const srcs = f ? [f] : SRCS;
    const sub = `${plural(list.length, "question")} · ${f ? (f === "company" ? "for every business" : `at ${srcShort(f)}`) : "for the company and each platform"}`;
    const addBlocked = () => {
      const v = bqText.trim().replace(/^["“]|["”]$/g, "");
      const src = f || bqScope;
      if (!v) return setBqErr("Type the question as a customer would ask it.");
      const dup = blockedAll.find((b) => norm(b.q) === norm(v) && (b.src === src || b.src === "company"));
      if (dup) return setBqErr(`That question is already blocked${dup.src === "company" ? " for every business" : ` at ${srcShort(dup.src)}`}.`);
      const item = { src, id: `n${Date.now()}`, q: /[?]$/.test(v) ? v : `${v}?` };
      setBlocked((x) => [...x, item]);
      setBqText("");
      setBqErr(null);
      toast.undo(`Blocked ${src === "company" ? "for every business" : `at ${srcShort(src)}`}.`, () => setBlocked((x) => x.filter((y) => y.id !== item.id)));
    };
    return (
      <>
        <Head h={hh} title="Blocked questions" sub={sub} />
        {roNote}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2.5">{bizFilter}</div>
        <div className="mt-4 max-w-[720px]">
          <p className="m-0 text-[13px] leading-[18px] text-muted">Leda won't answer these, even when a topic could. It gives your reply instead.</p>
          <div>
            {srcs.map((src, si) => {
              const label = src === "company" ? (f ? "Leda replies" : "Leda replies, for the company and every business") : `At ${srcShort(src)}, Leda replies`;
              return refEdit?.src === src ? (
                <div key={src} className={cn("rounded-card bg-raised px-4 pb-4 pt-3.5", si ? "mt-2" : "mt-4")}>
                  <label htmlFor="refT" className="block text-[14px] font-medium leading-5">{src === "company" ? "Leda's reply for the company and every business" : `Leda's reply at ${srcShort(src)}`}</label>
                  <textarea id="refT" autoFocus maxLength={400} rows={2} value={refEdit.v} onChange={(e) => setRefEdit({ src, v: e.target.value })} aria-invalid={refEdit.err ? true : undefined} className="mt-2 block min-h-[84px] w-full resize-y rounded-control border border-control bg-surface px-3 py-2 text-[14px] leading-5 text-text focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[1px] focus-visible:outline-accent" />
                  {refEdit.err ? <p className="m-0 mt-1.5 text-[12px] leading-4 text-bad">{refEdit.err}</p> : <p className="m-0 mt-1.5 text-[12px] leading-4 text-muted">Keep it polite and short. Customers see it as Leda's answer.</p>}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button onClick={() => {
                      if (!refEdit.v.trim()) return setRefEdit({ ...refEdit, err: "Write the reply Leda should give." });
                      setReplies((r) => ({ ...r, [src]: refEdit.v.trim() }));
                      setRefEdit(null);
                      toast.undo(src === "company" ? "Reply saved, for the company and every business." : `Reply saved for ${srcShort(src)}.`, () => setReplies(memReplies));
                    }}>Save reply</Button>
                    <Button variant="text" onClick={() => setRefEdit(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div key={src} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-card bg-raised px-4 py-3", si ? "mt-2" : "mt-4")}>
                  <span className="col-span-full text-[12px] leading-4 text-muted">{label}</span>
                  <p className="m-0 text-[13px] leading-5">“{replies[src]}”</p>
                  {canEdit ? <Button variant="text" className="!h-[30px] !border-0 !px-2 !leading-5 max-[640px]:!h-11" leftIcon={PencilSimple} onClick={() => setRefEdit({ src, v: replies[src] })}>Edit reply</Button> : null}
                </div>
              );
            })}
          </div>
          {list.length ? (
            <ul className="m-0 mt-2 list-none p-0">
              {list.map((b) => (
                <li key={`${b.src}|${b.id}`} onMouseEnter={() => setHover(BUILDING[b.src])} onMouseLeave={() => setHover(null)} className="flex items-center gap-1 border-t border-rule py-4 first:border-t-0 max-[640px]:flex-wrap">
                  <span className="min-w-0 flex-1 text-[14px] leading-5 max-[640px]:basis-full">“{b.q}”</span>
                  {f ? null : (
                    <span className="mr-1 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] leading-4 text-muted"><Logo src={b.src} size={14} />{b.src === "company" ? "Every business" : srcShort(b.src)}</span>
                  )}
                  <Button variant="text" className="!h-[30px] !border-0 !px-2 !leading-5 !text-[13px] !text-muted hover:!bg-raised hover:!text-text max-[640px]:!h-11" aria-label={`Try it: ${b.q}`} onClick={() => openTry(undefined, `any#${b.src}|b:${b.id}`)}>Try</Button>
                  {canEdit ? <Button variant="text" className="!h-[30px] !border-0 !px-2 !leading-5 !text-[13px] !text-muted hover:!bg-raised hover:!text-bad max-[640px]:!h-11" aria-label={`Remove blocked question: ${b.q}`} onClick={() => setRmAsk(b)}>Remove</Button> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 mt-3 text-[14px] leading-5 text-muted">No blocked questions. Leda answers anything its topics cover.</p>
          )}
          {inherited.length ? (
            <p className="m-0 mt-3 flex gap-1.5 text-[13px] leading-[18px] text-muted"><Buildings size={14} aria-hidden className="mt-0.5 shrink-0" /><span>Also blocked here, for every business: {andList(inherited.map((b) => `“${b.q}”`))}.</span></p>
          ) : null}
          {canEdit ? (
            <div className="mt-4 flex flex-wrap items-start gap-2">
              <div className="min-w-0 flex-[1_1_260px]">
                <label htmlFor="bqNew" className={sr}>A question to block</label>
                <input id="bqNew" maxLength={160} value={bqText} onChange={(e) => { setBqText(e.target.value); setBqErr(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBlocked(); } }} placeholder="A question to block, like “Who is your parts supplier?”" autoComplete="off" aria-invalid={bqErr ? true : undefined} aria-describedby={bqErr ? "bqE" : undefined} className={cn("block h-10 w-full rounded-control border bg-surface px-3 text-[14px] placeholder:text-muted", bqErr ? "border-bad" : "border-control", focusRing)} />
                {bqErr ? <p id="bqE" className="m-0 mt-1 text-[13px] leading-[18px] text-bad">{bqErr}</p> : null}
              </div>
              {f ? null : (
                <div className="basis-[196px] max-[640px]:basis-full">
                  <Select aria-label={`Blocked for: ${bqScope === "company" ? "Every business" : `${srcName(bqScope)} only`}`} options={[{ value: "company", label: "Every business" }, ...(["autoworks", "stockroom"] as MemSrc[]).map((s) => ({ value: s, label: `${srcName(s)} only` }))]} value={bqScope} onValueChange={(v) => setBqScope(v as MemSrc)} className="w-full min-w-0" />
                </div>
              )}
              <Button variant="secondary" leftIcon={Prohibit} onClick={addBlocked} className="h-10">Block question</Button>
            </div>
          ) : null}
        </div>
      </>
    );
  })();

  // ----- customer requests -----
  const requestsPanel = (() => {
    const f = folder;
    const rq = f ? (f === "company" ? [] : requestsAll.filter((r) => r.src === f)) : requestsAll;
    const ps = (f ? [f] : (["autoworks", "stockroom"] as MemSrc[])).filter((p) => p !== "company");
    const sub = rq.length ? `${rq.filter((r) => r.on).length} of ${rq.length} on · ${f ? srcShort(f) : "grouped by platform"}` : "None yet";
    return (
      <>
        <Head h={hh} title="Customer requests" sub={sub} />
        {roNote}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2.5">{bizFilter}</div>
        <div className="mt-4 max-w-[720px]">
          {f === "company" ? (
            <p className="m-0 text-[14px] leading-5 text-muted">Requests are made at a platform, like booking a service, so the company has none. Pick a platform, or All businesses.</p>
          ) : !rq.length ? (
            <p className="m-0 text-[14px] leading-5 text-muted">None of your platforms takes requests yet.</p>
          ) : (
            <>
              <p className="m-0 text-[13px] leading-[18px] text-muted">Each request goes to staff to accept. Leda never accepts one on its own. Switches save as you change them.</p>
              {ps.map((pid, gi) => {
                const x = requestsAll.filter((r) => r.src === pid);
                if (!x.length) return null;
                return (
                  <section key={pid} aria-label={srcName(pid)} onMouseEnter={() => setHover(BUILDING[pid])} onMouseLeave={() => setHover(null)}>
                    {f ? null : (
                      <div className={cn("flex items-center gap-2", gi ? "mt-5" : "mt-6")}>
                        <h2 className="m-0 inline-flex items-center gap-2 text-[13px] font-semibold leading-5"><Logo src={pid} size={16} />{srcName(pid)}</h2>
                        <span className="ml-auto text-[12px] text-muted">{x.filter((r) => r.on).length} of {x.length} on</span>
                      </div>
                    )}
                    <ul className="m-0 mt-2 list-none p-0">
                      {x.map((r) => (
                        <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 border-t border-rule py-4 first:border-t-0 @max-[520px]/sheet:grid-cols-1">
                          <b className={cn("col-start-1 row-start-1 self-center text-[14px] font-medium leading-5", !r.on && "text-muted")}>{r.name}</b>
                          <p className={cn("m-0 col-span-full mt-1 max-w-[640px] justify-self-start text-[13px] leading-5", r.on ? "text-text" : "text-muted")}>{r.about}</p>
                          <button type="button" aria-label={`Try it: ${r.ask}`} onClick={() => openTry(undefined, `any#${r.src}|r:${r.key}`)} className={cn("col-span-full mt-2 -ml-2 inline-flex min-h-[26px] max-w-full items-center gap-1.5 justify-self-start rounded-chip px-2 py-0.5 text-left text-[12px] leading-[18px] text-muted hover:bg-raised hover:text-text max-[640px]:min-h-9", focusRing)}>
                            <ChatCircle size={14} aria-hidden className="shrink-0" />
                            <span className="[overflow-wrap:anywhere]">Try “{r.ask}”</span>
                          </button>
                          <span className="col-start-2 row-start-1 flex items-start gap-3 @max-[520px]/sheet:col-start-1 @max-[520px]/sheet:row-start-2 @max-[520px]/sheet:mb-1 @max-[520px]/sheet:mt-2">
                            <Switch look="workshop" aria-label={`Can request: ${r.name}, ${srcName(r.src)}`} checked={r.on} disabled={readOnly} onCheckedChange={(v) => setRequest(r, v)} />
                            <span aria-hidden className={cn("min-w-[184px] text-[13px] leading-5 @max-[520px]/sheet:min-w-0", !r.on && "text-muted")}>Can request</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </>
    );
  })();

  // ----- a topic's page -----
  const docBody = (() => {
    const t = curTopic;
    if (!t)
      return (
        <EmptyBox icon={FileX} title="This topic is gone">
          It was deleted, or the link is old.
          <div className="mt-3 flex gap-2"><Button variant="secondary" leftIcon={ArrowLeft} onClick={closeDoc}>Back to Memory</Button></div>
        </EmptyBox>
      );
    const nw = isNew;
    const ed = !!edit && t.type === "custom";
    const room = Math.max(0, left);
    const qs = nw ? [] : [t.ask, ...t.qs].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 3);
    const save = () => {
      if (!edit) return;
      const ti = edit.t.trim();
      const c = edit.c.trim();
      if (!ti) return setEdit({ ...edit, err: "A title is needed.", errAt: "t" });
      if (!c) return setEdit({ ...edit, err: "Write what Leda should know about it.", errAt: "c" });
      if (allTopics.some((x) => x.title.toLowerCase() === ti.toLowerCase() && (nw || keyOf(x) !== keyOf(t)))) return setEdit({ ...edit, err: "A topic with this title already exists in memory. Titles are unique across the company.", errAt: "t" });
      const used2 = used - (nw ? 0 : t.title.length + t.text.length);
      if (used2 + ti.length + c.length > MEM_CAP) return setEdit({ ...edit, err: `The memory is full: this needs ${num(used2 + ti.length + c.length - MEM_CAP)} more characters. Shorten it, or delete other topics first.`, errAt: "c" });
      if (nw) {
        const id = `m${Date.now()}`;
        const added1: MemTopic = { src: edit.src ?? "company", k: `c:${id}`, type: "custom", title: ti, text: c, on: true, ask: `What should I know about ${lower(ti)}?`, qs: [], updated: "Thu 22 Oct" };
        setAdded((a) => [...a, added1]);
        setOn((o) => ({ ...o, [keyOf(added1)]: true }));
        setDoc(keyOf(added1));
        setEdit({ t: ti, c });
        toast.undo(`Topic added: ${ti}.`, () => {
          setAdded((a) => a.filter((x) => x.k !== added1.k));
          setDoc(null);
          setEdit(null);
        });
        return;
      }
      const prev = custom[keyOf(t)];
      setCustom((m) => ({ ...m, [keyOf(t)]: { title: ti, text: c } }));
      setEdit({ t: ti, c });
      toast.undo(`Topic saved: ${ti}.`, () => {
        setCustom((m) => {
          const n = { ...m };
          if (prev) n[keyOf(t)] = prev;
          else delete n[keyOf(t)];
          return n;
        });
        setEdit({ t: prev?.title ?? t.title, c: prev?.text ?? t.text });
      });
    };
    const discard = () => {
      if (nw) {
        setEdit(null);
        if (window.history.state?.mem) window.history.back();
        else {
          setDir("out");
          setDoc(null);
        }
        return;
      }
      setEdit({ t: t.title, c: t.text });
    };
    return (
      <article aria-labelledby="docH" className="max-w-[680px]">
        <nav aria-label="Folder" className="-mt-3 mb-1 hidden items-center gap-2 text-[13px] max-[640px]:flex">
          <a href="#memory" onClick={(e) => { e.preventDefault(); closeDoc(); }} className={cn(crumbLink, "min-h-11")}>Memory</a>
          <span aria-hidden className="text-control">/</span>
          <a href="#folder" onClick={(e) => { e.preventDefault(); pickFolder(t.src); }} className={cn(crumbLink, "min-h-11")}><Logo src={t.src} size={14} /><span>{srcName(t.src)}</span></a>
        </nav>
        <p className="m-0 flex items-center gap-1.5 text-[13px] leading-[18px] text-muted">
          {nw ? (
            <>
              <PencilSimpleLine size={14} aria-hidden className="shrink-0" />
              <span>Custom · new topic</span>
            </>
          ) : (
            srcLabel(t)
          )}
        </p>
        {nw && edit?.pick ? (
          <div className="mt-3 flex items-center gap-2.5">
            <span id="docSL" className="m-0 text-[12px] leading-4 text-muted">Folder</span>
            <div className="w-[240px] max-[640px]:w-auto max-[640px]:flex-1 [&_[role=combobox]]:pl-2.5 [&_[role=combobox]]:pr-2 [&_[role=combobox]]:text-[13px]">
              <Select size="sm" aria-labelledby="docSL" options={SRCS.map((x) => ({ value: x, label: srcName(x) }))} value={edit.src ?? "company"} onValueChange={(v) => setEdit({ ...edit, src: v as MemSrc })} className="w-full min-w-0" />
            </div>
          </div>
        ) : null}
        <div className="mt-2 flex items-start gap-6 max-[640px]:flex-col max-[640px]:gap-3">
          {ed ? (
            <>
              <h1 id="docH" className={sr}>{edit!.t.trim() || (nw ? "New topic" : t.title)}</h1>
              <label htmlFor="docT" className={sr}>Title</label>
              <input id="docT" autoFocus={nw} maxLength={100} value={edit!.t} onChange={(e) => setEdit({ ...edit!, t: e.target.value, err: undefined })} placeholder="A title, like “Senior citizen discount”" autoComplete="off" aria-invalid={edit!.err && edit!.errAt === "t" ? true : undefined} className={cn("-ml-[9px] block h-10 min-w-0 flex-1 rounded-control border border-transparent bg-transparent px-2 text-[24px] font-semibold leading-8 tracking-[-0.01em] text-text placeholder:font-medium placeholder:text-faint hover:border-border max-[640px]:text-[20px]", "focus-visible:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent forced-colors:focus-visible:outline-[Highlight]")} />
            </>
          ) : (
            <h1 id="docH" className="m-0 min-w-0 flex-1 text-[24px] font-semibold leading-8 tracking-[-0.01em] max-[640px]:text-[20px] max-[640px]:leading-7">{t.title}</h1>
          )}
          {nw ? null : (
          <label className="mt-1.5 flex max-w-[240px] shrink-0 items-start gap-3 max-[640px]:min-h-11 max-[640px]:max-w-none">
            <Switch look="workshop" aria-label={`Customers' Leda can use ${t.title}`} checked={t.on} disabled={readOnly} onCheckedChange={(v) => setTopic(t, v)} />
            <span className="text-[13px] font-medium leading-[18px]">
              {t.on ? "Customers' Leda can use this" : "Off for customers"}
              <span className="block text-[12px] font-medium leading-4 text-muted">{t.on ? "Saves as you switch it" : "Leda won't use it for customers"}</span>
            </span>
          </label>
          )}
        </div>
        {ed && edit!.err ? <p role="alert" className="m-0 mt-1.5 text-[13px] leading-[18px] text-bad">{edit!.err}</p> : null}
        {t.sensitive ? (
          <p className="m-0 mt-2.5 flex items-start gap-1.5 text-[13px] leading-[18px] text-warn"><LockSimple size={14} aria-hidden className="mt-0.5 shrink-0" /><span>Off by default. {t.sensitive}{t.staff ? " Your team's Leda uses it either way." : ""}</span></p>
        ) : null}
        {ed ? (
          <>
            <label htmlFor="docC" className={sr}>What Leda should know</label>
            <textarea id="docC" maxLength={8000} rows={5} value={edit!.c} onChange={(e) => setEdit({ ...edit!, c: e.target.value, err: undefined })} placeholder="Write it as you would explain it to a customer, in full sentences. Leda answers from it in its own words." className={cn("-ml-[9px] mt-[18px] block min-h-[190px] w-[calc(100%+18px)] resize-none rounded-control border border-transparent bg-transparent px-2 py-1.5 text-[16px] leading-[27px] text-text placeholder:text-faint hover:border-border max-[640px]:text-[16px] max-[640px]:leading-[26px]", "focus-visible:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent forced-colors:focus-visible:outline-[Highlight]")} />
            <div className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-rule pt-3 text-[13px] leading-[18px] text-muted">
              {dirty ? <span className="inline-flex items-center gap-1.5 text-warn"><PencilSimpleLine size={16} aria-hidden />Unsaved changes</span> : nw ? <span>Write a title and the paragraph</span> : <span className="inline-flex items-center gap-1.5"><Check size={16} aria-hidden className="text-ok" />Saved</span>}
              <span className="tabular-nums">{num(room)} characters left in memory</span>
              <span className="flex-1" />
              {nw ? null : <Button variant="text" leftIcon={Trash} onClick={() => setDelAsk(t)} className="!border-0 !px-2 [&_svg]:text-bad max-[640px]:h-11">Delete</Button>}
              <Button variant="text" disabled={!dirty} onClick={discard} className="!border-0 !px-2 disabled:!opacity-50 max-[640px]:h-11">{nw ? "Cancel" : "Discard"}</Button>
              <Button disabled={!dirty} onClick={save} className="disabled:!opacity-50 max-[640px]:h-11">{nw ? "Add topic" : "Save"}</Button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-[18px] block w-full text-[16px] leading-[27px] text-text max-[640px]:leading-[26px]"><p className="m-0 whitespace-pre-line">{t.text}</p></div>
            <p className="m-0 mt-4 flex items-start gap-2 border-t border-rule pt-3 text-[13px] leading-[18px] text-muted">
              {t.type === "data" ? <Database size={14} aria-hidden className="mt-0.5 shrink-0" /> : <LockSimple size={14} aria-hidden className="mt-0.5 shrink-0" />}
              <span>
                {t.type === "data" ? (
                  <>
                    Comes from {t.src === "company" ? "company" : srcShort(t.src)} data ·{" "}
                    <a href={t.src === "company" ? "#settings" : `#${t.src}`} className="text-accent underline underline-offset-2">edit it in {t.src === "company" ? "Settings" : srcShort(t.src)}</a>
                    {t.edit?.[0] === "app" ? <span className="text-muted"> ({lower(t.edit[1])})</span> : null}
                  </>
                ) : (
                  "Written by your team. Only owners, admins and managers can change it."
                )}
              </span>
            </p>
          </>
        )}
        {qs.length ? (
          <section aria-labelledby="docQ" className="mt-8">
            <h2 id="docQ" className="m-0 text-[13px] font-semibold leading-[18px]">Questions this helps answer</h2>
            <ul className="m-0 mt-1.5 list-none p-0">
              {qs.map((x, i) => (
                <li key={x} className={cn("flex gap-2.5 py-[9px] text-[14px] leading-5", i && "border-t border-rule")}>
                  <ChatCircle size={14} aria-hidden className="mt-[3px] shrink-0 text-muted" />
                  <span>“{x}”</span>
                </li>
              ))}
            </ul>
            <Button variant="text" leftIcon={ArrowRight} onClick={() => openTry(undefined, `any#${t.src}|t:${t.k}`)} className="-ml-2 mt-1.5 !h-8 !border-0 !px-2 !text-[13px] max-[640px]:!h-11">
              See what Leda says to “{t.ask}”
            </Button>
          </section>
        ) : null}
        {nw ? null : <p className="m-0 mt-7 text-[12px] leading-4 text-muted">
          {t.type === "custom" ? `Last edited ${t.updated}` : `Last changed ${t.updated}, when ${t.src === "company" ? "the company profile" : `${srcShort(t.src)} data`} changed`} · {srcName(t.src)}
        </p>}
      </article>
    );
  })();

  const sheet = (
    <div ref={bodyRef} className="px-6 pb-8 pt-5 max-[640px]:px-0 max-[640px]:pt-0">
      {phoneChips}
      <div className="max-[640px]:px-4 max-[640px]:pb-[120px] max-[640px]:pt-4">{inDoc ? docBody : renderPanel()}</div>
    </div>
  );

  return (
    <SubpageTransition paneKey={doc ?? "list"} direction={dir}>
      <PortalFrame
        current="memory"
        heading={null}
        pageName={loading || error || empty ? "Memory" : `${allTopics.filter((t) => t.on).length} topics on`}
        onAddPlatform={() => navGo({ to: "platforms", add: true })}
        onNavigate={(d: Dest) => (d.to === "memory" ? (inDoc ? closeDoc() : undefined) : navGo(d))}
        detail={inDoc || phoneSheet}
        placeLabel="Memory folders"
        place={placeBody}
        sheetLabel="Memory"
        sheetBar={phoneDetail ? undefined : sheetBar}
        topBar={phoneTop}
        hidePhoneNav={phoneDetail}
        account={readOnly ? { name: "Arnel Cruz", email: "arnel@example.ph", role: "Member" } : { name: "Ramon Dela Cruz", email: "ramon@delacruz.ph", role: "Owner" }}
        status={
          <StatusBar
            ledaFirst
            platforms={empty ? [] : [
              { id: "autoworks", name: "Auto Works", logoSrc: AUTO_LOGO, onSelect: () => navGo({ to: "platform", id: "autoworks" }) },
              { id: "stockroom", name: "Stockroom", color: "#6d48c6", initials: "PS", onSelect: () => navGo({ to: "platform", id: "stockroom" }) },
            ]}
            people={{ count: 9, onSelect: () => navGo({ to: "team" }) }}
            leda={{ used: 1742, max: 2000, daysLeft: "7 days left", onSelect: () => navGo({ to: "plan" }) }}
            plan="Starter"
            onPlanSelect={() => navGo({ to: "plan" })}
            updatedAt="9:12 AM"
          />
        }
      >
        <SubpageLane>{sheet}</SubpageLane>
      </PortalFrame>
      <TryIt
        open={tryShown}
        onOpenChange={setTryShown}
        abouts={tryAbouts}
        about={tryAbout}
        onAboutChange={setTryAbout}
        questions={tryQuestions}
        question={tryQ}
        onQuestionChange={setTryQ}
        ask={askTry}
        variant="workshop"
        description="Ask as a customer and see what Leda says, and why."
        footnote="As customers see it in your mobile app, with the switches as they are now."
        note="Other customers' details, staff notes and pay are never used for customers. Your team's own use of Leda follows their role on Team."
      />
      <DlgCard
        open={!!bulkAsk}
        title={bulkAsk ? `Turn ${bulkAsk.how} everything in ${srcName(bulkAsk.src)}?` : ""}
        mark={bulkAsk ? <Logo src={bulkAsk.src} size={20} /> : null}
        confirmLabel={bulkAsk?.how === "on" ? "Turn on" : bulkAsk ? `Turn off ${plural(bulkChange.length, "topic")}` : ""}
        tone={bulkAsk?.how === "on" ? "primary" : "danger"}
        onCancel={() => setBulkAsk(null)}
        onConfirm={() => {
          if (!bulkAsk) return;
          const b = bulkAsk;
          const xs = b.how === "on" ? [...bulkPlain, ...(bulkSens ? bulkSensTopics : [])] : bulkChange;
          setBulkAsk(null);
          if (!xs.length) return toast.info("Nothing to change.");
          const before = on;
          setOn((o) => ({ ...o, ...Object.fromEntries(xs.map((t) => [keyOf(t), b.how === "on"])) }));
          toast.undo(`${srcShort(b.src)}: ${plural(xs.length, "topic")} ${b.how} for customers.`, () => setOn(before));
        }}
      >
        {bulkAsk?.how === "on" ? (
          <>
            <p className="m-0 mt-2 text-[14px] leading-5 text-muted">
              {bulkPlain.length ? <>Customers' Leda can then use <b className="font-medium text-text">{andList(bulkPlain.map((t) => t.title))}</b>.</> : "Everything that is safe to share is already on."}
            </p>
            {bulkSensTopics.length ? (
              <div className="mt-4 flex items-start gap-3">
                <Switch look="workshop" checked={bulkSens} onCheckedChange={setBulkSens} aria-labelledby="bulkSensL" />
                <span className="flex flex-col text-[14px] leading-5" id="bulkSensL">
                  Also turn on {andList(bulkSensTopics.map((t) => t.title))}
                  <span className="text-[12px] leading-4 text-muted">Off by default. {[...new Set(bulkSensTopics.map((t) => t.sensitive))].join(" ")}</span>
                </span>
              </div>
            ) : null}
          </>
        ) : bulkAsk ? (
          <p className="m-0 mt-2 text-[14px] leading-5 text-muted">
            Customers' Leda won't answer any question about <b className="font-medium text-text">{andList(bulkChange.map((t) => t.title))}</b> ({plural(bulkChange.length, "topic")}). Your team's own use of Leda doesn't change.
          </p>
        ) : null}
      </DlgCard>
      <ConfirmDialog
        open={!!delAsk}
        onOpenChange={(o) => !o && setDelAsk(null)}
        title="Delete this topic?"
        name={delAsk?.title}
        description={delAsk ? `Customers' Leda stops using it right away${delAsk.src === "company" ? ", at every business" : ` at ${srcShort(delAsk.src)}`}, and its ${num(delAsk.title.length + delAsk.text.length)} characters go back to the memory room.` : ""}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (!delAsk) return;
          const t = delAsk;
          setRemoved((r) => [...r, keyOf(t)]);
          setDelAsk(null);
          setEdit(null);
          setDoc(null);
          toast.undo(`Deleted: ${t.title}.`, () => setRemoved((r) => r.filter((x) => x !== keyOf(t))));
        }}
        onCancel={() => setDelAsk(null)}
      />
      <ConfirmDialog
        open={!!rmAsk}
        onOpenChange={(o) => !o && setRmAsk(null)}
        title="Remove this blocked question?"
        name={rmAsk ? `“${rmAsk.q}”` : undefined}
        description={rmAsk ? `Leda can answer it again ${rmAsk.src === "company" ? "at every business" : `at ${srcShort(rmAsk.src)}`} when a topic that is on covers it.` : ""}
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (!rmAsk) return;
          const b = rmAsk;
          setBlocked((x) => x.filter((y) => !(y.id === b.id && y.src === b.src)));
          setRmAsk(null);
          toast.undo(`Unblocked: “${b.q}”`, () => setBlocked((x) => [...x, b]));
        }}
        onCancel={() => setRmAsk(null)}
      />
      <DlgCard
        open={!!leaveAsk}
        title="Discard your changes?"
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        tone="danger"
        focus="cancel"
        onCancel={() => setLeaveAsk(null)}
        onConfirm={() => {
          const go = leaveAsk;
          setLeaveAsk(null);
          setEdit(null);
          go?.();
        }}
      >
        <p className="m-0 mt-2 text-[14px] leading-5 text-muted">
          {isNew ? "This new topic isn't added yet." : `Your edits to “${curTopic?.title ?? ""}” aren't saved.`}
        </p>
      </DlgCard>
      <Toaster />
    </SubpageTransition>
  );
}

function EmptyBox({ icon, title, children }: { icon: Icon; title: string; children: ReactNode }) {
  const I = icon;
  return (
    <div className="mt-4 flex max-w-[600px] items-start gap-3.5 rounded-card bg-raised px-5 py-[18px] max-[640px]:flex-col max-[640px]:gap-2">
      <I size={22} aria-hidden className="mt-px shrink-0 text-muted" />
      <div>
        <h3 className="m-0 text-[15px] font-semibold leading-[21px]">{title}</h3>
        <div className="m-0 mt-0.5 text-[14px] leading-5 text-muted">{children}</div>
      </div>
    </div>
  );
}
