import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SignIn } from '@phosphor-icons/react';
import { Button, heroGeometry } from './Button';
import { ButtonLink } from './ButtonLink';

afterEach(cleanup);

const heroClasses = heroGeometry.split(' ');

describe('Button and ButtonLink geometry', () => {
  it('default is the 32px control geometry (no hero classes)', () => {
    render(<><Button>Save</Button><ButtonLink href="/x">Open</ButtonLink></>);
    for (const el of [screen.getByRole('button', { name: 'Save' }), screen.getByRole('link', { name: 'Open' })]) {
      expect(el.className).toContain('h-[var(--ctl-button)]');
      expect(el.className).toContain('px-3');
      for (const c of heroClasses) expect(el.className).not.toContain(c);
    }
  });

  it('hero replaces the height, padding and type: 44px, px-6, 15px semibold, 52px on phone, 16px icons', () => {
    render(<><Button hero leftIcon={SignIn}>Save</Button><ButtonLink href="/x" hero leftIcon={SignIn}>Open</ButtonLink></>);
    for (const el of [screen.getByRole('button', { name: 'Save' }), screen.getByRole('link', { name: 'Open' })]) {
      for (const c of heroClasses) expect(el.className).toContain(c);
      expect(el.className).not.toContain('h-[var(--ctl-button)]');
      expect(el.className).not.toMatch(/(^| )px-3( |$)/);
      expect(el.className).not.toMatch(/(^| )text-ui( |$)/);
      expect(el.className).not.toMatch(/(^| )font-medium( |$)/);
      expect(el.className).not.toContain('!');
      expect(el.querySelector('svg')?.getAttribute('width')).toBe('16');
    }
  });
});
