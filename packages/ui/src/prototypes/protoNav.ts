import { useEffect, useState } from 'react';
import { toast } from '../components/toast/toastStore';

/**
 * Prototype navigation (RDY-357). Prototype only: NOT exported from the package.
 * Maps a destination to the Storybook story that is the page's default state and moves there from inside the story iframe,
 * so the five Portal pages walk as one connected prototype without touching the sidebar.
 *
 * Contexts (see `navigateTo`):
 *  - Storybook manager: the iframe emits SELECT_STORY on the preview channel; the manager selects the story and keeps the URL's
 *    globals (theme, viewport).
 *  - "Open canvas in new tab" (standalone iframe.html): the iframe URL changes to `?id=<story>&viewMode=story`, carrying `globals`.
 *  - Docs mode: does nothing.
 * A destination with no page (Reports, account settings, a platform that has no Platform page) shows the page's own toast.
 */
export type PlatformTab = 'general' | 'system' | 'team' | 'connections' | 'leda';
export type Dest =
  | { to: 'home' }
  /** `add`: open on the in-page marketplace ("Add a platform"). */
  | { to: 'platforms'; add?: boolean }
  | { to: 'platform'; id: string; tab?: PlatformTab }
  | { to: 'team'; person?: string }
  | { to: 'memory'; folder?: string; topic?: string }
  | { to: 'reports' }
  | { to: 'plan' }
  | { to: 'settings' }
  | { to: 'logout' };

export type PageGroup = 'home' | 'platforms' | 'platform' | 'team' | 'memory';

/** Story ids, read from the stories' exports (title + export name). Tested against the real Storybook index. */
export const STORY_IDS = {
  home: 'prototypes-home--live',
  platforms: 'prototypes-platforms--default',
  marketplace: 'prototypes-platforms--marketplace-from-add',
  platform: 'prototypes-platform--general-info',
  team: 'prototypes-team--live',
  person: 'prototypes-team--person',
  memory: 'prototypes-memory--topics',
  topic: 'prototypes-memory--topic-page',
} as const;

/** The same pages' phone stories, used when the canvas is phone-wide so the viewport survives navigation. */
export const PHONE_STORY_IDS = {
  home: 'prototypes-home--phone',
  platforms: 'prototypes-platforms--phone',
  platform: 'prototypes-platform--phone',
  team: 'prototypes-team--phone',
  person: 'prototypes-team--phone-person',
  memory: 'prototypes-memory--phone-folders',
  topic: 'prototypes-memory--phone-topics',
} as const;

/** Platforms that have a Platform page in this prototype (Platform.data.ts). */
export const PLATFORM_PAGES = ['autoworks', 'stockroom'] as const;
/** People that have a Team person story. */
export const TEAM_PEOPLE = ['grace', 'liza', 'mon'] as const;

export const hasPlatformPage = (id: string) => (PLATFORM_PAGES as readonly string[]).includes(id);

/** The story for a destination, or null when it has no page. */
export function storyIdFor(dest: Dest, phone = false): string | null {
  const ids = phone ? PHONE_STORY_IDS : STORY_IDS;
  switch (dest.to) {
    case 'home': return ids.home;
    case 'platforms': return dest.add && !phone ? STORY_IDS.marketplace : ids.platforms;
    case 'platform': return hasPlatformPage(dest.id) ? ids.platform : null;
    case 'team': return dest.person && (TEAM_PEOPLE as readonly string[]).includes(dest.person) ? ids.person : ids.team;
    case 'memory': return dest.topic ? ids.topic : ids.memory;
    default: return null;
  }
}

export const groupOfStory = (storyId: string): PageGroup | null => {
  const m = /^prototypes-(home|platforms|platform|team|memory)--/.exec(storyId);
  return m ? (m[1] as PageGroup) : null;
};

const groupOfDest = (d: Dest): PageGroup | null => (d.to === 'home' || d.to === 'platforms' || d.to === 'platform' || d.to === 'team' || d.to === 'memory' ? d.to : null);

const LABEL: Record<Dest['to'], string> = { home: 'Home', platforms: 'Platforms', platform: 'This platform', team: 'Team', memory: 'Memory', reports: 'Reports', plan: 'Plan', settings: 'Account settings', logout: 'Log out' };
export const noPageMessage = (d: Dest) =>
  d.to === 'platform' ? 'This platform’s page is not in the prototype yet.' : d.to === 'logout' ? 'Logging out is not part of the prototype.' : `${LABEL[d.to]} is not in the prototype yet.`;

/* ---------- hand-off to the page that mounts next ---------- */
const KEY = 'rph-proto-nav';
const FRESH_MS = 15000;
export interface Handoff { group: PageGroup; platform?: string; tab?: PlatformTab; person?: string; at: number }

