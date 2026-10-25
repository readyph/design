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
});
