// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LedaMark, LedaThinking, LedaWordmark } from './Leda';

describe('Leda', () => {
  it('uses the 16 px cut at small sizes', () => {
    const { container } = render(<LedaMark size={16} />);
    expect(container.querySelector('path')?.getAttribute('d')).toContain('M64 99.14');
  });
  it('toggles thinking and settling', () => {
    const { container, rerender } = render(<LedaMark size={48} effect="aurora" active />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('ld-on');
    rerender(<LedaMark size={48} effect="aurora" active={false} />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('ld-settling');
  });
  it('reserves the Thinking label and renders the wordmark', () => {
    const { getByText, getAllByLabelText } = render(<><LedaThinking thinking={false} /><LedaWordmark /></>);
    expect(getByText('Thinking…')).toBeTruthy();
    expect(getAllByLabelText("Leda").length).toBeGreaterThanOrEqual(2);
  });
  it('decorative marks are aria-hidden with no role', () => {
    const { container } = render(<><LedaMark decorative /><LedaWordmark decorative /><LedaThinking thinking /></>);
    container.querySelectorAll('svg').forEach((s) => {
      expect(s.getAttribute('aria-hidden')).toBe('true');
      expect(s.getAttribute('role')).toBeNull();
    });
  });
  it('announces Thinking only while thinking, and only Aurora has the still layer', () => {
    const { container, getByRole, rerender } = render(<LedaThinking thinking />);
    expect(getByRole('status').textContent).toBe('Thinking…');
    expect(container.querySelector('.ld-still')).toBeTruthy();
    rerender(<LedaThinking thinking effect="glint" />);
    expect(container.querySelector('.ld-still')).toBeNull();
    expect(container.querySelector('.ld-rmlabel')).toBeNull();
  });
  it('injects the stylesheet once', () => {
    render(<><LedaMark /><LedaMark /><LedaWordmark /></>);
    expect(document.querySelectorAll('#ld-css').length).toBe(1);
  });
});
