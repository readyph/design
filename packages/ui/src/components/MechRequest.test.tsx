import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { useState } from 'react';
import { MechRequestForm, MechRequestRow, MechRequestSent } from './MechRequest';
import { jobs, mechanics } from './sms/data';
import { getMech, requestsOf } from './sms/mechModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const active = jobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'TODO');
const noop = () => {};

function Form({ askCar }: { askCar: boolean }) {
  const [jobId, setJobId] = useState<string | null>(active[0].id);
  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [scanOpen, setScanOpen] = useState(false);
  return <MechRequestForm jobs={active} jobId={jobId} setJobId={setJobId} askCar={askCar} productId={productId} setProductId={setProductId} qty={qty} setQty={setQty} scanOpen={scanOpen} setScanOpen={setScanOpen} />;
}

describe('MechRequest', () => {
  it('asks which car only when asked, and numbers the steps', () => {
    const a = render(<Form askCar />);
    expect(screen.getByText('1. Which car?')).toBeTruthy();
    expect(screen.getByText('3. How many?')).toBeTruthy();
    a.unmount();
    render(<Form askCar={false} />);
    expect(screen.queryByText('Which car?')).toBeNull();
    expect(screen.getByText('1. Which part?')).toBeTruthy();
  });
  it('picks the shop-use option', () => {
    render(<Form askCar />);
    fireEvent.click(screen.getByRole('radio', { name: /Not for a car/ }));
    expect(screen.getByRole('radio', { name: /Not for a car/ }).getAttribute('aria-checked')).toBe('true');
  });
  it('has no axe violations (form, sent, rows)', async () => {
    const reqs = requestsOf(getMech(), mechanics[0].id);
    for (const ui of [<Form askCar />, <MechRequestSent onDone={noop} onAnother={noop} doneLabel="Done" />, <ul>{reqs.map((r) => <MechRequestRow key={r.id} r={r} jobs={jobs} />)}</ul>]) {
      const { unmount } = render(ui);
      expect((await axe.run(document.body, axeOpts)).violations).toEqual([]);
      unmount();
    }
  });
});
