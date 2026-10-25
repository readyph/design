// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';
import { ErrorBlock } from './ErrorBlock';
import { Skeleton } from './Skeleton';

afterEach(cleanup);

describe('ErrorBlock', () => {
  it('says what failed and when it last loaded', () => {
    render(<ErrorBlock thing="products" lastLoaded="9:10 AM" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Couldn’t load your products.');
    expect(alert.textContent).toContain('Last loaded 9:10 AM.');
  });
  it('omits last loaded when it never loaded', () => {
    render(<ErrorBlock thing="products" />);
    expect(screen.queryByText(/Last loaded/)).toBeNull();
  });
  it('retries from a real button', () => {
    const onRetry = vi.fn();
    render(<ErrorBlock thing="products" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it('disables the button while retrying', () => {
    render(<ErrorBlock thing="products" onRetry={() => {}} retrying />);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });
  it('has no button without onRetry', () => {
    render(<ErrorBlock thing="products" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('renders title, description and action', () => {
    render(<EmptyState title="No products yet" description="Add one." action={<button>Add</button>} />);
    expect(screen.getByText('No products yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
  });
  it('renders the title as a heading when asked', () => {
    render(<EmptyState title="Nothing" headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Nothing' })).toBeTruthy();
  });
  it('shows the no-permission line', () => {
    render(<EmptyState title="Owners only" restricted="Ask Maria Santos (owner) for access." />);
    expect(screen.getByText('Ask Maria Santos (owner) for access.')).toBeTruthy();
  });
  it('left-aligns for the inline variant', () => {
    const { container } = render(<EmptyState title="x" align="start" />);
    expect((container.firstChild as HTMLElement).className).not.toContain('text-center');
  });
});

describe('Skeleton', () => {
  it('is hidden from assistive tech', () => {
    const { container } = render(<Skeleton />);
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });
  it('renders the requested number of text lines', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    expect(container.querySelectorAll('span').length).toBe(3);
  });
});
