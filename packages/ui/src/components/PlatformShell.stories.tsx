import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { House, Graph, FileText, Users, DotsThree, MagnifyingGlass } from '@phosphor-icons/react';
import { PlatformShell } from './PlatformShell';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { PlatformLogo } from './PlatformLogo';
import { ProgressBar } from './ProgressBar';
import { Queue } from './Queue';
import { allPlatforms, done, items, snoozed, watching } from './Queue.data';
import { PlatformToday } from './PlatformToday';
import { autoWorks, cafe, jobs } from './PlatformToday.data';
import { ListCell, ListRow } from './List';
import { ListGroup, ListGroups } from './ListGroup';

const meta: Meta<typeof PlatformShell> = {
  title: 'Components/Layout/PlatformShell',
  component: PlatformShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Portal app shell (C1): grid `rail | place column | sheet` over a status row. It is the composition slot for IconRail (C2), the place column, the sheet bar (C5) and StatusBar (C4); the stories use plain stand-ins for those.',
          '',
          '- Frame colour behind rail, place column and status bar. The sheet is a `surface` panel: 1px border, 8px radius, 8px inset from the top and right, container named `sheet` (`@container/sheet`, `@max-[760px]/sheet:`). `List` keeps its own `@container/list`; the two names do not collide.',
          '- `--place` is 460px, 400 below 1440, 380 below 1180, 320 below 960 (tokens).',
          '- Landmarks: `nav` (rail, phone nav), `section` (place, labelled), `main` (sheet), `footer` (status). Pass items, not your own `nav`/`footer`, into `rail` and `status`.',
          '- The shell fills its parent height (`h-dvh`). The sheet body and the place column scroll; the frame never does.',
          '- Phone (640px and below): 48px top bar (`topBar`), 60px bottom nav (`phoneNav`), one region at a time: the place column, or the sheet with `detail`. `actionBar` is the sticky foot of the sheet, phone detail only. Rail and status are hidden.',
          '- `className` is merged under the shell classes: add colour or margin, it cannot move the regions.',
          '',
          '```tsx',
          '<PlatformShell rail={<IconRail/>} place={<Map/>} placeLabel="Platforms" sheetBar={<SheetBar/>} status={<StatusBar/>}',
          '  topBar={<PhoneTop/>} phoneNav={<PhoneNav/>} detail={isDetail}>{page}</PlatformShell>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof PlatformShell>;

const railItem = 'grid size-9 place-items-center rounded-control text-muted hover:bg-frame-hover hover:text-text';
const Rail = () => (
  <ul className="m-0 flex list-none flex-col items-center gap-1 p-0 pt-inset">
    {[House, Graph, FileText, Users].map((Ic, i) => (
      <li key={i}>
        <a href="#" aria-label={['Home', 'Platforms', 'Reports', 'Team'][i]} aria-current={i === 0 ? 'page' : undefined} className={`${railItem} ${i === 0 ? 'bg-frame-active text-text' : ''}`}>
          <Ic size={19} aria-hidden />
        </a>
      </li>
    ))}
  </ul>
);

const Place = () => (
  <div className="flex flex-col gap-3 p-1">
    <div className="rounded-card border border-border bg-raised p-pad text-muted">Map</div>
    {['Barangay Clearance', 'Stockroom', 'Marikina SMS'].map((n, i) => (
      <button key={n} type="button" className="flex items-center gap-2 rounded-card px-2 py-2 text-left hover:bg-frame-hover">
        <PlatformLogo decorative name={n} index={i} />
        {n}
      </button>
    ))}
    {Array.from({ length: 12 }, (_, i) => (
      <p key={i} className="m-0 px-2 text-muted">Place item {i + 1}</p>
    ))}
  </div>
);

const SheetBar = () => (
  <div className="flex h-sheet-bar items-center justify-between gap-3 px-pad">
    <h1 className="m-0 truncate text-ui font-semibold">Home</h1>
    <Button variant="secondary">Invite</Button>
  </div>
);

const Status = () => (
  <ul className="m-0 flex list-none items-center gap-4 p-0">
    <li>All running</li>
    <li>3 people</li>
    <li className="flex items-center gap-2">Leda <ProgressBar value={42} aria-label="Leda usage" className="w-14" /></li>
  </ul>
);

const Body = () => (
  <div className="p-pad">
    <h2 className="m-0 mb-3 text-ui font-semibold">Today</h2>
    {Array.from({ length: 40 }, (_, i) => (
      <p key={i} className="m-0 border-b border-rule py-row-y">Row {i + 1}</p>
    ))}
  </div>
);

const PhoneTop = () => (
  <>
    <span className="font-semibold">ReadyPH</span>
    <span className="min-w-0 flex-1 truncate text-muted">Home</span>
    <IconButton icon={MagnifyingGlass} label="Ask Leda" />
  </>
);
const PhoneNav = () => (
  <ul className="m-0 flex w-full list-none p-0">
    {[[House, 'Home'], [Graph, 'Platforms'], [FileText, 'Reports'], [Users, 'Team'], [DotsThree, 'More']].map(([Ic, l]) => {
      const I = Ic as typeof House;
      return (
        <li key={l as string} className="flex-1">
          <a href="#" className="flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-small text-muted">
            <I size={20} aria-hidden />
            {l as string}
          </a>
        </li>
      );
    })}
  </ul>
);

const full = {
  rail: <Rail />,
  place: <Place />,
  placeLabel: 'Platforms',
  sheetBar: <SheetBar />,
  status: <Status />,
  topBar: <PhoneTop />,
  phoneNav: <PhoneNav />,
};

export const Default: Story = {
  render: (args) => (
    <PlatformShell {...full} {...args}>
      <Body />
    </PlatformShell>
  ),
};

/** Narrow desktop: place column drops to 320px under 960. */
export const Narrow: Story = { ...Default, parameters: { viewport: { defaultViewport: 'tablet' } } };

/** Pages without a place column (Memory, Team). */
export const SheetOnly: Story = {
  render: () => (
    <PlatformShell {...full} place={undefined}>
      <Body />
    </PlatformShell>
  ),
};

/** Phone, place region (default). */
export const PhonePlace: Story = { ...Default, parameters: { viewport: { defaultViewport: 'mobile1' } } };

/** Phone, detail region with the sticky action bar. */
export const PhoneDetail: Story = {
  render: () => (
    <PlatformShell {...full} detail actionBar={<><Button variant="secondary">Cancel</Button><Button>Save</Button></>}>
      <Body />
    </PlatformShell>
  ),
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/** Phone: toggle between regions, as a page would on row tap and Back. */
export const PhoneInteractive: Story = {
  render: () => {
    const [detail, setDetail] = useState(false);
    return (
      <PlatformShell {...full} detail={detail} place={<div className="p-1"><button type="button" className="rounded-card border border-border px-3 py-2" onClick={() => setDetail(true)}>Open Stockroom</button></div>} actionBar={<Button onClick={() => setDetail(false)}>Back</Button>}>
        <Body />
      </PlatformShell>
    );
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/** The place column carries data-surface="frame": Queue, ListGroup and PlatformToday rules use --frame-rule and focus rings offset on --frame; a sheet nested in the column resets to --rule / --surface (RDY-305). */
export const PlaceColumnSurfaces: Story = {
  render: () => (
    <PlatformShell
      {...full}
      place={
        <div className="flex flex-col gap-4 pb-4">
          <div className="h-[420px]"><Queue items={items} watching={watching} snoozed={snoozed} done={done} platforms={allPlatforms} shortcuts={false} defaultOpenGroups={['watching']} /></div>
          <ListGroups as="list" aria-label="Frame groups">
            <ListGroup title="Frame group" count={2}>
              {['One', 'Two'].map((t) => <ListRow key={t} rowId={t} label={t} onActivate={() => {}}><ListCell kind="lead">{t}</ListCell></ListRow>)}
            </ListGroup>
          </ListGroups>
          <PlatformToday platform={autoWorks} kind="Auto repair" lists={[{ ...jobs, onViewAll: () => {} }]} onOpen={() => {}} />
          <div data-testid="nested-sheet" className="rounded-card border border-border bg-surface p-3" data-surface="surface">
            <PlatformToday platform={cafe} kind="Point of sale" lists={[{ ...jobs, id: "j2", onViewAll: () => {} }]} onOpen={() => {}} surface="surface" />
          </div>
        </div>
      }
    >
      <Body />
    </PlatformShell>
  ),
};

/**
 * Phone: the shell is all --surface, so the frame scope resets (rules, sticky header band and ring offset on --surface; RDY-306). Check at 375 and 320.
 * The play step reads computed styles: the "Auto repair" header paints the place column's colour, and the focused Open button's ring offset is that colour.
 */
export const PlaceColumnSurfacesPhone: Story = {
  ...PlaceColumnSurfaces,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
    const canvas = within(canvasElement);
    const place = canvasElement.querySelector('[data-shell-place]') as HTMLElement;
    // Resolve --surface to the colour the browser paints (rgb) with a probe, so the check holds in light and dark.
    const probe = place.appendChild(document.createElement('div'));
    probe.style.background = 'var(--surface)';
    const surface = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const header = canvas.getByRole('heading', { name: 'Auto Works Quezon City' }).closest('header') as HTMLElement;
    await expect(getComputedStyle(header).backgroundColor).toBe(surface);
    const open = canvas.getByRole('button', { name: 'Open Auto Works Quezon City' });
    await userEvent.tab();
    open.focus();
    if (window.matchMedia('(forced-colors: active)').matches) {
      // Forced-colors drops box-shadow: the focus indicator is a visible 2px outline instead.
      const cs = getComputedStyle(open);
      await expect(cs.outlineStyle).toBe('solid');
      await expect(parseFloat(cs.outlineWidth)).toBeGreaterThanOrEqual(2);
      return;
    }
    // Focus ring = 2px offset in the scope colour, then the accent ring.
    await expect(getComputedStyle(open).boxShadow).toContain(surface);
  },
};
