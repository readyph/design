import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { LinesTable, ServiceAdder } from './ServiceLines';
import { ScheduleFields, MoreFields } from './JobOrderFields';
import { WizardSummary } from './WizardSummary';
import { typeIdFor } from './sms/catalogue';
import { customers } from './sms/data';
import { customLine, emptyDraft, linesFromType, partLine } from './sms/wizardModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const oil = () => linesFromType(typeIdFor('Change oil (Shell Helix 10W-40)')!);
const brakes = () => linesFromType(typeIdFor('Brake pad replacement, front')!).map((l, i) => (i === 1 ? { ...l, qty: 3 } : l));
const belt = () => linesFromType(typeIdFor('Timing belt replacement')!);
const custom = () => { const c = customLine('Wiring check', 500); return [c, partLine('pr06', c.key)]; };
const priced = () => oil().map((l, i) => (i === 0 ? { ...l, price: 600 } : l));
const noop = () => {};

describe('Service lines', () => {
  const cases: [string, ReturnType<typeof oil>][] = [['parts sub-lines', oil()], ['not enough stock', brakes()], ['out on order', belt()], ['custom price', priced()], ['custom service with a part', custom()]];
  for (const [name, lines] of cases) {
    it(`editable table has no axe violations (${name})`, async () => {
      const { container } = render(<LinesTable lines={lines} onChange={noop} />);
      expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    });
  }
  it('read-only table has no axe violations', async () => {
    const { container } = render(<LinesTable lines={priced()} readOnly />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('warns when the job needs more than is here', () => {
    const { container } = render(<LinesTable lines={brakes()} onChange={noop} />);
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Short by 1');
  });
  it('adder has no axe violations', async () => {
    const { container } = render(<ServiceAdder lines={[]} kind="car" onChange={noop} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('Job order fields and summary', () => {
  const d = emptyDraft({ customer: customers[0]!, vehicleId: customers[0]!.vehicles[0]!.id, lines: oil() });
  it('schedule and more fields have no axe violations', async () => {
    const { container } = render(<><ScheduleFields draft={d} onChange={noop} onDur={noop} /><MoreFields draft={d} onChange={noop} /></>);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('summary has no axe violations', async () => {
    const { container } = render(<WizardSummary draft={d} onChange={noop} editing={null} setEditing={noop} onPreview={noop} onDur={noop} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
