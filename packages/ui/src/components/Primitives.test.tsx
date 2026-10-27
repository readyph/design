// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Notice } from './Notice';
import { Checkbox } from './Checkbox';
import { ButtonLink } from './ButtonLink';
import { Link } from './Link';
import { Spinner } from './Spinner';

afterEach(cleanup);

describe('Notice', () => {
  it.each([
    ['info', 'status'],
    ['ok', 'status'],
    ['warn', 'alert'],
    ['bad', 'alert'],
  ] as const)('tone %s has role %s and a name from its text', (tone, role) => {
    render(<Notice tone={tone} title="Heads up">Body text</Notice>);
    const el = screen.getByRole(role);
    expect(el.textContent).toContain('Heads up');
    expect(el.textContent).toContain('Body text');
  });
  it('lets role be overridden', () => {
    render(<Notice tone="bad" role="status">x</Notice>);
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('renders the action as a real button or link', () => {
    render(<Notice action={<button type="button">Retry</button>}>Failed</Notice>);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    cleanup();
    render(<Notice action={<a href="/x">Open</a>}>Failed</Notice>);
    expect(screen.getByRole('link', { name: 'Open' })).toBeTruthy();
  });
});

describe('Checkbox', () => {
  it('has a real label and toggles with Space', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Agree" hint="Required" />);
    const box = screen.getByRole('checkbox', { name: /Agree/ }) as HTMLInputElement;
    expect(document.querySelector('label')).toBeTruthy();
    expect(box.getAttribute('aria-describedby')).toBeTruthy();
    box.focus();
    await user.keyboard(' ');
    expect(box.checked).toBe(true);
    await user.keyboard(' ');
    expect(box.checked).toBe(false);
  });
  it('indeterminate sets aria-checked mixed', () => {
    render(<Checkbox label="Some" indeterminate />);
    const box = screen.getByLabelText('Some') as HTMLInputElement;
    expect(box.getAttribute('aria-checked')).toBe('mixed');
    expect(box.indeterminate).toBe(true);
  });
  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Off" disabled />);
    const box = screen.getByRole('checkbox', { name: 'Off' }) as HTMLInputElement;
    expect(box.disabled).toBe(true);
    await user.click(box);
    expect(box.checked).toBe(false);
  });
});

describe('ButtonLink', () => {
  it('is an anchor with the Button classes', () => {
    render(<ButtonLink href="/a" variant="secondary">Go</ButtonLink>);
    const a = screen.getByRole('link', { name: 'Go' });
    expect(a.tagName).toBe('A');
    expect(a.className).toContain('h-[var(--ctl-button)]');
    expect(a.className).toContain('border-control');
  });
  it('disabled removes href and sets aria-disabled', () => {
    render(<ButtonLink href="/a" disabled>Go</ButtonLink>);
    const a = screen.getByText('Go');
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.getAttribute('aria-disabled')).toBe('true');
  });
  it('target _blank adds rel; explicit rel wins', () => {
    render(<><ButtonLink href="/a" target="_blank">A</ButtonLink><Link href="/b" target="_blank">B</Link><Link href="/c" target="_blank" rel="me">C</Link></>);
    expect(screen.getByText('A').getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByText('B').getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByText('C').getAttribute('rel')).toBe('me');
  });
});

describe('Spinner', () => {
  it('has role status and a hidden label', () => {
    render(<Spinner label="Saving" />);
    const s = screen.getByRole('status');
    expect(s.textContent).toBe('Saving');
    expect(screen.getByText('Saving').className).toContain('sr-only');
  });
  it('removes the animation under reduced motion', () => {
    const { container } = render(<Spinner />);
    const ring = container.querySelector('[data-spinner]') as HTMLElement;
    expect(ring.className).toContain('animate-spin');
    expect(ring.className).toContain('motion-reduce:animate-none');
  });
});
