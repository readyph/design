// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DataList } from './DataList';

afterEach(cleanup);

const items = [
  { label: 'Invoice', value: 'INV-1' },
  { label: 'Due', value: '24 Oct', note: '2 days overdue', tone: 'bad' as const },
];

describe('DataList semantics', () => {
  it('renders a dl with one dt and one dd per item, rows grouped in divs', () => {
    const { container } = render(<DataList items={items} />);
    const dl = container.querySelector('dl')!;
    expect(dl.querySelectorAll(':scope > div').length).toBe(2);
    expect(dl.querySelectorAll('dt').length).toBe(2);
    expect(dl.querySelectorAll('dd').length).toBe(2);
    expect(container.querySelector('dt')!.textContent).toBe('Invoice');
  });

  it('keeps label and value text free of block elements', () => {
    const { container } = render(<DataList items={items} />);
    expect(container.querySelectorAll('dt p, dt div, dd p, dd div').length).toBe(0);
  });
});

describe('DataList layout', () => {
  it('uses the 34% grid and stacks when narrow', () => {
    const { container } = render(<DataList items={items} />);
    const row = container.querySelector('dl > div')!;
    expect(row.className).toContain('grid-cols-[minmax(120px,34%)_1fr]');
    expect(row.className).toContain('max-width:599px');
    expect(row.className).toContain('py-[7px]');
    expect(row.className).toContain('border-t');
  });

  it('stacked forces one column', () => {
    const { container } = render(<DataList items={items} stacked />);
    const row = container.querySelector('dl > div')!;
    expect(row.className).toContain('grid-cols-1');
    expect(row.className).not.toContain('minmax');
  });

  it('shows the note and the bad tone', () => {
    render(<DataList items={items} />);
    expect(screen.getByText('2 days overdue').className).toContain('text-bad');
    expect(screen.getByText('24 Oct').closest('dd')!.className).toContain('text-bad');
    expect(screen.getByText('INV-1').closest('dd')!.className).toContain('text-text');
  });

  it('lets a caller margin through without changing the layout classes', () => {
    const { container } = render(<DataList items={items} className="mt-4" />);
    expect(container.querySelector('dl')!.className).toContain('mt-4');
    expect(container.querySelector('dl > div')!.className).toContain('grid');
  });

  it('is full width and keeps leading-5 on the rows when a caller passes text-*', () => {
    const { container } = render(<DataList items={items} className="text-sm" />);
    expect(container.querySelector('dl')!.className).toContain('w-full');
    expect(container.querySelector('dl > div')!.className).toContain('leading-5');
    expect(container.querySelector('dl')!.className).not.toContain('leading-5');
  });
});
