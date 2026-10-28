import { useEffect, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { House, Graph, FileText, Users, DotsThree } from '@phosphor-icons/react';
import { PlatformShell } from '../PlatformShell';
import { ReadyLogo } from '../ReadyMark';
import { StatusBar } from '../StatusBar';
import { Button } from '../Button';
import { Toaster } from './Toaster';
import { clearToasts, toast, type ToastOptions } from './toastStore';

const meta: Meta = {
  title: 'Components/Feedback/Toast',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Toast with Undo (C11, UPDATE of `Toaster` / `toastStore`). Mount `Toaster` once near the app root, then call `toast` anywhere.',
          '',
          '- One line on the ink surface (`bg-text`, `text-surface`, so it inverts in dark), 13px, 5px radius, float shadow. Optional Leda tile (`leda: true`) and an Undo text button.',
          '- Placement: bottom-left of the sheet (24px in, 16px above its bottom edge, so above the status bar); phone: a full-width bar above the bottom nav. It is portalled to `body` and positioned from the sheet and nav geometry, because the sheet is a container and a fixed child inside it would not be viewport-relative.',
          '- One at a time: a new toast replaces the one showing. 5000ms, paused while hovered or focused (then at least 2s more). Esc closes it. Undo runs once and closes it.',
          '- A permanent `role="status"` polite region: each toast is announced once. Reduced motion: no slide or fade.',
          '- Long text: truncated to one line on desktop (full text in the tooltip and the announcement), two lines on phone.',
          '- Keyboard: the toast is last in tab order, so pages can bind a shortcut to `toast.runAction()`. It runs the showing toast\'s action (Undo) once, closes the toast and returns `false` when there is none. The component binds no key itself.',
          '- Follow-ups for later tickets: the desktop toast narrows while the Leda panel is open and top-pins under the top bar on phone (use the `anchor` prop); the Leda memory toast shows one action today (Undo), the page ticket decides on a second.',
          '',
          '```tsx',
          'import { Toaster, toast } from \'@readyph/ui\';',
          '<Toaster />                                   // once, in the app root',
          'toast.undo(\'System settings saved.\', revert)  // success + Undo',
          'toast.success(\'Platform added.\')',
          'toast({ description: \'Saved to memory: Holiday hours was added.\', leda: true, action: { label: \'Undo\', onClick: revert } })',
          'useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === \'z\' && toast.runAction()) e.preventDefault(); }; document.addEventListener(\'keydown\', k); return () => document.removeEventListener(\'keydown\', k); }, []);',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj;

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

/** The real shell: the Toaster finds the sheet and phone nav by itself. `fire` shows a toast once on mount. */
function Stage({ fire, children, actionStyle }: { fire?: ToastOptions | ToastOptions[]; children?: ReactNode; actionStyle?: 'link' | 'inventory' }) {
  useEffect(() => {
    clearToasts();
    if (fire) for (const f of ([] as ToastOptions[]).concat(fire)) toast(f);
    return () => clearToasts();
  }, [fire]);
  return (
    <>
      <PlatformShell
        rail={<span className="sr-only">Rail</span>}
        place={<p className="p-4 text-small text-muted">Places</p>}
        placeLabel="Platforms"
        sheetBar={<p className="px-6 py-3 text-small">Sheet bar</p>}
        status={<StatusBar platforms={[{ id: '1', name: 'Stockroom' }, { id: '2', name: 'Auto Works' }]} people={{ count: 12 }} plan="Starter" updatedAt="9:12 AM" />}
        topBar={<ReadyLogo size={28} />}
        phoneNav={<PhoneNav />}
        detail
      >
        <div className="space-y-3 p-6">
          <p className="text-body">Page content. The toast sits at the bottom-left of this sheet.</p>
          {children}
        </div>
      </PlatformShell>
      <Toaster actionStyle={actionStyle} />
    </>
  );
}

const undo = (description: string, extra: ToastOptions = {}): ToastOptions => ({ description, tone: 'success', action: { label: 'Undo', onClick: () => {} }, ...extra });
const fireOnce = { description: 'Platform added.', tone: 'success' } as ToastOptions;
const withUndo = undo('System settings saved.');
const leda = undo('Saved to memory: Holiday hours was added.', { leda: true });
const long = undo('Data source connected. Stockroom will sync every 15 minutes from now on, and the first sync starts in about a minute; you can change the schedule under System settings.');
const tones = [{ description: 'Synced 128 items.', tone: 'info' }, { description: 'Product published.', tone: 'success' }, { description: 'Low stock on 3 items.', tone: 'warning' }, { description: 'Failed to save changes.', tone: 'error' }] as ToastOptions[];

export const Playground: Story = {
  render: () => (
    <Stage>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => toast.success('Platform added.')}>Plain</Button>
        <Button variant="secondary" onClick={() => toast(withUndo)}>With Undo</Button>
        <Button variant="secondary" onClick={() => toast(leda)}>Leda wrote it</Button>
        <Button variant="secondary" onClick={() => toast(long)}>Long</Button>
        <Button variant="secondary" onClick={() => tones.forEach((t) => toast(t))}>Four in a row (last wins)</Button>
        <Button variant="secondary" onClick={() => toast.undo('Persists until dismissed.', () => {}, { duration: 0 })}>No timeout</Button>
      </div>
    </Stage>
  ),
};

export const Plain: Story = { render: () => <Stage fire={fireOnce} /> };
export const WithUndo: Story = { render: () => <Stage fire={withUndo} /> };
export const LedaTile: Story = { name: 'Leda tile + Undo', render: () => <Stage fire={leda} /> };
export const Info: Story = { render: () => <Stage fire={tones[0]} /> };
export const Warning: Story = { render: () => <Stage fire={tones[2]} /> };
export const ErrorTone: Story = { name: 'Error', render: () => <Stage fire={tones[3]} /> };
export const LongMessage: Story = { render: () => <Stage fire={long} /> };
export const WithTitle: Story = { render: () => <Stage fire={{ title: 'Export ready.', description: 'Your inventory report is ready to download.', tone: 'success', action: { label: 'Download', onClick: () => {} } }} /> };

const phone = { viewport: { defaultViewport: 'mobile1' } };
export const PhoneUndo: Story = { name: 'Phone, Undo', render: () => <Stage fire={withUndo} />, parameters: phone };
export const PhoneLeda: Story = { name: 'Phone, Leda + long', render: () => <Stage fire={{ ...long, leda: true }} />, parameters: phone };

const invUndo = undo('Added 12 Rice 25kg to Stockroom.');
const invCart = { description: 'Rice 25kg added to the order list.', tone: 'success', duration: 8000, actions: [{ label: 'Undo', onClick: () => {} }, { label: 'View order lists', onClick: () => {} }] } as ToastOptions;
export const InventoryUndo: Story = { name: 'Inventory, Undo', render: () => <Stage fire={invUndo} actionStyle="inventory" /> };
export const InventoryUndoAndOrderLists: Story = { name: 'Inventory, Undo + View order lists (8s)', render: () => <Stage fire={invCart} actionStyle="inventory" /> };
export const InventoryLeda: Story = { name: 'Inventory, Leda tile + Undo', render: () => <Stage fire={{ ...invUndo, leda: true }} actionStyle="inventory" /> };
export const InventoryPhone: Story = { name: 'Inventory, phone', render: () => <Stage fire={invCart} actionStyle="inventory" />, parameters: phone };
