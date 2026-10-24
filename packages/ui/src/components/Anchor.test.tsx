// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);
import { Anchor } from './Anchor';

describe('Anchor', () => {
  it('sets CSS variables and centring classes', () => {
    render(<Anchor x={25} y={40}><button>Go</button></Anchor>);
    const el = screen.getByRole('button').parentElement as HTMLElement;
    expect(el.style.getPropertyValue('--anchor-x')).toBe('25%');
    expect(el.style.getPropertyValue('--anchor-y')).toBe('40%');
    for (const c of ['absolute', '-translate-x-1/2', '-translate-y-1/2']) expect(el.className).toContain(c);
  });

  it('clamps to 0-100', () => {
    render(<Anchor x={150} y={-5}><button>Go</button></Anchor>);
    const el = screen.getByRole('button').parentElement as HTMLElement;
    expect(el.style.getPropertyValue('--anchor-x')).toBe('100%');
    expect(el.style.getPropertyValue('--anchor-y')).toBe('0%');
  });
});
