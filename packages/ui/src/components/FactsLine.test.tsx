// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Fact, FactsLine } from './FactsLine';

afterEach(cleanup);

describe('FactsLine', () => {
  it('renders a list of facts with bold values', () => {
    render(
      <FactsLine aria-label="Case facts">
        <Fact value="2 days" tone="bad">Closes in</Fact>
        <Fact value="Quezon City" tone="ok">Leda acts in</Fact>
      </FactsLine>,
    );
    expect(screen.getByRole('list', { name: 'Case facts' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    const v = screen.getByText('2 days');
    expect(v.tagName).toBe('STRONG');
    expect(v.className).toContain('text-bad-ink');
    expect(screen.getAllByRole('listitem')[0].textContent).toBe('Closes in 2 days');
  });
  it('hides separators from assistive tech and supports value first', () => {
    const { container } = render(
      <FactsLine>
        <Fact value="3" valueFirst>open cases</Fact>
      </FactsLine>,
    );
    expect(container.querySelector('li > span[aria-hidden]')).toBeTruthy();
    expect(screen.getByRole('listitem').textContent).toBe('3 open cases');
  });
  it('puts className on the wrapper so a caller margin keeps the gutter shift', () => {
    const { container } = render(
      <FactsLine className="mx-4 ml-2">
        <Fact value="3">open</Fact>
      </FactsLine>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('mx-4');
    expect(wrapper.className).toContain('overflow-hidden');
    expect(screen.getByRole('list').className).toContain('-ml-[23px]');
  });
  it('lets a long unbreakable value wrap inside its fact', () => {
    render(
      <FactsLine>
        <Fact value="Supercalifragilisticexpialidocious-Logistics-Warehouse">Platform</Fact>
      </FactsLine>,
    );
    const cls = screen.getByRole('listitem').className;
    expect(cls).toContain('min-w-0');
    expect(cls).toContain('[overflow-wrap:anywhere]');
  });
});
