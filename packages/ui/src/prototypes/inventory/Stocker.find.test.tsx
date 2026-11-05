import { afterEach, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StockerFindPage } from './Stocker.find';
import { StockerHomePage } from './Stocker.home';

afterEach(cleanup);
const axeOk = async () => expect((await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);

describe('Stocker Find', () => {
  it('start: scan and Needs stock rows', async () => {
    render(<StockerFindPage />);
    expect(screen.getByText('Scan or type a barcode')).toBeTruthy();
    expect(screen.getByText('Needs stock')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Gates 6PK1195/ }).getAttribute('href')).toBe('stocker-find.html?p=p10');
    await axeOk();
  });
  it('loading and empty', () => {
    const a = render(<StockerFindPage state="loading" />);
    expect(a.container.querySelector('[aria-busy="true"]')).toBeTruthy();
    a.unmount();
    render(<StockerFindPage state="empty" />);
    expect(screen.getByText(/No products yet/)).toBeTruthy();
  });
  it('product: facts, coming, take some out', async () => {
    render(<StockerFindPage p="p17" />);
    expect(screen.getByText('On hand')).toBeTruthy();
    expect(screen.getByText('Coming')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Take some out/ }).getAttribute('href')).toBe('stocker-out.html?p=p17');
    expect(screen.getByRole('link', { name: /Tell your manager/ }).getAttribute('href')).toBe('stocker.html?ask=count&p=p17');
    await axeOk();
  });
  it('product with nothing on hand has no Take some out', () => {
    render(<StockerFindPage p="p10" />);
    expect(screen.queryByText('Take some out')).toBeNull();
    expect(screen.getByText('Nothing on hand, so nothing can be taken out.')).toBeTruthy();
  });
  it('unknown product', () => {
    render(<StockerFindPage p="zz" />);
    expect(screen.getByText('That product is not here. Go back and search again.')).toBeTruthy();
  });
});

describe('Stocker new product and ask views', () => {
  it('new product: send enabled once the barcode has 8 digits', async () => {
    render(<StockerHomePage np="" />);
    const send = screen.getByRole('button', { name: /Send to your manager/ }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Barcode'), { target: { value: '4801230499990' } });
    expect(send.disabled).toBe(false);
    fireEvent.click(send);
    expect(screen.getByText('4801230499990 is waiting to be set up.')).toBeTruthy();
  });
  it('new product form is accessible', async () => {
    render(<StockerHomePage np="4801230499990" />);
    await axeOk();
  });
  it('ask: needs a topic, other needs a note', async () => {
    render(<StockerHomePage ask="new" />);
    const send = screen.getByRole('button', { name: /Tell your manager/ }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: /Something else/ }));
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: 'hello' } });
    expect(send.disabled).toBe(false);
    await axeOk();
  });
});
