import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';
import * as ui from '../index';
import { surfaces } from '../tokens';

afterEach(cleanup);

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('Avatar', () => {
  it('initials: two words, one word, empty', () => {
    const { rerender } = render(<Avatar name="Liza Santos" />);
    expect(screen.getByRole('img').textContent).toBe('LS');
    rerender(<Avatar name="Mon" />);
    expect(screen.getByRole('img').textContent).toBe('M');
    rerender(<Avatar name="" />);
    expect(screen.getByRole('img').textContent).toBe('?');
  });
  it('initials prop overrides', () => {
    render(<Avatar name="Liza Santos" initials="LZ" />);
    expect(screen.getByRole('img').textContent).toBe('LZ');
  });
  it('image replaces initials and falls back on error', () => {
    const { container } = render(<Avatar name="Jun Reyes" src="/jun.png" />);
    expect(container.querySelector('img')).toBeTruthy();
    expect(screen.getByRole('img').textContent).toBe('');
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img').textContent).toBe('JR');
  });
  it('name is the aria-label; decorative hides it', () => {
    const { container, rerender } = render(<Avatar name="Grace Lumbao" />);
    expect(screen.getByRole('img', { name: 'Grace Lumbao' })).toBeTruthy();
    rerender(<Avatar name="Grace Lumbao" decorative />);
    expect(screen.queryByRole('img')).toBeNull();
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true');
    expect((container.firstChild as HTMLElement).getAttribute('aria-label')).toBeNull();
  });
  it('sizes 24, 32, 40', () => {
    const { container, rerender } = render(<Avatar name="A B" size={24} />);
    expect((container.firstChild as HTMLElement).className).toContain('size-6');
    rerender(<Avatar name="A B" />);
    expect((container.firstChild as HTMLElement).className).toContain('size-8');
    rerender(<Avatar name="A B" size={40} />);
    expect((container.firstChild as HTMLElement).className).toContain('size-10');
  });
  it('initials contrast is at least 4.5:1 in light and dark', () => {
    const t = surfaces as Record<string, readonly [string, string]>;
    for (const i of [0, 1]) {
      expect(ratio(t['accent-tint'][i], t.accent[i])).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.surface[i], t.muted[i])).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('is exported from the package', () => {
    expect(ui.Avatar).toBe(Avatar);
  });
});
