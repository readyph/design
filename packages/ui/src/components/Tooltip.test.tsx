// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);
import { Tooltip } from './Tooltip';

class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;

function content(tone?: 'inverse' | 'surface') {
  render(
    <Tooltip open content="Hint" tone={tone}>
      <button>Trigger</button>
    </Tooltip>,
  );
  return document.querySelector('[data-side]') as HTMLElement;
}

describe('Tooltip tone', () => {
  it('defaults to inverse', () => {
    const el = content();
    expect(el.className).toContain('bg-ink');
    expect(el.className).toContain('text-surface');
    expect(document.querySelector('svg')?.getAttribute('class')).toContain('fill-ink');
  });

  it('renders the surface tone', () => {
    const el = content('surface');
    for (const c of ['bg-surface', 'text-ink', 'border', 'border-border', 'shadow-lg', 'p-3', 'rounded-md']) {
      expect(el.className.split(/\s+/)).toContain(c);
    }
    expect(el.className).not.toContain('bg-ink');
    expect(document.querySelector('svg')?.getAttribute('class')).toContain('fill-surface');
    expect(screen.getAllByText('Hint').length).toBeGreaterThan(0);
  });
});
