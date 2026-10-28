import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PlatformLogo, nextIdentityColor, platformInitials, platformInitialsFor } from './PlatformLogo';

afterEach(cleanup);

describe('platformInitials', () => {
  it('skips stop words', () => {
    expect(platformInitials('The Grand Café')).toBe('GC');
    expect(platformInitials('Bank of Cubao')).toBe('BC');
  });
  it('keeps similar names apart', () => {
    expect(platformInitialsFor(['Café POS', 'Cubao Parts Counter'])).toEqual(['CP', 'CU']);
  });
});

describe('nextIdentityColor', () => {
  it('returns the first free colour, then least used', () => {
    expect(nextIdentityColor([])).toBe('#6d48c6');
    expect(nextIdentityColor(['#6d48c6', 2])).toBe('#85408f');
    expect(nextIdentityColor([1, 2, 3, 4, 5, 6, 7, 8, 1])).toBe('#3a6d8c');
  });
});

describe('PlatformLogo', () => {
  it('defaults to 16px and is labelled', () => {
    render(<PlatformLogo name="Lakeside Dental" />);
    expect(screen.getByRole('img', { name: 'Lakeside Dental' }).className).toContain('size-4');
  });
  it('stored colour overrides index', () => {
    render(<PlatformLogo name="X Y" index={1} color="#9b4f2c" />);
    expect(screen.getByRole('img').className).toContain('bg-identity-8');
  });
  it('decorative hides from assistive tech', () => {
    const { container } = render(<PlatformLogo name="Lakeside Dental" decorative />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});
