import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { House, Graph, FileText, Users } from '@phosphor-icons/react';
import { OnboardingStepper, type StepperStep } from './OnboardingStepper';
import { PlatformShell } from './PlatformShell';
import { ReadyLogo } from './ReadyMark';
import { LedaNote } from './LedaNote';
import { Switch } from './Switch';
import { Button } from './Button';

const meta: Meta<typeof OnboardingStepper> = {
  title: 'Components/Layout/Onboarding stepper',
  component: OnboardingStepper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Onboarding stepper (C21): layout and state for guided setup. The forms are yours (slot `children`); the stepper owns the step list, progress bar, section heading and the footer.',
          '',
          '- Wide (720px or more of its own width, `@container/stepper`): a 14rem step list (`<ol>`) with the C40 progress bar under it, the section on the right. Narrow or phone: the list becomes a row of 44px chips (719px and under; 720px shows the list), each at most 16rem or 80% of the width, label wrapping that scrolls sideways, the progress bar stays under it. The list and the footer stick (top / bottom) inside the sheet that scrolls.',
          '- States are never colour alone: done = check icon + "Done", skipped = dashed outline + dashed-circle icon + "Skipped", locked = lock icon + "Locked" + the reason, current = filled number + `aria-current="step"` + "In progress". On chips the words stay for assistive tech (`sr-only`), the icons stay visible.',
          '- Footer: Back (hidden on step 1; goes back, changes no status), Finish later (calls you; keep drafts yourself), Skip for now (marks skipped and moves on; hidden on a `required` step or without `onSkip`), and the primary (`continueLabel`: "Add and continue" on step 1, "Save and continue" after). `busy` disables all; `continueLoading` shows the spinner on the primary.',
          '',
          '**Controlled and URL-free.** Pass `current` (step id) and `onStepChange`. The component never reads or writes the URL: map `?id=…&setup=N` to `current` yourself (resume on reload) and update the URL in `onStepChange`, `onContinue`, `onSkip` and `onBack`. A locked step never calls `onStepChange`.',
          '',
          '**Keyboard and assistive tech.** Every step is a button in the normal Tab order (locked ones stay focusable, `aria-disabled`, with the reason as description; pressing one announces the reason). Enter / Space opens an unlocked step. There are no arrow keys: Tab is enough for five steps and avoids a second tab stop model. When `current` changes, focus moves to the section heading (`h2`, `tabIndex=-1`) so the new step is read once. The live region starts empty and speaks only the progress change ("2 of 5 steps done.") and locked presses. `className` goes on the outer box; the grid cannot be overridden.',
          '',
          '**API for Leonardo.** `steps[] {id, label, status?: todo|done|skipped, locked?, reason?, required?}`, `current`, `onStepChange(id)`, `title?`, `description?`, `intro?` (slot, e.g. `LedaNote`), `children`, `continueLabel`, `continueLoading`, `continueDisabled`, `busy`, `onContinue`, `onSkip`, `onBack`, `onFinishLater`, `progressLabel?`, `listLabel?`. Progress = steps with status `done` / total. Mark "Skipped" on the detail page from the same `status`.',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof OnboardingStepper>;

const base: StepperStep[] = [
  { id: 'general', label: 'General info', required: true },
  { id: 'system', label: 'System' },
  { id: 'team', label: 'Team' },
  { id: 'connections', label: 'Connections' },
  { id: 'leda', label: 'Leda & Memory' },
];

const field = 'h-8 w-full rounded-control border border-control bg-surface px-2.5 text-ui text-text';
const Form = ({ name }: { name: string }) => (
  <form className="flex max-w-md flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
    <label className="flex flex-col gap-1 text-ui">
      <span className="font-medium">{name} name</span>
      <input className={field} defaultValue="" placeholder="Parts Counter" />
    </label>
    <label className="flex items-center justify-between gap-3 text-ui">
      <span>Show in the company directory</span>
      <Switch aria-label="Show in the company directory" defaultChecked />
    </label>
  </form>
);

/** Fully working demo: steps update their status as you continue, skip and go back. */
function Demo({ initial = 'general', seed = base, lockRest = false }: { initial?: string; seed?: StepperStep[]; lockRest?: boolean }) {
  const [steps, setSteps] = useState<StepperStep[]>(seed);
  const [current, setCurrent] = useState(initial);
  const [saving, setSaving] = useState(false);
  const i = steps.findIndex((s) => s.id === current);
  const [created, setCreated] = useState(!lockRest);
  const shown = steps.map((s, n) => (n > 0 && !created ? { ...s, locked: true, reason: 'Add the platform first.' } : s));
  const mark = (status: 'done' | 'skipped') => setSteps((all) => all.map((s, n) => (n === i ? { ...s, status } : s)));
  const next = () => setCurrent(steps[Math.min(i + 1, steps.length - 1)].id);
  return (
    <OnboardingStepper
      steps={shown}
      current={current}
      onStepChange={setCurrent}
      continueLabel={i === 0 ? 'Add and continue' : 'Save and continue'}
      continueLoading={saving}
      busy={saving}
      intro={i === 4 ? <LedaNote byline="Leda">Nothing is added until you press Save and continue.</LedaNote> : undefined}
      description="You can change this later in the platform's tabs."
      onContinue={() => {
        setSaving(true);
        setTimeout(() => { setSaving(false); setCreated(true); mark('done'); next(); }, 500);
      }}
      onSkip={() => { mark('skipped'); next(); }}
      onBack={() => setCurrent(steps[Math.max(i - 1, 0)].id)}
      onFinishLater={() => {}}
    >
      <Form name={shown[i].label} />
    </OnboardingStepper>
  );
}

export const Default: Story = { render: () => <Demo /> };
/** Step 1 not saved yet: the rest are locked with a reason (the platform does not exist). */
export const FirstStepLocked: Story = { render: () => <Demo lockRest /> };
export const DoneAndSkipped: Story = {
  render: () => (
    <Demo
      initial="connections"
      seed={base.map((s) => (s.id === 'general' ? { ...s, status: 'done' as const } : s.id === 'system' ? { ...s, status: 'done' as const } : s.id === 'team' ? { ...s, status: 'skipped' as const } : s))}
    />
  ),
};
export const Saving: Story = {
  render: () => (
    <OnboardingStepper steps={base.map((s, n) => (n === 0 ? { ...s, status: 'done' as const } : s))} current="system" onStepChange={() => {}} continueLoading busy onContinue={() => {}} onSkip={() => {}} onBack={() => {}} onFinishLater={() => {}}>
      <Form name="System" />
    </OnboardingStepper>
  ),
};
export const ContinueDisabled: Story = {
  render: () => (
    <OnboardingStepper steps={base} current="general" onStepChange={() => {}} continueLabel="Add and continue" continueDisabled onContinue={() => {}} onFinishLater={() => {}}>
      <Form name="General info" />
    </OnboardingStepper>
  ),
};
const unbreakable = 'Supercalifragilisticexpialidocious_Inventory_Reconciliation_Branch_0042';
export const LongNames: Story = {
  render: () => (
    <OnboardingStepper
      steps={[
        { id: 'a', label: unbreakable, status: 'done' },
        { id: 'b', label: 'Opening hours, holidays and one-off closures for every branch in the region' },
        { id: 'c', label: 'Connections', locked: true, reason: `Add ${unbreakable} first so there is something to connect.` },
      ]}
      current="b"
      onStepChange={() => {}}
      title="Opening hours, holidays and one-off closures for every branch in the region"
      onContinue={() => {}} onSkip={() => {}} onBack={() => {}} onFinishLater={() => {}}
    >
      <Form name="Hours" />
    </OnboardingStepper>
  ),
};

const many: StepperStep[] = [
  { id: 's1', label: 'General info', status: 'done', required: true },
  { id: 's2', label: 'System', status: 'done' },
  { id: 's3', label: 'Opening hours', status: 'skipped' },
  { id: 's4', label: 'Team', status: 'done' },
  { id: 's5', label: 'Connections' },
  { id: 's6', label: 'Payments', locked: true, reason: 'Connect a bank account first.' },
  { id: 's7', label: 'Notifications' },
  { id: 's8', label: 'Leda & Memory' },
  { id: 's9', label: 'Review and publish', locked: true, reason: 'Finish the steps before it.' },
];
/** Nine steps, mixed done, skipped and locked: the chip row scrolls and keeps the open chip in view. */
export const ManySteps: Story = { render: () => <Demo initial="s5" seed={many} /> };

const rail = (
  <ul className="m-0 flex list-none flex-col items-center gap-1 p-0 pt-inset">
    {[House, Graph, FileText, Users].map((Ic, i) => (
      <li key={i}><a href="#" aria-label={['Home', 'Platforms', 'Reports', 'Team'][i]} className="grid size-9 place-items-center rounded-control text-muted"><Ic size={19} aria-hidden /></a></li>
    ))}
  </ul>
);
const bar = (
  <div className="flex h-sheet-bar items-center justify-between gap-3 px-pad">
    <h1 className="m-0 truncate text-ui font-semibold">Add platform</h1>
    <Button variant="secondary">Cancel</Button>
  </div>
);
const nav = (
  <ul className="m-0 flex w-full list-none p-0">
    {['Home', 'Platforms', 'Team'].map((l) => (
      <li key={l} className="flex-1"><a href="#" className="flex h-full min-h-11 items-center justify-center text-small text-muted">{l}</a></li>
    ))}
  </ul>
);

/** In the real PlatformShell sheet (desktop): the footer sticks to the foot of the scrolling sheet. */
export const InSheet: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="h-dvh">
      <PlatformShell rail={rail} place={<div className="p-1 text-muted">Platforms</div>} placeLabel="Platforms" sheetBar={bar} topBar={<ReadyLogo size={28} />} phoneNav={nav} detail status={<span>All running</span>}>
        <div className="p-pad"><Demo initial="system" /></div>
      </PlatformShell>
    </div>
  ),
};
/** Phone: steps as chips, sticky footer above the bottom nav. */
export const InSheetPhone: Story = { ...InSheet, parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'mobile1' } } };
