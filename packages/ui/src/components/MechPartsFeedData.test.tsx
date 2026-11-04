import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MechParts } from './MechParts';
import { FeedPostRow, MechFeed } from './MechFeed';
import { mechanics } from './sms/data';

afterEach(cleanup);
const me = mechanics[0];

describe('MechParts from real data', () => {
  it('renders given parts, counts ready ones and reports toggles by id', () => {
    const onToggle = vi.fn();
    render(<MechParts readOnly={false} onToggle={onToggle} onRequest={() => {}}
      parts={[{ id: 'p1', name: 'Oil filter', qty: 2, stock: { text: 'In stock', tone: 'ok' }, ready: true }, { id: 'p2', name: 'Brake pad', qty: 1, stock: { text: 'Low stock', tone: 'warn' }, ready: false }]} />);
    expect(screen.getByText('1 of 2 parts ready')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Brake pad, have it'));
    expect(onToggle).toHaveBeenCalledWith('p2');
  });
  it('locks taken parts', () => {
    render(<MechParts readOnly={false} onToggle={() => {}} onRequest={() => {}} parts={[{ id: 'p1', name: 'Oil filter', qty: 1, stock: { text: 'In stock', tone: 'ok' }, taken: true, ready: true }]} />);
    expect((screen.getByLabelText('Oil filter, have it') as HTMLInputElement).disabled).toBe(true);
  });
});

describe('MechFeed with real data', () => {
  it('shows the real author and time label', () => {
    render(<ul><FeedPostRow me={me} flash={() => {}} post={{ id: 'a', kind: 'manager', by: 'manager', at: '', text: 'Hi', seq: 0, author: 'Maria Cruz', time: '5 min ago' }} /></ul>);
    expect(screen.getByText('Maria Cruz')).toBeTruthy();
    expect(screen.getByText('5 min ago')).toBeTruthy();
  });
  it('passes chosen files to the callbacks', () => {
    const onPick = vi.fn(); const onPost = vi.fn();
    render(<MechFeed posts={[]} me={me} readOnly={false} onPost={onPost} onPickPhotos={onPick} flash={() => {}} />);
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose photos'), { target: { files: [file] } });
    expect(onPick).toHaveBeenCalledWith([file]);
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));
    expect(onPost).toHaveBeenCalledWith('', 1, false, [file]);
  });
});
