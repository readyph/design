// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { storyNameFromExport, toId } from 'storybook/internal/csf';
import * as home from './Home.stories';
import * as platforms from './Platforms.stories';
import * as platform from './Platform.stories';
import * as team from './Team.stories';
import * as memory from './Memory.stories';
import { PHONE_STORY_IDS, STORY_IDS, destFromHash, groupOfStory, navigateTo, readHandoff, storyIdFor, type Dest } from './protoNav';

/** Every story id the stories files really produce (same rule Storybook's index uses: title + export name). */
const modules = [home, platforms, platform, team, memory] as const;
const index = new Set(
  modules.flatMap((m) => Object.keys(m).filter((k) => k !== 'default').map((k) => toId((m.default as { title: string }).title, storyNameFromExport(k)))),
);

afterEach(() => { sessionStorage.clear(); });

describe('prototype navigation map', () => {
  it('every target story id exists in the stories (and so in the Storybook index)', () => {
    for (const id of [...Object.values(STORY_IDS), ...Object.values(PHONE_STORY_IDS)]) expect(index.has(id), id).toBe(true);
  });

  it('maps each destination to the page group it names', () => {
    const cases: [Dest, string][] = [
      [{ to: 'home' }, 'home'], [{ to: 'platforms' }, 'platforms'], [{ to: 'platforms', add: true }, 'platforms'],
      [{ to: 'platform', id: 'autoworks' }, 'platform'], [{ to: 'team' }, 'team'], [{ to: 'team', person: 'grace' }, 'team'],
      [{ to: 'memory' }, 'memory'], [{ to: 'memory', topic: 't1' }, 'memory'],
    ];
    for (const [d, g] of cases) { expect(groupOfStory(storyIdFor(d)!)).toBe(g); expect(groupOfStory(storyIdFor(d, true)!)).toBe(g); }
  });

  it('picks the default state story, and the phone one for phone-wide canvases', () => {
    expect(storyIdFor({ to: 'home' })).toBe('prototypes-home--live');
    expect(storyIdFor({ to: 'home' }, true)).toBe('prototypes-home--phone');
    expect(storyIdFor({ to: 'team', person: 'grace' })).toBe('prototypes-team--person');
    expect(storyIdFor({ to: 'team', person: 'nobody' })).toBe('prototypes-team--live');
    expect(storyIdFor({ to: 'platforms', add: true })).toBe('prototypes-platforms--marketplace-from-add');
  });

  it('destinations without a page have no story: reports, plan, settings, a platform without a Platform page', () => {
    for (const d of [{ to: 'reports' }, { to: 'plan' }, { to: 'settings' }, { to: 'logout' }, { to: 'platform', id: 'cebu' }] as Dest[]) {
      expect(storyIdFor(d)).toBeNull();
      expect(navigateTo(d)).toBe(false);
    }
  });

  it('outside Storybook (unit tests, real apps) navigating does nothing', () => {
    expect(navigateTo({ to: 'home' })).toBe(true);
    expect(readHandoff('home')).toBeNull();
  });

  it('turns Leda action hashes into destinations', () => {
    expect(destFromHash('#autoworks')).toEqual({ to: 'platform', id: 'autoworks' });
    expect(destFromHash('#team')).toEqual({ to: 'team' });
    expect(destFromHash('#cafe-connections')).toEqual({ to: 'platform', id: 'cafe' });
  });
});
