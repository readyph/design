// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);
import { Switch } from './Switch';

describe('Switch accessible name', () => {
  it('uses aria-label when there is no visible label', () => {
    render(<Switch aria-label="Lights, Main Lab" />);
    expect(screen.getByRole('switch', { name: 'Lights, Main Lab' })).toBeTruthy();
  });

  it('uses aria-labelledby', () => {
    render(<><span id="n">Lights</span><Switch aria-labelledby="n" /></>);
    expect(screen.getByRole('switch', { name: 'Lights' })).toBeTruthy();
  });

  it('prefers the visible label', () => {
    render(<Switch label="Visible" aria-label="Ignored" />);
    expect(screen.getByRole('switch', { name: 'Visible' })).toBeTruthy();
  });
});