function writeHandoff(h: Handoff) {
  try { sessionStorage.setItem(KEY, JSON.stringify(h)); } catch { /* storage blocked: the page opens in its default state */ }
}
/** What the previous page passed on (a platform id, a person), if it was just left. Read in the page's first render. */
export function readHandoff(group: PageGroup): Handoff | null {
  try {
    const h = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Handoff | null;
    return h && h.group === group && Date.now() - h.at < FRESH_MS ? h : null;
  } catch { return null; }
}
/** True when this mount follows an in-prototype navigation (any page). */
export const arrivedByNav = () => (['home', 'platforms', 'platform', 'team', 'memory'] as const).some((g) => readHandoff(g) !== null);
export function clearHandoff() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}
/** Hook form: the hand-off is read once at mount and cleared after, so a reload or the sidebar opens the default state. */
export function useHandoff(group: PageGroup): Handoff | null {
  const [h] = useState(() => readHandoff(group));
  useEffect(() => { if (h) clearHandoff(); }, [h]);
  return h;
}

/* ---------- navigation ---------- */
type PreviewWindow = Window & { __STORYBOOK_ADDONS_CHANNEL__?: { emit: (event: string, ...args: unknown[]) => void }; __STORYBOOK_PREVIEW__?: { currentSelection?: { storyId?: string } } };

const params = () => new URLSearchParams(window.location.search);
const inManager = () => window.parent !== window;
const isDocs = () => params().get('viewMode') === 'docs';
const isStorybook = () => /iframe\.html$/.test(window.location.pathname);
const currentStoryId = (w: PreviewWindow) => w.__STORYBOOK_PREVIEW__?.currentSelection?.storyId ?? params().get('id') ?? '';
const phoneWide = () => window.matchMedia?.('(max-width: 640px)').matches ?? false;

/**
 * Go to a destination. Returns true when it was handled (navigated, or deliberately a no-op) and false when the destination has no page.
 * Outside Storybook (unit tests, real apps) it does nothing and returns true for destinations that do have a page.
 */
export function navigateTo(dest: Dest): boolean {
  const id = storyIdFor(dest, phoneWide());
  if (!id) return false;
  if (!isStorybook() || isDocs()) return true;
  const w = window as PreviewWindow;
  const now = currentStoryId(w);
  const group = groupOfDest(dest)!;
  const plain = !(dest.to === 'platform' || (dest.to === 'platforms' && dest.add) || (dest.to === 'team' && dest.person) || (dest.to === 'memory' && dest.topic));
  if (now === id || (plain && groupOfStory(now) === group)) return true;
  writeHandoff({ group, platform: dest.to === 'platform' ? dest.id : undefined, tab: dest.to === 'platform' ? dest.tab : undefined, person: dest.to === 'team' ? dest.person : undefined, at: Date.now() });
  const channel = w.__STORYBOOK_ADDONS_CHANNEL__;
  if (inManager() && channel) {
    channel.emit('selectStory', { storyId: id });
    return true;
  }
  const next = new URLSearchParams({ id, viewMode: 'story' });
  const globals = params().get('globals');
  if (globals) next.set('globals', globals);
  window.location.assign(`${window.location.pathname}?${next.toString()}`);
  return true;
}

/** Go to a story by id (the palette's "Prototype states": Loading, error, empty, scale test). Same hand-off as `navigateTo`, no page group change. */
export function goToStory(id: string) {
  if (!isStorybook() || isDocs()) return;
  const w = window as PreviewWindow;
  if (currentStoryId(w) === id) return;
  const channel = w.__STORYBOOK_ADDONS_CHANNEL__;
  if (inManager() && channel) {
    channel.emit('selectStory', { storyId: id });
    return;
  }
  const next = new URLSearchParams({ id, viewMode: 'story' });
  const globals = params().get('globals');
  if (globals) next.set('globals', globals);
  window.location.assign(`${window.location.pathname}?${next.toString()}`);
}

/** The default handler for a page: go there, or tell the person this destination is not in the prototype. */
export function go(dest: Dest) {
  if (!navigateTo(dest)) toast({ description: noPageMessage(dest) });
}

/** A `#platformId` / `#team` style href (Leda's action links, in-page anchors) as a destination. */
export function destFromHash(href: string): Dest {
  const h = href.replace(/^#/, '');
  if (h === 'home' || h === 'platforms' || h === 'reports') return { to: h };
  if (h === 'team') return { to: 'team' };
  if (h === 'memory') return { to: 'memory' };
  return { to: 'platform', id: h.replace(/-connections$/, '') };
}
